'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Database, 
  Lock, 
  Zap, 
  UserCheck, 
  FileText, 
  CreditCard, 
  GraduationCap,
  Layers,
  HelpCircle,
  Activity,
  BellRing
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  role: 'admin' | 'faculty' | 'student' | 'parent';
  description: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Admin
  { id: 'admin-1', role: 'admin', title: 'Open Institution Overview', description: 'Explore campus-wide enrollment, faculty counts, and total fee collections.' },
  { id: 'admin-2', role: 'admin', title: 'Review Pending Approvals', description: 'Check admission applications awaiting selection committee decision.' },
  { id: 'admin-3', role: 'admin', title: 'View Governed Data Warehouse', description: 'Open certified institutional metrics and digital twin scenarios.' },
  { id: 'admin-4', role: 'admin', title: 'Open AI Governance Registry', description: 'Inspect deployed ML models, fairness audits, and telemetry logs.' },

  // Faculty
  { id: 'faculty-1', role: 'faculty', title: 'Check Today\'s Timetable', description: 'View assigned course offerings, lecture halls, and live stages.' },
  { id: 'faculty-2', role: 'faculty', title: 'Run Sample Attendance Session', description: 'Mark daily attendance and track 75% threshold alerts.' },
  { id: 'faculty-3', role: 'faculty', title: 'Grade Student Submissions', description: 'Review lab reports with blind evaluation and rubrics.' },
  { id: 'faculty-4', role: 'faculty', title: 'Draft Course Announcement', description: 'Post syllabus updates to the community discussion feed.' },

  // Student
  { id: 'student-1', role: 'student', title: 'View Class Timetable', description: 'Check lecture schedule and join 1-click live online classes.' },
  { id: 'student-2', role: 'student', title: 'Submit Assignment PDF', description: 'Upload homework before deadline and view assignment rubrics.' },
  { id: 'student-3', role: 'student', title: 'Check Attendance & Results', description: 'Review your attendance percentage and SGPA/CGPA grade sheets.' },
  { id: 'student-4', role: 'student', title: 'Explore Student Benefits Hub', description: 'Claim over $3,500/year in free developer tools and software.' },

  // Parent
  { id: 'parent-1', role: 'parent', title: 'View Linked Student (Rohan Verma)', description: 'Inspect academic progress and attendance for your ward.' },
  { id: 'parent-2', role: 'parent', title: 'Check Attendance Warnings', description: 'Monitor daily attendance logs and threshold warnings.' },
  { id: 'parent-3', role: 'parent', title: 'View Term Fee Invoices', description: 'Review tuition dues, scholarship waivers, and pay online.' },
  { id: 'parent-4', role: 'parent', title: 'Request Advisor Meeting', description: 'Schedule parent-teacher conference with faculty advisor.' }
];

