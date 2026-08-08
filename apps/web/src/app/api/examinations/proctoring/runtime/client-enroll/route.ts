import { NextResponse } from 'next/server';

import { SecureExaminationError } from '@/lib/secure-examination';
import { enrollSecureClientDevice } from '@/lib/secure-examination-runtime';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const result = await enrollSecureClientDevice({
      enrollmentCode: body.enrollmentCode,
      label: body.label,
      platform: body.platform,
      publicKeyPem: body.publicKeyPem,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof SecureExaminationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Secure-client enrollment failed:', error);
    return NextResponse.json({ error: 'Unable to enroll secure-client device.' }, { status: 500 });
  }
}
