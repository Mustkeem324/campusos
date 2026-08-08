import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { FinanceError, getFinanceSettings, updateFinanceSettings } from '@/lib/finance-operations';
import { isFinanceConfigurator } from '@/lib/finance-policy';

export const dynamic = 'force-dynamic';

const settingsPatchSchema = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  timezone: z.string().min(1).max(64).optional(),
  invoicePrefix: z.string().min(1).max(12).optional(),
  invoiceYearFormat: z.enum(['YYYY', 'YY']).optional(),
  allowPartialPayments: z.boolean().optional(),
  allowOverpaymentCredit: z.boolean().optional(),
  lateFeeModel: z.enum(['NONE', 'FIXED', 'PERCENTAGE', 'DAILY']).optional(),
  lateFeeAmountMinor: z.number().int().nonnegative().optional(),
  lateFeePercentage: z.number().min(0).max(100).optional(),
  lateFeeDaily: z.boolean().optional(),
  lateFeeGraceDays: z.number().int().nonnegative().optional(),
  lateFeeMaxMinor: z.number().int().nonnegative().optional(),
  scholarshipStackingPolicy: z.enum(['NO_STACKING', 'LIMITED', 'UNLIMITED']).optional(),
  scholarshipMaxDiscountPct: z.number().min(0).max(100).optional(),
  refundRequiresMakerChecker: z.boolean().optional(),
  refundHighValueMinor: z.number().int().nonnegative().optional(),
  examRequiresClearance: z.boolean().optional(),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const settings = await getFinanceSettings(context.tenantId);
    return NextResponse.json({ settings, canConfigure: isFinanceConfigurator(context) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load finance settings.';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = settingsPatchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid finance settings payload.' }, { status: 400 });
    }
    const settings = await updateFinanceSettings(context, parsed.data);
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof FinanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to save finance settings.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
