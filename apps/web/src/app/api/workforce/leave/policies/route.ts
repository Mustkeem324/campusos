import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, createLeavePolicy, listLeavePolicies } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const policySchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(120),
  leaveType: z.enum([
    'CASUAL', 'SICK', 'EARNED', 'PRIVILEGE', 'MATERNITY', 'PATERNITY',
    'BEREAVEMENT', 'COMP_OFF', 'DUTY_LEAVE', 'STUDY_LEAVE', 'UNPAID',
    'SABBATICAL', 'OTHER',
  ]),
  defaultDays: z.number().min(0).max(3650),
  accrualEnabled: z.boolean().optional(),
  accrualPerYear: z.number().min(0).max(3650).optional(),
  carryForwardLimit: z.number().min(0).max(3650).optional(),
  isPaid: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  appliesTo: z.array(z.string().max(40)).max(20).optional(),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const policies = await listLeavePolicies(context);
    return NextResponse.json({ policies });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load leave policies.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = policySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid leave policy payload.' }, { status: 400 });
    const policy = await createLeavePolicy(context, parsed.data as Parameters<typeof createLeavePolicy>[1]);
    return NextResponse.json({ policy }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to create the leave policy.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
