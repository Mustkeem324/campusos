import { describe, expect, it } from 'vitest';

import {
  calculateSmsSegments,
  escapeHtml,
  renderBaseTemplate,
  renderText,
  safePortalUrl,
} from './communications-templates';
import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_EVENT_TYPES,
  EVENT_POLICIES,
} from './communications-types';

const institution = { name: 'Nexus Institute', logoUrl: null, primaryColor: '#164A9C' };

describe('NAVEMORA communication policy', () => {
  it('keeps the supported channels canonical', () => {
    expect(COMMUNICATION_CHANNELS).toEqual(['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP', 'PUSH']);
  });

  it('contains cross-platform event coverage', () => {
    for (const event of [
      'ATTENDANCE_SHORTAGE_WARNING',
      'RESULT_PUBLISHED',
      'PAYMENT_CONFIRMED',
      'HOSTEL_OUTPASS_APPROVED',
      'TRANSPORT_BUS_DELAYED',
      'LIBRARY_DUE_REMINDER',
      'RESEARCH_MILESTONE_DUE',
      'HELPDESK_CASE_UPDATED',
      'PAYSLIP_AVAILABLE',
      'EMERGENCY_ALERT',
    ]) expect(COMMUNICATION_EVENT_TYPES).toContain(event);
  });

  it('never places highly confidential HR payloads on SMS/WhatsApp by default', () => {
    expect(EVENT_POLICIES.PAYSLIP_AVAILABLE.classification).toBe('CONFIDENTIAL');
    expect(EVENT_POLICIES.PAYSLIP_AVAILABLE.defaultChannels).toEqual(['IN_APP', 'EMAIL']);
  });

  it('routes attendance warnings to guardians without hardcoding an institution threshold', () => {
    const policy = EVENT_POLICIES.ATTENDANCE_SHORTAGE_WARNING;
    expect(policy.guardian).toBe(true);
    expect(policy.defaultChannels).toContain('EMAIL');
    expect(policy.defaultChannels).toContain('SMS');
  });

  it('requires emergency delivery policy rather than user optional preference', () => {
    expect(EVENT_POLICIES.EMERGENCY_ALERT.mandatory).toBe(true);
    expect(EVENT_POLICIES.EMERGENCY_ALERT.defaultChannels).toEqual(['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP']);
  });
});

describe('template safety', () => {
  it('escapes untrusted HTML values', () => {
    expect(escapeHtml('<script>alert("x")</script>')).not.toContain('<script>');
  });

  it('renders dotted variables', () => {
    expect(renderText('Hello {{student.name}}', { student: { name: 'Aarav' } })).toBe('Hello Aarav');
  });

  it('does not allow an external CTA origin', () => {
    const safe = safePortalUrl('https://evil.example/phish', 'https://navemora.example');
    expect(new URL(safe).origin).toBe('https://navemora.example');
  });

  it('renders both HTML and plain text from an operational template', () => {
    const result = renderBaseTemplate({
      key: 'attendance_warning',
      institution,
      variables: {
        student: { name: '<Aarav>' },
        course: { title: 'Operations' },
        attendance: { percentage: 72, requiredPercentage: 75 },
      },
    });
    expect(result.text).toContain('72%');
    expect(result.text).toContain('75%');
    expect(result.html).toContain('&lt;Aarav&gt;');
    expect(result.html).not.toContain('<Aarav>');
  });
});

describe('SMS billing segmentation', () => {
  it('uses one GSM segment for a normal short message', () => {
    expect(calculateSmsSegments('NAVEMORA: Exam tomorrow at 10:00 AM.')).toMatchObject({ encoding: 'GSM-7', segments: 1 });
  });

  it('uses UCS-2 for Hindi/Unicode content', () => {
    expect(calculateSmsSegments('आपकी परीक्षा कल है')).toMatchObject({ encoding: 'UCS-2', segments: 1 });
  });

  it('counts concatenated SMS units', () => {
    expect(calculateSmsSegments('A'.repeat(161)).segments).toBe(2);
  });
});
