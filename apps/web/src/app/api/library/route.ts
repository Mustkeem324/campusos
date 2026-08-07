import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { getLibraryWorkspace, libraryError } from '@/lib/library-workspace';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    return NextResponse.json(await getLibraryWorkspace(context));
  } catch (error: unknown) {
    const failure = libraryError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
