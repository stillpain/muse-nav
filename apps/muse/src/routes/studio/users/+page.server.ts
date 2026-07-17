import { listUsers,updateUserStatus } from '$lib/server/db';
export const load=()=>({users:listUsers()});
export const actions={toggle:async({request})=>{const f=await request.formData();updateUserStatus(Number(f.get('id')),String(f.get('status'))==='active'?'disabled':'active');return{success:true}}};
