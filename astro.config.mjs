// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tools.zglab.fun',
  output: 'static',
  build: {
    format: 'directory',
  },
  integrations: [preact(), sitemap()],
});
