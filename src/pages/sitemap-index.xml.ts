import type { APIRoute } from 'astro';
import { siteConfig } from '@/config';

export const GET: APIRoute = () => new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${siteConfig.siteUrl}/sitemap-pages.xml</loc></sitemap></sitemapindex>`, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
