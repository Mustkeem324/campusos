'use client';

import React, { useState } from 'react';
import { BookOpen, CheckCircle2, AlertTriangle, Clock, ShieldCheck, FileText, Lock } from 'lucide-react';
import {
  OFFERING_SEATS,
  StudentRegistrationProfile,
  registerCourseOptimistic,
  RegistrationResult,
} from '../../lib/registration-engine';

export function RegistrationConsole() {
  const [studentProfile, setStudentProfile] = useState<StudentRegistrationProfile>({
    studentId: 'usr_student_01',
    tenantId: 'inst_apex_univ',
    cgpa: 3.84,
    completedCourseCodes: ['CS201', 'CS301', 'MA202'], // Prerequisites fulfilled for CS401 & CS405
    enrolledOfferingIds: [],
    totalEnrolledCredits: 0,
  });

  const [lastResult, setLastResult] = useState<RegistrationResult | null>(null);

  const handleRegister = (offeringId: string) => {
    const result = registerCourseOptimistic(studentProfile, offeringId);
    setLastResult(result);
    if (result.success) {
      setStudentProfile({ ...studentProfile });
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      {/* Registration Banner */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div>
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-indigo-200">
            Real-Time Course Registration Engine
          </span>
          <h2 className="text-lg font-extrabold mt-0.5">Term 2026-2 Course Registration Console</h2>
          <p className="text-xs text-indigo-100 mt-1">
            Optimistic concurrency locking enabled • Prevents overbooking under high traffic load
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs font-mono font-bold bg-white/20 px-3 py-1.5 rounded-lg">
            <Clock size={14} />
            <span>Window Closes: 02d : 14h : 22m</span>
          </div>
          <p className="text-[10px] text-indigo-200 mt-1">
            Credits Enrolled: <span className="font-extrabold text-white">{studentProfile.totalEnrolledCredits}</span> / 26 Max
          </p>
        </div>
      </div>

      {/* Result Alert Banner */}
      {lastResult && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-fade-in ${
            lastResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {lastResult.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span className="font-bold">{lastResult.message}</span>
          </div>

          {lastResult.receiptNumber && (
            <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-mono font-bold">
              {lastResult.receiptNumber}
            </span>
          )}
        </div>
      )}

      {/* Available Course Offerings Grid */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase font-bold text-gray-400">Term Offerings & Live Seat Counters</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(OFFERING_SEATS).map((seat) => {
            const isEnrolled = studentProfile.enrolledOfferingIds.includes(seat.offeringId);
            const isFull = seat.enrolledCount >= seat.capacity;

            return (
              <div
                key={seat.offeringId}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-xs text-indigo-500">{seat.courseCode}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                      {seat.credits} Credits
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-1">{seat.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Prereqs: {seat.prerequisites.join(', ') || 'None'}
                  </p>
                </div>

                {/* Seat Capacity Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Seat Counter:</span>
                    <span className={`font-mono font-bold ${isFull ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {seat.enrolledCount} / {seat.capacity} Seats
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(seat.enrolledCount / seat.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Enrollment Action Button */}
                <div>
                  {isEnrolled ? (
                    <button
                      disabled
                      className="w-full py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <CheckCircle2 size={14} /> Enrolled
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(seat.offeringId)}
                      disabled={isFull}
                      className={`w-full py-2 rounded-xl text-xs font-extrabold shadow transition ${
                        isFull
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isFull ? 'Section Full (Waitlist)' : 'Reserve Seat Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
