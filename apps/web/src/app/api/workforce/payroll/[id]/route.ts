import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import {
  WorkforceError,
  approvePayrollPeriod,
  getPayrollPeriod,
  markPayrollDisbursed,
  reviewPayrollPeriod,
  runPayroll,
} from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  action: z.enum(['RUN', 'REVIEW', 'APPROVE', 'DISBURSE']),
  decision: z.enum(['APPROVE', 'RETURN']).optional(),
  note: z.string().max(1000).optional(),
  method: z.enum(['BANK_TRANSFER', 'BANK_FILE', 'MANUAL_TRACKING', 'OTHER']).optional(),
  fileReference: z.string().max(300).optional(),
});

export async function GET(
  _request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const period = await getPayrollPeriod(context, id);
    return NextResponse.json({ period });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load the payroll period.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const parsed = actionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payroll action payload.' }, { status: 400 });

    let period;
    let result;
    switch (parsed.data.action) {
      case 'RUN':
        result = await runPayroll(context, id);
        period = await getPayrollPeriod(context, id);
        return NextResponse.json({ period, result });
      case 'REVIEW':
        period = await reviewPayrollPeriod(context, id, { decision: parsed.data.decision ?? 'RETURN', note: parsed.data.note });
        return NextResponse.json({ period });
      case 'APPROVE':
        period = await approvePayrollPeriod(context, id, parsed.data.note);
        return NextResponse.json({ period });
      case 'DISBURSE':
        period = await markPayrollDisbursed(context, id, { method: parsed.data.method, fileReference: parsed.data.fileReference });
        return NextResponse.json({ period });
      default:
        return NextResponse.json({ error: 'Unsupported payroll action.' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to process the payroll action.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
