import { NextResponse } from 'next/server';

import { SecureExaminationError } from '@/lib/secure-examination';
import {
  createSecureClientChallenge,
  createSecureClientEnrollment,
  getRuntimeAdministration,
  issueExamMediaGrant,
  updateExamMediaState,
  upsertExamRuntimePolicy,
} from '@/lib/secure-examination-runtime';

export const dynamic = 'force-dynamic';

function errorResponse(error: unknown) {
  if (error instanceof SecureExaminationError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error('Secure examination runtime action failed:', error);
  return NextResponse.json({ error: 'Unable to complete secure examination runtime action.' }, { status: 500 });
}

export async function GET() {
  try {
    const data = await getRuntimeAdministration();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action || '');
    if (action === 'media_grant') {
      return NextResponse.json(await issueExamMediaGrant({
        attemptId: String(body.attemptId || ''),
        streamKind: String(body.streamKind || ''),
        permission: String(body.permission || ''),
      }));
    }
    if (action === 'media_state') {
      return NextResponse.json(await updateExamMediaState({
        attemptId: String(body.attemptId || ''),
        streamKind: String(body.streamKind || ''),
        state: String(body.state || ''),
        error: body.error ? String(body.error) : null,
      }));
    }
    if (action === 'secure_client_challenge') {
      return NextResponse.json(await createSecureClientChallenge(String(body.attemptId || '')));
    }
    if (action === 'create_client_enrollment') {
      return NextResponse.json(await createSecureClientEnrollment({
        label: body.label ? String(body.label) : undefined,
        expiresMinutes: Number(body.expiresMinutes ?? 60),
        maxUses: Number(body.maxUses ?? 1),
      }));
    }
    if (action === 'runtime_policy') {
      return NextResponse.json(await upsertExamRuntimePolicy({
        configId: String(body.configId || ''),
        primaryStreamRequired: body.primaryStreamRequired !== false,
        secondaryStreamRequired: body.secondaryStreamRequired === true,
        screenStreamRequired: body.screenStreamRequired === true,
        aiVisionEnabled: body.aiVisionEnabled === true,
        secureClientRequired: body.secureClientRequired === true,
        secureClientPolicyVersion: String(body.secureClientPolicyVersion || '1'),
        sampleIntervalSeconds: Number(body.sampleIntervalSeconds ?? 15),
        maxProctorReaders: Number(body.maxProctorReaders ?? 20),
      }));
    }
    return NextResponse.json({ error: 'Unsupported runtime action.' }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
