---
title: 20 data engineering practices that prevent the most pain
description: The problems that hurt data teams most often, why they happen from first principles, real public examples, and what to do about each one.
pubDate: 2026-10-03T19:00:00Z
tags:
  - best practices
  - data quality
  - pipelines
---

Most data engineering pain comes from a few assumptions that feel safe and aren't: that a job runs once, that data shows up on time and in the shape you expect, that a number means the same thing everywhere, and that someone will notice when something breaks.

Data teams keep naming the same top problem. In dbt Labs' [2024 State of Analytics Engineering report](https://www.getdbt.com/blog/the-2024-state-of-analytics-engineering-report), 57% of respondents said poor data quality was a predominant issue, up from 41% in 2022.

This is the list I'd hand to someone starting on a data team, or to anyone tired of the same incident coming back every quarter. For each one: why it happens, a real example, and what to do. The examples are public cases or common patterns, not things from my own job.

## 1. Make every run idempotent

Schedulers, queues and people all retry. A worker can write its output and die before it reports success. A network can drop the acknowledgement. Someone clicks "rerun" because a dashboard looked off. If running a job twice gives a different result than running it once, the bug is already there; it's just waiting for a retry.

A typical case: an `INSERT INTO daily_sales ... WHERE dt = '2026-09-30'` times out after the insert has already committed. The scheduler retries, the second run succeeds, and every sale from September 30 is now in the table twice. Nothing failed.

**What to do:** have each run replace a well-defined slice of data instead of appending to it. Overwrite the partition, or `MERGE` on a real key. Pass the slice in as a parameter (the logical date of the run), never "now". Then test it the obvious way: run the same date twice and diff the outputs.

```sql
-- Rerunning a date replaces that date. It never adds to it.
insert overwrite table daily_sales partition (dt = '{{ ds }}')
select order_id, store_id, amount_cents
from   orders
where  order_date = '{{ ds }}';
```

I wrote more about this in [Make reruns boring](../make-reruns-boring/).

## 2. Know the grain of every table

A table's grain is the set of columns that identifies exactly one row. Join it to something at a finer grain and every row multiplies. SQL won't warn you. `SUM` and `COUNT` will happily add up the copies.

Say `orders` has one row per order and `shipments` has one row per package. An order that ships in three boxes now appears three times, and its revenue is counted three times. Revenue goes up right after someone adds a "simple" join to get the carrier name.

**What to do:** write the grain down for every table and enforce it with a uniqueness test on the key. Compare row counts before and after each join. When you need data from a finer table, aggregate it to your grain first, then join.

```sql
-- Should return nothing. Any row here breaks the grain.
select order_id, count(*) as copies
from   fct_orders
group by order_id
having count(*) > 1;
```

## 3. Expect late and out-of-order data

There are two clocks in every pipeline: when something happened (event time) and when you found out (processing time). Phones go offline, partners resend files, queues retry. A job that assumes yesterday is complete at 00:05 is placing a bet.

A mobile app buffers events while a phone is in airplane mode and sends them hours later. The daily job already ran at midnight, so those events either land in the wrong day or never get counted, and the numbers shift every time someone reruns an old date.

**What to do:** partition by event time and reprocess a trailing window, such as the last three days, on every run. Idempotent writes (item 1) make that safe. In streaming, set watermarks and decide on purpose what happens to events that arrive after them: drop them, send them to a side output, or correct the data in a later batch. Tell consumers when a day counts as final.

## 4. Store time in UTC and convert at the edges

Local time is not a straight line. When US clocks spring forward, 2:00 to 2:59 AM never happens; in the fall, 1:00 to 1:59 AM happens twice. That gives you a 23-hour day and a 25-hour day every year. Mix sources in different time zones and joins quietly shift by hours.

A classic symptom: an "orders by hour" chart in local time shows a spike at 1 AM every November, because that hour is counted twice.

