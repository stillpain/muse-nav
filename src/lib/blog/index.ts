import { blogArticles as localArticles, type BlogArticle } from '@/data/blog';

const stripHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const allowedAccent = (value: unknown): BlogArticle['accent'] =>
  value === 'teal' || value === 'gold' ? value : 'purple';
const wpDate = (value: string | undefined) => {
  if (!value) return new Date().toISOString();
  return new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`).toISOString();
};

export async function getBlogArticles(): Promise<BlogArticle[]> {
  if (import.meta.env.CONTENT_SOURCE !== 'wordpress') return localArticles;
  const base = String(import.meta.env.WORDPRESS_API_URL || '').replace(/\/$/, '');
  if (!base) return localArticles;
  try {
    const response = await fetch(`${base}/wp/v2/posts?per_page=100&_embed=1`, {
      signal: AbortSignal.timeout(Number(import.meta.env.WORDPRESS_TIMEOUT_MS || 8000)),
    });
    if (!response.ok) throw new Error(`WordPress posts: ${response.status}`);
    const posts = await response.json() as any[];
    if (!posts.length) return localArticles;
    return posts.map((post) => {
      const terms = post._embedded?.['wp:term'] || [];
      const categories = terms[0] || [];
      const tags = terms[1] || [];
      const meta = post.meta || {};
      const excerpt = meta.twilight_blog_subtitle || stripHtml(post.excerpt?.rendered) || stripHtml(post.content?.rendered).slice(0, 140);
      return {
        slug: post.slug,
        title: stripHtml(post.title?.rendered),
        excerpt,
        category: categories[0]?.name || '未分类',
        tags: tags.map((tag: any) => tag.name),
        publishedAt: wpDate(post.date_gmt || post.date),
        readTime: Math.max(1, Number(meta.twilight_blog_read_time || 5)),
        featured: Boolean(post.sticky),
        accent: allowedAccent(meta.twilight_blog_accent),
        sections: [],
        html: post.content?.rendered || '',
      } satisfies BlogArticle;
    });
  } catch (error) {
    console.warn('WordPress 博客内容不可用，使用本地内容快照。', error);
    return localArticles;
  }
}

export const getBlogCategories = (articles: BlogArticle[]) => [...new Set(articles.map((article) => article.category))];
