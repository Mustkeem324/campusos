import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, getWorkforceSettings, updateWorkforceSettings } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const settingsPatchSchema = z.object({
  timezone: z.string().max(64).optional(),
  employeeNumberPrefix: z.string().max(24).optional(),
  employeeNumberYearFormat: z.enum(['YYYY', 'YY']).optional(),
  attendanceDayStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  overnightShiftAllowed: z.boolean().optional(),
  missingCheckoutGraceMinutes: z.number().int().min(0).max(600).optional(),
  leaveBalanceEnforced: z.boolean().optional(),
  leaveApprovalMakerChecker: z.boolean().optional(),
  leaveDeductionOnApproval: z.boolean().optional(),
  leaveCancellationRestores: z.boolean().optional(),
  unpaidLeaveBasis: z.enum(['CALENDAR_DAYS', 'WORKING_DAYS']).optional(),
  payrollMakerChecker: z.boolean().optional(),
  payrollMonthlyDivisor: z.number().int().min(1).max(31).optional(),
  payrollProtectClosed: z.boolean().optional(),
  payrollRequireDisbursementConfirmation: z.boolean().optional(),
  finalSettlementMakerChecker: z.boolean().optional(),
  probationDays: z.number().int().min(1).max(3650).optional(),
  noticePeriodDays: z.number().int().min(0).max(3650).optional(),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const settings = await getWorkforceSettings(context.tenantId);
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load workforce settings.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = settingsPatchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid workforce settings payload.' }, { status: 400 });
    const settings = await updateWorkforceSettings(context, parsed.data as Parameters<typeof updateWorkforceSettings>[1]);
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to update workforce settings.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
