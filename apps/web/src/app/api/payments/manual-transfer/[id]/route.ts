import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { approveManualPaymentSubmission } from '@/lib/payment-finalizer';
import { requireFinancePaymentOperator } from '@/lib/payment-portal';

const reviewSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('APPROVE'), note: z.string().trim().max(1000).optional().default('') }),
  z.object({ action: z.literal('REJECT'), note: z.string().trim().min(3).max(1000) }),
]);

type SubmissionIdentity = {
  id: string;
  tenant_id: string;
  status: string;
  transaction_reference: string;
};

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const context = await requireFinancePaymentOperator().catch(() => null);
  if (!context) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Choose approve/reject and provide a valid review note.' }, { status: 400 });

    const rows = await prisma.$queryRaw<SubmissionIdentity[]>`
      SELECT id, tenant_id, status, transaction_reference
      FROM campusos_finance.manual_payment_submissions
      WHERE id = ${params.id}::uuid AND tenant_id = ${context.tenantId}::uuid
      LIMIT 1
    `;
    const submission = rows[0];
    if (!submission) return NextResponse.json({ error: 'Transfer submission not found.' }, { status: 404 });
    if (!['PENDING', 'RECONCILIATION_REQUIRED'].includes(submission.status)) {
      return NextResponse.json({ error: 'This transfer submission has already been reviewed.' }, { status: 409 });
    }

    if (parsed.data.action === 'REJECT') {
      await prisma.$executeRaw`
        UPDATE campusos_finance.manual_payment_submissions
        SET status = 'REJECTED', reviewer_user_id = ${context.userId}::uuid,
            review_note = ${parsed.data.note}, reviewed_at = now(), updated_at = now()
        WHERE id = ${submission.id}::uuid AND tenant_id = ${context.tenantId}::uuid
      `;
      return NextResponse.json({ success: true, status: 'REJECTED' });
    }

    const receiptNumber = await approveManualPaymentSubmission({
      submissionId: submission.id,
      reviewerUserId: context.userId,
    });
    if (parsed.data.note) {
      await prisma.$executeRaw`
        UPDATE campusos_finance.manual_payment_submissions
        SET review_note = ${parsed.data.note}, updated_at = now()
        WHERE id = ${submission.id}::uuid AND tenant_id = ${context.tenantId}::uuid
      `;
    }
    return NextResponse.json({ success: true, status: 'APPROVED', receiptNumber });
  } catch (error) {
    console.error('Manual payment review failed:', error);
    const message = error instanceof Error ? error.message : 'Unable to review the transfer.';
    return NextResponse.json({ error: message }, { status: /reconciliation|balance|closed/i.test(message) ? 409 : 500 });
  }
}
