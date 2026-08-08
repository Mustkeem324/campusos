import { NextResponse } from 'next/server';

import { getAIGovernanceWorkspace, AIGovernanceWorkspaceError } from '@/lib/ai-governance-workspace';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAIGovernanceWorkspace();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AIGovernanceWorkspaceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('AI governance workspace load failed:', error);
    return NextResponse.json({ error: 'Unable to load the AI governance workspace.' }, { status: 500 });
  }
}
