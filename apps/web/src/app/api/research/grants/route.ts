import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, addGrant, listGrants } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

const addSchema = z.object({
  projectId: z.string().uuid().optional(),
  fundingAgency: z.string().min(1).max(300),
  grantReference: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  approvedBudgetMinor: z.number().int().min(0),
  currency: z.string().regex(/^[A-Za-z]{3}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const grants = await listGrants(context);
    return NextResponse.json({ grants });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to list grants.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = addSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid grant payload.' }, { status: 400 });
    const grant = await addGrant(context, parsed.data as Parameters<typeof addGrant>[1]);
    return NextResponse.json({ grant }, { status: 201 });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to add the grant.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
