import { describe, it, expect } from 'vitest';
import { triggerMobileSOSGPSAlert } from '../lib/wellness-safety-service';

describe('Phase 15 Mobile SOS Panic Button Live GPS Broadcast Test Suite', () => {
  it('should trigger emergency alert with live lat/lng coordinates', () => {
    const alert = triggerMobileSOSGPSAlert('s1', 'Alex Vance', 12.9716, 77.5946);

    expect(alert.status).toBe('ACTIVE_EMERGENCY');
    expect(alert.lat).toBe(12.9716);
    expect(alert.lng).toBe(77.5946);
    expect(alert.alertId).toContain('SOS_GPS_');
  });
});
