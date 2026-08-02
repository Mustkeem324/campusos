export interface StudentGamificationProfile {
  studentId: string;
  studentName: string;
  xpPoints: number;
  level: number;
  attendanceStreakDays: number;
  badges: { badgeId: string; title: string; awardedAt: Date }[];
}

export interface EventCheckInRecord {
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentName: string;
  checkInTimestamp: Date;
  certificateHash?: string;
}

// 1. Evaluate Gamification Badges & 14-Day Attendance Streak (Phase 16 Exit Criteria 1)
export function evaluateGamificationBadges(profile: StudentGamificationProfile): {
  newBadgesAwarded: string[];
  updatedXp: number;
  updatedLevel: number;
} {
  const newBadgesAwarded: string[] = [];

  // Streak Rule: 14 Consecutive Attendance Days
  if (profile.attendanceStreakDays >= 14) {
    const hasBadge = profile.badges.some((b) => b.badgeId === 'badge_streak_14');
    if (!hasBadge) {
      profile.badges.push({
        badgeId: 'badge_streak_14',
        title: '14-Day Perfect Attendance Streak',
        awardedAt: new Date(),
      });
      newBadgesAwarded.push('14-Day Perfect Attendance Streak');
      profile.xpPoints += 250; // +250 XP bonus!
    }
  }

  // Level Progression Math (1 Level per 500 XP)
  profile.level = Math.floor(profile.xpPoints / 500) + 1;

  return {
    newBadgesAwarded,
    updatedXp: profile.xpPoints,
    updatedLevel: profile.level,
  };
}

// 2. QR Check-In Event Participation Certificate Generator (Phase 16 Exit Criteria 2)
export function processEventQRCheckIn(
  eventId: string,
  eventTitle: string,
  studentId: string,
  studentName: string
): EventCheckInRecord {
  const certificateHash = `EVENT-CERT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  return {
    eventId,
    eventTitle,
    studentId,
    studentName,
    checkInTimestamp: new Date(),
    certificateHash,
  };
}
