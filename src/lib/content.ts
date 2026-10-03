import { getCollection, type CollectionEntry } from 'astro:content';

export type WorkEntry = CollectionEntry<'work'>;
export type PostEntry = CollectionEntry<'blog'>;

/** Drafts show up in `npm run dev` so you can preview them, never in a build. */
const visible = (draft: boolean) => import.meta.env.DEV || !draft;

export async function getWork(): Promise<WorkEntry[]> {
  const entries = await getCollection('work', ({ data }) => visible(data.draft));
  return entries.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export async function getCaseStudies(): Promise<WorkEntry[]> {
  return (await getWork()).filter((entry) => entry.data.kind === 'case-study');
}

export async function getProjects(): Promise<WorkEntry[]> {
  return (await getWork()).filter((entry) => entry.data.kind === 'project');
}

// Skip the query entirely while there are no posts, which avoids Astro's
// "collection is empty" warning on every page of every build.
const postFiles = import.meta.glob(['../content/blog/**/*.{md,mdx}', '!../content/blog/**/_*']);

export async function getPosts(): Promise<PostEntry[]> {
  if (Object.keys(postFiles).length === 0) return [];
  const posts = await getCollection('blog', ({ data }) => visible(data.draft));
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
