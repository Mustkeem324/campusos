import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { FinanceError, generateInvoices, previewInvoiceGeneration } from '@/lib/finance-operations';

export const dynamic = 'force-dynamic';

const generateSchema = z.object({
  structureId: z.string().uuid(),
  commit: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = generateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid invoice generation payload.' }, { status: 400 });
    const { structureId, commit } = parsed.data;

    if (!commit) {
      const preview = await previewInvoiceGeneration(context, structureId);
      return NextResponse.json({ preview });
    }

    const result = await generateInvoices(context, structureId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof FinanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to generate invoices.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
