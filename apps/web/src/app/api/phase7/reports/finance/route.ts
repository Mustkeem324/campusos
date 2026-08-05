import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';

const allowedRoles = new Set(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'FINANCE_OFFICER', 'ACCOUNTANT']);

export async function GET() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!allowedRoles.has(context.activeRole)) {
    return NextResponse.json({ error: 'You do not have permission to export finance records' }, { status: 403 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { tenantId: context.tenantId },
    orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      amount: true,
      dueDate: true,
      status: true,
      feeStructure: { select: { name: true } },
      student: {
        select: {
          rollNumber: true,
          user: { select: { name: true } },
        },
      },
      payments: {
        select: {
          amount: true,
          method: true,
          status: true,
          paidAt: true,
          transactionId: true,
        },
      },
    },
  });

  const rows = invoices.map((invoice) => {
    const paidAmount = invoice.payments
      .filter((payment) => payment.status === 'PAID' || payment.status === 'PARTIAL')
      .reduce((sum, payment) => sum + payment.amount, 0);
    const latestPayment = invoice.payments
      .slice()
      .sort((left, right) => right.paidAt.getTime() - left.paidAt.getTime())[0];

    return [
      invoice.id,
      invoice.student.rollNumber,
      invoice.student.user.name,
      invoice.feeStructure.name,
      invoice.amount.toFixed(2),
      paidAmount.toFixed(2),
      Math.max(0, invoice.amount - paidAmount).toFixed(2),
      invoice.status,
      invoice.dueDate.toISOString(),
      latestPayment?.method ?? '',
      latestPayment?.status ?? '',
      latestPayment?.transactionId ?? '',
      latestPayment?.paidAt.toISOString() ?? '',
    ];
  });

  const csv = toCsv([
    ['invoice_id', 'roll_number', 'student_name', 'fee_structure', 'invoice_amount', 'paid_amount', 'outstanding_amount', 'invoice_status', 'due_date', 'latest_payment_method', 'latest_payment_status', 'latest_transaction_id', 'latest_payment_at'],
    ...rows,
  ]);

  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'REPORT_EXPORTED',
      entity: 'Finance',
      diffJson: JSON.stringify({ report: 'phase7-finance', rowCount: rows.length, format: 'csv' }),
    },
  });

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="campusos-finance-${new Date().toISOString().slice(0, 10)}.csv"`,
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
