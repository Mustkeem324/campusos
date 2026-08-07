import type { Metadata } from 'next';

import { AcademicCommunityChatPro } from '@/components/community/chat/AcademicCommunityChatPro';

export const metadata: Metadata = {
  title: 'Academic Communities | CampusOS',
  description: 'Secure branch, batch, section and course collaboration with realtime messaging, media, polls and moderation.',
};

export const dynamic = 'force-dynamic';

export default function AcademicCommunityChatPage() {
  return <AcademicCommunityChatPro />;
}
