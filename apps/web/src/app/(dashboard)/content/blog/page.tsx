import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { BlogStudio } from '@/components/blog/BlogStudio';
import { BLOG_EDITOR_ROLES } from '@/lib/blog/api';
import { requireActiveUserContext } from '@/lib/active-user-context';

export const metadata: Metadata = {
  title: 'Blog Studio',
  description: 'Create, optimize, schedule and publish CampusOS editorial content.',
  robots: { index: false, follow: false },
};

export default async function BlogStudioPage() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) redirect('/login');
  if (!BLOG_EDITOR_ROLES.includes(context.activeRole)) redirect('/unauthorized');

  return <BlogStudio activeRole={context.activeRole} />;
}
