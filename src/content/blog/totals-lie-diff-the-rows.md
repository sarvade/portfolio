---
title: Totals lie. Diff the rows.
description: Matching totals don't mean matching data. The row-level diff is the cheapest insurance I know in data engineering, and this is how I run it.
pubDate: 2026-10-03T18:00:00Z
tags:
  - data quality
  - validation
  - sql
---

When I migrate a table, I don't trust a matching total. Two totals can agree to the cent while thousands of rows underneath them are wrong. Errors cancel. A row dropped on one side and a row duplicated on the other add up to zero difference, and the dashboard looks fine right up until someone filters by region.

So before anything I build ships, I diff it against whatever it replaces, row by row.

## What a row-level diff is

Pick the grain: the set of columns that should identify exactly one row. Join the old output and the new output on that key with a full outer join. Every key then lands in exactly one bucket: only in old, only in new, in both with different values, or in both and identical.

```sql
with old_rows as (
  select order_id, revenue
  from   old_orders
  where  dt = '2026-09-30'
),
new_rows as (
  select order_id, revenue
  from   new_orders
  where  dt = '2026-09-30'
)
select case
         when o.order_id is null then 'only_in_new'
         when n.order_id is null then 'only_in_old'
         when abs(o.revenue - n.revenue) > 0.005 then 'value_changed'
         else 'match'
       end      as bucket,
       count(*) as row_count
from      old_rows o
full join new_rows n on o.order_id = n.order_id
group by 1
order by row_count desc;
```

The SQL is the easy part. Three details matter more.

**Filter each side before the join.** Put the date filter in a `WHERE` after a full outer join and you've quietly turned it into an inner join. The `only_in_*` rows, the ones you were looking for, disappear.

**Know the grain.** If the key isn't unique on both sides, the join multiplies rows and the diff lies too. Check first:

```sql
select order_id, count(*)
from   new_rows
group by order_id
having count(*) > 1;
```

**Mind the nulls.** If a value column can be null, `abs(null - 5)` is null, the `case` falls through, and a real difference lands in `match`. Compare with `is distinct from`, or coalesce both sides to a sentinel.

## What it catches that a total can't

On one migration I worked on, moving revenue metrics in three regions onto a new attribution model, row-level diffs caught three different bugs before launch:

- **A filter on the wrong path.** A reviewer noticed a revenue number that looked off. The diff is what traced it to a single filter applied on the wrong attribution path.
- **A join that fanned out.** When the right side of a join has more than one row per key, every measure on the left gets multiplied. In a diff that shows up as a cluster of `value_changed` rows, all inflated the same way.
- **A distinct count at the wrong grain.** Distinct users per day, summed over a week, is not distinct users per week. Totals can't tell you which one you computed. A row-level compare against a trusted source can.

## Diff your own fixes too

The most useful diff I've run recently was against my own code. I had rebuilt a table that two APIs depend on, and my first version used an aggregation that looked right. The diff said 67,565 rows were wrong. I replaced the aggregation with an anti-join, ran the diff again, and got zero differences.

Without it, that version ships, and I find out from a user.

## Making it routine

- **Diff per partition and per region.** A global diff averages away a problem that lives in one region.
- **Put the diff in the pull request.** Reviewers should see the bucket counts, not just the code.
- **Pick the tolerance before you look.** A tolerance of 0.005 on currency is a rounding policy. Choosing it after you've seen the numbers is how real differences get waved through.
- **Diff the backfill.** Twelve months of rebuilt history is twelve months of chances to be wrong.
- **Keep the mismatched keys, not just the counts.** A table of keys that differ is what you'll actually debug from.

## When a full diff is too expensive

A full outer join on a very large partition isn't free. If it's too slow, diff a few partitions completely and compare per-column aggregates on the rest: row count, sums of the main measures, distinct count on the key. That's a weaker check, so say in the pull request which one you ran.

Totals are for dashboards. Rows are for deciding whether to ship.
