import { listCategories, listSites } from '$lib/server/db';

export const load = ({ url }) => {
  const query = (url.searchParams.get('q') || '').trim();
  const activeCategory = url.searchParams.get('category') || '';
  const allSites = listSites();
  const categories = listCategories().map((category) => ({
    ...category,
    siteCount: allSites.filter((site) => site.categoryId === category.id).length
  }));
  const showSites = Boolean(activeCategory || query);
  const filtered = allSites.filter((site) =>
    (!activeCategory || site.categorySlug === activeCategory) &&
    (!query || `${site.name} ${site.description} ${site.url}`.toLowerCase().includes(query.toLowerCase()))
  );
  const pageSize = 18;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, Number(url.searchParams.get('page')) || 1));
  return {
    categories,
    sites: showSites ? filtered.slice((page - 1) * pageSize, page * pageSize) : [],
    total: showSites ? filtered.length : allSites.length,
    page,
    pageCount: showSites ? pageCount : 1,
    query,
    activeCategory
  };
};
