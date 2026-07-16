import { getAppearance } from '$lib/server/db';
export const load = ({ locals, url }) => ({ appearance: getAppearance(), admin: locals.admin, studio: url.pathname.startsWith('/studio') });
