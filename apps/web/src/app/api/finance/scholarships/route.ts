import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { createScholarshipProgram, FinanceError, listScholarshipPrograms } from '@/lib/finance-operations';

export const dynamic = 'force-dynamic';

const programSchema = z.object({
  name: z.string().min(1).max(200),
  provider: z.string().max(200).optional(),
  valueType: z.enum(['FIXED', 'PERCENTAGE', 'FULL_TUITION', 'PARTIAL_TUITION', 'COMPONENT', 'CAPPED']),
  fixedAmountMinor: z.number().int().nonnegative().optional(),
  percentage: z.number().min(0).max(100).optional(),
  capMinor: z.number().int().nonnegative().optional(),
  budgetMinor: z.number().int().nonnegative().optional(),
  programIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED']).optional(),
  applicationOpens: z.string().optional(),
  applicationCloses: z.string().optional(),
  appliesToComponents: z.array(z.string().max(40)).optional(),
  stackingAllowed: z.boolean().optional(),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const programs = await listScholarshipPrograms(context.tenantId);
    return NextResponse.json({ programs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load scholarship programs.';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = programSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid scholarship program payload.' }, { status: 400 });
    const program = await createScholarshipProgram(context, parsed.data as Parameters<typeof createScholarshipProgram>[1]);
    return NextResponse.json({ program }, { status: 201 });
  } catch (error) {
    if (error instanceof FinanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to create scholarship program.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
