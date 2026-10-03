import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/content';
import { site } from '../data/profile';
import { absoluteUrl } from '../lib/url';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${site.name}: writing`,
    description: 'Notes on data engineering by Sai S Sarvade.',
    site: absoluteUrl('', context.site),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: absoluteUrl(`blog/${post.id}/`, context.site),
    })),
  });
}
