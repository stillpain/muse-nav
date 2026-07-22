import { getAppearance } from '$lib/server/db';
export const load = ({ locals, url }) => ({
  appearance: getAppearance(),
  admin: locals.admin,
  user: locals.user,
  studio: url.pathname.startsWith('/studio'),
  blog: url.pathname === '/blog' || url.pathname.startsWith('/blog/'),
  origin: (process.env.ORIGIN || url.origin).replace(/\/$/,'')
});
