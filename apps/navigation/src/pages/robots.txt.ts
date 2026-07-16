import type { APIRoute } from 'astro';
import { siteConfig } from '@/config';

export const GET: APIRoute = () => new Response(`User-agent: *\nAllow: /\nDisallow: /search/\nDisallow: /submit/\nDisallow: /*?*\nSitemap: ${siteConfig.siteUrl}/sitemap-index.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
