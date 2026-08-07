import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AttendanceAdminConsole } from '@/components/attendance/AttendanceAdminConsole';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';
import { getAttendanceAdminData } from '@/lib/smart-attendance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Attendance Control',
  robots: { index: false, follow: false },
};

export default async function AttendanceAdminPage() {
  try {
    const context = await requireActiveUserContext();
    if (context.activeRole !== 'INSTITUTION_ADMIN' && context.activeRole !== 'REGISTRAR') redirect('/dashboard');
    const data = await getAttendanceAdminData();
    const programs = await prisma.program.findMany({
      where: { tenantId: context.tenantId },
      select: {
        id: true,
        name: true,
        batches: {
          where: { tenantId: context.tenantId },
          select: {
            id: true,
            name: true,
            sections: { where: { tenantId: context.tenantId }, select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return <AttendanceAdminConsole initialData={data} programs={programs} />;
  } catch {
    redirect('/dashboard');
  }
}
