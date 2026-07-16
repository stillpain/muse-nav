export type SiteStatus = 'draft' | 'published' | 'archived' | 'broken';
export type Pricing = 'free' | 'freemium' | 'paid' | 'unknown';

export interface Site {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string;
  longDescription: string | null;
  logo: string;
  category: string;
  tags: string[];
  featured: boolean;
  recommended: boolean;
  sortOrder: number;
  status: SiteStatus;
  pricing: Pricing;
  language: string[];
  screenshots: string[];
  alternatives: string[];
  relatedPosts: string[];
  createdAt: string;
  updatedAt: string;
  indexable: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  parent: string | null;
  sortOrder: number;
  status: 'published' | 'draft';
  seoTitle: string;
  seoDescription: string;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: 'published' | 'draft';
}

export interface FriendLink {
  id: string;
  name: string;
  url: string;
  description: string;
  logo: string;
  status: 'published' | 'pending';
  sortOrder: number;
  createdAt: string;
}

export interface BlogPostProjection {
  id: string;
  slug: string;
  url: string;
  title: string;
  excerpt: string;
  cover: string | null;
  categories: string[];
  publishedAt: string;
}

export interface ContentCatalog {
  sites: Site[];
  categories: Category[];
  tags: Tag[];
  friends: FriendLink[];
  posts: BlogPostProjection[];
  stale?: boolean;
}

export interface ContentAdapter {
  getCatalog(): Promise<ContentCatalog>;
}
