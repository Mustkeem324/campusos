import { NextResponse } from 'next/server';

import { getHostelAvailability, HostelError } from '@/lib/hostel-operations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const availability = await getHostelAvailability();
    return NextResponse.json(availability, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof HostelError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ visible: false, reason: 'ROLE_NOT_SUPPORTED' }, { status: 403 });
  }
}
