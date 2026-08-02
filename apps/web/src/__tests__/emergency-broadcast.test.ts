import { describe, it, expect } from 'vitest';
import { triggerEmergencyCampusBroadcast } from '../lib/notification-engine';

describe('Phase 10 Emergency Panic Button Campus Broadcast Test Suite', () => {
  it('should dispatch emergency alert simultaneously across all 4 channels', () => {
    const logs = triggerEmergencyCampusBroadcast('PANIC ALERT', 'Severe weather warning');

    expect(logs.length).toBe(4);

    const channels = logs.map((l) => l.channel);
    expect(channels).toContain('WHATSAPP');
    expect(channels).toContain('SMS');
    expect(channels).toContain('EMAIL');
    expect(channels).toContain('PUSH');

    expect(logs.every((l) => l.status === 'DELIVERED')).toBe(true);
  });
});
