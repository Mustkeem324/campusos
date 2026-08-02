'use client';

import React, { useState } from 'react';
import { Users, UserPlus, CheckCircle2, Award, Sparkles, ArrowRight } from 'lucide-react';
import { AdmissionLead, StudentRecord, convertLeadToStudent } from '../../lib/lifecycle-service';

export function AdmissionsCRMConsole() {
  const [leads, setLeads] = useState<AdmissionLead[]>([
    {
      id: 'lead_101',
      tenantId: 'inst_apex_univ',
      applicantName: 'David Miller',
      email: 'david.m@gmail.com',
      phone: '+1 555-0199',
      programInterested: 'B.Tech CS',
      leadScore: 92,
      entranceScore: 88,
      status: 'OFFER_ISSUED',
    },
  ]);

  const [convertedStudent, setConvertedStudent] = useState<StudentRecord | null>(null);

  const handleConvertLead = (lead: AdmissionLead) => {
    const student = convertLeadToStudent(lead, 'CS2026-105', 2026);
    setConvertedStudent(student);
    setLeads([...leads]);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-indigo-500" />
            <span>Admissions CRM & Lead-to-Student Conversion Engine</span>
          </h2>
          <p className="text-xs text-gray-500">
            Lead capture, entrance scoring, offer letter issuance, and seamless 1-click conversion into active Student records
          </p>
        </div>
      </div>

      {/* Leads Funnel List */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase font-bold text-gray-400">Active Admissions Applicant Pipeline</h3>

        <div className="space-y-3">
          {leads.map((l) => (
            <div
              key={l.id}
              className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">{l.applicantName}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold">
                    Score: {l.leadScore} pts
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {l.email} • Program: <span className="font-bold text-indigo-500">{l.programInterested}</span>
                </p>
              </div>

              <div>
                {l.status === 'CONVERTED_STUDENT' ? (
                  <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 size={14} /> Converted to Student
                  </span>
                ) : (
                  <button
                    onClick={() => handleConvertLead(l)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition"
                  >
                    <span>Convert Lead to Student</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Converted Student Result Card */}
      {convertedStudent && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-bold space-y-1 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-extrabold flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Lead Successfully Converted to Active Student Record!
            </span>
            <span className="font-mono text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded">
              Roll: {convertedStudent.rollNumber}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
            Student ID: <span className="font-mono">{convertedStudent.id}</span> • Program: {convertedStudent.program} • Batch: {convertedStudent.batchYear}
          </p>
        </div>
      )}
    </div>
  );
}
