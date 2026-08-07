import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AttendanceConsole } from '@/components/attendance/AttendanceConsole';
import { getAttendanceWorkspace } from '@/lib/smart-attendance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Smart Attendance',
  robots: { index: false, follow: false },
};

export default async function AttendancePage() {
  try {
    const data = await getAttendanceWorkspace();
    return <AttendanceConsole initialData={data} />;
  } catch {
    redirect('/dashboard');
  }
}
