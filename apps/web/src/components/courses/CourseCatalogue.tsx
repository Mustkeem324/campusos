'use client';

import React, { useState } from 'react';
import { BookOpen, Grid, CheckCircle2, FileText, ChevronRight } from 'lucide-react';
import { DEMO_COURSES, CourseDetail } from '../../lib/academic-service';

export function CourseCatalogue() {
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail>(DEMO_COURSES[0]);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-500" />
            <span>Institutional Course Catalogue & CO-PO Attainment Matrix</span>
          </h2>
          <p className="text-xs text-gray-500">
            L-T-P Credit structure, prerequisites, syllabus units, and outcome attainment matrices
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Course List */}
        <div className="space-y-2 border-r border-gray-200 dark:border-gray-800 pr-4">
          <h3 className="text-xs uppercase font-bold text-gray-400 mb-2">Available Courses</h3>
          {DEMO_COURSES.map((crs) => (
            <button
              key={crs.id}
              onClick={() => setSelectedCourse(crs)}
              className={`w-full text-left p-3 rounded-xl transition border ${
                selectedCourse.id === crs.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs">{crs.code}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20">
                  {crs.type}
                </span>
              </div>
              <h4 className="text-xs font-semibold mt-1 truncate">{crs.title}</h4>
              <p className="text-[10px] opacity-80 mt-0.5">
                Credits: L{crs.lectureCredits}-T{crs.tutorialCredits}-P{crs.practicalCredits} ({crs.totalCredits} Total)
              </p>
            </button>
          ))}
        </div>

        {/* Right Column: Course Detail & CO-PO Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-extrabold text-indigo-500">{selectedCourse.code}</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                Prerequisite(s): {selectedCourse.prerequisiteCodes.join(', ') || 'None'}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedCourse.title}</h3>
          </div>

          {/* CO-PO Attainment Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-gray-400 flex items-center gap-1.5">
              <Grid size={16} className="text-indigo-500" />
              <span>Course Outcome (CO) to Program Outcome (PO) Attainment Matrix</span>
            </h4>

            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
                  <tr>
                    <th className="p-3">Course Outcome</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Target Attainment</th>
                    <th className="p-3">PO Correlation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {selectedCourse.outcomes.map((co) => (
                    <tr key={co.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3 font-bold text-indigo-500">{co.code}</td>
                      <td className="p-3">{co.description}</td>
                      <td className="p-3 font-mono font-bold text-emerald-500">{co.targetAttainmentPct}% Target</td>
                      <td className="p-3 font-mono font-bold">
                        {selectedCourse.coPoMatrix
                          .filter((m) => m.coId === co.id)
                          .map((m) => `PO1 (${m.weight === 3 ? 'High' : 'Med'})`)
                          .join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
