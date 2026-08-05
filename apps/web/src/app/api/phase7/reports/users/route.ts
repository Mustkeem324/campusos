import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';

const allowedRoles = new Set(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR', 'HR_ADMIN', 'DEAN']);

export async function GET() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!allowedRoles.has(context.activeRole)) {
    return NextResponse.json({ error: 'You do not have permission to export institution users' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { tenantId: context.tenantId },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  const rows = users.map((user) => [
    user.id,
    user.name,
    user.email,
    user.phone ?? '',
    user.role,
    user.isActive ? 'ACTIVE' : 'INACTIVE',
    user.emailVerified ? user.emailVerified.toISOString() : '',
    user.lastLoginAt ? user.lastLoginAt.toISOString() : '',
    user.createdAt.toISOString(),
  ]);

  const csv = toCsv([
    ['user_id', 'name', 'email', 'phone', 'role', 'account_status', 'email_verified_at', 'last_login_at', 'created_at'],
    ...rows,
  ]);

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'REPORT_EXPORTED',
      entity: 'User',
      diffJson: JSON.stringify({ report: 'phase7-users', rowCount: rows.length, format: 'csv' }),
    },
  });

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="campusos-users-${dateStamp()}.csv"`,
      'cache-control': 'private, no-store',
    },
  });
}

function toCsv(rows: Array<Array<string | number>>) {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\n');
}

function escapeCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}
