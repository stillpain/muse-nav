export const siteConfig = {
  name: import.meta.env.PUBLIC_SITE_NAME || '暮色导航',
  description: '暮色导航，收录经过筛选的学习、创作、开发与效率工具。',
  siteUrl: import.meta.env.PUBLIC_SITE_URL || 'https://example.com',
  blogUrl: import.meta.env.PUBLIC_BLOG_URL || 'https://blog.example.com',
  author: '暮色导航',
  pageSize: 12,
  detailMinimumLength: 120,
} as const;
