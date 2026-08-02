import { describe, it, expect } from 'vitest';
import { processExamResult } from '../lib/exam-engine';

describe('Phase 4 Result Processing & Moderation Grace Marks Test Suite', () => {
  it('should apply grace moderation for marginal failures (38/39 total score)', () => {
    // Internal = 12, EndTerm = 26 -> Total = 38 -> Grace +2 -> Final 40 (Pass Grade C)
    const result = processExamResult(12, 26, true);
    expect(result.totalScore).toBe(38);
    expect(result.graceMarks).toBe(2);
    expect(result.finalScore).toBe(40);
    expect(result.isPassed).toBe(true);
    expect(result.gradeLetter).toBe('C');
  });

  it('should assign Outstanding (O) grade for scores 90 and above', () => {
    const result = processExamResult(28, 64, true); // 28 + 64 = 92
    expect(result.finalScore).toBe(92);
    expect(result.gradeLetter).toBe('O');
    expect(result.gradePoints).toBe(10);
  });
});
