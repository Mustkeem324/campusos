import type { Metadata } from 'next';

import { BlogExplorer } from '@/components/public/BlogExplorer';
import { getPublishedBlogPosts } from '@/lib/blog/repository';
import { absoluteUrl, createPageMetadata, jsonLd } from '@/lib/seo';

export const revalidate = 900;

export const metadata: Metadata = createPageMetadata({
  title: 'Higher-Education Operations Blog',
  description:
    'Expert guidance on university ERP, student information systems, academic operations, implementation, governance, analytics and student service.',
  path: '/resources/blog',
  keywords: [
    'higher education blog',
    'university ERP insights',
    'student information system guidance',
    'campus operations',
  ],
});

type BlogPageProps = {
  searchParams?: {
    search?: string | string[];
  };
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const posts = await getPublishedBlogPosts();
  const initialSearch = typeof searchParams?.search === 'string' ? searchParams.search : '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${absoluteUrl('/resources/blog')}#blog`,
    name: 'CampusOS Higher-Education Operations Blog',
    description:
      'Practical guidance for institutions selecting, implementing and operating connected higher-education systems.',
    url: absoluteUrl('/resources/blog'),
    publisher: { '@id': `${absoluteUrl('/')}#organization` },
    blogPost: posts.slice(0, 20).map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: absoluteUrl(`/resources/blog/${post.slug}`),
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <BlogExplorer posts={posts} initialSearch={initialSearch} />
    </>
  );
}
