import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { getUserById } from './db';

const COOKIE = 'muse_user';
const maxAge = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.MUSE_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('MUSE_SESSION_SECRET 必须至少 32 个字符');
  return value;
}

function signature(value:string) { return createHmac('sha256',secret()).update(value).digest('hex'); }

export function hashPassword(password:string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;
}

export function verifyPassword(password:string,stored:string) {
  const [salt,expectedHex] = stored.split(':');
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password,salt,64); const expected = Buffer.from(expectedHex,'hex');
  return actual.length === expected.length && timingSafeEqual(actual,expected);
}

export function createUserSession(cookies:Cookies,userId:number) {
  const expires = Math.floor(Date.now()/1000)+maxAge;
  const payload = `${userId}.${expires}`;
  cookies.set(COOKIE,`${payload}.${signature(payload)}`,{path:'/',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge});
}

export function clearUserSession(cookies:Cookies) { cookies.delete(COOKIE,{path:'/'}); }

export function getSessionUser(cookies:Cookies) {
  const value = cookies.get(COOKIE); if (!value) return null;
  const [id,expires,sig] = value.split('.'); if (!id||!expires||!sig||Number(expires)<Date.now()/1000) return null;
  const payload=`${id}.${expires}`; const expected=signature(payload); const a=Buffer.from(sig); const b=Buffer.from(expected);
  if(a.length!==b.length||!timingSafeEqual(a,b)) return null;
  const user=getUserById(Number(id)); return user?.status==='active'?user:null;
}

export function validUsername(value:string) { return /^[\p{L}\p{N}_-]{2,20}$/u.test(value); }
export function validEmail(value:string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 120; }
