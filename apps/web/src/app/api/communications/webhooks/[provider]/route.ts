import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

import { CommunicationError, processProviderDelivery } from '@/lib/communications';
import {
  normalizeProviderEvent,
  verifyGenericCommunicationWebhook,
  verifyMetaWebhook,
  verifyTwilioWebhook,
} from '@/lib/communications-webhooks';

export const dynamic = 'force-dynamic';
const MAX_BODY_BYTES = 512_000;

type Context = { params: Promise<{ provider: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { provider: providerParam } = await context.params;
    const provider = providerParam.toLowerCase();
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) throw new CommunicationError('Webhook body is too large.', 413, 'PAYLOAD_TOO_LARGE');
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new CommunicationError('Webhook body is too large.', 413, 'PAYLOAD_TOO_LARGE');

    let payload: Record<string, unknown> = {};
    let signatureValid = false;
    if (provider === 'twilio') {
      const params = new URLSearchParams(raw);
      payload = Object.fromEntries(params.entries());
      const publicUrl = process.env.NAVEMORA_COMMUNICATION_STATUS_CALLBACK_URL || request.url;
      signatureValid = verifyTwilioWebhook(publicUrl, params, request.headers.get('x-twilio-signature'));
    } else {
      payload = raw ? JSON.parse(raw) as Record<string, unknown> : {};
      if (provider === 'meta' || provider === 'meta-whatsapp' || provider === 'whatsapp') {
        signatureValid = verifyMetaWebhook(raw, request.headers.get('x-hub-signature-256'));
      } else {
        signatureValid = verifyGenericCommunicationWebhook(raw, request.headers.get('x-navemora-signature'));
      }
    }
    if (!signatureValid) throw new CommunicationError('Provider webhook signature is invalid.', 401, 'INVALID_WEBHOOK_SIGNATURE');

    const event = normalizeProviderEvent(provider, payload);
    if (!event.providerEventId || !event.providerReference) throw new CommunicationError('Webhook does not contain a provider message reference.', 400, 'INVALID_PROVIDER_EVENT');
    const result = await processProviderDelivery({
      providerKey: provider === 'meta' || provider === 'whatsapp' ? 'META_WHATSAPP' : provider.toUpperCase(),
      providerEventId: event.providerEventId.slice(0, 250),
      providerReference: event.providerReference.slice(0, 250),
      status: event.status,
      occurredAt: event.occurredAt,
      payloadHash: crypto.createHash('sha256').update(raw).digest('hex'),
      signatureValid: true,
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof CommunicationError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Webhook body is invalid.', code: 'INVALID_JSON' }, { status: 400 });
    console.error('Communication provider webhook failed:', error);
    return NextResponse.json({ error: 'Provider webhook processing is unavailable.' }, { status: 503 });
  }
}

export async function GET(request: Request, context: Context) {
  const { provider } = await context.params;
  if (!['meta', 'meta-whatsapp', 'whatsapp'].includes(provider.toLowerCase())) return new NextResponse(null, { status: 405 });
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const configured = process.env.NAVEMORA_WHATSAPP_VERIFY_TOKEN || '';
  if (mode === 'subscribe' && configured && token === configured && challenge) return new NextResponse(challenge, { status: 200 });
  return new NextResponse(null, { status: 403 });
}
