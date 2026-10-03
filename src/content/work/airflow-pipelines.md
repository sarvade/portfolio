---
title: Faster Airflow pipelines that are safe to rerun
summary: I designed and operated production Airflow pipelines integrating vendor APIs and legacy systems into S3 and Teradata.
org: Delta Air Lines
order: 6
headline:
  value: '65%'
  label: shorter ETL runtime, 4.5 hours down to 1.5
figures:
  - value: '4.5h → 1.5h'
    label: ETL runtime
  - value: '99.9%'
    label: accuracy
tags:
  - Apache Airflow
  - Amazon S3
  - Teradata
  - Idempotent DAGs
  - Reconciliation
---

## Context

Data from vendor APIs and legacy systems had to land in S3 and Teradata.

## What I did

- Designed and operated the production Airflow pipelines that integrate those sources.
- Made the DAGs idempotent, so rerunning a task gives the same result.
- Added reconciliation checks to confirm the data that landed matches the source.

## Result

ETL runtime dropped 65%, from 4.5 hours to 1.5, while accuracy held at 99.9%.
