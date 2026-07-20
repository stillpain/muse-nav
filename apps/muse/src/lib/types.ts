export type Site = {
  id: number; name: string; slug: string; url: string; description: string; icon: string;
  categoryId: number; categoryName?: string; categorySlug?: string; featured: number; sortOrder: number;
  status: 'published' | 'draft'; createdAt: string; updatedAt: string;
};

export type Category = { id: number; name: string; slug: string; description: string; color: string; sortOrder: number; siteCount?: number };
export type Post = {
  id: number; title: string; slug: string; excerpt: string; content: string; cover: string;
  status: 'published' | 'draft'; featured: number; categoryId?: number; categoryName?: string; categorySlug?: string;
  publishedAt: string; updatedAt: string;
};

export type PostCategory = { id: number; name: string; slug: string; description: string; color: string; sortOrder: number; postCount?: number };

export type User = {
  id: number; username: string; email: string; role: 'member' | 'admin'; status: 'active' | 'disabled';
  createdAt: string; lastLoginAt: string;
};

export type Comment = {
  id: number; postId: number; postTitle?: string; postSlug?: string; userId?: number; authorName: string;
  content: string; status: 'pending' | 'published' | 'hidden'; mentionsAdmin: number; adminRead: number;
  createdAt: string;
};

export type WordCloudItem = { word: string; count: number; weight: number };

export type Appearance = {
  siteName: string; blogName: string; heroLine: string; brand: string; secondary: string;
  accent: string; radius: string; density: 'compact' | 'comfortable'; background: string;
};
