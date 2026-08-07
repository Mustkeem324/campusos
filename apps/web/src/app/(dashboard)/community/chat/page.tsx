import type { Metadata } from 'next';

import { AcademicCommunityChat } from '@/components/community/chat/AcademicCommunityChat';

export const metadata: Metadata = {
  title: 'Academic Communities | CampusOS',
  description: 'Secure branch, batch, section and course communication inside CampusOS.',
};

export const dynamic = 'force-dynamic';

export default function AcademicCommunityChatPage() {
  return <AcademicCommunityChat />;
}
