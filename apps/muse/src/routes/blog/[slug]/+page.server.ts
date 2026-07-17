import { error } from '@sveltejs/kit'; import { getPostBySlug } from '$lib/server/db'; import { renderText } from '$lib/server/content';
export const load = ({ params }) => { const post=getPostBySlug(params.slug); if(!post) error(404,'文章不存在'); return { post, html:renderText(post.content) }; };
