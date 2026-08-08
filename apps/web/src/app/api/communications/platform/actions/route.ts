import { NextResponse } from 'next/server';

import {
  activatePaidChannel,
  adjustCommunicationCredits,
  CommunicationError,
  createCommunicationPricing,
} from '@/lib/communications';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action || '');
    let result: unknown;
    switch (action) {
      case 'create_pricing':
        result = await createCommunicationPricing({
          planKey: String(body.planKey || ''),
          name: String(body.name || ''),
          currency: body.currency ? String(body.currency) : 'INR',
          monthlyBaseMinor: body.monthlyBaseMinor === undefined ? 0 : Number(body.monthlyBaseMinor),
          includedSmsUnits: body.includedSmsUnits === undefined ? 0 : Number(body.includedSmsUnits),
          includedWhatsappUnits: body.includedWhatsappUnits === undefined ? 0 : Number(body.includedWhatsappUnits),
          smsUnitCostMinor: body.smsUnitCostMinor === undefined ? 0 : Number(body.smsUnitCostMinor),
          whatsappUnitCostMinor: body.whatsappUnitCostMinor === undefined ? 0 : Number(body.whatsappUnitCostMinor),
          effectiveFrom: body.effectiveFrom ? String(body.effectiveFrom) : undefined,
        });
        break;
      case 'activate_channel':
        result = await activatePaidChannel({
          tenantId: body.tenantId ? String(body.tenantId) : undefined,
          channel: String(body.channel || '') as 'SMS' | 'WHATSAPP',
          pricingVersionId: body.pricingVersionId ? String(body.pricingVersionId) : null,
          billingMode: String(body.billingMode || 'PREPAID') as 'PREPAID' | 'POSTPAID' | 'INCLUDED' | 'CUSTOM',
          initialUnits: body.initialUnits === undefined ? 0 : Number(body.initialUnits),
        });
        break;
      case 'adjust_credits':
        result = await adjustCommunicationCredits({
          tenantId: body.tenantId ? String(body.tenantId) : undefined,
          channel: String(body.channel || '') as 'SMS' | 'WHATSAPP',
          units: Number(body.units || 0),
          reason: String(body.reason || ''),
        });
        break;
      default:
        throw new CommunicationError('Unsupported platform communication action.', 400, 'UNSUPPORTED_ACTION');
    }
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CommunicationError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Platform communication action failed:', error);
    return NextResponse.json({ error: 'Platform communication action failed.' }, { status: 500 });
  }
}
