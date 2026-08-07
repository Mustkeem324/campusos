import { NextResponse } from 'next/server';

import { getHostelWorkspaceData, HostelError } from '@/lib/hostel-operations';
import { clientSafeHostelWorkspace } from '@/lib/hostel-sanitize';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = clientSafeHostelWorkspace(await getHostelWorkspaceData());
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof HostelError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Hostel workspace load failed:', error);
    return NextResponse.json({ error: 'Unable to load hostel workspace.' }, { status: 500 });
  }
}
