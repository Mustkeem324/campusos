import { NextResponse } from 'next/server';

import { getDataMigrationWorkspace, DataMigrationWorkspaceError } from '@/lib/data-migration-workspace';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getDataMigrationWorkspace();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof DataMigrationWorkspaceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Data migration workspace load failed:', error);
    return NextResponse.json({ error: 'Unable to load the data migration workspace.' }, { status: 500 });
  }
}
