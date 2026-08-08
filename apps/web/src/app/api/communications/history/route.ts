import { NextResponse } from 'next/server';

import { CommunicationError, getCommunicationHistory } from '@/lib/communications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    return NextResponse.json({ messages: await getCommunicationHistory(Number(searchParams.get('limit') || 50)) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof CommunicationError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Communication history failed:', error);
    return NextResponse.json({ error: 'Communication history is unavailable.' }, { status: 500 });
  }
}
