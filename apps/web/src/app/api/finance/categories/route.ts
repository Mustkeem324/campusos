import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { createFeeCategory, FinanceError, listFeeCategories } from '@/lib/finance-operations';

export const dynamic = 'force-dynamic';

const categorySchema = z.object({
  code: z.string().min(2).max(32),
  label: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  isRefundable: z.boolean().optional(),
  isMandatory: z.boolean().optional(),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const categories = await listFeeCategories(context.tenantId);
    return NextResponse.json({ categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load fee categories.';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = categorySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid fee category payload.' }, { status: 400 });
    const category = await createFeeCategory(context, parsed.data as Parameters<typeof createFeeCategory>[1]);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof FinanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to create fee category.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
