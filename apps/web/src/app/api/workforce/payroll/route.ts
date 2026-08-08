import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, createPayrollPeriod } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const periodSchema = z.object({
  periodKey: z.string().min(3).max(60),
  periodLabel: z.string().min(3).max(120),
  cycle: z.enum(['MONTHLY', 'WEEKLY', 'FORTNIGHTLY', 'OTHER']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(1000).optional(),
});

export async function GET(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const url = new URL(request.url);
    const periodId = url.searchParams.get('id');
    if (periodId) {
      const { getPayrollPeriod } = await import('@/lib/workforce-operations');
      const period = await getPayrollPeriod(context, periodId);
      return NextResponse.json({ period });
    }
    return NextResponse.json({ periods: [] });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load payroll periods.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = periodSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payroll period payload.' }, { status: 400 });
    const period = await createPayrollPeriod(context, parsed.data as Parameters<typeof createPayrollPeriod>[1]);
    return NextResponse.json({ period }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to create the payroll period.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
