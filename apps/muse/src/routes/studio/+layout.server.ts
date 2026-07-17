import { redirect } from '@sveltejs/kit';
export const load=({locals,url})=>{if(!locals.admin&&url.pathname!=='/studio/login')redirect(303,'/studio/login');return{studioAdmin:locals.admin}};
