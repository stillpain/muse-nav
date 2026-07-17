import { error, fail } from '@sveltejs/kit'; import { createComment,getPostBySlug,listPostComments } from '$lib/server/db'; import { renderText } from '$lib/server/content';
const recent=new Map<string,number>();
export const load = ({ params }) => { const post=getPostBySlug(params.slug); if(!post) error(404,'文章不存在'); return { post,html:renderText(post.content),comments:listPostComments(post.id) }; };
export const actions={comment:async({request,params,locals,getClientAddress})=>{
  const post=getPostBySlug(params.slug);if(!post)return fail(404,{message:'文章不存在'});
  const form=await request.formData();if(String(form.get('website')||''))return{success:true,message:'评论已提交'};
  const content=String(form.get('content')||'').trim();const guestName=String(form.get('guestName')||'').trim();
  if(content.length<2||content.length>2000)return fail(400,{message:'评论需要 2—2000 个字符'});
  if(!locals.user&&(guestName.length<2||guestName.length>20))return fail(400,{message:'游客昵称需要 2—20 个字符'});
  const key=`${getClientAddress()}:${post.id}`;const last=recent.get(key)||0;if(Date.now()-last<30000)return fail(429,{message:'评论太快了，请稍后再试'});recent.set(key,Date.now());
  createComment({postId:post.id,userId:locals.user?.id,guestName,content,status:locals.user?'published':'pending'});
  return{success:true,message:locals.user?'评论已发布':'评论已提交，审核后展示'};
}};
