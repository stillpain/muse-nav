import { fail, redirect } from '@sveltejs/kit';
import { createUser } from '$lib/server/db';
import { createUserSession, hashPassword, validEmail, validUsername } from '$lib/server/user-auth';

export const load=({locals})=>{if(locals.user)redirect(303,'/account')};
export const actions={default:async({request,cookies})=>{
  const form=await request.formData(); const username=String(form.get('username')||'').trim(); const email=String(form.get('email')||'').trim().toLowerCase(); const password=String(form.get('password')||'');
  if(!validUsername(username))return fail(400,{message:'用户名需要 2—20 个中文、英文、数字、下划线或短横线',username,email});
  if(!validEmail(email))return fail(400,{message:'请填写有效邮箱',username,email});
  if(password.length<8||password.length>128)return fail(400,{message:'密码需要 8—128 个字符',username,email});
  try{const user=createUser({username,email,passwordHash:hashPassword(password)});createUserSession(cookies,user.id);redirect(303,'/account')}catch(error){return fail(400,{message:String(error).includes('UNIQUE')?'用户名或邮箱已经注册':'注册失败，请稍后重试',username,email})}
}};
