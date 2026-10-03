---
title: Integrity checks on every pipeline job
summary: I set the data integrity standards and delivery SLAs, then built the tooling that enforces them on every job.
org: TikTok
order: 1
headline:
  value: '20 TB'
  label: a day, validated on every job
figures:
  - value: '20 TB'
    label: processed daily
  - value: '5'
    label: regions deployed
tags:
  - Data SLAs
  - Automated validation
  - Freshness monitoring
  - Quality checks
  - Alerting
  - Documentation
---

## The goal

No stakeholder should open a stale dashboard, and no wrong number should ship, before the data team knows about it.

## Constraint

Nobody asked for this. I built it anyway, because waiting for permission would have meant shipping wrong numbers for another quarter.

## What I did

- Set the data integrity standards and delivery SLAs, and wrote them up as a standards doc the team adopted.
- Built the tooling that enforces them: automated validation on every job, freshness and quality checks, and alerts that fire before a stakeholder opens a stale dashboard.
- Deployed it across 5 regions.

## Result

The team now runs on this tooling. When data is late or wrong, the alert reaches the data team before a stakeholder opens the dashboard.
