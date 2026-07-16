import type { Handle } from '@sveltejs/kit';
import { hasSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.admin = hasSession(event.cookies);
  return resolve(event, { filterSerializedResponseHeaders: (name) => name === 'content-type' });
};
