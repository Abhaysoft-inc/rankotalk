import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Set SITE_URL in the host's build settings once the real domain is chosen.
const site = process.env.SITE_URL ?? 'https://rankotalk.com';
const CONTENT_UPDATED = '2026-10-31';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    preact(),
    mdx(),
    // Update CONTENT_UPDATED whenever page content changes. An accurate lastmod helps crawlers; a false one is ignored.
    sitemap({
      filter: (page) => !page.endsWith('/404'),
      serialize: (item) => ({ ...item, lastmod: CONTENT_UPDATED }),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
