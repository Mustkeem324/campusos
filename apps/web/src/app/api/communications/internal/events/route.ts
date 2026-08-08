import { NextResponse } from 'next/server';

import {
  CommunicationError,
  publishCommunicationEvent,
  verifyInternalCommunicationSecret,
} from '@/lib/communications';
import { isCommunicationEventType } from '@/lib/communications-types';

export const dynamic = 'force-dynamic';
const MAX_BODY_BYTES = 250_000;

export async function POST(request: Request) {
  try {
    verifyInternalCommunicationSecret(request.headers.get('x-navemora-communications-secret'));
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      throw new CommunicationError('Communication event payload is too large.', 413, 'PAYLOAD_TOO_LARGE');
    }
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      throw new CommunicationError('Communication event payload is too large.', 413, 'PAYLOAD_TOO_LARGE');
    }
    const payload = JSON.parse(raw || '{}') as Record<string, unknown>;
    const eventType = String(payload.eventType || '');
    if (!isCommunicationEventType(eventType)) {
      throw new CommunicationError('Unsupported communication event.', 400, 'UNSUPPORTED_EVENT');
    }
    const tenantId = String(payload.tenantId || '');
    const subjectType = String(payload.subjectType || '').toUpperCase();
    const subjectId = String(payload.subjectId || '');
    const correlationId = String(payload.correlationId || '');
    const idempotencyKey = String(payload.idempotencyKey || '');
    const sourceModule = String(payload.sourceModule || '').slice(0, 80);
    if (!tenantId || !subjectType || !subjectId || !correlationId || !idempotencyKey || !sourceModule) {
      throw new CommunicationError('Trusted communication event identity is incomplete.', 400, 'INVALID_EVENT');
    }
    const result = await publishCommunicationEvent({
      eventType,
      tenantId,
      subjectType,
      subjectId,
      occurredAt: payload.occurredAt ? String(payload.occurredAt) : new Date().toISOString(),
      correlationId,
      idempotencyKey,
      sourceModule,
      data: payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
        ? payload.data as Record<string, unknown>
        : {},
    });
    return NextResponse.json(result, { status: 202, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof CommunicationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Communication event body must be valid JSON.', code: 'INVALID_JSON' }, { status: 400 });
    }
    console.error('Trusted communication event ingestion failed:', error);
    return NextResponse.json({ error: 'Communication event processing is unavailable.', code: 'COMMUNICATION_UNAVAILABLE' }, { status: 503 });
  }
}
