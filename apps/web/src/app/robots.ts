import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/content/',
          '/settings/',
          '/account/',
          '/mfa/',
          '/session-expired/',
          '/unauthorized/',
          '/demo/progress/',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
