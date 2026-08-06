import { NextResponse } from 'next/server';

import { prisma } from '../../../../lib/db';

const WORKSPACE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const subdomain = String(payload.subdomain ?? '').trim().toLowerCase();

    if (!WORKSPACE_PATTERN.test(subdomain)) {
      return NextResponse.json({ error: 'Enter a valid institution workspace.' }, { status: 400 });
    }

    const institution = await prisma.institution.findUnique({
      where: { subdomain },
      select: {
        name: true,
        subdomain: true,
        status: true,
        logoUrl: true,
      },
    });

    if (!institution) {
      return NextResponse.json({ error: 'Institution workspace not found.' }, { status: 404 });
    }

    if (['SUSPENDED', 'INACTIVE', 'DISABLED'].includes(institution.status.toUpperCase())) {
      return NextResponse.json({ error: 'This institution workspace is currently unavailable.' }, { status: 403 });
    }

    return NextResponse.json({
      institution: {
        name: institution.name,
        subdomain: institution.subdomain,
        status: institution.status,
        logoUrl: institution.logoUrl,
      },
      loginUrl: `/login?workspace=${encodeURIComponent(institution.subdomain)}`,
    });
  } catch (error) {
    console.error('Institution workspace resolution failed:', error);
    return NextResponse.json({ error: 'Unable to verify the institution workspace right now.' }, { status: 500 });
  }
}
