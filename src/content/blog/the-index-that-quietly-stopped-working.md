---
title: The index that quietly stopped working
description: An API was failing at peak and everyone wanted a higher rate limit. The real problem was a query that had silently stopped using its index.
pubDate: 2026-10-03T16:00:00Z
tags:
  - olap
  - performance
  - debugging
---

The alert came in the usual way: an API failing at peak, its success rate down to about 70%. The fix everyone reached for first was the obvious one. Raise the rate limit.

I owned the query behind that API, so before agreeing to anything I looked at what a single call actually cost. Every request was scanning 8.24 million rows in our OLAP cluster.

That changes the conversation. If every call is that expensive, letting more of them through doesn't fix the API. It moves the incident into a shared cluster, where it can hurt everyone else's queries too.

## Reading the plan

I sat down with the owner of the cluster, which runs Apache Doris, and we read the query plans together. The query filtered on a long `IN` list of keys.

Doris can use a prefix index to jump straight to the rows a query needs instead of reading everything. But there's a configured cap on how many scan keys it will build from a filter. Go past it and the engine stops using the index for that scan. It doesn't fail. It doesn't warn. It just reads a lot more data.

Our `IN` list had grown past that cap, so the index had quietly stopped doing its job.

## The fix was one line

A query hint on the scan-key setting (`max_scan_key_num`) put the index back to work. Rows scanned per call dropped by 40 to 80 times.

Then, and only then, I raised the rate limit from 150 to 200 queries per second, with the before-and-after numbers attached to the change. The success rate recovered, and the API has run under that limit since.

## Three months later

During an infrastructure incident, traffic failed over to a backup environment that had none of this tuning. The same API hit its cap at about 250 queries per second, and a backend engineer asked for a quick patch.

I said no, but I didn't stop at no. I gave him a rule: measure the real peak in the failover environment, agree on a threshold, and file a proper change only if traffic stays above it past the time we expect to fail back. Nothing unreviewed went in during the incident.

## What I took from it

**Read the plan before you touch the limit.** Capacity is the expensive fix. Cost per call is usually the cheap one, and it's the one you control.

**Engines degrade silently.** Scan-key caps, broadcast-join thresholds, memory limits that trigger a spill to disk: plenty of optimizers have a cliff where they switch strategies without telling you. If a query got slow without anyone changing it, look for the cliff. Often the input grew, not the code.

**Bring evidence to a limit change.** "Rows per call dropped 40 to 80 times" is a much easier yes than "it should be fine."

**Give people a rule, not just a no.** During an incident somebody always wants the quick patch. A clear threshold turns an argument into a decision everyone can live with.

The same fix later unblocked a colleague's new interface that had failed scan testing a few days before its launch date, and it became our default approach for OLAP-backed list APIs. Small change, large effect. Those are my favorite kind.
