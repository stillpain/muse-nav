import { siteConfig } from '@/config';
import type { ContentCatalog, Site } from './types';

export const publishedSites = (catalog: ContentCatalog) => catalog.sites
  .filter((site) => site.status === 'published')
  .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'zh-CN'));

export const indexableSites = (catalog: ContentCatalog) => publishedSites(catalog)
  .filter((site) => site.indexable && (site.longDescription?.length || 0) >= siteConfig.detailMinimumLength);

export const hasDetail = (site: Site) => site.indexable && (site.longDescription?.length || 0) >= siteConfig.detailMinimumLength;

export const siteHref = (site: Site) => hasDetail(site) ? `/site/${site.slug}/` : site.url;
