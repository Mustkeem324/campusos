import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { createFeeStructure, FinanceError, listFeeStructures } from '@/lib/finance-operations';

export const dynamic = 'force-dynamic';

const headSchema = z.object({
  name: z.string().min(1).max(120),
  categoryCode: z.string().max(40).nullable().optional(),
  amountMinor: z.number().int().nonnegative(),
  isRecurring: z.boolean().optional(),
});

const structureSchema = z.object({
  name: z.string().min(1).max(200),
  categoryCode: z.string().max(40).optional(),
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  academicYearId: z.string().uuid().optional(),
  campusId: z.string().uuid().optional(),
  programIds: z.array(z.string().uuid()).optional(),
  batchIds: z.array(z.string().uuid()).optional(),
  semester: z.string().max(80).optional(),
  studyModes: z.array(z.enum(['ONLINE', 'OFFLINE', 'HYBRID'])).optional(),
  recurring: z.boolean().optional(),
  isRefundable: z.boolean().optional(),
  isMandatory: z.boolean().optional(),
  taxApplicable: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  effectiveFrom: z.string(),
  effectiveUntil: z.string().optional(),
  installmentEligibility: z.boolean().optional(),
  maxInstallments: z.number().int().min(1).max(12).optional(),
  scholarshipEligible: z.boolean().optional(),
  heads: z.array(headSchema).max(30).optional(),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const structures = await listFeeStructures(context.tenantId);
    return NextResponse.json({ structures });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load fee structures.';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = structureSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid fee structure payload.' }, { status: 400 });
    const structure = await createFeeStructure(context, parsed.data as Parameters<typeof createFeeStructure>[1]);
    return NextResponse.json({ structure }, { status: 201 });
  } catch (error) {
    if (error instanceof FinanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to create fee structure.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
