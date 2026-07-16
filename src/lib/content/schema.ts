import { z } from 'zod';
import type { ContentCatalog } from './types';

const isoDate = z.string().datetime({ offset: true });
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const siteSchema = z.object({
  id: z.string().uuid(), name: z.string().min(1), slug,
  url: z.string().url().refine((url) => /^https?:\/\//.test(url), '只允许 HTTP/HTTPS'),
  description: z.string().min(8).max(160), longDescription: z.string().nullable(), logo: z.string(),
  category: slug, tags: z.array(slug), featured: z.boolean(), recommended: z.boolean(),
  sortOrder: z.number().int(), status: z.enum(['draft', 'published', 'archived', 'broken']),
  pricing: z.enum(['free', 'freemium', 'paid', 'unknown']), language: z.array(z.string()).min(1),
  screenshots: z.array(z.string()), alternatives: z.array(slug), relatedPosts: z.array(z.string()),
  createdAt: isoDate, updatedAt: isoDate, indexable: z.boolean(),
});

export const categorySchema = z.object({
  id: z.string().uuid(), slug, name: z.string().min(1), description: z.string().min(20),
  icon: z.string().min(1), color: z.string().regex(/^#[0-9a-f]{6}$/i), parent: slug.nullable(),
  sortOrder: z.number().int(), status: z.enum(['published', 'draft']),
  seoTitle: z.string().min(1), seoDescription: z.string().min(20).max(180),
});

export const tagSchema = z.object({
  id: z.string().uuid(), slug, name: z.string().min(1), description: z.string(), status: z.enum(['published', 'draft']),
});

export const friendSchema = z.object({
  id: z.string().uuid(), name: z.string(), url: z.string().url(), description: z.string(), logo: z.string(),
  status: z.enum(['published', 'pending']), sortOrder: z.number().int(), createdAt: isoDate,
});

export const postSchema = z.object({
  id: z.string(), slug, url: z.string().url(), title: z.string(), excerpt: z.string(), cover: z.string().nullable(),
  categories: z.array(z.string()), publishedAt: isoDate,
});

export function validateCatalog(raw: unknown): ContentCatalog {
  const catalog = z.object({
    sites: z.array(siteSchema), categories: z.array(categorySchema), tags: z.array(tagSchema),
    friends: z.array(friendSchema), posts: z.array(postSchema), stale: z.boolean().optional(),
  }).parse(raw);

  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length) throw new Error(`${label} 存在重复值`);
  };
  unique(catalog.sites.map((item) => item.slug), '网站 slug');
  unique(catalog.sites.map((item) => item.url.replace(/\/$/, '').toLowerCase()), '网站 URL');
  unique(catalog.categories.map((item) => item.slug), '分类 slug');
  unique(catalog.tags.map((item) => item.slug), '标签 slug');

  const categories = new Set(catalog.categories.map((item) => item.slug));
  const tags = new Set(catalog.tags.map((item) => item.slug));
  const sites = new Set(catalog.sites.map((item) => item.slug));
  for (const site of catalog.sites) {
    if (!categories.has(site.category)) throw new Error(`${site.slug} 引用了不存在的分类 ${site.category}`);
    for (const tag of site.tags) if (!tags.has(tag)) throw new Error(`${site.slug} 引用了不存在的标签 ${tag}`);
    for (const alt of site.alternatives) if (!sites.has(alt)) throw new Error(`${site.slug} 引用了不存在的替代项 ${alt}`);
    if (site.alternatives.includes(site.slug)) throw new Error(`${site.slug} 不能将自身设为替代项`);
  }
  return catalog;
}
