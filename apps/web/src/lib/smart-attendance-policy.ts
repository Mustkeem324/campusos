import type { AttendanceSettings, AttendanceStudyMode } from './smart-attendance-types';

export function selfCheckInMode(
  studyMode: AttendanceStudyMode | 'UNCLASSIFIED',
  settings: Pick<AttendanceSettings, 'allowOfflineSelfCheckIn' | 'allowHybridDailyCheckIn'>,
): 'CLASS' | 'DAY' | 'NONE' {
  if (studyMode === 'ONLINE') return 'CLASS';
  if (studyMode === 'OFFLINE') return settings.allowOfflineSelfCheckIn ? 'DAY' : 'NONE';
  if (studyMode === 'HYBRID') return settings.allowHybridDailyCheckIn ? 'DAY' : 'CLASS';
  return 'NONE';
}

export function attendancePercentage(present: number, late: number, held: number) {
  if (held <= 0) return 100;
  return ((present + late) / held) * 100;
}

export function classesNeededForTarget(attended: number, held: number, requiredPercentage: number) {
  if (held <= 0) return 0;
  const target = requiredPercentage / 100;
  if (target >= 1) return attended >= held ? 0 : Number.POSITIVE_INFINITY;
  const current = attended / held;
  if (current >= target) return 0;
  return Math.max(0, Math.ceil((target * held - attended) / (1 - target)));
}

export function isAttendanceDay(dayType?: string | null) {
  return !dayType || dayType === 'WORKING' || dayType === 'SPECIAL_WORKING';
}

export function timetableDayMatches(dayOfWeek: number, jsDay: number) {
  // Existing tenants may store JS-style 0..6 or ISO-style 1..7 values.
  if (dayOfWeek === jsDay) return true;
  const isoDay = jsDay === 0 ? 7 : jsDay;
  return dayOfWeek === isoDay;
}

export function minutesFromClock(clock: string) {
  const [hours, minutes] = clock.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function isWithinCheckInWindow(
  nowMinutes: number,
  startTime: string,
  earlyMinutes: number,
  lateMinutes: number,
) {
  const start = minutesFromClock(startTime);
  return nowMinutes >= start - earlyMinutes && nowMinutes <= start + lateMinutes;
}
