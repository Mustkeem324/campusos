import { getPublishedBlogPosts } from '@/lib/blog/repository';
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const posts = await getPublishedBlogPosts();
  const articleLines = posts
    .slice(0, 30)
    .map((post) => `- ${post.title}: ${absoluteUrl(`/resources/blog/${post.slug}`)}`)
    .join('\n');

  const content = `# ${SITE_NAME}\n\n${SITE_DESCRIPTION}\n\n## Primary resources\n- Homepage: ${absoluteUrl('/')}\n- Platform: ${absoluteUrl('/platform')}\n- Security: ${absoluteUrl('/security')}\n- Resource guides: ${absoluteUrl('/resources/guides')}\n- Editorial blog: ${absoluteUrl('/resources/blog')}\n- RSS feed: ${absoluteUrl('/feed.xml')}\n\n## Editorial articles\n${articleLines}\n\n## Usage guidance\nCampusOS public pages describe product concepts and higher-education operating practices. Institution-specific capabilities, configuration and compliance responsibilities must be verified during procurement and implementation.\n`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
