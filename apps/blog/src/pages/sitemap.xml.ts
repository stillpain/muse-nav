import type { APIRoute } from 'astro';
import { getBlogArticles } from '@/lib/blog';
import { blogConfig } from '@/config';

const esc = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', "'":'&apos;', '\"':'&quot;' }[char]!));
export const GET: APIRoute = async () => {
  const articles = await getBlogArticles();
  const paths = ['/', '/archive/', '/about/', ...articles.map((article) => `/post/${article.slug}/`)];
  const urls = paths.map((path) => `<url><loc>${esc(new URL(path, blogConfig.siteUrl).toString())}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
