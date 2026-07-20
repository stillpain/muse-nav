import { changePassword, createSession } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';

export const actions={
  default:async({request,cookies})=>{
    const form=await request.formData();
    const currentPassword=String(form.get('currentPassword')||'');
    const newPassword=String(form.get('newPassword')||'');
    const confirmPassword=String(form.get('confirmPassword')||'');
    if(newPassword!==confirmPassword)return fail(400,{message:'两次输入的新密码不一致'});
    try{
      changePassword(currentPassword,newPassword);
      createSession(cookies);
      return{success:true,message:'工作台密码已更新，其他设备上的旧登录会话已失效'};
    }catch(error){return fail(400,{message:error instanceof Error?error.message:'密码修改失败'});}
  }
};
