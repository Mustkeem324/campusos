import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createHelpdeskTicket, HelpdeskError } from '@/lib/helpdesk';

const schema = z.object({
  category: z.enum(['ACADEMIC','EXAMINATION','FACULTY_CONCERN','ATTENDANCE','FEES','ADMISSIONS','LIBRARY','HOSTEL','TRANSPORT','PLACEMENT','HR','TECHNICAL','REGISTRAR','OTHER']),
  subject: z.string().trim().min(3).max(180),
  description: z.string().trim().min(5).max(8000),
  priority: z.enum(['LOW','NORMAL','HIGH','URGENT']).default('NORMAL'),
  relatedStudentId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the helpdesk case details.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const ticket = await createHelpdeskTicket(parsed.data);
    return NextResponse.json({ success: true, ticket }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof HelpdeskError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Helpdesk ticket creation failed:', error);
    return NextResponse.json({ error: 'Unable to create the helpdesk case.' }, { status: 500 });
  }
}
