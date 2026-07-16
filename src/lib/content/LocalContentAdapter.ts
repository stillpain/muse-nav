import sites from '@/data/sites.json';
import categories from '@/data/categories.json';
import tags from '@/data/tags.json';
import friends from '@/data/friends.json';
import posts from '@/data/posts.json';
import { validateCatalog } from './schema';
import type { ContentAdapter } from './types';

export class LocalContentAdapter implements ContentAdapter {
  async getCatalog() {
    return validateCatalog({ sites, categories, tags, friends, posts });
  }
}
