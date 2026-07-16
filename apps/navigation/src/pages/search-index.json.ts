import type { APIRoute } from 'astro';
import { getCatalog } from '@/lib/content';
import { publishedSites, siteHref } from '@/lib/content/selectors';

export const GET: APIRoute = async () => {
  const catalog = await getCatalog();
  const categories = new Map(catalog.categories.map((item) => [item.slug, item.name]));
  const tags = new Map(catalog.tags.map((item) => [item.slug, item.name]));
  const data = publishedSites(catalog).map((site) => ({
    name: site.name, description: site.description, href: siteHref(site),
    text: [site.name, site.description, categories.get(site.category), ...site.tags.map((tag) => tags.get(tag))].filter(Boolean).join(' ').toLowerCase(),
  }));
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};
