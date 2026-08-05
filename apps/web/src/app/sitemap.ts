import type { MetadataRoute } from 'next';

import { guides } from '@/components/public/site-data';
import { getPublishedBlogPosts } from '@/lib/blog/repository';
import { absoluteUrl } from '@/lib/seo';

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/platform',
  '/solutions',
  '/roles',
  '/resources',
  '/resources/guides',
  '/resources/blog',
  '/resources/webinars',
  '/security',
  '/pricing',
  '/trust',
  '/integrations',
  '/developers',
  '/partners',
  '/status',
  '/blueprint',
  '/careers',
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedBlogPosts();
  const staticLastModified = new Date('2026-08-05T00:00:00.000Z');

  return [
    ...PUBLIC_ROUTES.map((path) => ({
      url: absoluteUrl(path),
      lastModified: staticLastModified,
      changeFrequency: path === '/' || path === '/resources/blog' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '/' ? 1 : path === '/resources/blog' ? 0.9 : 0.7,
    })),
    ...guides.map((guide) => ({
      url: absoluteUrl(`/resources/guides/${guide.slug}`),
      lastModified: new Date(guide.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/resources/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: post.featured ? 0.8 : 0.65,
    })),
  ];
}
