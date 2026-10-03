---
title: Where LLMs earn their keep in data engineering
description: LLMs are good at reading, drafting and explaining. They're bad at being the source of a number. How I'd use them on a data team, and the guardrails that make it safe.
pubDate: 2026-10-03T17:00:00Z
tags:
  - ai
  - llm
  - data quality
---

A team came to me in the middle of an investigation because an AI assistant had told them my tables held the answer. They brought along a document the assistant had helped write. Its arithmetic didn't add up and some of its fields were labeled as things they weren't. Separately, a percentage they were quoting used a different denominator from mine, so the two numbers couldn't be added together.

Nothing about it was malicious. It was just confidently wrong, and it was about to steer a real decision.

I gave them aggregates I could stand behind, said plainly what my tables could and couldn't answer, and corrected the document. That episode is a fair summary of where LLMs sit on a data team right now. They're very good with language. They're unreliable as a source of numbers.

## Where they help

**Reading unfamiliar code.** Point a model at a 400-line job you didn't write and ask "what happens to rows with a null region?" You still verify the answer, but you start reading in the right place.

**First drafts of SQL.** Joins, window functions, a `MERGE` skeleton, the boilerplate of a backfill. Models are fine at syntax and bad at grain, so check every join key yourself.

**Explaining a failure.** Give a model the stack trace, the task log and the last few runs, and it will write a reasonable first paragraph of an incident summary. You edit; you don't start from a blank page.

**Documentation.** Column descriptions, a README for a dataset, the "how to backfill this" section nobody ever writes. Drafts are cheap. Review them like code.

**Test ideas.** "What inputs would break this dedup logic?" gets you a list worth turning into unit tests: identical timestamps, late arrivals, a delete that lands before its insert.

## Where they don't

**Being the source of a number.** A model doesn't know your table's grain, your accrual timing, or which filters the business agreed to. Ask it for last month's revenue and it will give you one, confidently.

**Deciding whether a pipeline is healthy.** That should be answered by rules: freshness thresholds, row-count bounds, reconciliation against the source. Deterministic checks decide. A model can explain what the checks found, in plain language, to the people who need it.

**Anything with access it doesn't need.** If it can write, it can break something. Read-only by default.

## Guardrails that make it work

1. **Numbers come from queries, never from the model.** If a model is involved, it writes or explains the query. The warehouse runs it, and the result is shown next to the query that produced it.
2. **Scope before you answer.** Say what the data covers and what it doesn't: an estimate at attribution time is not a settled amount, and event time is not processing time. Half of all wrong numbers are right answers to a different question.
3. **Aggregate by default.** Model output gets pasted everywhere. Keep identifiers out of anything a model touches unless there's a specific reason.
4. **Validate model-written SQL the way you validate your own.** Uniqueness on the key, a row-level diff against something trusted, a run-it-twice check. Generated code isn't special. It's code someone else wrote.
5. **Keep a person on the merge button.**

## A small example of the split

Here's the shape I like for a daily data-quality summary. The checks are plain SQL and decide pass or fail. The model only turns the result into a readable note.

```python
results = run_checks(partition="2026-10-02")   # deterministic SQL checks
failed = [r for r in results if not r.passed]

status = "healthy" if not failed else "needs attention"   # rules decide

summary = llm.summarize(                      # the model only explains
    status=status,
    failed_checks=[r.as_dict() for r in failed],
    instructions="Explain each failure in one sentence. Do not add numbers.",
)
post_to_channel(status=status, details=failed, note=summary)
```

The status never depends on the model. If the model has a bad day, the note reads oddly, but nobody gets told a broken pipeline is fine.

## The short version

Use LLMs to read, draft and explain. Let deterministic code compute and decide. When those two jobs get mixed up, you end up with a confident document steering a real decision, and somebody has to untangle it.
