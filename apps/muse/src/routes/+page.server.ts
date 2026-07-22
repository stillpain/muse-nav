import { getVisitorStats, listCategories, listSites } from '$lib/server/db';

export const load = ({ url }) => {
  const query = (url.searchParams.get('q') || '').trim();
  const activeCategory = url.searchParams.get('category') || '';
  const allSites = listSites();
  const filtered = allSites.filter((site) =>
    (!activeCategory || site.categorySlug === activeCategory) &&
    (!query || `${site.name} ${site.description} ${site.url}`.toLowerCase().includes(query.toLowerCase()))
  );
  const pageSize = 18;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, Number(url.searchParams.get('page')) || 1));
  return { categories: listCategories(), sites: filtered.slice((page - 1) * pageSize, page * pageSize), visitorStats:getVisitorStats(), total: filtered.length, page, pageCount, query, activeCategory };
};
