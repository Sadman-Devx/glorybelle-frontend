import type { MetadataRoute } from 'next';

/**
 * GLORYBELLE — robots.ts
 * P1 fix #23 — SEO: allow indexing, disallow account/checkout pages.
 */
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glorybelle.it';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account',
          '/checkout',
          '/login',
          '/register',
          '/api',
          '/admin',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
