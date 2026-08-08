import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, createJobRequisition, reviewJobRequisition } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const requisitionSchema = z.object({
  departmentId: z.string().uuid().optional(),
  positionTitle: z.string().min(2).max(160),
  employeeType: z.string().min(2).max(60),
  requiredCount: z.number().int().min(1).max(500).optional(),
  reason: z.string().max(1000).optional(),
  qualifications: z.string().max(1000).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  compensationRange: z.record(z.unknown()).optional(),
  targetJoinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  note: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const body = await request.json().catch(() => null);
    if (body && typeof body === 'object' && 'action' in body) {
      const parsed = reviewSchema.safeParse(body);
      if (!parsed.success || !body.requisitionId) return NextResponse.json({ error: 'Invalid requisition review payload.' }, { status: 400 });
      const requisition = await reviewJobRequisition(context, body.requisitionId, { decision: parsed.data.action, note: parsed.data.note });
      return NextResponse.json({ requisition });
    }
    const parsed = requisitionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid requisition payload.' }, { status: 400 });
    const requisition = await createJobRequisition(context, parsed.data as Parameters<typeof createJobRequisition>[1]);
    return NextResponse.json({ requisition }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to process the job requisition.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
