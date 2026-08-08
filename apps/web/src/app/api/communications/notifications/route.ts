import { NextResponse } from 'next/server';

import { CommunicationError, getNotificationCenter, markNotificationRead } from '@/lib/communications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 30);
    return NextResponse.json({ notifications: await getNotificationCenter(limit) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handle(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (String(body.action || '') !== 'mark_read') throw new CommunicationError('Unsupported notification action.', 400, 'UNSUPPORTED_ACTION');
    return NextResponse.json(await markNotificationRead(String(body.notificationId || '')));
  } catch (error) {
    return handle(error);
  }
}

function handle(error: unknown) {
  if (error instanceof CommunicationError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  console.error('Notification center request failed:', error);
  return NextResponse.json({ error: 'Notification center is unavailable.' }, { status: 500 });
}
