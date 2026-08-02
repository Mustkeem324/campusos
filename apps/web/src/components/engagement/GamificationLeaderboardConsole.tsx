'use client';

import React, { useState } from 'react';
import { Award, Zap, Sparkles, CheckCircle2, Flame, Trophy } from 'lucide-react';
import { evaluateGamificationBadges, StudentGamificationProfile } from '../../lib/gamification-service';

export function GamificationLeaderboardConsole() {
  const [profile, setProfile] = useState<StudentGamificationProfile>({
    studentId: 'usr_student_01',
    studentName: 'Alex Vance',
    xpPoints: 1250,
    level: 3,
    attendanceStreakDays: 14, // 14-day streak!
    badges: [],
  });

  const [awardedBadgeMsg, setAwardedBadgeMsg] = useState<string | null>(null);

  const handleClaimStreakBadge = () => {
    const res = evaluateGamificationBadges(profile);
    setProfile({ ...profile });
    if (res.newBadgesAwarded.length > 0) {
      setAwardedBadgeMsg(`CONGRATULATIONS! Awarded Badge: "${res.newBadgesAwarded[0]}" (+250 XP Bonus)`);
    } else {
      setAwardedBadgeMsg('Badge already claimed!');
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy size={20} className="text-amber-500" />
            <span>Student Gamification, Attendance Streaks & Leaderboard Hub</span>
          </h2>
          <p className="text-xs text-gray-500">
            XP level progression • 14-day attendance streak counter • Opt-in achievement wall
          </p>
        </div>

        <button
          onClick={handleClaimStreakBadge}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-lg transition"
        >
          <Flame size={14} />
          <span>Claim 14-Day Streak Badge</span>
        </button>
      </div>

      {/* XP & Level Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900 dark:text-amber-200">
          <span className="text-[10px] uppercase font-bold">Attendance Streak</span>
          <h3 className="text-2xl font-extrabold flex items-center gap-1 mt-1">
            <Flame size={24} className="text-amber-500 fill-amber-500" />
            <span>{profile.attendanceStreakDays} Days Streak</span>
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-indigo-900 dark:text-indigo-200">
          <span className="text-[10px] uppercase font-bold">Total XP Points</span>
          <h3 className="text-2xl font-extrabold mt-1">{profile.xpPoints.toLocaleString()} XP</h3>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900 dark:text-emerald-200">
          <span className="text-[10px] uppercase font-bold">Campus Scholar Level</span>
          <h3 className="text-2xl font-extrabold mt-1">Level {profile.level}</h3>
        </div>
      </div>

      {awardedBadgeMsg && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 text-amber-900 dark:text-amber-200 text-xs font-bold font-mono animate-fade-in flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{awardedBadgeMsg}</span>
        </div>
      )}

      {/* Badges Collection */}
      <div className="space-y-2">
        <h4 className="text-xs uppercase font-bold text-gray-400">Awarded Badges</h4>
        <div className="flex gap-2">
          {profile.badges.map((b) => (
            <span key={b.badgeId} className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 font-bold text-xs border border-amber-300">
              🏅 {b.title}
            </span>
          ))}
          {profile.badges.length === 0 && <span className="text-xs text-gray-400 italic">No badges claimed yet. Click button above!</span>}
        </div>
      </div>
    </div>
  );
}
