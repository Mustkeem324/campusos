import { NextResponse } from 'next/server';

import { SecureExaminationError } from '@/lib/secure-examination';
import { attestSecureClient } from '@/lib/secure-examination-runtime';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    return NextResponse.json(await attestSecureClient({
      challengeToken: body.challengeToken,
      nonce: body.nonce,
      deviceFingerprint: body.deviceFingerprint,
      signature: body.signature,
      policyVersion: body.policyVersion,
      clientVersion: body.clientVersion,
      appHash: body.appHash,
      kioskMode: body.kioskMode,
      extensionsDisabled: body.extensionsDisabled,
      devtoolsRestricted: body.devtoolsRestricted,
      posture: body.posture,
    }));
  } catch (error) {
    if (error instanceof SecureExaminationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Secure-client attestation failed:', error);
    return NextResponse.json({ error: 'Unable to verify secure-client attestation.' }, { status: 500 });
  }
}
