const origin=process.env.ORIGIN||'https://musedaohang.com';
export const GET=()=>new Response(`User-agent: *\nAllow: /\nDisallow: /studio\nSitemap: ${origin}/sitemap.xml\n`,{headers:{'content-type':'text/plain; charset=utf-8'}});
