import { NextResponse } from 'next/server';
import { z } from 'zod';

import { CompanySupportError, replyCompanySupportTicket } from '@/lib/company-admin-support';

const schema = z.object({ body: z.string().trim().min(1).max(8000) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the reply.' }, { status: 400 });
    await replyCompanySupportTicket(params.id, parsed.data.body);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof CompanySupportError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Company support reply failed:', error);
    return NextResponse.json({ error: 'Unable to send the company support reply.' }, { status: 500 });
  }
}
