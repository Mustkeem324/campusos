import { describe, it, expect } from 'vitest';
import { evaluateGamificationBadges, StudentGamificationProfile } from '../lib/gamification-service';

describe('Phase 16 Gamification 14-Day Attendance Streak Badge Test Suite', () => {
  it('should award 14-Day Perfect Attendance Streak Badge and bonus XP when streak hits 14 days', () => {
    const profile: StudentGamificationProfile = {
      studentId: 's1',
      studentName: 'Alex Vance',
      xpPoints: 1000,
      level: 3,
      attendanceStreakDays: 14, // Meets 14-day streak rule
      badges: [],
    };

    const res = evaluateGamificationBadges(profile);

    expect(res.newBadgesAwarded.length).toBe(1);
    expect(res.newBadgesAwarded[0]).toBe('14-Day Perfect Attendance Streak');
    expect(profile.xpPoints).toBe(1250); // 1000 + 250 bonus = 1250
    expect(profile.badges.length).toBe(1);
  });
});
