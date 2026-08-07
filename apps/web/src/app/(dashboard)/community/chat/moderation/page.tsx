import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AcademicModerationConsole } from '@/components/community/chat/AcademicModerationConsole';
import { requireActiveUserContext } from '@/lib/active-user-context';

export const metadata: Metadata = {
  title: 'Community Moderation | CampusOS',
  description: 'Authorised academic community trust, safety and moderation workspace.',
};

export const dynamic = 'force-dynamic';

const MODERATION_ROLES = new Set(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR', 'DEAN', 'HOD', 'FACULTY']);

export default async function AcademicCommunityModerationPage() {
  const context = await requireActiveUserContext();
  if (!MODERATION_ROLES.has(context.activeRole)) redirect('/community/chat');
  return <AcademicModerationConsole />;
}
