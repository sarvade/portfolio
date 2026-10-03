---
title: Moving a ranking feature’s computation upstream into Flink
summary: Others were tuning the query. The real constraint was the access pattern, so I moved the computation upstream into Flink.
org: TikTok
order: 3
headline:
  value: '1.5B+'
  label: record stream, computed upstream in Flink
figures:
  - value: '1.5B+'
    label: records in the stream
tags:
  - Flink
  - Stream processing
  - Query performance
---

## Context

A ranking feature had stalled. Other engineers were working on it, and looking at it was outside my job description.

## Problem

The fix in progress was tuning the query.

## Diagnosis

The query wasn't the constraint. The access pattern was. Tuning could only go so far, because the limit was in how the data was accessed, not in how the query was written.

## What I did

Moved the computation upstream into Flink, running over a stream of 1.5B+ records, so the heavy work happens as the data flows instead of at query time.

## Result

Query time and compute cost both dropped by orders of magnitude.
