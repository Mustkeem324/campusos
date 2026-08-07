import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { HostelAdminConsole } from '@/components/campus/HostelAdminConsole';
import { HostelChargeConsole } from '@/components/campus/HostelChargeConsole';
import { getHostelAdminData } from '@/lib/hostel-operations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Hostel Control',
  robots: { index: false, follow: false },
};

export default async function HostelAdminPage() {
  try {
    const data = await getHostelAdminData();
    return (
      <div className="space-y-5">
        <HostelAdminConsole
          initialData={{
            ...data,
            providers: data.providers.map((provider) => ({
              ...provider,
              last_sync_at: provider.last_sync_at?.toISOString() ?? null,
            })),
          }}
        />
        <HostelChargeConsole
          currency={data.settings.currency}
          students={data.students.map((student) => ({
            studentId: student.studentId,
            studentName: student.studentName,
            rollNumber: student.rollNumber,
            eligible: student.eligible,
            enrolled: student.enrolled,
          }))}
        />
      </div>
    );
  } catch {
    redirect('/dashboard');
  }
}
