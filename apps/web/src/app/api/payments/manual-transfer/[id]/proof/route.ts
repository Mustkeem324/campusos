import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';
import { isFinancePaymentOperator } from '@/lib/payment-portal';

type ProofRow = {
  id: string;
  tenant_id: string;
  payer_user_id: string;
  proof_file_name: string;
  proof_mime_type: string;
  proof_bytes: Uint8Array;
};

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const rows = await prisma.$queryRaw<ProofRow[]>`
      SELECT id, tenant_id, payer_user_id, proof_file_name, proof_mime_type, proof_bytes
      FROM campusos_finance.manual_payment_submissions
      WHERE id = ${params.id}::uuid AND tenant_id = ${context.tenantId}::uuid
      LIMIT 1
    `;
    const proof = rows[0];
    if (!proof) return NextResponse.json({ error: 'Payment proof not found.' }, { status: 404 });
    if (proof.payer_user_id !== context.userId && !isFinancePaymentOperator(context)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return new NextResponse(proof.proof_bytes, {
      status: 200,
      headers: {
        'Content-Type': proof.proof_mime_type,
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(proof.proof_file_name)}`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Unable to read payment proof:', error);
    return NextResponse.json({ error: 'Unable to load payment proof.' }, { status: 500 });
  }
}
