import { timingSafeEqual } from 'node:crypto';

import { NextResponse } from 'next/server';

import { processEmailQueue } from '@/lib/email-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorize(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET || process.env.EMAIL_QUEUE_CRON_SECRET;
  if (!cronSecret) return false;

  const header = request.headers.get('x-cron-secret');
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const provided = header ?? bearer ?? '';
  if (!provided) return false;

  const left = Buffer.from(provided);
  const right = Buffer.from(cronSecret);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processEmailQueue();
    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Email queue cron processing failed:', error);
    return NextResponse.json({ error: 'Email queue processing failed.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
