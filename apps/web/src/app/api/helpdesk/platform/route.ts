import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createCompanySupportTicket, HelpdeskError } from '@/lib/helpdesk';

const schema = z.object({
  category: z.string().trim().min(2).max(80),
  subject: z.string().trim().min(3).max(180),
  description: z.string().trim().min(5).max(8000),
  priority: z.enum(['LOW','NORMAL','HIGH','URGENT']).default('NORMAL'),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the CampusOS support request.' }, { status: 400 });
    const data = parsed.data;
    const ticket = await createCompanySupportTicket({
      category: data.category,
      subject: data.subject,
      description: data.description,
      priority: data.priority ?? 'NORMAL',
    });
    return NextResponse.json({ success: true, ticket }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof HelpdeskError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Company support request failed:', error);
    return NextResponse.json({ error: 'Unable to contact CampusOS support.' }, { status: 500 });
  }
}
