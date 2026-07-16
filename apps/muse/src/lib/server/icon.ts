import { lookup } from 'node:dns/promises';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
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
function candidates(html:string, base:URL) {
  const found:string[] = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1] || '';
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href && /icon/i.test(rel)) { try { found.push(new URL(href, base).href); } catch {} }
  }
  found.push(new URL('/favicon.ico', base).href);
  return [...new Set(found)];
}
export async function fetchIcon(address:string) {
  const pageUrl = new URL(address); const page = await safeFetch(pageUrl, 'text/html');
  if (!page.ok) throw new Error(`网站返回 ${page.status}`);
  const html = (await page.text()).slice(0, 512_000);
  for (const value of candidates(html, pageUrl).slice(0, 8)) {
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
