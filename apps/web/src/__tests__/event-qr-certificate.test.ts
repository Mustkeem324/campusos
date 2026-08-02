import { describe, it, expect } from 'vitest';
import { processEventQRCheckIn } from '../lib/gamification-service';

describe('Phase 16 Event QR Check-In Participation Certificate Test Suite', () => {
  it('should issue event participation certificate with unique hash upon QR check-in', () => {
    const rec = processEventQRCheckIn('e1', 'Hackathon 2026', 's1', 'Alex Vance');

    expect(rec.eventId).toBe('e1');
    expect(rec.studentName).toBe('Alex Vance');
    expect(rec.certificateHash).toContain('EVENT-CERT-');
  });
});
