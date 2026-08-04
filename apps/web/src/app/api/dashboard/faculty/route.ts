import { NextResponse } from 'next/server';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getTenantDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const { activeRole: role, tenantId, userId, staffProfileId } = context;
    const db = getTenantDb(tenantId);

    if (role !== 'FACULTY' || !staffProfileId) {
      return NextResponse.json({ error: 'Unauthorized: Faculty role required' }, { status: 403 });
    }

    const [user, staff] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
      db.staff.findFirst({
        where: { id: staffProfileId, userId },
      }),
    ]);

    if (!user || !staff) return NextResponse.json({ error: 'Your faculty profile or teaching assignments could not be resolved.' }, { status: 409 });

    return NextResponse.json({
      role: 'FACULTY',
      facultyUser: {
        id: userId, name: user.name, email: user.email,
        title: 'Faculty Member',
        departmentId: staff.departmentId,
      },
      assignedCourses: [
        { id: 'cs-301', code: 'CS-301', title: 'Data Structures & Algorithms', section: 'Sec A', studentCount: 42, liveStatus: 'LIVE NOW' },
        { id: 'cs-302', code: 'CS-302', title: 'Database Management Systems', section: 'Sec B', studentCount: 38, liveStatus: 'UPCOMING' },
      ],
      todayClasses: [
        { time: '10:00 AM - 11:30 AM', course: 'CS-301 Data Structures & Algorithms', room: 'Lecture Hall 302', status: 'LIVE NOW' },
        { time: '02:00 PM - 04:00 PM', course: 'CS-302 DBMS Lab', room: 'Computer Lab 02', status: 'UPCOMING' },
      ],
      pendingGradingCount: 28,
      attendancePendingCount: 2,
      metrics: [
        { label: 'Assigned Courses', value: 2, detail: 'Active term courses' },
        { label: 'Enrolled Students', value: 80, detail: 'Across all sections' },
        { label: 'Grading Pending', value: 28, detail: 'Submissions awaiting evaluation' },
        { label: 'Avg Attendance', value: '91.4%', detail: 'Class average' },
      ],
      alerts: [
        { id: 1, title: '28 Lab Reports Awaiting Grading', desc: 'CS-301 Mid-term submissions', href: '/assignments', urgent: true },
        { id: 2, title: '2 Students Below 75% Attendance', desc: 'Automated warnings dispatched', href: '/attendance', urgent: false },
      ],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load faculty dashboard';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
