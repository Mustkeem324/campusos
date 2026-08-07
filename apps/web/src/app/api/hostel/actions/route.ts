import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createHostelCharge,
  createHostelFacility,
  createHostelIncident,
  createHostelOutpass,
  createHostelProvider,
  createHostelRoom,
  decideHostelOutpass,
  HostelError,
  updateHostelSettings,
  updateHostelStudent,
} from '@/lib/hostel-operations';

const settingsSchema = z.object({
  action: z.literal('settings'),
  enabled: z.boolean().optional(),
  ownershipMode: z.enum(['INSTITUTION','THIRD_PARTY','MIXED']).optional(),
  allowHybridStudents: z.boolean().optional(),
  requireParentOutpassApproval: z.boolean().optional(),
  requireWardenOutpassApproval: z.boolean().optional(),
  facultyWelfareVisibility: z.boolean().optional(),
  thirdPartySyncEnabled: z.boolean().optional(),
  currency: z.string().trim().length(3).optional(),
});

const studentSchema = z.object({
  action: z.literal('student'),
  studentId: z.string().uuid(),
  studyMode: z.enum(['ONLINE','OFFLINE','HYBRID']),
  hostelEnrolled: z.boolean(),
  facilityId: z.string().uuid().nullable().optional(),
  roomId: z.string().uuid().nullable().optional(),
  bedLabel: z.string().trim().max(40).nullable().optional(),
  mealPlan: z.string().trim().max(120).nullable().optional(),
});

const facilitySchema = z.object({
  action: z.literal('facility'),
  name: z.string().trim().min(2).max(120),
  building: z.string().trim().max(120).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  ownership: z.enum(['INSTITUTION','THIRD_PARTY']),
  providerId: z.string().uuid().nullable().optional(),
});

const roomSchema = z.object({
  action: z.literal('room'),
  facilityId: z.string().uuid(),
  roomNumber: z.string().trim().min(1).max(40),
  floorLabel: z.string().trim().max(40).nullable().optional(),
  capacity: z.number().int().min(1).max(20),
});

const chargeSchema = z.object({
  action: z.literal('charge'),
  studentId: z.string().uuid(),
  category: z.enum(['HOSTEL','MESS','MAINTENANCE','SECURITY_DEPOSIT','DAMAGE','OTHER']),
  description: z.string().trim().min(2).max(500),
  amount: z.number().min(0).max(10_000_000),
  dueDate: z.string().date().nullable().optional(),
});

const outpassSchema = z.object({
  action: z.literal('outpass'),
  destination: z.string().trim().min(2).max(300),
  reason: z.string().trim().max(1000).nullable().optional(),
  departureAt: z.string().datetime(),
  expectedReturnAt: z.string().datetime(),
});

const decisionSchema = z.object({
  action: z.literal('outpass-decision'),
  outpassId: z.string().uuid(),
  decision: z.enum(['APPROVED','REJECTED']),
});

const incidentSchema = z.object({
  action: z.literal('incident'),
  studentId: z.string().uuid().nullable().optional(),
  kind: z.enum(['DAMAGE','DISCIPLINE','SAFETY','MAINTENANCE']),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(3000).nullable().optional(),
  proposedChargeAmount: z.number().min(0).max(10_000_000).nullable().optional(),
});

const providerSchema = z.object({
  action: z.literal('provider'),
  name: z.string().trim().min(2).max(120),
  externalCode: z.string().trim().max(80).nullable().optional(),
});

const requestSchema = z.discriminatedUnion('action', [
  settingsSchema,
  studentSchema,
  facilitySchema,
  roomSchema,
  chargeSchema,
  outpassSchema,
  decisionSchema,
  incidentSchema,
  providerSchema,
]);

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the hostel request fields.' }, { status: 400 });
    const input = parsed.data;
    let result: unknown;
    switch (input.action) {
      case 'settings': result = await updateHostelSettings(input); break;
      case 'student': result = await updateHostelStudent(input); break;
      case 'facility': result = await createHostelFacility(input); break;
      case 'room': result = await createHostelRoom(input); break;
      case 'charge': result = await createHostelCharge(input); break;
      case 'outpass': result = await createHostelOutpass(input); break;
      case 'outpass-decision': result = await decideHostelOutpass(input); break;
      case 'incident': result = await createHostelIncident(input); break;
      case 'provider': result = await createHostelProvider(input); break;
    }
    return NextResponse.json({ success: true, result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof HostelError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Hostel action failed:', error);
    return NextResponse.json({ error: 'Unable to complete the hostel action.' }, { status: 500 });
  }
}
