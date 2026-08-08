import { NextResponse } from 'next/server';

import { HelpdeskError, resolveHelpdeskTicket } from '@/lib/helpdesk';

export async function POST(_request: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    await resolveHelpdeskTicket(params.id);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof HelpdeskError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Helpdesk resolution failed:', error);
    return NextResponse.json({ error: 'Unable to resolve this case.' }, { status: 500 });
  }
}
