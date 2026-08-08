import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, applyLeaveRequest, getLeaveBalances, listLeaveRequests } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const leaveSchema = z.object({
  policyId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(3).max(1000),
  supportingDocRef: z.string().max(300).optional(),
});

export async function GET(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId') ?? undefined;
    const balances = await getLeaveBalances(context, employeeId);
    const requests = await listLeaveRequests(context);
    return NextResponse.json({ balances, requests });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load leave information.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = leaveSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid leave request payload.' }, { status: 400 });
    const leave = await applyLeaveRequest(context, parsed.data as Parameters<typeof applyLeaveRequest>[1]);
    return NextResponse.json({ leave }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to submit the leave request.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
