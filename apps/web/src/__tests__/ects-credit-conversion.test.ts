import { describe, it, expect } from 'vitest';
import { convertECTSToUSCredits } from '../lib/multicampus-service';

describe('Phase 17 International ECTS to US Credit Conversion Test Suite', () => {
  it('should convert 6 ECTS credits to 3 US semester credits accurately', () => {
    const usCredits = convertECTSToUSCredits(6);
    expect(usCredits).toBe(3.0);
  });
});
