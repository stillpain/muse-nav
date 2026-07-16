import { siteConfig } from '@/config';
import type { Category, Site } from '@/lib/content/types';

export const websiteJsonLd = () => ({
  '@context': 'https://schema.org', '@type': 'WebSite', name: siteConfig.name,
  url: siteConfig.siteUrl, description: siteConfig.description,
  potentialAction: {
    '@type': 'SearchAction', target: `${siteConfig.siteUrl}/search/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const breadcrumbJsonLd = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, ...item })),
});

export const categoryJsonLd = (category: Category, sites: Site[]) => ({
  '@context': 'https://schema.org', '@type': 'ItemList', name: category.name,
  numberOfItems: sites.length,
  itemListElement: sites.map((site, index) => ({ '@type': 'ListItem', position: index + 1, name: site.name, url: site.url })),
});
