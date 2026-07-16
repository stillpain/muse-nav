import { LocalContentAdapter } from './LocalContentAdapter';
import { validateCatalog } from './schema';
import type {
  BlogPostProjection,
  Category,
  ContentAdapter,
  FriendLink,
  Pricing,
  Site,
  Tag,
} from './types';

const stripHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const asArray = (value: unknown, fallback: string[] = []) =>
  Array.isArray(value) ? value.map(String).filter(Boolean) : typeof value === 'string' && value ? [value] : fallback;
const stableUuid = (value: unknown) => {
  const candidate = String(value || '');
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)) return candidate;
  const numeric = String(Math.abs(Number.parseInt(candidate, 10) || 0)).slice(-12).padStart(12, '0');
  return `00000000-0000-4000-8000-${numeric}`;
};
const wpDate = (value: string | undefined) => {
  if (!value) return new Date(0).toISOString();
  const explicitZone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
  return new Date(explicitZone).toISOString();
};

export class WordPressContentAdapter implements ContentAdapter {
  private base = (import.meta.env.WORDPRESS_API_URL || '').replace(/\/$/, '');
  private timeout = Number(import.meta.env.WORDPRESS_TIMEOUT_MS || 8000);

  private async fetchJson<T>(path: string): Promise<T> {
    if (!this.base) throw new Error('WORDPRESS_API_URL 未配置');
    const response = await fetch(`${this.base}${path}`, { signal: AbortSignal.timeout(this.timeout) });
    if (!response.ok) throw new Error(`WordPress API ${response.status}: ${path}`);
    return response.json() as Promise<T>;
  }

  async getCatalog() {
    try {
      const [wpSites, wpCategories, wpTags, wpPosts] = await Promise.all([
        this.fetchJson<any[]>('/wp/v2/nav-sites?per_page=100&_embed=1'),
        this.fetchJson<any[]>('/wp/v2/nav_category?per_page=100'),
        this.fetchJson<any[]>('/wp/v2/nav_tag?per_page=100'),
        this.fetchJson<any[]>('/wp/v2/posts?per_page=12&_embed=1'),
      ]);

      const categories: Category[] = wpCategories.map((item) => {
        const description = stripHtml(item.description) || `${item.name}分类收录经过编辑筛选的网站、工具与相关实用资源。`;
        return {
          id: stableUuid(item.meta?.nav_uuid || item.id),
          slug: item.slug,
          name: item.name,
          description,
          icon: item.meta?.nav_icon || 'NAV',
          color: item.meta?.nav_color || '#6857d9',
          parent: item.parent ? wpCategories.find((entry) => entry.id === item.parent)?.slug || null : null,
          sortOrder: Number(item.meta?.nav_sort_order || item.id),
          status: 'published',
          seoTitle: item.meta?.nav_seo_title || `${item.name}网站导航`,
          seoDescription: item.meta?.nav_seo_description || description,
        };
      });

      const tags: Tag[] = wpTags.map((item) => ({
        id: stableUuid(item.meta?.nav_uuid || item.id),
        slug: item.slug,
        name: item.name,
        description: stripHtml(item.description),
        status: 'published',
      }));

      const validPricing = new Set<Pricing>(['free', 'freemium', 'paid', 'unknown']);
      const sites: Site[] = wpSites.map((item) => {
        const pricing = String(item.meta?.nav_pricing || 'unknown') as Pricing;
        const shortDescription = item.meta?.nav_description || stripHtml(item.excerpt?.rendered);
        return {
          id: stableUuid(item.meta?.nav_uuid || item.id),
          name: stripHtml(item.title?.rendered),
          slug: item.slug,
          url: item.meta?.nav_url,
          description: shortDescription || '由编辑团队筛选并整理的实用网站资源。',
          longDescription: stripHtml(item.content?.rendered) || null,
          logo: item.meta?.nav_logo || '',
          category: item._embedded?.['wp:term']?.[0]?.[0]?.slug || '',
          tags: (item._embedded?.['wp:term']?.[1] || []).map((tag: any) => tag.slug),
          featured: Boolean(item.meta?.nav_featured),
          recommended: Boolean(item.meta?.nav_recommended),
          sortOrder: Number(item.meta?.nav_sort_order || 0),
          status: item.status === 'publish' ? 'published' : 'draft',
          pricing: validPricing.has(pricing) ? pricing : 'unknown',
          language: asArray(item.meta?.nav_language, ['zh-CN']),
          screenshots: asArray(item.meta?.nav_screenshots),
          alternatives: asArray(item.meta?.nav_alternatives),
          relatedPosts: asArray(item.meta?.nav_related_posts),
          createdAt: wpDate(item.date_gmt || item.date),
          updatedAt: wpDate(item.modified_gmt || item.modified),
          indexable: Boolean(item.meta?.nav_indexable),
        };
      });

      const posts: BlogPostProjection[] = wpPosts.map((item) => ({
        id: String(item.id),
        slug: item.slug,
        url: item.link,
        title: stripHtml(item.title?.rendered),
        excerpt: stripHtml(item.excerpt?.rendered),
        cover: item._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
        categories: (item._embedded?.['wp:term']?.[0] || []).map((term: any) => term.name),
        publishedAt: wpDate(item.date_gmt || item.date),
      }));

      const local = await new LocalContentAdapter().getCatalog();
      const friends: FriendLink[] = local.friends;
      return validateCatalog({ sites, categories, tags, friends, posts, stale: false });
    } catch (error) {
      console.warn('WordPress 内容不可用，使用本地快照。', error);
      const fallback = await new LocalContentAdapter().getCatalog();
      return { ...fallback, stale: true };
    }
  }
}
