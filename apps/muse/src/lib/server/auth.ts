import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

const COOKIE = 'muse_studio';
const maxAge = 60 * 60 * 24 * 14;

function secret() {
  const value = process.env.MUSE_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('MUSE_SESSION_SECRET 必须至少 32 个字符');
  return value;
}

function signature(value: string) { return createHmac('sha256', secret()).update(value).digest('hex'); }

export function checkPassword(password: string) {
  const expected = process.env.MUSE_ADMIN_PASSWORD;
  if (!expected || expected.length < 12) throw new Error('MUSE_ADMIN_PASSWORD 必须至少 12 个字符');
  const a = Buffer.from(password); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createSession(cookies: Cookies) {
  const expires = Math.floor(Date.now() / 1000) + maxAge;
  const value = `${expires}.${signature(String(expires))}`;
  cookies.set(COOKIE, value, { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge });
}

export function clearSession(cookies: Cookies) { cookies.delete(COOKIE, { path: '/' }); }

export function hasSession(cookies: Cookies) {
  const value = cookies.get(COOKIE); if (!value) return false;
  const [expires, sig] = value.split('.'); if (!expires || !sig || Number(expires) < Date.now() / 1000) return false;
  const expected = signature(expires); const a = Buffer.from(sig); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
