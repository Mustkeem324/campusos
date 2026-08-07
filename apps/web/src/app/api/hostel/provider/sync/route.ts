import { NextResponse } from 'next/server';
import { z } from 'zod';

import { HostelError, syncThirdPartyHostel } from '@/lib/hostel-operations';

const chargeSchema = z.object({
  externalChargeRef: z.string().trim().min(1).max(120),
  category: z.enum(['HOSTEL','MESS','MAINTENANCE','SECURITY_DEPOSIT','DAMAGE','OTHER']),
  description: z.string().trim().min(1).max(500),
  amount: z.number().min(0).max(10_000_000),
  paidAmount: z.number().min(0).max(10_000_000).optional(),
  currency: z.string().trim().length(3).optional(),
  dueDate: z.string().date().nullable().optional(),
  status: z.enum(['DUE','PARTIAL','PAID','WAIVED','DISPUTED']).optional(),
});

const studentSchema = z.object({
  rollNumber: z.string().trim().min(1).max(80),
  externalStudentRef: z.string().trim().max(120).nullable().optional(),
  externalAllocationRef: z.string().trim().min(1).max(120),
  facilityName: z.string().trim().min(2).max(120),
  building: z.string().trim().max(120).nullable().optional(),
  roomNumber: z.string().trim().max(40).nullable().optional(),
  bedLabel: z.string().trim().max(40).nullable().optional(),
  mealPlan: z.string().trim().max(120).nullable().optional(),
  status: z.enum(['ACTIVE','RESERVED','CHECKED_OUT']).optional(),
  charges: z.array(chargeSchema).max(50).optional(),
});

const payloadSchema = z.object({
  snapshotRef: z.string().trim().min(1).max(160),
  students: z.array(studentSchema).min(1).max(500),
});

const buckets = new Map<string, { startedAt: number; count: number }>();

function allow(key: string) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= 60_000) {
    buckets.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= 30) return false;
  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 1_500_000) return NextResponse.json({ error: 'Payload is too large.' }, { status: 413 });
    const authorization = request.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : request.headers.get('x-navemora-hostel-token')?.trim();
    if (!token || token.length > 256) return NextResponse.json({ error: 'Provider credential is required.' }, { status: 401 });
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!allow(`${token.slice(-12)}:${forwarded}`)) return NextResponse.json({ error: 'Sync rate limit exceeded.' }, { status: 429 });

    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the provider snapshot payload.' }, { status: 400 });
    const syncInput = { token, ...parsed.data } as Parameters<typeof syncThirdPartyHostel>[0];
    const result = await syncThirdPartyHostel(syncInput);
    return NextResponse.json({ success: true, ...result }, { status: result.duplicate ? 200 : 202, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof HostelError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Third-party hostel sync failed:', error);
    return NextResponse.json({ error: 'Unable to process hostel provider sync.' }, { status: 500 });
  }
}
