import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.PUBLIC_BLOG_URL || 'https://blog.example.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: { build: { cssMinify: true } },
});
