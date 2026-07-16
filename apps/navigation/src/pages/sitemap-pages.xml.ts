import type { APIRoute } from 'astro';
import { getCatalog } from '@/lib/content';
import { indexableSites, publishedSites } from '@/lib/content/selectors';
import { siteConfig } from '@/config';

const esc = (value: string) => value.replace(/[<>&'\"]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[c]!));
export const GET: APIRoute = async () => {
  const catalog = await getCatalog(); const sites = publishedSites(catalog);
  const urls = ['/', '/about/'];
  for (const category of catalog.categories.filter((c) => c.status === 'published')) {
    const count = sites.filter((site) => site.category === category.slug).length;
    if (category.description.length >= 40 && count >= 2) urls.push(`/category/${category.slug}/`);
  }
  urls.push(...indexableSites(catalog).map((site) => `/site/${site.slug}/`));
  for (const tag of catalog.tags) if (sites.filter((site) => site.tags.includes(tag.slug)).length >= 8 && tag.description.length >= 40) urls.push(`/tag/${tag.slug}/`);
  const body = urls.map((path) => `<url><loc>${esc(new URL(path, siteConfig.siteUrl).toString())}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
