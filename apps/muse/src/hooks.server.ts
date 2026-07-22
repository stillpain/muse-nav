import type { Handle } from '@sveltejs/kit';
import { createHmac } from 'node:crypto';
import { hasSession } from '$lib/server/auth';
import { recordVisit } from '$lib/server/db';
import { getSessionUser } from '$lib/server/user-auth';

const excludedPaths=/^\/(?:studio|account|health|media)(?:\/|$)|^\/(?:robots\.txt|sitemap\.xml|blog\/feed\.xml)$/;
const assetPath=/\.(?:css|js|map|png|jpe?g|gif|webp|svg|ico|woff2?|xml|txt)$/i;
const botAgent=/(?:bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp|telegrambot|uptimerobot|monitoring)/i;

function trackPublicVisit(event:Parameters<Handle>[0]['event']) {
  const {request,url}=event;const userAgent=request.headers.get('user-agent')||'';
  if(request.method!=='GET'||!request.headers.get('accept')?.includes('text/html')||request.headers.get('dnt')==='1'||excludedPaths.test(url.pathname)||assetPath.test(url.pathname)||!userAgent||botAgent.test(userAgent))return;
  try{
    const address=event.getClientAddress();const secret=process.env.MUSE_ANALYTICS_SALT||process.env.MUSE_SESSION_SECRET||'muse-local-analytics';
    const visitorHash=createHmac('sha256',secret).update(`${address}|${userAgent.slice(0,200)}`).digest('hex');
    const header=(process.env.MUSE_COUNTRY_HEADER||'cf-ipcountry').toLowerCase();const rawCountry=(request.headers.get(header)||'').toUpperCase();
    const country=/^[A-Z]{2}$/.test(rawCountry)&&rawCountry!=='XX'?rawCountry:'XX';recordVisit(visitorHash,country);
  }catch{ /* 统计失败不应影响页面访问 */ }
}

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.admin = hasSession(event.cookies);
  event.locals.user = getSessionUser(event.cookies);
  trackPublicVisit(event);
  return resolve(event, { filterSerializedResponseHeaders: (name) => name === 'content-type' });
};
