import { describe, it, expect } from 'vitest';
import { calculateFacultyHIndex } from '../lib/research-service';

describe('Phase 12 Automated Faculty h-Index Calculator Test Suite', () => {
  it('should accurately compute h-index and i10-index from citation array', () => {
    // Citations: [42, 18, 12, 8] -> 3 papers have at least 3 citations, 4th paper has 8 (>=4) -> h-index = 4!
    const citations = [42, 18, 12, 8];

    const metrics = calculateFacultyHIndex(citations);

    expect(metrics.hIndex).toBe(4);
    expect(metrics.i10Index).toBe(3); // 42, 18, 12 are >= 10
  });

  it('should return h-index 0 when no citations exist', () => {
    const metrics = calculateFacultyHIndex([0, 0, 0]);
    expect(metrics.hIndex).toBe(0);
    expect(metrics.i10Index).toBe(0);
  });
});
