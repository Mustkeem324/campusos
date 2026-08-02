'use client';

import React, { useState } from 'react';
import { Award, Users, CheckCircle2, UserCheck, ArrowRight } from 'lucide-react';
import { StudentRecord, AlumniRecord, convertStudentToAlumnus } from '../../lib/lifecycle-service';

export function AlumniNetworkConsole() {
  const [students] = useState<StudentRecord[]>([
    {
      id: 'stud_graduating_01',
      tenantId: 'inst_apex_univ',
      rollNumber: 'CS2026-01',
      name: 'Alex Vance',
      email: 'alex.vance@apex.edu',
      program: 'B.Tech CS',
      batchYear: 2026,
      cgpa: 3.84,
      backlogs: 0,
      status: 'ACTIVE_STUDENT',
    },
  ]);

  const [alumniList, setAlumniList] = useState<AlumniRecord[]>([]);

  const handleGraduateStudent = (student: StudentRecord) => {
    const alumnus = convertStudentToAlumnus(student, 2026, 'Google Cloud', 'Senior SDE');
    setAlumniList([...alumniList, alumnus]);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Award size={20} className="text-amber-500" />
            <span>Alumni Network & Graduation Conversion Engine</span>
          </h2>
          <p className="text-xs text-gray-500">
            Verified alumni directory, mentorship matching, 1-click Student $\rightarrow$ Alumnus conversion upon degree award
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs uppercase font-bold text-gray-400">Graduating Students (Batch 2026)</h3>

        <div className="space-y-3">
          {students.map((s) => {
            const isAlumnus = s.status === 'ALUMNI';

            return (
              <div key={s.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">{s.name}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {s.rollNumber} • CGPA: <span className="font-bold text-emerald-500">{s.cgpa}</span>
                  </p>
                </div>

                <div>
                  {isAlumnus ? (
                    <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 size={14} /> Converted to Alumnus
                    </span>
                  ) : (
                    <button
                      onClick={() => handleGraduateStudent(s)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow transition"
                    >
                      <span>Graduate & Convert to Alumnus</span>
                      <ArrowRight size={14} />
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
