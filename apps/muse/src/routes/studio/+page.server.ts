import { clearSession } from '$lib/server/auth'; import { listCategories,listPosts,listSites } from '$lib/server/db'; import { redirect } from '@sveltejs/kit';
export const load=()=>({siteCount:listSites(true).length,postCount:listPosts(true).length,categoryCount:listCategories().length,drafts:listPosts(true).filter(p=>p.status==='draft').length});
export const actions={logout:({cookies})=>{clearSession(cookies);redirect(303,'/studio/login')}};
