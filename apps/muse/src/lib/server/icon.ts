import { lookup } from 'node:dns/promises';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { mediaDir } from './db';

function isPrivate(address:string) {
  if (address === '::1' || address === '0:0:0:0:0:0:0:1' || address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80')) return true;
  const parts = address.split('.').map(Number);
  if (parts.length !== 4) return false;
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168);
}
async function assertPublic(url:URL) {
  if (!['http:','https:'].includes(url.protocol)) throw new Error('仅支持 HTTP/HTTPS');
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((item) => isPrivate(item.address))) throw new Error('禁止访问内网地址');
}
async function safeFetch(url:URL, accept:string) {
  await assertPublic(url);
  const response = await fetch(url, { headers: { 'user-agent': 'MuseIconBot/1.0 (+https://musedaohang.com)', accept }, redirect: 'manual', signal: AbortSignal.timeout(8000) });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location'); if (!location) throw new Error('重定向地址无效');
    const next = new URL(location, url); await assertPublic(next);
    return fetch(next, { headers: { 'user-agent': 'MuseIconBot/1.0', accept }, redirect: 'error', signal: AbortSignal.timeout(8000) });
  }
  return response;
}
const protectedSiteIcons:Record<string,string[]> = {
  'chatgpt.com': [
    'https://chatgpt.com/cdn/assets/favicon-180x180-od45eci6.webp',
    'https://chatgpt.com/favicon.ico'
  ],
  'claude.ai': ['https://claude.ai/favicon.ico']
};

function normalizedHost(hostname:string) {
  const host=hostname.toLowerCase().replace(/^www\./,'');
  return host==='chat.openai.com' ? 'chatgpt.com' : host;
}
function candidates(html:string, base:URL) {
  const found:string[] = [];
  const host=normalizedHost(base.hostname);
  found.push(...(protectedSiteIcons[host] || []));
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1] || '';
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href && /icon/i.test(rel) && !/^(data|blob):/i.test(href)) {
      try { found.push(new URL(href, base).href); } catch {}
    }
  }
  found.push(new URL('/favicon.ico', base).href);
  found.push(new URL('/apple-touch-icon.png', base).href);
  found.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`);
  found.push(`https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`);
  return [...new Set(found)];
}
export async function fetchIcon(address:string) {
  const pageUrl = new URL(address);
  let html='';
  try {
    const page = await safeFetch(pageUrl, 'text/html');
    if (page.ok) html=(await page.text()).slice(0,512_000);
  } catch { /* Protected sites may block HTML bots; direct icon candidates still work. */ }
  for (const value of candidates(html, pageUrl).slice(0, 12)) {
    try {
      const response = await safeFetch(new URL(value), 'image/*'); if (!response.ok) continue;
      const type = (response.headers.get('content-type') || '').split(';')[0];
      if (!['image/png','image/jpeg','image/webp','image/x-icon','image/vnd.microsoft.icon','image/gif'].includes(type)) continue;
      const bytes = new Uint8Array(await response.arrayBuffer()); if (!bytes.length || bytes.length > 2_000_000) continue;
      const extension = type.includes('png') ? '.png' : type.includes('jpeg') ? '.jpg' : type.includes('webp') ? '.webp' : type.includes('gif') ? '.gif' : '.ico';
      const filename = `${randomUUID()}${extension}`; await writeFile(`${mediaDir}/${filename}`, bytes);
      return `/media/${filename}`;
    } catch { /* Try the next declared icon. */ }
  }
  throw new Error('没有找到可用的网站图标');
}
