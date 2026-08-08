import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '../../../lib/auth';
import { prisma } from '../../../lib/db';
import { z } from 'zod';
import { decodeCursor, InvalidCursorError, pageInfo, pageSize } from '@/lib/platform/pagination';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'unread', 'all'
    const limit = pageSize(searchParams.get('limit'));
    const cursor = decodeCursor(searchParams.get('cursor'), session.tenantId);
    const search = searchParams.get('search') || '';

    const whereClause: any = {
      userId: session.userId,
      tenantId: session.tenantId,
      isArchived: false,
    };

    if (filter === 'unread') {
      whereClause.isRead = false;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } }
      ];
    }

    const rows = await prisma.notification.findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
      take: limit + 1,
    });

    const result = pageInfo(rows, limit, session.tenantId);
    // Preserve the legacy array response for existing dashboard controls.
    // New consumers opt into the cursor envelope (or receive it when sending
    // a cursor) without ever receiving an unbounded collection.
    if (cursor || searchParams.get('pagination') === 'cursor') {
      return NextResponse.json({ notifications: result.items, ...result });
    }
    return NextResponse.json(result.items, {
      headers: {
        'X-Has-Next-Page': String(result.pageInfo.hasNextPage),
        'X-Next-Cursor': result.pageInfo.nextCursor ?? '',
      },
    });
  } catch (error) {
    if (error instanceof InvalidCursorError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().uuid().optional(), // if provided, update specific
  action: z.enum(['markRead', 'snooze', 'markAllRead']),
  snoozeUntil: z.string().datetime().optional()
});

export async function PATCH(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = patchSchema.parse(body);

    if (parsed.action === 'markAllRead') {
      await prisma.notification.updateMany({
        where: {
          userId: session.userId,
          tenantId: session.tenantId,
          isRead: false
        },
        data: { isRead: true }
      });
      return NextResponse.json({ success: true });
    }

    if (!parsed.id) {
      return NextResponse.json({ error: 'id required for this action' }, { status: 400 });
    }

    const notif = await prisma.notification.findFirst({
      where: { id: parsed.id, userId: session.userId, tenantId: session.tenantId }
    });

    if (!notif) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (parsed.action === 'markRead') {
      await prisma.notification.update({
        where: { id: parsed.id },
        data: { isRead: true }
      });
    } else if (parsed.action === 'snooze' && parsed.snoozeUntil) {
      await prisma.notification.update({
        where: { id: parsed.id },
        data: { snoozedUntil: new Date(parsed.snoozeUntil) }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

const deleteSchema = z.object({
  id: z.string().uuid()
});

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const notif = await prisma.notification.findFirst({
      where: { id, userId: session.userId, tenantId: session.tenantId }
    });

    if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // We can hard delete or soft delete (archive)
    await prisma.notification.update({
      where: { id },
      data: { isArchived: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
