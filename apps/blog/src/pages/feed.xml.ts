import type { APIRoute } from 'astro';
import { getBlogArticles } from '@/lib/blog';
import { blogConfig } from '@/config';

const esc = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', "'":'&apos;', '\"':'&quot;' }[char]!));
export const GET: APIRoute = async () => {
  const articles = await getBlogArticles();
  const items = articles.map((article) => `<item><title>${esc(article.title)}</title><link>${esc(new URL(`/post/${article.slug}/`, blogConfig.siteUrl).toString())}</link><description>${esc(article.excerpt)}</description><pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate><guid>${esc(article.slug)}</guid></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(blogConfig.name)}</title><link>${esc(blogConfig.siteUrl)}</link><description>${esc(blogConfig.description)}</description><language>zh-CN</language>${items}</channel></rss>`, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
