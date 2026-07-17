import { redirect } from '@sveltejs/kit';
import { listUserComments } from '$lib/server/db';
import { clearUserSession } from '$lib/server/user-auth';
export const load=({locals})=>{if(!locals.user)redirect(303,'/account/login');return{accountUser:locals.user,comments:listUserComments(locals.user.id)}};
export const actions={logout:({cookies})=>{clearUserSession(cookies);redirect(303,'/blog')}};
