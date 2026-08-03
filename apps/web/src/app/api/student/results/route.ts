import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { db, session } = await requireTenantContext();
    const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true, cgpa: true, creditsEarned: true } });
    if (!student) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    const results = await db.studentSemesterResult.findMany({
      where: { studentId: student.id, published: true },
      include: {
        examination: { select: { name: true } },
        courseResults: { include: { courseOffering: { include: { course: { select: { code: true, title: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ cgpa: student.cgpa, creditsEarned: student.creditsEarned, results });
  } catch (error: unknown) {
    const status = error instanceof Error && error.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Unable to load results' }, { status });
  }
}
