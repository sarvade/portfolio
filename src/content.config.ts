import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Work: case studies and projects.
 * One Markdown (or MDX) file per entry in src/content/work/.
 * Files starting with an underscore (e.g. _example-project.md) are ignored,
 * so they can act as templates.
 */
const work = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    /** One sentence shown in lists and as the page description. */
    summary: z.string(),
    /** 'case-study' entries appear under "Selected work", 'project' entries under "Projects". */
    kind: z.enum(['case-study', 'project']).default('case-study'),
    /** Where the work happened, e.g. "TikTok" or "Personal project". */
    org: z.string(),
    /** Optional time frame, e.g. "2026". Leave out if you are not sure. */
    period: z.string().optional(),
    /** The large figure shown next to the entry in lists. */
    headline: z.object({ value: z.string(), label: z.string() }),
    /** Up to three key figures shown at the top of the entry page. */
    figures: z.array(z.object({ value: z.string(), label: z.string() })).max(3).default([]),
    /** Tools and practices, shown as a list on the entry page. */
    tags: z.array(z.string()).default([]),
    links: z
      .object({
        repo: z.url().optional(),
        demo: z.url().optional(),
      })
      .default({}),
    /** Lower numbers sort first. */
    order: z.number().default(100),
    /** Drafts are visible with `npm run dev` but never published. */
    draft: z.boolean().default(false),
  }),
});

/**
 * Blog posts. One Markdown (or MDX) file per post in src/content/blog/.
 * The "Writing" section and nav link appear automatically once a
 * non-draft post exists.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { work, blog };
