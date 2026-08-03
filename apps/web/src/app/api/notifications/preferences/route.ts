import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const preferences = await prisma.notificationPreference.findMany({
      where: {
        userId: session.userId,
        tenantId: session.tenantId,
      }
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Fetch notification preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updatePrefSchema = z.object({
  type: z.string(),
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = updatePrefSchema.parse(body);

    const existing = await prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId: session.userId,
          type: parsed.type,
        }
      }
    });

    if (existing) {
      const updated = await prisma.notificationPreference.update({
        where: { id: existing.id },
        data: {
          email: parsed.email ?? existing.email,
          push: parsed.push ?? existing.push,
          inApp: parsed.inApp ?? existing.inApp,
        }
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.notificationPreference.create({
        data: {
          tenantId: session.tenantId,
          userId: session.userId,
          type: parsed.type,
          email: parsed.email ?? true,
          push: parsed.push ?? true,
          inApp: parsed.inApp ?? true,
        }
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error('Update notification preference error:', error);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
