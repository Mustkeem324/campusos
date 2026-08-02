'use client';

import React, { useState } from 'react';
import { Calendar, Cpu, Clock, CheckCircle2, AlertTriangle, Users, Building2 } from 'lucide-react';
import {
  PERIODS,
  DEMO_ROOMS,
  TimetableClassRequirement,
  solveTimetableCSP,
  ScheduledSlot,
  ClashConflict,
} from '../../lib/timetable-solver';

export function TimetableWorkspace() {
  const [activeView, setActiveView] = useState<'WEEK' | 'FACULTY_WORKLOAD' | 'ROOMS'>('WEEK');

  const sampleRequirements: TimetableClassRequirement[] = [
    { id: 'req_1', courseCode: 'CS401', courseTitle: 'Data Structures', facultyId: 'f1', facultyName: 'Prof. Alan Turing', batchSectionId: 'sec_A', roomTypeNeeded: 'COMPUTER_LAB', durationHours: 1 },
    { id: 'req_2', courseCode: 'CS405', courseTitle: 'Machine Learning', facultyId: 'f2', facultyName: 'Dr. Fei-Fei Li', batchSectionId: 'sec_B', roomTypeNeeded: 'LECTURE_HALL', durationHours: 1 },
    { id: 'req_3', courseCode: 'CS410', courseTitle: 'Distributed Systems', facultyId: 'f3', facultyName: 'Dr. Leslie Lamport', batchSectionId: 'sec_A', roomTypeNeeded: 'SEMINAR_ROOM', durationHours: 1 },
  ];

  const [solution, setSolution] = useState<{
    scheduledSlots: ScheduledSlot[];
    conflicts: ClashConflict[];
  } | null>(null);

  const handleGenerateTimetable = () => {
    const res = solveTimetableCSP(sampleRequirements, DEMO_ROOMS);
    setSolution(res);
  };

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} className="text-indigo-500" />
            <span>AI Constraint-Based Timetable Generator & Schedule Grid</span>
          </h2>
          <p className="text-xs text-gray-500">
            CSP Solver • Solves for zero room, faculty, or batch clashes with lunch break preservation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveView('WEEK')}
              className={`px-3 py-1 rounded-lg ${activeView === 'WEEK' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Week Grid
            </button>
            <button
              onClick={() => setActiveView('FACULTY_WORKLOAD')}
              className={`px-3 py-1 rounded-lg ${activeView === 'FACULTY_WORKLOAD' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Faculty Workload
            </button>
          </div>

          <button
            onClick={handleGenerateTimetable}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg transition"
          >
            <Cpu size={14} />
            <span>Run AI CSP Generator</span>
          </button>
        </div>
      </div>

      {solution && solution.conflicts.length === 0 && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>AI Generator solved 100% constraints cleanly with zero clashes!</span>
        </div>
      )}

      {/* Week Grid View */}
      {activeView === 'WEEK' && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-center border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="p-3 text-left border-r border-gray-200 dark:border-gray-700">Time / Period</th>
                {DAYS.map((d, idx) => (
                  <th key={idx} className="p-3 border-r border-gray-200 dark:border-gray-700 last:border-r-0">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {PERIODS.map((period) => (
                <tr key={period.periodIndex}>
                  <td className="p-3 font-mono font-bold text-left bg-gray-50/50 dark:bg-gray-800/20 border-r border-gray-200 dark:border-gray-700">
                    {period.startTime} - {period.endTime}
                    {period.isLunchBreak && <span className="block text-[9px] text-amber-500 font-bold">Lunch Break</span>}
                  </td>
                  {DAYS.map((d, dayIdx) => {
                    const dayNum = dayIdx + 1;
                    const slot = solution?.scheduledSlots.find(
                      (s) => s.dayOfWeek === dayNum && s.periodIndex === period.periodIndex
                    );

                    return (
                      <td key={dayIdx} className="p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0 h-16">
                        {slot ? (
                          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-left space-y-0.5">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{slot.courseCode}</span>
                            <span className="block text-[10px] font-semibold text-gray-800 dark:text-gray-200 truncate">{slot.facultyName}</span>
                            <span className="block text-[9px] font-mono text-gray-400">{slot.roomNumber}</span>
                          </div>
                        ) : period.isLunchBreak ? (
                          <span className="text-[10px] text-amber-500/60 font-bold italic">Lunch</span>
                        ) : (
                          <span className="text-[10px] text-gray-300 dark:text-gray-700">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Faculty Workload View */}
      {activeView === 'FACULTY_WORKLOAD' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-xs text-gray-900 dark:text-white">Prof. Alan Turing</h4>
            <p className="text-[11px] text-gray-500 mt-1">Allocated Hours: <span className="font-bold text-indigo-500">14 hrs/wk</span></p>
            <p className="text-[10px] text-emerald-500 font-bold mt-0.5">Workload Balance: Optimal</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-xs text-gray-900 dark:text-white">Dr. Fei-Fei Li</h4>
            <p className="text-[11px] text-gray-500 mt-1">Allocated Hours: <span className="font-bold text-indigo-500">12 hrs/wk</span></p>
            <p className="text-[10px] text-emerald-500 font-bold mt-0.5">Workload Balance: Optimal</p>
          </div>
        </div>
      )}
    </div>
  );
}
