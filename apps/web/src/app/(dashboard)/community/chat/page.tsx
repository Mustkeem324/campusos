import type { Metadata } from 'next';
import Link from 'next/link';

import { AcademicCommunityChatPro } from '@/components/community/chat/AcademicCommunityChatPro';
import { requireActiveUserContext } from '@/lib/active-user-context';

export const metadata: Metadata = {
  title: 'Academic Communities | CampusOS',
  description: 'Secure branch, batch, section and course collaboration with realtime messaging, media, polls and moderation.',
};

export const dynamic = 'force-dynamic';

const MODERATION_ROLES = new Set(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR', 'DEAN', 'HOD', 'FACULTY']);

export default async function AcademicCommunityChatPage() {
  const context = await requireActiveUserContext();
  const canModerate = MODERATION_ROLES.has(context.activeRole);

  return (
    <div className="space-y-3">
      {canModerate && (
        <div className="flex justify-end">
          <Link
            href="/community/chat/moderation"
            className="inline-flex min-h-10 items-center rounded-lg border border-[#C9D6E8] bg-white px-3.5 text-xs font-extrabold text-[#244166] shadow-sm transition hover:border-[#9EB8DE] hover:bg-[#F6F9FD] hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30"
          >
            Open Moderator Console
          </Link>
        </div>
      )}
      <AcademicCommunityChatPro />
    </div>
  );
}
