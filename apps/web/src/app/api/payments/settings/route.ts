import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getPaymentSettings, requireFinancePaymentOperator } from '@/lib/payment-portal';
import { prisma } from '@/lib/db';

const settingsSchema = z.object({
  razorpayEnabled: z.boolean(),
  stripeEnabled: z.boolean(),
  bankTransferEnabled: z.boolean(),
  currency: z.string().trim().toUpperCase().length(3),
  accountName: z.string().trim().max(180).default(''),
  bankName: z.string().trim().max(180).default(''),
  accountNumber: z.string().trim().max(80).default(''),
  ifscCode: z.string().trim().toUpperCase().max(30).default(''),
  branchName: z.string().trim().max(180).default(''),
  upiId: z.string().trim().max(120).default(''),
  paymentInstructions: z.string().trim().max(2000).default(''),
}).superRefine((value, context) => {
  if (value.bankTransferEnabled && (!value.accountName || !value.bankName || !value.accountNumber || !value.ifscCode)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['bankTransferEnabled'],
      message: 'Account name, bank name, account number and IFSC are required for direct bank transfer.',
    });
  }
});

export async function GET() {
  const context = await requireFinancePaymentOperator().catch(() => null);
  if (!context) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(await getPaymentSettings(context.tenantId));
}

export async function PATCH(request: Request) {
  const context = await requireFinancePaymentOperator().catch(() => null);
  if (!context) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Review the payment settings.', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    if (input.razorpayEnabled && !(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)) {
      return NextResponse.json({ error: 'Razorpay server credentials are not configured for this deployment.' }, { status: 409 });
    }
    if (input.stripeEnabled && !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe server credentials are not configured for this deployment.' }, { status: 409 });
    }

    await prisma.$executeRaw`
      INSERT INTO campusos_finance.payment_settings
        (tenant_id, razorpay_enabled, stripe_enabled, bank_transfer_enabled,
         currency, account_name, bank_name, account_number, ifsc_code,
         branch_name, upi_id, payment_instructions, updated_by, updated_at)
      VALUES
        (${context.tenantId}::uuid, ${input.razorpayEnabled}, ${input.stripeEnabled},
         ${input.bankTransferEnabled}, ${input.currency}, ${input.accountName || null},
         ${input.bankName || null}, ${input.accountNumber || null}, ${input.ifscCode || null},
         ${input.branchName || null}, ${input.upiId || null}, ${input.paymentInstructions || null},
         ${context.userId}::uuid, now())
      ON CONFLICT (tenant_id) DO UPDATE SET
        razorpay_enabled = EXCLUDED.razorpay_enabled,
        stripe_enabled = EXCLUDED.stripe_enabled,
        bank_transfer_enabled = EXCLUDED.bank_transfer_enabled,
        currency = EXCLUDED.currency,
        account_name = EXCLUDED.account_name,
        bank_name = EXCLUDED.bank_name,
        account_number = EXCLUDED.account_number,
        ifsc_code = EXCLUDED.ifsc_code,
        branch_name = EXCLUDED.branch_name,
        upi_id = EXCLUDED.upi_id,
        payment_instructions = EXCLUDED.payment_instructions,
        updated_by = EXCLUDED.updated_by,
        updated_at = now()
    `;

    return NextResponse.json({ success: true, settings: await getPaymentSettings(context.tenantId) });
  } catch (error) {
    console.error('Payment settings update failed:', error);
    return NextResponse.json({ error: 'Unable to save payment settings.' }, { status: 500 });
  }
}
