---
# TEMPLATE. Files starting with "_" are ignored by the site.
# To publish a post: copy this file to a new name without the underscore,
# e.g. src/content/blog/idempotent-dags.md. The file name becomes the URL:
# /portfolio/blog/idempotent-dags/
# The "Writing" section, the nav link, and the RSS feed appear automatically
# once at least one non-draft post exists.
title: Title of the post
description: One or two sentences for the post list, search results, and link previews.
pubDate: 2026-10-01
tags:
  - data quality
draft: true # set to false (or delete this line) to publish
---

Write the post in Markdown. Headings start at `##`.

## A section

Code blocks are highlighted and follow the light or dark theme:

```sql
select metric_date, count(*) as row_count
from canonical.events
group by 1
order by 1;
```

> Quotes, lists, tables, and images all work.
