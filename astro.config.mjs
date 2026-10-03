// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// The site is a GitHub Pages *project* site served from /portfolio/.
// If you move to a custom domain or a root user site (sarvade.github.io),
// change `site` to that origin and set `base` to '/'.
const site = 'https://sarvade.github.io';
const base = '/portfolio';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  // Keep classic lossless whitespace handling (Astro 7 defaults to JSX rules).
  compressHTML: true,
  build: {
    format: 'directory',
  },
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light-default', dark: 'github-dark-default' },
      defaultColor: false,
    },
  },
});
