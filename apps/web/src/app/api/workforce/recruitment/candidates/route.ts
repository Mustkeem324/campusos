import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import {
  WorkforceError,
  acceptEmploymentOffer,
  addCandidate,
  createEmploymentOffer,
  scheduleInterview,
  submitInterviewFeedback,
} from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const candidateSchema = z.object({
  requisitionId: z.string().uuid().optional(),
  name: z.string().min(2).max(160),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional(),
  resumeRef: z.string().max(300).optional(),
  source: z.string().max(60).optional(),
  hrNotes: z.string().max(1000).optional(),
});

const interviewSchema = z.object({
  candidateId: z.string().uuid(),
  stage: z.enum(['SCREENING', 'TECHNICAL', 'DEMO_LECTURE', 'HR_ROUND', 'REFERENCE_CHECK', 'PANEL', 'FINAL']),
  scheduledAt: z.string(),
  mode: z.enum(['OFFLINE', 'ONLINE', 'HYBRID', 'PHONE']).optional(),
  meetingRef: z.string().max(300).optional(),
  panelMemberUserIds: z.array(z.string().uuid()).max(20).optional(),
});

const feedbackSchema = z.object({
  interviewId: z.string().uuid(),
  score: z.number().min(0).max(100),
  recommendation: z.string().max(300),
  feedback: z.record(z.unknown()),
});

const offerSchema = z.object({
  candidateId: z.string().uuid(),
  positionTitle: z.string().min(2).max(160),
  departmentId: z.string().uuid().optional(),
  employmentType: z.string().min(2).max(60),
  proposedJoinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  compensation: z.record(z.unknown()),
  probationMonths: z.number().int().min(1).max(60).optional(),
  contractDurationMonths: z.number().int().min(1).max(120).optional(),
  conditions: z.string().max(1000).optional(),
  offerExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const acceptSchema = z.object({
  offerId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid recruitment payload.' }, { status: 400 });
    }

    if ('interviewId' in body) {
      const parsed = feedbackSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid interview feedback payload.' }, { status: 400 });
      const interview = await submitInterviewFeedback(context, parsed.data.interviewId, parsed.data as Parameters<typeof submitInterviewFeedback>[2]);
      return NextResponse.json({ interview }, { status: 201 });
    }

    if ('candidateId' in body && 'stage' in body) {
      const parsed = interviewSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid interview payload.' }, { status: 400 });
      const interview = await scheduleInterview(context, parsed.data as Parameters<typeof scheduleInterview>[1]);
      return NextResponse.json({ interview }, { status: 201 });
    }

    if ('candidateId' in body && 'positionTitle' in body) {
      const parsed = offerSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid offer payload.' }, { status: 400 });
      const offer = await createEmploymentOffer(context, parsed.data as Parameters<typeof createEmploymentOffer>[1]);
      return NextResponse.json({ offer }, { status: 201 });
    }

    if ('offerId' in body) {
      const parsed = acceptSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid offer acceptance payload.' }, { status: 400 });
      const result = await acceptEmploymentOffer(context, parsed.data.offerId);
      return NextResponse.json(result, { status: 201 });
    }

    const parsed = candidateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid candidate payload.' }, { status: 400 });
    const candidate = await addCandidate(context, parsed.data as Parameters<typeof addCandidate>[1]);
    return NextResponse.json({ candidate }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to process the recruitment action.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
