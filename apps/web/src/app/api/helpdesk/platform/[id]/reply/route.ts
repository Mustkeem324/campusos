import { NextResponse } from 'next/server';
import { z } from 'zod';

import { HelpdeskError, replyCompanySupportAsInstitution } from '@/lib/helpdesk';

const schema = z.object({ body: z.string().trim().min(1).max(8000) });

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the reply.' }, { status: 400 });
    await replyCompanySupportAsInstitution(params.id, parsed.data.body);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof HelpdeskError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Institution company-support reply failed:', error);
    return NextResponse.json({ error: 'Unable to reply to CampusOS support.' }, { status: 500 });
  }
}
