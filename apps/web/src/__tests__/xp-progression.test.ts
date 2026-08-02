import { describe, it, expect } from 'vitest';
import { evaluateGamificationBadges, StudentGamificationProfile } from '../lib/gamification-service';

describe('Phase 16 Gamification XP Level Progression Test Suite', () => {
  it('should advance student level based on accumulated XP (1 level per 500 XP)', () => {
    const profile: StudentGamificationProfile = {
      studentId: 's1',
      studentName: 'Alex',
      xpPoints: 1550, // Should evaluate to Level 4
      level: 1,
      attendanceStreakDays: 5,
      badges: [],
    };

    const res = evaluateGamificationBadges(profile);
    expect(res.updatedLevel).toBe(4);
  });
});
