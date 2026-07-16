export const blogConfig = {
  name: import.meta.env.PUBLIC_BLOG_NAME || '暮色手记',
  description: '记录独立开发、VPS、自托管、设计与数字生活。',
  siteUrl: import.meta.env.PUBLIC_BLOG_URL || 'https://blog.example.com',
  navigationUrl: import.meta.env.PUBLIC_SITE_URL || 'https://example.com',
  cmsUrl: import.meta.env.WORDPRESS_API_URL || 'https://cms.example.com/wp-json',
  author: import.meta.env.PUBLIC_BLOG_AUTHOR || '暮色手记',
} as const;
