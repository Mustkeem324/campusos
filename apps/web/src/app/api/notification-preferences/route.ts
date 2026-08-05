import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';
import { writePhase7Audit } from '@/lib/phase7';

const preferenceSchema = z.object({
  type: z.enum(['ACADEMIC', 'FINANCE', 'APPROVAL', 'SECURITY', 'SYSTEM']),
  email: z.boolean(),
  push: z.boolean(),
  inApp: z.boolean(),
});

const defaultTypes = ['ACADEMIC', 'FINANCE', 'APPROVAL', 'SECURITY', 'SYSTEM'] as const;

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const stored = await prisma.notificationPreference.findMany({
      where: { tenantId: context.tenantId, userId: context.userId },
      select: { type: true, email: true, push: true, inApp: true },
    });
    const byType = new Map(stored.map((item) => [item.type, item]));
    return NextResponse.json({
      preferences: defaultTypes.map((type) => byType.get(type) ?? {
        type,
        email: true,
        push: true,
        inApp: true,
      }),
    });
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
