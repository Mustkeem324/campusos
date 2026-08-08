import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, createCompensationVersion, listCompensationVersions } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const compensationSchema = z.object({
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  basePayMinor: z.number().int().min(0).max(1_000_000_000_000),
  earnings: z.array(z.object({
    code: z.string().max(40),
    label: z.string().max(120),
    amountMinor: z.number().int().min(0),
  })).max(50).optional(),
  deductions: z.array(z.object({
    code: z.string().max(40),
    label: z.string().max(120),
    amountMinor: z.number().int().min(0),
    percentage: z.number().min(0).max(100).optional(),
  })).max(50).optional(),
  employerContributions: z.array(z.object({
    code: z.string().max(40),
    label: z.string().max(120),
    amountMinor: z.number().int().min(0),
  })).max(50).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
});

export async function GET(
  _request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const versions = await listCompensationVersions(context, id);
    return NextResponse.json({ versions });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load compensation structures.';
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
    const parsed = compensationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid compensation payload.' }, { status: 400 });
    const version = await createCompensationVersion(context, id, parsed.data as Parameters<typeof createCompensationVersion>[2]);
    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to create the compensation structure.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
