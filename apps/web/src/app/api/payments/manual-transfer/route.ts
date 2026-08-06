import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { PaymentRequestError, createManualPaymentSubmission } from '@/lib/payment-request';
import { getPaymentSettings } from '@/lib/payment-portal';

const ALLOWED_PROOF_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_PROOF_BYTES = 3 * 1024 * 1024;
const TRANSACTION_REFERENCE = /^[A-Za-z0-9][A-Za-z0-9._\-/]{4,99}$/;

function safeFileName(value: string) {
  return value.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 180) || 'payment-proof';
}

export async function POST(request: Request) {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const settings = await getPaymentSettings(context.tenantId);
    if (!settings.bankTransferEnabled) {
      return NextResponse.json({ error: 'Direct bank transfer is not enabled by this institution.' }, { status: 409 });
    }

    const form = await request.formData();
    const invoiceIdsRaw = String(form.get('invoiceIds') ?? '');
    const transactionReference = String(form.get('transactionReference') ?? '').trim();
    const bankName = String(form.get('bankName') ?? '').trim().slice(0, 180);
    const transferDate = String(form.get('transferDate') ?? '').trim();
    const payerNote = String(form.get('payerNote') ?? '').trim().slice(0, 2000);
    const proof = form.get('proof');

    let invoiceIds: string[] = [];
    try {
      const parsed: unknown = JSON.parse(invoiceIdsRaw);
      if (Array.isArray(parsed)) invoiceIds = parsed.filter((item): item is string => typeof item === 'string');
    } catch {
      invoiceIds = [];
    }

    if (!TRANSACTION_REFERENCE.test(transactionReference)) {
      return NextResponse.json({ error: 'Enter a valid bank transaction/UTR reference (5-100 characters).' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transferDate) || Number.isNaN(new Date(`${transferDate}T00:00:00Z`).getTime())) {
      return NextResponse.json({ error: 'Enter the transfer date.' }, { status: 400 });
    }
    if (!(proof instanceof File) || proof.size <= 0) {
      return NextResponse.json({ error: 'Attach the payment screenshot, receipt or PDF.' }, { status: 400 });
    }
    if (!ALLOWED_PROOF_TYPES.has(proof.type)) {
      return NextResponse.json({ error: 'Payment proof must be JPG, PNG, WebP or PDF.' }, { status: 415 });
    }
    if (proof.size > MAX_PROOF_BYTES) {
      return NextResponse.json({ error: 'Payment proof must be 3 MB or smaller.' }, { status: 413 });
    }

    const proofBytes = Buffer.from(await proof.arrayBuffer());
    const submission = await createManualPaymentSubmission({
      context,
      invoiceIds,
      submission: {
        transactionReference,
        bankName: bankName || null,
        transferDate: new Date(`${transferDate}T00:00:00Z`),
        payerNote: payerNote || null,
        proofFileName: safeFileName(proof.name),
        proofMimeType: proof.type,
        proofBytes,
        currency: settings.currency,
      },
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      status: 'PENDING',
      amount: submission.totalMinor / 100,
      message: 'Transfer proof submitted. The institution finance team must verify it before the invoices are marked paid.',
    }, { status: 201 });
  } catch (error) {
    console.error('Manual payment submission failed:', error);
    const message = error instanceof Error ? error.message : 'Unable to submit bank transfer proof.';
    if (error instanceof PaymentRequestError) {
      return NextResponse.json({ error: message }, { status: error.status });
    }
    const duplicate = /unique|transaction_reference/i.test(message);
    return NextResponse.json(
      { error: duplicate ? 'This transaction/UTR reference is already attached to an active or approved submission.' : message },
      { status: duplicate ? 409 : 500 },
    );
  }
}
