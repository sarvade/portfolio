# sarvade.github.io/portfolio

Personal site of Sai S Sarvade, data engineer. Built with [Astro](https://astro.build) and deployed to GitHub Pages by GitHub Actions.

Live: https://sarvade.github.io/portfolio/

## Run it locally

Requires Node 22.12 or newer.

```sh
npm install
npm run dev        # http://localhost:4321/portfolio/ (drafts are visible here)
npm run verify     # type-check, build, and check every internal link
npm run preview    # serve the production build
```

## Where things live

| To change… | Edit |
| --- | --- |
| Hero, experience, skills, about, education, contact links | `src/data/profile.ts` |
| A case study or project | `src/content/work/<slug>.mdx` (`featured: true` puts it on the home page; all appear on `/work/`) |
| A blog post | `src/content/blog/<slug>.md` |
| The résumé PDF | replace `public/Sai_Sarvade_Resume.pdf` (keep the name, or update `resume` in `profile.ts`) |
| Headshot | replace `src/assets/headshot.jpg` (4:5 portrait works best) |
| Colors, type scale, spacing | `src/styles/global.css` |
| Hero pipeline diagram labels | `pipeline` in `src/data/profile.ts` |
| At-a-glance card, optional "open to roles" line | `glance` and `hero.availability` in `src/data/profile.ts` |
| Engineering principles section (habits + illustrative snippets) | `principles` in `src/data/profile.ts` |
| “Scale I work at” and “Results” bands under the hero | `scale` and `impact` in `src/data/profile.ts` |
| Typewriter roles | `hero.roles` in `src/data/profile.ts` |
| Hero headline (two lines, split at the first period) | `hero.headline` in `src/data/profile.ts`, then `scripts/og/og.html` and `python3 scripts/render-images.py` for the link preview |
| Colors of the animated name | `--spectrum` in `src/styles/global.css` (one list per theme) |
| Icons | `src/icons/*.svg` (Tabler Icons, MIT), used via `<Icon name="..." />` |

## Add a blog post

1. Copy `src/content/blog/_example-post.md` to `src/content/blog/my-post-slug.md`.
2. Fill in `title`, `description`, `pubDate`, `tags`, and write the post in Markdown (`.mdx` also works).
3. Remove `draft: true` (or set it to `false`).
4. Push to `main`.

The "Writing" section on the home page, the nav link, `/portfolio/blog/`, and the RSS feed (`/portfolio/rss.xml`) all appear automatically once at least one published post exists.

## Diagrams and charts in case studies

Case studies are MDX, so they can use the built-in components in `src/components/viz/`:

- `<Flow steps={[...]} title="..." />`: an architecture flow that stacks vertically on phones. Step `tone` can be `signal`, `caution` or `muted`.
- `<Compare title="..." rows={[...]} caption="..." />`: before/after bars drawn to one scale, values labeled. Add `scale="log"` for 10×+ gaps, or `max={236}` to draw bars as shares of a whole; a value of 0 draws no bar.
- `<Callout label="The call">...</Callout>`: highlights the judgment call.
- `<Architecture title="..." layers={[{ name: 'Source', nodes: [...] }, ...]} checks={{ nodes: [...] }} />`: a layered system diagram (source, compute, storage, serving, or the system's real path) with a band for the checks that guard it. Spans the full article width on case-study pages and stacks on phones.
- `<Tradeoffs items={[{ question, chose, over, why }]} />`: decisions as a small decision record. Only list alternatives that were really considered.

Blog posts can use the same components when written as `.mdx`, plus a few more:

- `<Matrix title="..." columns={[...]} rows={[[...], ...]} chips={{ Latest: 'signal' }} />`: a decision table that turns into one card per row on phones. Cell values listed in `chips` render as tone-colored labels.
- `<Partitions title="..." legend={[{ key, label, tone }]} rows={[{ label, cells: 'oooxn', marks: [3], note }]} axis={['Sep 1', 'Sep 30']} />`: one row per scenario, one cell per partition. Each character of `cells` is a legend key; `marks` (or `'all'`) draws rewritten cells taller. Label illustrative data in the caption.
- `<StateTrace title="..." lanes={[{ name, scope, steps: [{ when, text, tone }], outcome }]} />`: stored state over time, one lane per scope, side by side when there is room. `text` may contain `<code>`.
- `<Schema title="..." tables={[{ name, note, columns: [{ name, type, key, note, added }] }]} relation={{ label, cardinality }} />`: a data model, one card per table; `added` marks proposed columns.
- `<RerunResolver />`: the interactive Airflow 3.3 rerun-version ladder used in the Airflow reruns post. Its rules live in `rerun-resolver.ts`.

Animated components play once when scrolled into view, and render static with reduced motion or without JavaScript.

Case studies end with **What broke, and what changed** (where something did) and **What I’d do differently now**.

## Add a project or case study

1. Copy `src/content/work/_example-project.md` to `src/content/work/my-project.md`.
2. Set `kind: project` (listed under "Projects") or `kind: case-study` (listed under "Selected work").
3. Fill in `headline` (the big figure in the list), optional `figures`, `tags`, and `links`.
4. Remove `draft: true` and push.

Files that start with `_` are ignored, so the examples stay as templates. To link a skill or an experience bullet to a case study, set its `work` field in `profile.ts` to the case study's file name (without `.md`); the build fails if that file doesn't exist.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: install, type-check, build, link check, then deploy to GitHub Pages. Pull requests run the same checks without deploying.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

If the Actions tab still shows a **pages build and deployment** run (with Jekyll errors), the source is still set to "Deploy from a branch". Switch it to GitHub Actions; until then that old job fails without publishing anything, and this workflow's deploy stays live.

### Moving to a custom domain

In `astro.config.mjs`, set `site` to the new origin (e.g. `https://saisarvade.dev`) and `base` to `'/'`, add `public/CNAME` with the domain, then configure DNS as described in GitHub's Pages docs. Every link goes through `url()` in `src/lib/url.ts`, so nothing else needs to change.

## Email address

The address never appears as plain text in the HTML, JSON-LD or `resume.json`. `Contact.astro` shows it as text plus an @ icon and assembles the real address in the browser only when someone clicks Copy or Write to me. The résumé PDF is the one place it still appears in plain text.

## Other scripts

- `src/pages/resume.json.ts` publishes the résumé as data at `/portfolio/resume.json` ([JSON Resume](https://jsonresume.org/schema) format), generated from `profile.ts`. It never includes a phone number or email address.
- `scripts/check-links.mjs` checks every internal link and asset in `dist/`, including the `/portfolio/` base path and `#fragment` targets.
- `scripts/subset-font.py` rebuilds the trimmed Archivo font in `src/fonts/` (needs `pip install fonttools brotli`).
- `scripts/render-images.py` regenerates `public/og.png` and the PNG icons (needs Python Playwright).
