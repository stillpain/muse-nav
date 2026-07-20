import { getWordCloud, listPostCategories, listPosts } from '$lib/server/db';
export const load = ({url}) => {
  const category=url.searchParams.get('category')||'';
  const query=(url.searchParams.get('q')||'').trim();
  const filtered=listPosts(false,category,query);
  const pageSize=9; const pageCount=Math.max(1,Math.ceil(filtered.length/pageSize));
  const page=Math.min(pageCount,Math.max(1,Number(url.searchParams.get('page'))||1));
  return { posts:filtered.slice((page-1)*pageSize,page*pageSize),total:filtered.length,page,pageCount,query,categories:listPostCategories(),cloud:getWordCloud(),activeCategory:category };
};
