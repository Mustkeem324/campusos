import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';

const preferencesSchema = z.object({
  language: z.string().optional(),
  appearance: z.string().optional(),
  accessibility: z.boolean().optional(),
  timeZone: z.string().optional(),
  startPage: z.string().optional(),
  notificationPreferences: z
    .object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      push: z.boolean().optional(),
    })
    .optional(),
  quietHours: z.boolean().optional(),
});

const DEFAULT_PREFERENCES = {
  language: 'en',
  appearance: 'system',
  accessibility: false,
  timeZone: 'UTC',
  startPage: '/dashboard',
  notificationPreferences: { email: true, sms: false, push: true },
  quietHours: false,
};

type PreferencePatch = z.infer<typeof preferencesSchema>;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergePreferences(stored: Record<string, unknown> | null, patch: PreferencePatch): Record<string, unknown> {
  const storedRecord = isPlainRecord(stored) ? stored : {};
  const storedNotificationPrefs = isPlainRecord(storedRecord.notificationPreferences)
    ? storedRecord.notificationPreferences
    : {};
  return {
    ...DEFAULT_PREFERENCES,
    ...storedRecord,
    ...patch,
    notificationPreferences: {
      ...storedNotificationPrefs,
      ...(isPlainRecord(patch.notificationPreferences) ? patch.notificationPreferences : {}),
    },
  };
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const json = await req.json();
    const data = preferencesSchema.parse(json);

    const current = await prisma.user.findFirst({
      where: { id: session.userId, tenantId: session.tenantId },
      select: { preferences: true },
    });
    if (!current) {
      return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 });
    }

    const merged = mergePreferences(
      current.preferences as Record<string, unknown> | null,
      data,
    );

    await prisma.user.update({
      where: { id: session.userId },
      data: { preferences: merged as Prisma.InputJsonValue },
    });

    return NextResponse.json({ success: true, data: merged });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }
    console.error('Failed to save user preferences:', error);
    return NextResponse.json({ success: false, error: 'Unable to save preferences.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { id: session.userId, tenantId: session.tenantId },
      select: { preferences: true },
    });

    const stored = user?.preferences as Record<string, unknown> | null;
    return NextResponse.json({
      success: true,
      data: {
        ...DEFAULT_PREFERENCES,
        ...(stored ?? {}),
      },
    });
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return NextResponse.json({ success: false, error: 'Unable to load preferences.' }, { status: 500 });
  }
}
