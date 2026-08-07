import { NextResponse } from 'next/server';
import { z } from 'zod';

import { HelpdeskError, replyToHelpdeskTicket } from '@/lib/helpdesk';

const schema = z.object({
  body: z.string().trim().min(1).max(8000),
  internalNote: z.boolean().optional().default(false),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the reply.' }, { status: 400 });
    await replyToHelpdeskTicket(params.id, parsed.data.body, parsed.data.internalNote);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof HelpdeskError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Helpdesk reply failed:', error);
    return NextResponse.json({ error: 'Unable to send this reply.' }, { status: 500 });
  }
}
