import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { LibraryError, listMemberships, updateMembershipStatus } from '@/lib/library-operations';

export const dynamic = 'force-dynamic';

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED', 'BLOCKED', 'CLEARANCE_PENDING', 'CLOSED']),
  reason: z.string().min(3).max(1000),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const memberships = await listMemberships(context);
    return NextResponse.json({ memberships });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to list library memberships.';
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
    if (!parsed.success) return NextResponse.json({ error: 'Invalid membership status payload.' }, { status: 400 });
    const membership = await updateMembershipStatus(context, id, parsed.data as Parameters<typeof updateMembershipStatus>[2]);
    return NextResponse.json({ membership });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to update the membership status.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
