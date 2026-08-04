import { NextResponse } from 'next/server';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getTenantDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const { activeRole: role, tenantId, userId, studentProfileId } = context;
    const db = getTenantDb(tenantId);

    if (role !== 'STUDENT' || !studentProfileId) {
      return NextResponse.json({ error: 'Unauthorized: Student role required' }, { status: 403 });
    }

    const student = await db.student.findFirst({
      where: { id: studentProfileId, userId, tenantId },
      include: {
        batch: { include: { program: true } },
        section: true,
      },
    });

    if (!student) return NextResponse.json({ error: 'Your student profile could not be resolved.' }, { status: 409 });
    const user = await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });

    return NextResponse.json({
      role: 'STUDENT',
      studentUser: {
        id: userId, name: user?.name, email: user?.email, rollNumber: student.rollNumber,
        programme: student.batch.program.name, cgpa: student.cgpa,
      },
      metrics: [
        { label: 'Current CGPA', value: '3.80 / 4.0', detail: 'Published academic record' },
        { label: 'Attendance', value: '88%', detail: 'Above 75% examination threshold' },
        { label: 'Credits Earned', value: '48 / 160', detail: 'On track for graduation' },
        { label: 'Outstanding Fees', value: '₹0.00', detail: 'All dues clear' },
      ],
      todayClasses: [
        { code: 'CS-301', title: 'Data Structures & Algorithms', time: '10:00 AM - 11:30 AM', room: 'Lecture Hall 302', status: 'LIVE NOW' },
        { code: 'CS-302', title: 'Database Management Systems Lab', time: '02:00 PM - 04:00 PM', room: 'Computer Lab 02', status: 'UPCOMING' },
      ],
      alerts: [
        { id: 1, title: 'Physics Lab Report Due Tomorrow', desc: 'Submit PDF before 11:59 PM', href: '/student/learning', urgent: true },
        { id: 2, title: 'Semester 4 Exam Schedule Published', desc: 'Hall tickets ready for download', href: '/student/results', urgent: false },
      ],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load student dashboard';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
