import { NextResponse } from 'next/server';

import { assignHelpdeskTicketToSelf, HelpdeskError } from '@/lib/helpdesk';

export async function POST(_request: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const result = await assignHelpdeskTicketToSelf(params.id);
    return NextResponse.json({ success: true, assignment: result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof HelpdeskError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Helpdesk assignment failed:', error);
    return NextResponse.json({ error: 'Unable to assign this case.' }, { status: 500 });
  }
}
