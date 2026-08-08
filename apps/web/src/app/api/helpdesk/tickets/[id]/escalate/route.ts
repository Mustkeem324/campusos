import { NextResponse } from 'next/server';
import { RoleType } from '@prisma/client';
import { z } from 'zod';

import { escalateHelpdeskTicket, HelpdeskError } from '@/lib/helpdesk';

const schema = z.object({
  toRole: z.nativeEnum(RoleType),
  reason: z.string().trim().min(5).max(2000),
});

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the escalation target and reason.' }, { status: 400 });
    await escalateHelpdeskTicket(params.id, parsed.data.toRole, parsed.data.reason);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof HelpdeskError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Helpdesk escalation failed:', error);
    return NextResponse.json({ error: 'Unable to escalate this case.' }, { status: 500 });
  }
}
