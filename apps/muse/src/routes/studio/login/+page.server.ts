import { checkPassword,createSession } from '$lib/server/auth'; import { fail,redirect } from '@sveltejs/kit';
export const load=({locals})=>{if(locals.admin)redirect(303,'/studio')};
export const actions={default:async({request,cookies})=>{const data=await request.formData();let valid=false;try{valid=checkPassword(String(data.get('password')||''))}catch(error){return fail(500,{message:error instanceof Error?error.message:'无法登录'})}if(!valid)return fail(400,{message:'密码不正确'});createSession(cookies);redirect(303,'/studio')}};
