import { NextResponse } from 'next/server';

import { getInternationalWorkspace, InternationalWorkspaceError } from '@/lib/international-workspace';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getInternationalWorkspace();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof InternationalWorkspaceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('International workspace load failed:', error);
    return NextResponse.json({ error: 'Unable to load the international workspace.' }, { status: 500 });
  }
}
