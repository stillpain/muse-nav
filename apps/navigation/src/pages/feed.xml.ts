import type { APIRoute } from 'astro';
import { getCatalog } from '@/lib/content';
import { publishedSites, siteHref } from '@/lib/content/selectors';
import { siteConfig } from '@/config';

const esc = (value: string) => value.replace(/[<>&'\"]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[c]!));
export const GET: APIRoute = async () => {
  const catalog = await getCatalog();
  const items = publishedSites(catalog).sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20).map((site) => `<item><title>${esc(site.name)}</title><link>${esc(new URL(siteHref(site), siteConfig.siteUrl).toString())}</link><description>${esc(site.description)}</description><pubDate>${new Date(site.createdAt).toUTCString()}</pubDate><guid>${esc(site.id)}</guid></item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(siteConfig.name)}</title><link>${esc(siteConfig.siteUrl)}</link><description>${esc(siteConfig.description)}</description><language>zh-CN</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