**What to do:** store timestamps in UTC with a proper timestamp type, and keep the original offset or zone if you need local analysis. Convert to local time in the presentation layer, or through a date dimension that knows the business's day boundaries. Put the zone in the column name (`created_at_utc`) so nobody has to guess.

## 5. Treat upstream schemas as contracts

Your pipeline depends on fields you don't control. A rename or a type change upstream usually breaks things loudly, which is the good case. A change in meaning breaks things silently.

NASA [lost the Mars Climate Orbiter](https://science.nasa.gov/mission/mars-climate-orbiter/) in 1999 because ground software used English units while the onboard software worked in metric. Both sides exchanged numbers that looked perfectly valid, and the trajectory errors sent the spacecraft too close to Mars. Data pipelines hit the same problem when an amount switches from dollars to cents, or a duration from seconds to milliseconds.

**What to do:** write the contract down: field names, types, nullability, units, allowed values, and who owns the source. Check incoming data against it at the boundary and fail loudly on breaking changes. Put units in column names (`amount_cents`, `duration_ms`). Agree with the source team on how changes get announced, with a deprecation period for anything that breaks consumers.

## 6. Validate at the door and quarantine bad records

Bad input doesn't stay where it landed. Once it's joined, aggregated and fed into models, it's expensive to find and expensive to undo.

In 2022, Unity told investors that [bad data ingested from a large customer](https://www.fool.com/investing/2022/05/16/should-you-buy-unity-software-after-stock-crashes), along with accuracy problems in its Audience Pinpointer ad-targeting tool, would cut that year's revenue by about $110 million, and that rebuilding the data and model training would take time.

**What to do:** check records on the way in: schema, required fields, value ranges, and whether referenced keys exist. Send failures to a quarantine table with the reason attached, so one bad record doesn't fail the whole load and doesn't vanish either. Alert on the quarantine rate. Keep raw data immutable so you can reprocess everything after a fix.

## 7. Test the data, not only the code

Unit tests prove your code does what you wrote. They can't tell you the data changed underneath it. Most data bugs I've seen were correct code meeting data nobody expected.

**What to do:** on every important table, test the basics. The primary key is unique and never null. Foreign keys point at rows that exist. Status fields only contain known values. Quantities aren't negative. Row counts stay within a normal range. Run these checks inside the pipeline and block publishing when a critical one fails. Keep the list short enough that every failure is worth reading; a test that fails every day and gets ignored is worse than no test.

## 8. Monitor freshness and volume, not just job status

A green job tells you the job ran. It doesn't tell you any data arrived. An upstream that sends an empty file, or a filter that drops everything, still produces a successful run.

A common version: a partner moves their files to a new folder. Your job reads the old, now empty folder, writes zero rows, and succeeds every day for a week. Someone finally notices at month end.

**What to do:** for each important table, alert on freshness (how old the newest row is) and on volume (today's row count against the same weekday in recent weeks). Treat zero rows as an error unless zero is genuinely expected. Show the data's freshness next to the numbers on dashboards, so readers know what they're looking at.

## 9. Reconcile counts from source to target

Data goes missing at boundaries: format conversions, file size limits, filters, half-finished loads. Each step can look fine on its own.

In October 2020, Public Health England [failed to report 15,841 positive COVID-19 cases](https://www.theregister.com/2020/10/05/excel_england_coronavirus_contact_error/) from between 25 September and 2 October. Lab results arrived as CSV files and were loaded into Excel files in the old .XLS format, which holds at most 65,536 rows. Records past the limit were simply left off, and contact-tracing alerts failed for nearly 48,000 people who had been exposed. In economics, Reinhart and Rogoff's influential 2010 paper on public debt turned out to have a [spreadsheet formula that left out five countries](https://theconversation.com/the-reinhart-rogoff-error-or-how-not-to-excel-at-economics-13646). In both cases the tool ran without complaint.

**What to do:** at every boundary, compare what was read with what was written, and count rejects explicitly. Add a checksum on a key amount if you can. Fail the run on any unexplained difference. Never put a tool with a silent row limit in a pipeline.

```sql
-- Rows in must equal rows out plus rows rejected, or the load fails.
select (select count(*) from staging.orders_raw where load_id = '{{ load_id }}') as rows_read,
       (select count(*) from mart.orders       where load_id = '{{ load_id }}') as rows_written,
       (select count(*) from quarantine.orders where load_id = '{{ load_id }}') as rows_rejected;
```

## 10. Diff the rows before you ship a change

Two totals can match to the cent while rows underneath are wrong. A row lost in one place and a row duplicated in another cancel out, and the dashboard looks fine until someone filters by region.

**What to do:** before you replace a table, full-outer-join the old and new versions on the grain and put every row in a bucket: only in old, only in new, changed, or identical. Put the bucket counts in the pull request, and keep the list of mismatched keys so you can debug from it. There's a full walkthrough in [Totals lie. Diff the rows.](../totals-lie-diff-the-rows/)

## 11. Define each metric once

When the same metric is computed in five places, the copies drift. One excludes test orders and one doesn't. One uses the order date and another the ship date. Then two dashboards disagree in the same meeting, and people stop trusting both.

"Active users" is the usual example. Product counts anyone who opened the app; marketing counts anyone who did something meaningful. Both numbers are right, they're answers to different questions, and nobody wrote down which question each one answers.

**What to do:** keep metric definitions in one place, either a metrics layer or a single modeled table, with a plain-language definition, an owner and a grain. Dashboards read from it instead of re-implementing it. When a definition changes, version it and tell people before the numbers move.

## 12. Plan backfills before you need them

Backfills put load on everything at once: the cluster, the jobs downstream, and source APIs with rate limits. Done carelessly, a backfill can starve production jobs, trigger floods of reprocessing downstream, or leave a table that is half old logic and half new.

The painful version is one giant query over two years of partitions. It fails near the end, and there's nothing to resume from.

**What to do:** make jobs take a date parameter, so a backfill is just many small idempotent runs. Run them in chunks with limited concurrency, and pick the order based on what consumers need first. Write to a staging table and swap it in, or overwrite partition by partition, so readers never see a mix. Time one chunk before you promise an ETA, and tell downstream owners before you start.

## 13. Partition for how the data is read, and avoid tiny files

Partitioning lets the engine skip data it doesn't need. Partition on the wrong column, or too finely, and you get millions of tiny files, so the engine spends more time listing and opening files than reading them.

Partitioning event data by user ID or by minute is the usual way this goes wrong.

**What to do:** partition on the column most queries filter on, which is usually a date. Aim for files in the hundreds of megabytes, not kilobytes, and compact small files on a schedule. Use clustering or sort keys for the next most common filters.

## 14. Find skew before it finds you

Distributed joins and aggregations send each key to a worker. If one key holds a large share of the rows, whether that's nulls, a default value or one huge customer, a single task ends up doing most of the work, and the job is only as fast as that task.

Picture a join on `customer_id` where a big chunk of orders are guest checkouts with a null customer. All of those rows go to one task. The other tasks finish in a minute and that one runs for an hour.

**What to do:** look at the key distribution before large joins. Handle nulls and default values separately. Salt hot keys, broadcast small dimension tables, and turn on adaptive skew handling where your engine supports it (Spark has had it since 3.0).

## 15. Make cost visible

In warehouses that bill by data scanned or compute time, cost grows quietly. A dashboard that refreshes every five minutes against an unpartitioned table costs real money, and nobody sees it until the invoice.

**What to do:** require partition filters on large tables (BigQuery has a table option for exactly this). Select only the columns you need. Materialize expensive joins that many queries repeat. Set budgets and alerts per team or per job, and tag jobs with owners so the bill can be traced back to them. Once a month, look at the ten most expensive queries; there's usually an easy win.

## 16. Keep history on purpose

If you overwrite a customer's attributes in place, every past report changes when the customer changes. If you build ML features from today's values for past events, the model learns from the future.

A customer upgrades from free to premium in June. With an overwrite-in-place customer table, their January revenue suddenly shows up as premium revenue. A churn model trained on the current tier looks great offline and falls apart in production.

**What to do:** decide per attribute whether you overwrite it or keep its history (a type 2 dimension with `valid_from` and `valid_to`). Join facts to dimensions as of the event time. For ML features, use point-in-time joins.

```sql
-- Each order gets the tier the customer had when the order was placed.
select o.order_id, o.order_ts, c.tier
from   orders o
join   dim_customer_history c
  on   c.customer_id = o.customer_id
 and   o.order_ts >= c.valid_from
 and   o.order_ts <  coalesce(c.valid_to, timestamp '9999-12-31');
```

## 17. Make destructive operations hard, and test your restores

Data engineers delete, truncate and overwrite things all day, and one wrong argument can be catastrophic.

In February 2017, an Amazon S3 engineer ran an established command to remove a small number of servers, and [one of the inputs was entered incorrectly](https://aws.amazon.com/message/41926/), so a larger set was removed than intended. AWS changed the tool to remove capacity more slowly and to block any removal that would take a subsystem below its minimum capacity. A month earlier, a GitLab engineer [deleted a production database directory on the wrong server](https://about.gitlab.com/blog/gitlab-dot-com-database-incident): of about 300 GB, roughly 4.5 GB was left, and about six hours of data was lost. GitLab had five backup and replication methods in place, and none of them was working reliably. One produced files only a few bytes in size, the database dumps failed because of a version mismatch, and the S3 bucket for backups was empty.

**What to do:** keep production credentials separate and hard to use by accident. Build dry runs and confirmations into anything that drops or deletes, and cap how much one command can touch. Prefer soft deletes and table snapshots or time travel. Above all, schedule restore drills, and have something check automatically that each backup exists and is the size you'd expect.

## 18. Ship data changes like software

A pipeline is code, configuration and data. When environments drift apart, the same change behaves differently in different places.

On 1 August 2012, Knight Capital deployed new code to its order router, but the code didn't reach one of the eight servers. That server ran an old function that was supposed to be dead. According to the [SEC](https://www.sec.gov/news/press-release/2013-222), the router sent more than 4 million orders while trying to fill 212 customer orders, and Knight lost more than $460 million in 45 minutes.

**What to do:** keep everything in version control, SQL and config included. Run tests in CI against a realistic sample. Use the same deployment process for dev, staging and production, and check after each deploy that every environment is running what you think it is. Delete dead code and old flags instead of leaving them switched off.

## 19. Treat personal data as a liability

Every copy of personal data is something you have to secure, delete on request, and explain to an auditor. Data engineers make copies all day: staging tables, extracts, debugging dumps.

Under the GDPR, people have a [right to have their personal data erased](https://gdpr-info.eu/art-17-gdpr/). If one customer's email address lives in 40 tables and a dozen CSV extracts, every request turns into a project.

**What to do:** collect only what you need. Tag personal-data columns in your catalog. Hash or tokenize identifiers early in the pipeline. Restrict access to raw data, and keep personal data out of logs and ad-hoc extracts. Build deletion in from the start, as a pipeline keyed on the person, instead of a manual hunt.

## 20. Give every table an owner, and every alert an action

Tables without owners rot. Alerts that nobody acts on teach everyone to ignore alerts, including the one that matters.

A channel that gets 200 automated alerts a day is the usual picture. The real incident is in there somewhere, and nobody sees it.

**What to do:** give every production table a named owner, a short description, an expectation for freshness and correctness, and visible lineage. Make every alert say what to check and who acts on it. Delete alerts that never lead to action, and write short runbooks for the failures you see most.

## If you only do five

Make reruns idempotent (1). Write down and test the grain (2). Watch freshness and volume (8). Reconcile counts at every boundary (9). Define each metric once (11).

Most of the rest follows from the same idea: assume the job will run twice, the data will be late and a bit wrong, and the next person to read your table has never met you. Build for that, and the pipeline gets boring in the best way.
