export type Site = {
  id: number; name: string; slug: string; url: string; description: string; icon: string;
  categoryId: number; categoryName?: string; categorySlug?: string; featured: number; sortOrder: number;
  status: 'published' | 'draft'; createdAt: string; updatedAt: string;
};

export type Category = { id: number; name: string; slug: string; description: string; color: string; sortOrder: number };
export type Post = {
  id: number; title: string; slug: string; excerpt: string; content: string; cover: string;
  status: 'published' | 'draft'; featured: number; publishedAt: string; updatedAt: string;
};

export type Appearance = {
  siteName: string; blogName: string; heroLine: string; brand: string; secondary: string;
  accent: string; radius: string; density: 'compact' | 'comfortable'; background: string;
};
