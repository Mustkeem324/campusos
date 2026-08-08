import { NextResponse } from 'next/server';

import { SecureExaminationError } from '@/lib/secure-examination';
import { authorizeMediaGateway } from '@/lib/secure-examination-runtime';
import { authorizeVisionWorkerMedia } from '@/lib/secure-examination-vision-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = body.token ?? body.password;
    if (typeof token === 'string' && process.env.NAVEMORA_EXAM_VISION_MEDIA_SECRET && token === process.env.NAVEMORA_EXAM_VISION_MEDIA_SECRET) {
      await authorizeVisionWorkerMedia({ token, action: body.action, path: body.path, protocol: body.protocol });
    } else {
      await authorizeMediaGateway({
        token: body.token,
        password: body.password,
        action: body.action,
        path: body.path,
        protocol: body.protocol,
      });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SecureExaminationError) {
      return NextResponse.json({ error: error.message }, { status: error.status === 401 ? 401 : 403 });
    }
    console.error('Media gateway authorization failed:', error);
    return NextResponse.json({ error: 'Media authorization unavailable.' }, { status: 503 });
  }
}