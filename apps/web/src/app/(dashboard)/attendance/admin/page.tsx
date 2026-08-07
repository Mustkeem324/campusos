import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AttendanceAdminConsole } from '@/components/attendance/AttendanceAdminConsole';
import { getAttendanceAdminData } from '@/lib/smart-attendance';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Attendance Control',
  robots: { index: false, follow: false },
};

export default async function AttendanceAdminPage() {
  try {
    const data = await getAttendanceAdminData();
    const programs = await prisma.program.findMany({
      select: {
        id: true,
        name: true,
        batches: { select: { id: true, name: true, sections: { select: { id: true, name: true } } } },
      },
      orderBy: { name: 'asc' },
    });
    return <AttendanceAdminConsole initialData={data} programs={programs} />;
  } catch {
    redirect('/dashboard');
  }
}
