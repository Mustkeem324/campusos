import { describe, it, expect } from 'vitest';
import { OutpassRequest, evaluateOutpassStatus } from '../lib/campus-life-service';

describe('Phase 6 Hostel Dual-Approval Outpass Test Suite', () => {
  it('should remain PENDING when only Parent has approved', () => {
    const req: OutpassRequest = {
      id: 'o1',
      studentId: 's1',
      studentName: 'Alex',
      destination: 'Home',
      departureDate: '2026-02-06',
      returnDate: '2026-02-08',
      parentApproved: true,
      wardenApproved: false,
      status: 'PENDING',
    };

    const status = evaluateOutpassStatus(req);
    expect(status).toBe('PENDING');
  });

  it('should approve outpass when BOTH Parent and Warden have approved', () => {
    const req: OutpassRequest = {
      id: 'o2',
      studentId: 's1',
      studentName: 'Alex',
      destination: 'Home',
      departureDate: '2026-02-06',
      returnDate: '2026-02-08',
      parentApproved: true,
      wardenApproved: true,
      status: 'PENDING',
    };

    const status = evaluateOutpassStatus(req);
    expect(status).toBe('APPROVED');
    expect(req.status).toBe('APPROVED');
  });
});
