import type { Handle } from '@sveltejs/kit';
import { hasSession } from '$lib/server/auth';
import { getSessionUser } from '$lib/server/user-auth';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.admin = hasSession(event.cookies);
  event.locals.user = getSessionUser(event.cookies);
  return resolve(event, { filterSerializedResponseHeaders: (name) => name === 'content-type' });
};
