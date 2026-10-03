---
title: Cutting ingestion latency from 2 hours to under 5 minutes
summary: I built asynchronous, event-driven ingestion on Kinesis, Lambda, and SNS for 3M+ transactions a day.
org: Delta Air Lines
order: 5
headline:
  value: '<5 min'
  label: end-to-end latency, down from 2 hours
figures:
  - value: '3M+'
    label: transactions a day
  - value: '99.9%'
    label: uptime
  - value: '<5 min'
    label: end-to-end latency, from 2 hours
tags:
  - Amazon Kinesis
  - AWS Lambda
  - Amazon SNS
  - Event-driven architecture
---

## Context

End-to-end latency for transaction data was 2 hours.

## What I did

Built asynchronous, event-driven ingestion on Kinesis, Lambda, and SNS to carry 3M+ transactions a day.

## Result

End-to-end latency fell from 2 hours to under 5 minutes, at 99.9% uptime.
