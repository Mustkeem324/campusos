import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createAttendanceCalendarDay,
  manualMarkAttendance,
  SmartAttendanceError,
  submitAttendanceSession,
  updateAttendanceSettings,
  updateAttendanceStudent,
} from '@/lib/smart-attendance';

const requestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('mark'),
    timetableSlotId: z.string().uuid(),
    sessionDate: z.string().date(),
    studentId: z.string().uuid(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    note: z.string().trim().max(500).optional(),
  }),
  z.object({ action: z.literal('submit'), sessionId: z.string().uuid() }),
  z.object({
    action: z.literal('student-mode'),
    studentId: z.string().uuid(),
    studyMode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']),
    selfCheckInEnabled: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('settings'),
    requiredPercentage: z.number().min(0).max(100).optional(),
    timezone: z.string().trim().min(1).max(80).optional(),
    allowOfflineSelfCheckIn: z.boolean().optional(),
    requireOnlineFace: z.boolean().optional(),
    requireOfflineSelfFace: z.boolean().optional(),
    allowHybridDailyCheckIn: z.boolean().optional(),
    checkinEarlyMinutes: z.number().int().min(0).max(120).optional(),
    checkinLateMinutes: z.number().int().min(0).max(180).optional(),
    checkoutEnabled: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('calendar'),
    calendarDate: z.string().date(),
    dayType: z.enum(['WORKING', 'HOLIDAY', 'INSTITUTION_CLOSED', 'EXAM', 'EVENT', 'SPECIAL_WORKING']),
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().max(1000).optional(),
    programId: z.string().uuid().optional(),
    batchId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
  }),
]);

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the attendance action fields.' }, { status: 400 });
    const input = parsed.data;
    let result: unknown;
    switch (input.action) {
      case 'mark':
        result = await manualMarkAttendance({
          timetableSlotId: input.timetableSlotId,
          sessionDate: input.sessionDate,
          studentId: input.studentId,
          status: input.status,
          note: input.note,
        });
        break;
      case 'submit':
        result = await submitAttendanceSession(input.sessionId);
        break;
      case 'student-mode':
        result = await updateAttendanceStudent({
          studentId: input.studentId,
          studyMode: input.studyMode,
          selfCheckInEnabled: input.selfCheckInEnabled,
        });
        break;
      case 'settings':
        result = await updateAttendanceSettings({
          requiredPercentage: input.requiredPercentage,
          timezone: input.timezone,
          allowOfflineSelfCheckIn: input.allowOfflineSelfCheckIn,
          requireOnlineFace: input.requireOnlineFace,
          requireOfflineSelfFace: input.requireOfflineSelfFace,
          allowHybridDailyCheckIn: input.allowHybridDailyCheckIn,
          checkinEarlyMinutes: input.checkinEarlyMinutes,
          checkinLateMinutes: input.checkinLateMinutes,
          checkoutEnabled: input.checkoutEnabled,
        });
        break;
      case 'calendar':
        result = await createAttendanceCalendarDay({
          calendarDate: input.calendarDate,
          dayType: input.dayType,
          title: input.title,
          description: input.description,
          programId: input.programId,
          batchId: input.batchId,
          sectionId: input.sectionId,
        });
        break;
    }
    return NextResponse.json({ success: true, result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SmartAttendanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Attendance action failed:', error);
    return NextResponse.json({ error: 'Unable to complete the attendance action.' }, { status: 500 });
  }
}
