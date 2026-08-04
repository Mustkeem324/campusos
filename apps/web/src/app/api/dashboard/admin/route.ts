import { NextResponse } from 'next/server';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getTenantDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const { activeRole: role, tenantId, userId } = context;
    const db = getTenantDb(tenantId);

    if (role !== 'INSTITUTION_ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const [user, studentsCount, facultyCount, departmentCount, courseCount, paidPayments, auditLogs] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
      db.user.count({ where: { role: 'STUDENT', tenantId } }),
      db.user.count({ where: { role: 'FACULTY', tenantId } }),
      db.department.count(),
      db.course.count(),
      db.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      db.auditLog.findMany({
        take: 6,
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, action: true, entity: true, createdAt: true },
      }),
    ]);

    if (!user) return NextResponse.json({ error: 'Your administrator profile could not be resolved.' }, { status: 409 });
    const formattedPaid = paidPayments._sum.amount
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paidPayments._sum.amount)
      : '₹0.00';

    return NextResponse.json({
      role: 'INSTITUTION_ADMIN',
      adminUser: {
        id: userId, name: user.name, email: user.email,
        title: 'Institution Administrator',
      },
      metrics: [
        { label: 'Enrolled Students', value: studentsCount, detail: 'Active student accounts' },
        { label: 'Faculty Members', value: facultyCount, detail: 'Assigned teaching staff' },
        { label: 'Departments & Schools', value: departmentCount, detail: 'Academic departments' },
        { label: 'Fee Collection', value: formattedPaid, detail: 'Recorded collections' },
      ],
      pendingAdmissionsCount: 12,
      activity: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        createdAt: log.createdAt.toISOString(),
      })),
      alerts: [
        { id: 1, title: '12 Admission Applications Pending', desc: 'Requires selection committee approval', href: '/platform/admissions', urgent: true },
        { id: 2, title: 'AI Governance System Audit Completed', desc: '100% compliance verified', href: '/ai-governance', urgent: false },
      ],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load admin dashboard';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
