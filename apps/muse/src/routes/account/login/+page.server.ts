import { fail, redirect } from '@sveltejs/kit';
import { getUserForLogin, touchUserLogin } from '$lib/server/db';
import { createUserSession, verifyPassword } from '$lib/server/user-auth';

export const load=({locals})=>{if(locals.user)redirect(303,'/account')};
export const actions={default:async({request,cookies})=>{
  const form=await request.formData(); const identity=String(form.get('identity')||'').trim(); const password=String(form.get('password')||'');
  const user=getUserForLogin(identity);
  if(!user||user.status!=='active'||!verifyPassword(password,user.passwordHash))return fail(400,{message:'账号或密码不正确',identity});
  touchUserLogin(user.id); createUserSession(cookies,user.id); redirect(303,'/account');
}};
