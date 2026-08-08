import { NextResponse } from 'next/server';

import { getGovernanceWorkspace, GovernanceWorkspaceError } from '@/lib/governance-workspace';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getGovernanceWorkspace();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof GovernanceWorkspaceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Governance workspace load failed:', error);
    return NextResponse.json({ error: 'Unable to load the governance workspace.' }, { status: 500 });
  }
}
