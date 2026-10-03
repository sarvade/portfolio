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
| A case study or project | `src/content/work/<slug>.md` |
| A blog post | `src/content/blog/<slug>.md` |
| The résumé PDF | replace `public/Sai_Sarvade_Resume.pdf` (keep the name, or update `resume` in `profile.ts`) |
| Headshot | replace `src/assets/headshot.jpg` (4:5 portrait works best) |
| Colors, type scale, spacing | `src/styles/global.css` |
| Hero pipeline diagram labels | `pipeline` in `src/data/profile.ts` |

## Add a blog post

1. Copy `src/content/blog/_example-post.md` to `src/content/blog/my-post-slug.md`.
2. Fill in `title`, `description`, `pubDate`, `tags`, and write the post in Markdown (`.mdx` also works).
3. Remove `draft: true` (or set it to `false`).
4. Push to `main`.

The "Writing" section on the home page, the nav link, `/portfolio/blog/`, and the RSS feed (`/portfolio/rss.xml`) all appear automatically once at least one published post exists.

## Add a project or case study

1. Copy `src/content/work/_example-project.md` to `src/content/work/my-project.md`.
2. Set `kind: project` (listed under "Projects") or `kind: case-study` (listed under "Selected work").
3. Fill in `headline` (the big figure in the list), optional `figures`, `tags`, and `links`.
4. Remove `draft: true` and push.

Files that start with `_` are ignored, so the examples stay as templates. To link a skill or an experience bullet to a case study, set its `work` field in `profile.ts` to the case study's file name (without `.md`); the build fails if that file doesn't exist.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: install, type-check, build, link check, then deploy to GitHub Pages. Pull requests run the same checks without deploying.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Moving to a custom domain

In `astro.config.mjs`, set `site` to the new origin (e.g. `https://saisarvade.dev`) and `base` to `'/'`, add `public/CNAME` with the domain, then configure DNS as described in GitHub's Pages docs. Every link goes through `url()` in `src/lib/url.ts`, so nothing else needs to change.

## Other scripts

- `scripts/check-links.mjs` checks every internal link and asset in `dist/`, including the `/portfolio/` base path and `#fragment` targets.
- `scripts/subset-font.py` rebuilds the trimmed Archivo font in `src/fonts/` (needs `pip install fonttools brotli`).
- `scripts/render-images.py` regenerates `public/og.png` and the PNG icons (needs Python Playwright).
