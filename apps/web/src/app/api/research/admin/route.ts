import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, getResearchAdminOverview } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const overview = await getResearchAdminOverview(context);
    return NextResponse.json(overview);
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load the research console.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
