import { NextResponse } from 'next/server';

import {
  CommunicationError,
  getCommunicationPreferences,
  recordCommunicationConsent,
  updateCommunicationPreference,
} from '@/lib/communications';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getCommunicationPreferences(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handle(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action || 'preference');
    if (action === 'preference') {
      return NextResponse.json(await updateCommunicationPreference({
        category: String(body.category || ''),
        channel: String(body.channel || ''),
        enabled: body.enabled === true,
      }));
    }
    if (action === 'consent') {
      const state = String(body.state || '') as 'GRANTED' | 'WITHDRAWN';
      if (!['GRANTED', 'WITHDRAWN'].includes(state)) throw new CommunicationError('Consent state is invalid.', 400, 'INVALID_CONSENT');
      return NextResponse.json(await recordCommunicationConsent({
        channel: String(body.channel || ''),
        purpose: String(body.purpose || ''),
        state,
      }));
    }
    throw new CommunicationError('Unsupported preference action.', 400, 'UNSUPPORTED_ACTION');
  } catch (error) {
    return handle(error);
  }
}

function handle(error: unknown) {
  if (error instanceof CommunicationError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  console.error('Communication preferences failed:', error);
  return NextResponse.json({ error: 'Communication preferences are unavailable.' }, { status: 500 });
}
