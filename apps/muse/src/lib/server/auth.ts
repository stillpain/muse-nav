import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { getSetting, saveSetting } from './db';

const COOKIE = 'muse_studio';
const maxAge = 60 * 60 * 24 * 14;
const passwordKey = 'admin_password_hash';
const passwordVersionKey = 'admin_password_version';

function secret() {
  const value = process.env.MUSE_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('MUSE_SESSION_SECRET 必须至少 32 个字符');
  return value;
}

function signature(value: string) { return createHmac('sha256', secret()).update(value).digest('hex'); }

function hashPassword(password:string) {
  const salt=randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;
}

function verifyHash(password:string,stored:string) {
  const [salt,expectedHex]=stored.split(':'); if(!salt||!expectedHex)return false;
  const actual=scryptSync(password,salt,64); const expected=Buffer.from(expectedHex,'hex');
  return actual.length===expected.length&&timingSafeEqual(actual,expected);
}

function passwordVersion() { return getSetting(passwordVersionKey)||'environment'; }

export function checkPassword(password: string) {
  const stored=getSetting(passwordKey);
  if(stored)return verifyHash(password,stored);
  const expected = process.env.MUSE_ADMIN_PASSWORD;
  if (!expected || expected.length < 12) throw new Error('MUSE_ADMIN_PASSWORD 必须至少 12 个字符');
  const a = Buffer.from(password); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function changePassword(currentPassword:string,newPassword:string) {
  if(!checkPassword(currentPassword))throw new Error('当前密码不正确');
  if(newPassword.length<12||newPassword.length>128)throw new Error('新密码需为 12–128 个字符');
  if(checkPassword(newPassword))throw new Error('新密码不能与当前密码相同');
  saveSetting(passwordKey,hashPassword(newPassword));
  saveSetting(passwordVersionKey,randomBytes(16).toString('hex'));
}

export function createSession(cookies: Cookies) {
  const expires = Math.floor(Date.now() / 1000) + maxAge;
  const payload = `${expires}.${passwordVersion()}`;
  const value = `${payload}.${signature(payload)}`;
  cookies.set(COOKIE, value, { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge });
}

export function clearSession(cookies: Cookies) { cookies.delete(COOKIE, { path: '/' }); }

export function hasSession(cookies: Cookies) {
  const value = cookies.get(COOKIE); if (!value) return false;
  const parts=value.split('.');
  if(parts.length===2&&!getSetting(passwordKey)){
    const [expires,sig]=parts; if(!expires||!sig||Number(expires)<Date.now()/1000)return false;
    const expected=signature(expires); const a=Buffer.from(sig); const b=Buffer.from(expected);
    return a.length===b.length&&timingSafeEqual(a,b);
  }
  const [expires,version,sig]=parts; if(!expires||!version||!sig||Number(expires)<Date.now()/1000||version!==passwordVersion())return false;
  const expected = signature(`${expires}.${version}`); const a = Buffer.from(sig); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
