---
title: 'PulseOps: integrity checks on every job'
summary: I set the data integrity standards and delivery SLAs for 30+ production pipelines, then built the tool that enforces them.
org: TikTok
order: 1
headline:
  value: '30+'
  label: production pipelines under automated checks
figures:
  - value: '30+'
    label: production pipelines
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

## Context

I own 30+ production pipelines processing about 20 TB a day for Creator Compass and Seller Compass, the self-serve analytics products 15M+ users rely on across 19 countries.

## The goal

No stakeholder should open a stale dashboard, and no wrong number should ship, before the data team knows about it.

## Constraint

Nobody asked for this. I built it unprompted, because waiting for permission would have meant shipping wrong numbers for another quarter.

## What I did

- Set the data integrity standards and delivery SLAs for the pipelines, and wrote them up as a standards doc the team adopted.
- Built PulseOps to enforce them: automated validation across every job, freshness and quality checks, and alerting that fires before a stakeholder opens a stale dashboard.
- Deployed it across 5 regions.

## Result

The team now runs on this tooling. Every job across 30+ pipelines is validated automatically, and a freshness or quality problem raises an alert before a stakeholder opens the dashboard.