export function HowCampusOsWorksConsole() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'checklist'>('architecture');
  const [activeRole, setActiveRole] = useState<'admin' | 'faculty' | 'student' | 'parent'>('student');
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  const toggleChecklist = (id: string) => {
    setCompletedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const roleChecklist = CHECKLIST_ITEMS.filter((item) => item.role === activeRole);
  const completedCount = roleChecklist.filter((item) => completedItems[item.id]).length;
  const progressPct = Math.round((completedCount / roleChecklist.length) * 100);

  return (
    <div className="space-y-10 pb-16">
      
      {/* Header Banner */}
      <div className="bg-[#101B33] text-white rounded-3xl p-6 md:p-10 border border-[#2A3B5C] shadow-2xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1854E8]/20 border border-[#1854E8]/40 text-[#A5D6FF] text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle size={14} className="text-[#1854E8]" /> How CampusOS Works
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            Connected University Operations & Security Blueprint
          </h1>
          <p className="text-[#BEC7D7] text-base md:text-lg leading-relaxed mb-6">
            CampusOS is engineered as a unified, multi-tenant university operating system. Explore how data, permissions, approvals, and AI assistance flow securely between roles.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                activeTab === 'architecture'
                  ? 'bg-white text-[#101B33] shadow-md'
                  : 'bg-[#182642] text-[#BEC7D7] hover:bg-[#2A3B5C] border border-[#2A3B5C]'
              }`}
            >
              System Architecture & Workflows
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                activeTab === 'checklist'
                  ? 'bg-white text-[#101B33] shadow-md'
                  : 'bg-[#182642] text-[#BEC7D7] hover:bg-[#2A3B5C] border border-[#2A3B5C]'
              }`}
            >
              Demo Exploration Checklist
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: ARCHITECTURE & WORKFLOW FLOW */}
      {activeTab === 'architecture' && (
        <div className="space-y-10">
          
          {/* Visual Execution Flow Diagram */}
          <div className="bg-white rounded-3xl border border-[#DEE5EF] p-6 md:p-8 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold text-[#101B33] mb-2">
              End-to-End System Execution Flow
            </h2>
            <p className="text-sm text-[#5F6B7A] mb-8">
              Every user interaction is authenticated, validated against server-side Row-Level Security (RLS) rules, and audit-logged in real time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              <div className="p-5 rounded-2xl bg-[#F5F7FB] border border-[#DEE5EF] relative">
                <div className="w-8 h-8 rounded-full bg-[#1854E8] text-white flex items-center justify-center font-bold text-xs mb-3">1</div>
                <h4 className="text-base font-bold text-[#101B33] mb-1">User Sign In</h4>
                <p className="text-xs text-[#5F6B7A] leading-relaxed">
                  Authentication token is verified server-side with role membership resolution.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F5F7FB] border border-[#DEE5EF] relative">
                <div className="w-8 h-8 rounded-full bg-[#1854E8] text-white flex items-center justify-center font-bold text-xs mb-3">2</div>
                <h4 className="text-base font-bold text-[#101B33] mb-1">RLS Scoping</h4>
                <p className="text-xs text-[#5F6B7A] leading-relaxed">
                  Prisma <code className="text-[#1854E8] font-bold">TENANT_MODELS</code> extension scopes queries strictly to tenant ID.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F5F7FB] border border-[#DEE5EF] relative">
                <div className="w-8 h-8 rounded-full bg-[#1854E8] text-white flex items-center justify-center font-bold text-xs mb-3">3</div>
                <h4 className="text-base font-bold text-[#101B33] mb-1">Action Execution</h4>
                <p className="text-xs text-[#5F6B7A] leading-relaxed">
                  Validations, grade calculations, fee collections, and RAG contexts run atomically.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F5F7FB] border border-[#DEE5EF] relative">
                <div className="w-8 h-8 rounded-full bg-[#078A57] text-white flex items-center justify-center font-bold text-xs mb-3">4</div>
                <h4 className="text-base font-bold text-[#101B33] mb-1">Audit & Notify</h4>
                <p className="text-xs text-[#5F6B7A] leading-relaxed">
                  Immutable audit log recorded; real-time notifications dispatched to related roles.
                </p>
              </div>
            </div>
          </div>

          {/* Concrete Role-Workflow Examples */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Academic Workflow Example */}
            <div className="bg-white rounded-3xl border border-[#DEE5EF] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1854E8] mb-2">
                  <GraduationCap size={16} /> Academic Evaluation Workflow
                </div>
                <h3 className="text-lg font-bold text-[#101B33] mb-3">
                  Assignment Submission to Grade Sheet Publication
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="p-3 bg-[#F5F7FB] rounded-xl text-xs text-[#101B33]">
                    <strong className="text-[#1854E8]">1. Student (Rohan Verma):</strong> Submits Physics Lab PDF before deadline.
                  </div>
                  <div className="p-3 bg-[#F5F7FB] rounded-xl text-xs text-[#101B33]">
                    <strong className="text-[#1854E8]">2. Faculty (Dr. Priya Sharma):</strong> Evaluates PDF with rubric and enters marks.
                  </div>
                  <div className="p-3 bg-[#F5F7FB] rounded-xl text-xs text-[#101B33]">
                    <strong className="text-[#1854E8]">3. Exam Controller:</strong> Moderates batch results and calculates SGPA.
                  </div>
                  <div className="p-3 bg-[#F5F7FB] rounded-xl text-xs text-[#101B33]">
                    <strong className="text-[#078A57]">4. Student & Parent (Anita Verma):</strong> View verified digital grade card with QR code.
                  </div>
                </div>
              </div>

              <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#1854E8] hover:underline">
                Test this workflow in demo &rarr;
              </Link>
            </div>

            {/* Finance Workflow Example */}
            <div className="bg-white rounded-3xl border border-[#DEE5EF] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1854E8] mb-2">
                  <CreditCard size={16} /> Fee Billing & Collection Workflow
                </div>
                <h3 className="text-lg font-bold text-[#101B33] mb-3">
                  Fee Demands, UPI Settlement & General Ledger
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="p-3 bg-[#F5F7FB] rounded-xl text-xs text-[#101B33]">
                    <strong className="text-[#1854E8]">1. Finance Admin:</strong> Configures batch fee structure and merit waivers.
                  </div>
                  <div className="p-3 bg-[#F5F7FB] rounded-xl text-xs text-[#101B33]">
                    <strong className="text-[#1854E8]">2. Parent / Student:</strong> Receives invoice and pays ₹48,750 online via UPI.
                  </div>
                  <div className="p-3 bg-[#F5F7FB] rounded-xl text-xs text-[#101B33]">
                    <strong className="text-[#1854E8]">3. Gateway Engine:</strong> Verifies webhook settlement and clears library holds.
                  </div>
                  <div className="p-3 bg-[#F5F7FB] rounded-xl text-xs text-[#101B33]">
                    <strong className="text-[#078A57]">4. Accounting Hub:</strong> Posts transaction to General Ledger and emails GST receipt.
                  </div>
                </div>
              </div>

              <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#1854E8] hover:underline">
                Test fee payment workflow &rarr;
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: DEMO CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="bg-white rounded-3xl border border-[#DEE5EF] p-6 md:p-8 shadow-sm space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#101B33] mb-1">
                Demo Exploration Checklist
              </h2>
              <p className="text-sm text-[#5F6B7A]">
                Check off key features as you test each fictional persona in the demo environment.
              </p>
            </div>

            {/* Role Switcher */}
            <div className="flex flex-wrap gap-2">
              {(['student', 'faculty', 'admin', 'parent'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRole(r)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                    activeRole === r
                      ? 'bg-[#101B33] text-white'
                      : 'bg-[#F5F7FB] text-[#5F6B7A] hover:bg-[#EEF3FF] border border-[#DEE5EF]'
                  }`}
                >
                  {r} Checklist
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-4 bg-[#F5F7FB] rounded-2xl border border-[#DEE5EF]">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="capitalize text-[#101B33]">{activeRole} Exploration Progress</span>
              <span className="text-[#1854E8]">{completedCount} of {roleChecklist.length} Completed ({progressPct}%)</span>
            </div>
            <div className="w-full bg-[#DEE5EF] h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#078A57] h-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            {roleChecklist.map((item) => {
              const isChecked = !!completedItems[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                    isChecked
                      ? 'bg-[#e6f4ed]/50 border-[#078A57]/30 text-[#101B33]'
                      : 'bg-white border-[#DEE5EF] hover:bg-[#F5F7FB]'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isChecked ? 'bg-[#078A57] border-[#078A57] text-white' : 'border-[#DEE5EF] bg-white'
                  }`}>
                    {isChecked && <CheckCircle2 size={16} />}
                  </span>
                  <div>
                    <h4 className={`text-base font-bold mb-0.5 ${isChecked ? 'line-through text-[#5F6B7A]' : 'text-[#101B33]'}`}>
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#5F6B7A] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
