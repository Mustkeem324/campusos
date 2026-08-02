'use client';

import React, { useState } from 'react';
import { Briefcase, Award, CheckCircle2, AlertTriangle, FileText, Download } from 'lucide-react';
import { PlacementDrive, checkPlacementEligibility, StudentRecord } from '../../lib/lifecycle-service';

export function PlacementsConsole() {
  const [drives] = useState<PlacementDrive[]>([
    { id: 'drive_google', companyName: 'Google Cloud', roleTitle: 'Software Development Engineer', ctcPackageLPA: 24, minCgpaRequired: 3.5, maxBacklogsAllowed: 0, eligibleBranches: ['CS', 'EE'] },
    { id: 'drive_microsoft', companyName: 'Microsoft', roleTitle: 'Cloud Solutions Architect', ctcPackageLPA: 22, minCgpaRequired: 3.2, maxBacklogsAllowed: 1, eligibleBranches: ['CS', 'ME', 'EE'] },
  ]);

  const [student] = useState<StudentRecord>({
    id: 'usr_student_01',
    tenantId: 'inst_apex_univ',
    rollNumber: 'CS2026-01',
    name: 'Alex Vance',
    email: 'alex.vance@apex.edu',
    program: 'B.Tech CS',
    batchYear: 2026,
    cgpa: 3.84,
    backlogs: 0,
    status: 'ACTIVE_STUDENT',
  });

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase size={20} className="text-indigo-500" />
            <span>Placement Drives & ATS Resume Builder</span>
          </h2>
          <p className="text-xs text-gray-500">
            Company profiles, CGPA & backlog eligibility filter, ATS-friendly PDF resume generator, CTC stats
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drives.map((d) => {
          const eligibility = checkPlacementEligibility(student, d);

          return (
            <div key={d.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-500">{d.companyName}</span>
                  <span className="font-mono text-xs font-extrabold text-emerald-500">
                    {d.ctcPackageLPA} LPA CTC
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-1">{d.roleTitle}</h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  Min CGPA: {d.minCgpaRequired} • Max Backlogs: {d.maxBacklogsAllowed}
                </p>
              </div>

              <div>
                {eligibility.eligible ? (
                  <button className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={14} /> Eligible — Submit ATS Resume
                  </button>
                ) : (
                  <button disabled className="w-full py-2 rounded-xl bg-gray-300 dark:bg-gray-700 text-gray-500 text-xs font-bold cursor-not-allowed">
                    {eligibility.reason}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
