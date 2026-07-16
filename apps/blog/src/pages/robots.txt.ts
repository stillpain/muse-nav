import type { APIRoute } from 'astro';
import { blogConfig } from '@/config';

export const GET: APIRoute = () => new Response(`User-agent: *\nAllow: /\nSitemap: ${blogConfig.siteUrl}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
