'use client';

import React from 'react';
import { Award, CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react';

export function SuperiorityMatrixModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const matrix = [
    { module: 'Digital Notice Board', campx: 'Basic announcements by admin', campusos: 'Role-targeted, scheduled, pinned notices with read receipt tracking & push/WhatsApp delivery' },
    { module: 'Profile & Identity', campx: 'Basic student/staff profile view', campusos: 'Dynamic custom attributes, verifiable digital IDs, multi-role switching, bio-metrics' },
    { module: 'Learning Management', campx: 'Simple file attachment uploads', campusos: 'Module-Lesson-Resource tree, SCORM support, video watch analytics, doubt resolution threads' },
    { module: 'Assignments', campx: 'Static file submission', campusos: 'Rubric-based grading, plagiarism/AI hooks, PDF inline annotation, grace period rules' },
    { module: 'Timetable', campx: 'Static grid view per batch', campusos: 'Constraint-solver AI auto-generator (no clashes), room capacity check, drag-and-drop live edit' },
    { module: 'Feedback', campx: 'Basic survey forms', campusos: 'Dynamic Likert/MCQ builder, anonymity guarantee, result-gating, faculty appraisal computation' },
    { module: 'Student Services', campx: 'Static contact directory', campusos: 'SLA-tracked helpdesk ticketing, automated certificate generation with QR public verification' },
    { module: 'Course Registration', campx: 'Basic manual enrollment', campusos: 'Optimistic-locked real-time seat reservation, clash detection, CGPA-weighted elective allotment' },
    { module: 'Hostel Management', campx: 'Manual room list & gate pass', campusos: 'Auto-allotment by merit/preference, QR in/out gate logging, warden/parent outpass approval' },
    { module: 'Discussion Forum', campx: 'Basic category post feed', campusos: 'Nested threads, solved-answer badges, reputation karma, AI toxic post auto-moderation' },
    { module: 'Payments & Fees', campx: 'Basic gateway integration', campusos: 'Component-wise fee heads, installment slabs, automated Razorpay/Stripe reconciliation, ledger sync' },
    { module: 'Exam Results', campx: 'Semester PDF export', campusos: 'Mixed-branch anti-cheating seating plan, SGPA/CGPA engine, backlog tracking, QR marksheets' },
    { module: 'Library / OPAC', campx: 'Manual book issuing system', campusos: 'MARC-lite OPAC search, barcode/RFID scanning, auto-calculated late fines, digital e-reading room' },
    { module: 'AI Copilot Layer', campx: 'None (Zero AI)', campusos: 'Role-aware RAG AI Copilot over tenant data with strict prompt-injection defense barrier' },
    { module: 'Early-Warning Engine', campx: 'None', campusos: 'Multi-factor student risk score calculator (Attendance + Marks + Dues + LMS engagement)' },
    { module: 'Open Automation', campx: 'Closed system', campusos: 'Zapier-style workflow builder (Trigger -> Condition -> Action) & OpenAPI 3.1 REST APIs' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={24} className="text-amber-500" />
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              CampusOS vs CampX Side-by-Side Superiority Comparison Matrix
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded bg-gray-100 dark:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="p-3">Module</th>
                <th className="p-3 text-gray-400">What CampX Does</th>
                <th className="p-3 text-indigo-500 font-extrabold">What CampusOS Does BETTER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 font-bold text-gray-900 dark:text-white">{row.module}</td>
                  <td className="p-3 text-gray-500">{row.campx}</td>
                  <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20">
                    ✓ {row.campusos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
