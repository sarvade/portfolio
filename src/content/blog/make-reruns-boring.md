---
title: Make reruns boring
description: Retries and backfills will happen. If running a job twice changes the answer, the pipeline isn’t finished. Four patterns I use to make reruns safe.
pubDate: 2026-10-03T15:00:00Z
tags:
  - pipelines
  - airflow
  - reliability
---

Every pipeline gets rerun. A task times out and retries. An upstream table lands late and you clear the day. Someone finds a bug and you backfill three months. The question isn't whether a job will run twice on the same input. It's what happens when it does.

If the answer is anything other than "nothing changes," the pipeline isn't finished.

## Delivery is not effect

A message arriving twice is normal. A payment applied twice is a bug. Most systems promise at-least-once delivery, and that's fine, as long as the write at the end is idempotent: doing it twice has the same effect as doing it once. No scheduler gives you that property. You build it.

## Pattern 1: overwrite the partition, don't append

```sql
insert overwrite table mart.daily_orders
partition (dt = '{{ ds }}')
select order_id,
       customer_id,
       amount_usd
from   staging.orders
where  dt = '{{ ds }}';
```

The task owns exactly one partition, and running it again replaces that partition. Swap `insert overwrite` for `insert into` and a single retry gives you two copies of the day.

Two details make this work:

- **Use the run's logical date** (`{{ ds }}` in Airflow), never `current_date()` or `now()`. A June backfill that runs in October should produce June's data.
- **Read only what belongs to that partition.** A job that reads "everything since the last run" depends on when it ran, which is the opposite of what you want.

## Pattern 2: merge on a real key

When the target isn't partitioned by date, or updates arrive out of order, merge on the natural key and make the winner deterministic:

```sql
merge into dim_customer t
using (
  select *
  from (
    select s.*,
           row_number() over (
             partition by customer_id
             order by updated_at desc, ingest_seq desc
           ) as rn
    from   staging.customer_changes s
    where  dt = '{{ ds }}'
  ) ranked
  where rn = 1
) s
on t.customer_id = s.customer_id
when matched and s.updated_at >= t.updated_at then update set *
when not matched then insert *;
```

Look at the tie-breaker in the `order by`. Without `ingest_seq`, two records with the same timestamp can resolve differently on different runs, and your "deterministic" job isn't. The `updated_at` guard stops an old change, replayed late, from overwriting a newer one.

## Pattern 3: a manifest for files and APIs

For ingestion, write each chunk to a deterministic location and record what has landed. Re-downloading a chunk then overwrites it instead of duplicating it, and a failed run resumes where it stopped instead of starting over.

```python
def ingest(source, manifest, storage, chunk_bytes=256 * 1024 * 1024):
    size = source.content_length()
    for start in range(0, size, chunk_bytes):
        end = min(start + chunk_bytes, size) - 1
        key = f"{source.name}/{start:012d}-{end:012d}.part"
        if manifest.is_complete(key):
            continue                          # landed on an earlier run
        data = source.read_range(start, end)  # HTTP range request
        storage.put(key, data)                # same key on a rerun: overwrite
        manifest.mark_complete(key, checksum=sha256(data))
```

A 50 GB pull from a flaky API stops being an all-or-nothing gamble.

## Pattern 4: check what landed

Idempotent writes protect you from duplicates. They don't prove the data is right. After each load, reconcile against the source, per partition: row counts, sums of the main measures, distinct count on the key. When they disagree, fail the run loudly.

A green task only tells you the code ran. It says nothing about whether the data is complete or correct.

## Test it the obvious way

Run the job twice for the same date and diff the output of the first run against the second. If anything differs, you've found a dependency on time, order or state that you didn't know about. It takes a few minutes and it's the most useful pipeline test I know.

## What it bought me

On production Airflow pipelines I designed and ran, pulling from vendor APIs and legacy systems into S3 and Teradata, I cut runtime from 4.5 hours to 1.5. Idempotent DAGs and reconciliation checks are how accuracy held at 99.9% while I did it.

When a retry or a backfill is a non-event, people stop being afraid to run them. That's the moment a pipeline gets easy to operate.
