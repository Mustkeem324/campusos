import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, getEmployeeProfile, updateEmploymentStatus } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const statusSchema = z.object({
  status: z.enum([
    'CANDIDATE', 'OFFERED', 'PRE_JOINING', 'ACTIVE', 'PROBATION', 'ON_LEAVE',
    'SUSPENDED', 'NOTICE_PERIOD', 'SEPARATION_PENDING', 'RESIGNED', 'TERMINATED',
    'RETIRED', 'CONTRACT_ENDED', 'EXITED',
  ]),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(3).max(1000),
});

export async function GET(
  _request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const employee = await getEmployeeProfile(context, id);
    return NextResponse.json({ employee });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load the employee.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const parsed = statusSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid employment status payload.' }, { status: 400 });
    const employee = await updateEmploymentStatus(context, id, parsed.data as Parameters<typeof updateEmploymentStatus>[2]);
    return NextResponse.json({ employee });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to update the employment status.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
