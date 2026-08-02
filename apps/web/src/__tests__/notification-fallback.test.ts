import { describe, it, expect } from 'vitest';
import { dispatchOmnichannelNotification, isWithinQuietHours } from '../lib/notification-engine';

describe('Phase 10 Omnichannel Notification Fallback & Quiet Hours Test Suite', () => {
  it('should trigger SMS and Email fallback when WhatsApp delivery fails', () => {
    const payload = {
      recipientId: 'usr_101',
      recipientName: 'Alex',
      recipientPhone: '+15550199',
      recipientEmail: 'alex@apex.edu',
      title: 'Fee Dues',
      body: 'Reminder: Term 2 fee due tomorrow',
      category: 'FEES' as const,
    };

    // Daytime timestamp (14:00) outside quiet hours
    const daytime = new Date('2026-02-02T14:00:00');

    // Simulate WhatsApp Failure
    const res = dispatchOmnichannelNotification(payload, true, daytime);

    expect(res.finalStatus).toBe('SUCCESS');
    expect(res.auditLog.length).toBe(3);

    // Verify WhatsApp failed -> SMS fallback triggered -> Email delivered
    expect(res.auditLog[0].channel).toBe('WHATSAPP');
    expect(res.auditLog[0].status).toBe('FAILED');

    expect(res.auditLog[1].channel).toBe('SMS');
    expect(res.auditLog[1].status).toBe('FALLBACK_TRIGGERED');

    expect(res.auditLog[2].channel).toBe('EMAIL');
    expect(res.auditLog[2].status).toBe('DELIVERED');
  });

  it('should delay non-emergency notification during quiet hours (23:00 local time)', () => {
    const payload = {
      recipientId: 'usr_101',
      recipientName: 'Alex',
      recipientPhone: '+15550199',
      recipientEmail: 'alex@apex.edu',
      title: 'Event Notice',
      body: 'Cultural Fest tomorrow',
      category: 'EVENTS' as any,
    };

    const quietTime = new Date('2026-02-02T23:00:00');
    const res = dispatchOmnichannelNotification(payload, false, quietTime);

    expect(res.finalStatus).toBe('DELAYED_QUIET_HOURS');
    expect(res.auditLog[0].failureReason).toContain('Quiet Hours policy');
  });
});
