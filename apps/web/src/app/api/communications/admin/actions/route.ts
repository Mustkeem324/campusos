import { NextResponse } from 'next/server';

import {
  activateCommunicationTemplate,
  approveCommunicationCampaign,
  CommunicationError,
  configureCommunicationChannel,
  createCommunicationCampaign,
  previewCommunicationTemplate,
} from '@/lib/communications';
import {
  configureProviderMetadata,
  createCommunicationTemplateVersion,
} from '@/lib/communications-admin';
import {
  dispatchCommunicationCampaign,
  estimateCommunicationCampaign,
} from '@/lib/communications-campaigns';

export const dynamic = 'force-dynamic';
const MAX_BODY_BYTES = 300_000;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) throw new CommunicationError('Request is too large.', 413, 'PAYLOAD_TOO_LARGE');
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action || '');
    let result: unknown;

    switch (action) {
      case 'configure_channel':
        result = await configureCommunicationChannel({
          channel: String(body.channel || ''),
          enabled: body.enabled === true,
          providerKey: body.providerKey ? String(body.providerKey) : null,
          providerMode: String(body.providerMode || 'PLATFORM_MANAGED') as 'PLATFORM_MANAGED' | 'INSTITUTION_MANAGED',
          regulatoryConfig: body.regulatoryConfig && typeof body.regulatoryConfig === 'object' && !Array.isArray(body.regulatoryConfig) ? body.regulatoryConfig as Record<string, unknown> : {},
          rateLimitPerMinute: body.rateLimitPerMinute === null || body.rateLimitPerMinute === undefined ? null : Number(body.rateLimitPerMinute),
          dailyLimit: body.dailyLimit === null || body.dailyLimit === undefined ? null : Number(body.dailyLimit),
        });
        break;
      case 'configure_provider':
        result = await configureProviderMetadata({
          channel: String(body.channel || '') as 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH',
          providerKey: String(body.providerKey || ''),
          displayName: String(body.displayName || body.providerKey || ''),
          providerMode: String(body.providerMode || 'INSTITUTION_MANAGED') as 'PLATFORM_MANAGED' | 'INSTITUTION_MANAGED',
          secretRef: body.secretRef ? String(body.secretRef) : null,
          config: body.config && typeof body.config === 'object' && !Array.isArray(body.config) ? body.config as Record<string, unknown> : {},
          status: String(body.status || 'MISCONFIGURED') as 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE' | 'MISCONFIGURED',
        });
        break;
      case 'create_template':
        result = await createCommunicationTemplateVersion({
          templateKey: String(body.templateKey || ''),
          channel: String(body.channel || ''),
          category: String(body.category || ''),
          classification: String(body.classification || 'PERSONAL'),
          locale: body.locale ? String(body.locale) : 'en-IN',
          subject: body.subject ? String(body.subject) : null,
          preheader: body.preheader ? String(body.preheader) : null,
          html: body.html ? String(body.html) : null,
          text: String(body.text || ''),
          variablesSchema: body.variablesSchema && typeof body.variablesSchema === 'object' && !Array.isArray(body.variablesSchema) ? body.variablesSchema as Record<string, unknown> : {},
          providerTemplateName: body.providerTemplateName ? String(body.providerTemplateName) : null,
        });
        break;
      case 'activate_template':
        result = await activateCommunicationTemplate(String(body.versionId || ''));
        break;
      case 'preview_template':
        result = await previewCommunicationTemplate({
          key: String(body.key || 'platform_maintenance'),
          variables: body.variables && typeof body.variables === 'object' && !Array.isArray(body.variables) ? body.variables as Record<string, unknown> : {},
        });
        break;
      case 'create_campaign':
        result = await createCommunicationCampaign({
          name: String(body.name || ''),
          category: String(body.category || ''),
          classification: body.classification ? String(body.classification) : 'INTERNAL',
          channels: Array.isArray(body.channels) ? body.channels.map(String) : [],
          audience: body.audience && typeof body.audience === 'object' && !Array.isArray(body.audience) ? body.audience as { type: string; scopeId?: string | null } : { type: '' },
          subject: String(body.subject || ''),
          body: String(body.body || ''),
          scheduledAt: body.scheduledAt ? String(body.scheduledAt) : null,
        });
        break;
      case 'approve_campaign':
        result = await approveCommunicationCampaign(
          String(body.campaignId || ''),
          String(body.decision || '') as 'APPROVED' | 'REJECTED',
          body.reason ? String(body.reason) : undefined,
        );
        break;
      case 'estimate_campaign':
        result = await estimateCommunicationCampaign(String(body.campaignId || ''));
        break;
      case 'dispatch_campaign':
        result = await dispatchCommunicationCampaign(String(body.campaignId || ''));
        break;
      default:
        throw new CommunicationError('Unsupported communications administration action.', 400, 'UNSUPPORTED_ACTION');
    }
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof CommunicationError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Communications administration action failed:', error);
    return NextResponse.json({ error: 'Communication administration action failed.', code: 'COMMUNICATION_ADMIN_FAILED' }, { status: 500 });
  }
}
