import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';
import { writePhase7Audit } from '@/lib/phase7';

/**
 * Canonical notification preferences route.
 *
 * Consumers:
 * - GET  /api/notification-preferences        -> preference[] (stored rows)
 * - POST /api/notification-preferences        -> full upsert (phase 7 console)
 * - PATCH /api/notification-preferences       -> partial update (account settings)
 *
 * Replaces the legacy /api/notifications/preferences route.
 */
const preferenceSchema = z.object({
  type: z.string().min(1).max(50),
  email: z.boolean(),
  push: z.boolean(),
  inApp: z.boolean(),
});

const partialSchema = z.object({
  type: z.string().min(1).max(50),
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const stored = await prisma.notificationPreference.findMany({
      where: { tenantId: context.tenantId, userId: context.userId },
      select: { type: true, email: true, push: true, inApp: true },
      orderBy: { type: 'asc' },
    });
    return NextResponse.json(stored);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load notification preferences.' },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const payload = preferenceSchema.parse(await request.json());

    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId_type: {
          userId: context.userId,
          type: payload.type,
        },
      },
      update: {
        tenantId: context.tenantId,
        email: payload.email,
        push: payload.push,
        inApp: payload.inApp,
      },
      create: {
        tenantId: context.tenantId,
        userId: context.userId,
        type: payload.type,
        email: payload.email,
        push: payload.push,
        inApp: payload.inApp,
      },
      select: { type: true, email: true, push: true, inApp: true },
    });

    await writePhase7Audit(context, 'PHASE7_NOTIFICATION_PREFERENCE_UPDATED', 'NotificationPreference', preference);
    return NextResponse.json({ success: true, preference });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid notification preference.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save notification preferences.' },
      { status: 401 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const payload = partialSchema.parse(await request.json());

    const existing = await prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId: context.userId,
          type: payload.type,
        },
      },
    });

    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId_type: {
          userId: context.userId,
          type: payload.type,
        },
      },
      update: {
        tenantId: context.tenantId,
        email: payload.email ?? existing?.email ?? true,
        push: payload.push ?? existing?.push ?? true,
        inApp: payload.inApp ?? existing?.inApp ?? true,
      },
      create: {
        tenantId: context.tenantId,
        userId: context.userId,
        type: payload.type,
        email: payload.email ?? true,
        push: payload.push ?? true,
        inApp: payload.inApp ?? true,
      },
      select: { type: true, email: true, push: true, inApp: true },
    });

    await writePhase7Audit(context, 'PHASE7_NOTIFICATION_PREFERENCE_UPDATED', 'NotificationPreference', preference);
    return NextResponse.json({ success: true, preference });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid notification preference.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save notification preferences.' },
      { status: 401 },
    );
  }
}
