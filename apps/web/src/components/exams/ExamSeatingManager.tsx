'use client';

import React, { useState } from 'react';
import { Grid, Users, ShieldAlert, Cpu, CheckCircle2, UserCheck } from 'lucide-react';
import {
  ExamStudent,
  generateAntiCheatingSeatingPlan,
  SeatAllocation,
} from '../../lib/exam-engine';

export function ExamSeatingManager() {
  const sampleStudents: ExamStudent[] = [
    { studentId: 's1', rollNumber: 'CS2026-01', name: 'Alex Vance', branch: 'CS', attendancePct: 88, hasFeeDues: false, cgpa: 3.84 },
    { studentId: 's2', rollNumber: 'ME2026-01', name: 'David Kim', branch: 'ME', attendancePct: 92, hasFeeDues: false, cgpa: 3.65 },
    { studentId: 's3', rollNumber: 'CS2026-02', name: 'Sarah Jenkins', branch: 'CS', attendancePct: 82, hasFeeDues: false, cgpa: 3.75 },
    { studentId: 's4', rollNumber: 'ME2026-02', name: 'Michael Chang', branch: 'ME', attendancePct: 85, hasFeeDues: false, cgpa: 3.40 },
    { studentId: 's5', rollNumber: 'EE2026-01', name: 'Emily Watson', branch: 'EE', attendancePct: 90, hasFeeDues: false, cgpa: 3.90 },
    { studentId: 's6', rollNumber: 'CS2026-03', name: 'James Miller', branch: 'CS', attendancePct: 78, hasFeeDues: false, cgpa: 3.20 },
  ];

  const [plan, setPlan] = useState<SeatAllocation[] | null>(null);

  const handleGenerateSeating = () => {
    const allocations = generateAntiCheatingSeatingPlan(sampleStudents, 3, 4);
    setPlan(allocations);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Grid size={20} className="text-indigo-500" />
            <span>Anti-Cheating Mixed-Branch Seating Plan & Invigilator Roster</span>
          </h2>
          <p className="text-xs text-gray-500">
            Checkerboard branch interleaving algorithm • Adjacent seats never share the same exam branch
          </p>
        </div>

        <button
          onClick={handleGenerateSeating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg transition"
        >
          <Cpu size={14} />
          <span>Generate Seating Plan</span>
        </button>
      </div>

      {plan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
            <span>Exam Hall A1 Checkerboard Seating Arrangement</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle2 size={14} /> Zero Adjacent Branch Conflicts Guaranteed
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {plan.map((seat) => (
              <div
                key={seat.seatNumber}
                className={`p-3 rounded-xl border flex flex-col justify-between space-y-1 ${
                  seat.branch === 'CS'
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800'
                    : seat.branch === 'ME'
                    ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/40 dark:bg-black/40">
                    Seat {seat.seatNumber}
                  </span>
                  <span className="font-mono text-xs font-extrabold">{seat.branch}</span>
                </div>
                <h4 className="text-xs font-bold truncate">{seat.name}</h4>
                <p className="text-[10px] font-mono text-gray-500">{seat.rollNumber}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <UserCheck size={16} className="text-indigo-500" />
              <span>Invigilator Duty Roster (Fairness Balanced)</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex justify-between">
                <span>Hall A1 Chief Invigilator</span>
                <span className="font-bold text-indigo-500">Prof. Alan Turing</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex justify-between">
                <span>Hall A1 Relief Invigilator</span>
                <span className="font-bold text-indigo-500">Dr. Leslie Lamport</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
