import { listPosts } from '$lib/server/db';
const origin=process.env.ORIGIN||'https://musedaohang.com';
const esc=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;');
export const GET=()=>{const urls=['/','/blog',...listPosts().map(p=>`/blog/${encodeURIComponent(p.slug)}`)];const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(path=>`<url><loc>${esc(origin+path)}</loc></url>`).join('')}</urlset>`;return new Response(xml,{headers:{'content-type':'application/xml; charset=utf-8'}})};
