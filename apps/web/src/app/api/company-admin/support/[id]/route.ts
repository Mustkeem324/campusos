import { NextResponse } from 'next/server';
import { z } from 'zod';

import { CompanySupportError, updateCompanySupportTicket } from '@/lib/company-admin-support';

const schema = z.object({
  status: z.enum(['NEW','OPEN','WAITING_INSTITUTION','RESOLVED','CLOSED']).optional(),
  priority: z.enum(['LOW','NORMAL','HIGH','URGENT']).optional(),
  assignToMe: z.boolean().optional(),
}).refine((value) => value.status !== undefined || value.priority !== undefined || value.assignToMe !== undefined, { message: 'At least one update is required.' });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the support-case update.' }, { status: 400 });
    await updateCompanySupportTicket(params.id, parsed.data);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof CompanySupportError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Company support case update failed:', error);
    return NextResponse.json({ error: 'Unable to update the company support case.' }, { status: 500 });
  }
}
