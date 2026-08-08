import { NextResponse } from 'next/server';

import { CommunicationError, getPlatformCommunicationDashboard } from '@/lib/communications';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getPlatformCommunicationDashboard(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof CommunicationError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Platform communications dashboard failed:', error);
    return NextResponse.json({ error: 'Platform communications dashboard is unavailable.' }, { status: 500 });
  }
}
