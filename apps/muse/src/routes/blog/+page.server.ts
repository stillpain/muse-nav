import { getWordCloud, listPostCategories, listPosts } from '$lib/server/db';
export const load = ({url}) => {
  const category=url.searchParams.get('category')||'';
  return { posts:listPosts(false,category),categories:listPostCategories(),cloud:getWordCloud(),activeCategory:category };
};
