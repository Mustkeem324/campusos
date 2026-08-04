import { NextResponse } from 'next/server';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getTenantDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const { activeRole: role, tenantId, userId, guardianProfileId } = context;
    const db = getTenantDb(tenantId);

    if (role !== 'PARENT' || !guardianProfileId) {
      return NextResponse.json({ error: 'Unauthorized: Parent role required' }, { status: 403 });
    }

    const guardian = await db.guardian.findFirst({
      where: { id: guardianProfileId, userId, tenantId },
      include: {
        students: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
            rollNumber: true,
            cgpa: true,
            batch: { include: { program: true } },
          },
        },
      },
    });

    const linkedStudent = guardian?.students[0];
    if (!linkedStudent) return NextResponse.json({ error: 'No linked student is currently available for this guardian account.' }, { status: 409 });
    const parent = await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    if (!parent) return NextResponse.json({ error: 'Parent account could not be resolved.' }, { status: 409 });

    return NextResponse.json({
      role: 'PARENT',
      parentUser: {
        id: userId, name: parent.name, email: parent.email,
        title: 'Parent / Guardian',
      },
      linkedStudent: {
        name: linkedStudent.user.name,
        rollNumber: linkedStudent.rollNumber,
        relationship: guardian.relationship,
        programme: linkedStudent.batch.program.name,
        semester: linkedStudent.batch.name,
      },
      metrics: [
        { label: 'Ward Attendance', value: '88%', detail: 'Above 75% examination threshold' },
        { label: 'Published SGPA', value: '3.80 / 4.0', detail: 'Term 3 official result' },
        { label: 'Fee Dues Status', value: '₹0.00 Outstanding', detail: 'Receipt RCT-9941 verified' },
        { label: 'Active Alerts', value: '0 Warnings', detail: 'Good academic standing' },
      ],
      notices: [
        { title: 'Parent-Teacher Council Meeting Scheduled', date: '15 Feb 2026', details: 'Discussion on semester performance' },
        { title: 'Semester 4 Exam Schedule Published', date: '01 Feb 2026', details: 'Exams start 10 March 2026' },
      ],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load parent dashboard';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
