import { describe, expect, it } from 'vitest';

import { estimateEtaMinutes, haversineDistanceMeters } from './transport-gps-phase2-math';

describe('Transport GPS Phase 2 ETA engine', () => {
  it('computes realistic great-circle distance', () => {
    const meters = haversineDistanceMeters(26.8467, 80.9462, 26.8567, 80.9462);
    expect(meters).toBeGreaterThan(1_050);
    expect(meters).toBeLessThan(1_180);
  });

  it('uses live speed when credible and fallback speed otherwise', () => {
    const liveEta = estimateEtaMinutes(5_000, 50, 25);
    const fallbackEta = estimateEtaMinutes(5_000, 0, 25);
    expect(liveEta).toBeLessThan(fallbackEta);
    expect(liveEta).toBeGreaterThan(0);
    expect(fallbackEta).toBeLessThanOrEqual(180);
  });

  it('bounds invalidly optimistic or extreme estimates', () => {
    expect(estimateEtaMinutes(0, 40, 25)).toBe(0);
    expect(estimateEtaMinutes(1, 250, 25)).toBe(1);
    expect(estimateEtaMinutes(1_000_000, 5, 25)).toBe(180);
  });
});
