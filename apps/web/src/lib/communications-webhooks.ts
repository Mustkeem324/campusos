import 'server-only';

import crypto from 'node:crypto';

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyGenericCommunicationWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.NAVEMORA_COMMUNICATION_WEBHOOK_SECRET || '';
  if (secret.length < 32 || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature.replace(/^sha256=/i, ''));
}

export function verifyMetaWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.NAVEMORA_WHATSAPP_APP_SECRET || '';
  if (secret.length < 16 || !signature) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  return safeEqual(expected, signature);
}

export function verifyTwilioWebhook(url: string, params: URLSearchParams, signature: string | null) {
  const token = process.env.NAVEMORA_TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN || '';
  if (!token || !signature) return false;
  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  let payload = url;
  for (const [key, value] of entries) payload += `${key}${value}`;
  const expected = crypto.createHmac('sha1', token).update(payload).digest('base64');
  return safeEqual(expected, signature);
}

export function normalizeProviderEvent(provider: string, payload: Record<string, unknown>) {
  const key = provider.toLowerCase();
  if (key === 'twilio') {
    return {
      providerEventId: String(payload.MessageSid || payload.SmsSid || payload.Sid || ''),
      providerReference: String(payload.MessageSid || payload.SmsSid || ''),
      status: String(payload.MessageStatus || payload.SmsStatus || 'UNKNOWN'),
      occurredAt: new Date().toISOString(),
    };
  }
  if (key === 'meta' || key === 'meta-whatsapp' || key === 'whatsapp') {
    const entry = Array.isArray(payload.entry) ? payload.entry[0] as Record<string, unknown> | undefined : undefined;
    const changes = entry && Array.isArray(entry.changes) ? entry.changes[0] as Record<string, unknown> | undefined : undefined;
    const value = changes?.value && typeof changes.value === 'object' ? changes.value as Record<string, unknown> : {};
    const statuses = Array.isArray(value.statuses) ? value.statuses : [];
    const status = statuses[0] && typeof statuses[0] === 'object' ? statuses[0] as Record<string, unknown> : {};
    return {
      providerEventId: `${String(status.id || '')}:${String(status.status || 'UNKNOWN')}:${String(status.timestamp || '')}`,
      providerReference: String(status.id || ''),
      status: String(status.status || 'UNKNOWN'),
      occurredAt: status.timestamp ? new Date(Number(status.timestamp) * 1000).toISOString() : new Date().toISOString(),
    };
  }
  return {
    providerEventId: String(payload.eventId || payload.id || ''),
    providerReference: String(payload.providerReference || payload.messageId || payload.message_id || ''),
    status: String(payload.status || 'UNKNOWN'),
    occurredAt: payload.occurredAt ? String(payload.occurredAt) : new Date().toISOString(),
  };
}
