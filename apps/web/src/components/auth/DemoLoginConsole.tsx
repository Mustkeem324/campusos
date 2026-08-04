'use client';

import React from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  Users, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  Info,
  BookOpen
} from 'lucide-react';

interface DemoLoginConsoleProps {
  demoLoading: string | null;
  onDemoLogin: (persona: string) => void;
}

export function DemoLoginConsole({ demoLoading, onDemoLogin }: DemoLoginConsoleProps) {
  return (
    <div className="w-full space-y-6">
      
      {/* Header & Supporting Explanation */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-[#1854E8]/10 text-[#1854E8] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#1854E8]/20 uppercase tracking-wider">
            Fictional Institution Workspace
          </span>
        </div>
        <h3 className="text-xl font-bold text-[#101B33]">Explore CampusOS by Role</h3>
        <p className="text-xs text-[#5F6B7A] mt-1 leading-relaxed">
          Choose a fictional persona to experience how CampusOS adapts its workspace, permissions and information for different campus roles.
        </p>
      </div>

      {/* Prominent Demo Notice */}
      <div className="p-3 bg-[#EEF3FF] border border-[#C6D7FE] rounded-xl flex items-start gap-2.5 text-xs text-[#101B33]">
        <Info size={16} className="text-[#1854E8] shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Demo Environment:</strong> All people, records, marks, and transactions shown in these demo accounts are fictional.
        </div>
      </div>

      {/* 4 Persona Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* ADMIN */}
        <div className="bg-white border border-[#DEE5EF] hover:border-[#1854E8]/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center font-bold text-sm shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-bold text-[#101B33] text-base leading-tight">Admin</h4>
                <p className="text-xs font-semibold text-[#1854E8]">Aarav Mehta</p>
              </div>
            </div>

            <p className="text-[11px] font-mono text-[#5F6B7A] bg-[#F5F7FB] px-2 py-0.5 rounded border border-[#DEE5EF] mb-3 truncate" title="admin.demo@campusos.local">
              admin.demo@campusos.local
            </p>

            <p className="text-xs text-[#5F6B7A] leading-relaxed mb-4">
              Manage institutional academics, finance, operations, users, approvals and reports.
            </p>

            <div className="space-y-1.5 mb-5 text-[11px] text-[#101B33] font-medium">
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Institution Overview</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Academic Configuration</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Finance & Collections</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Users & Permissions</div>
            </div>
          </div>

          <button
            type="button"
            disabled={demoLoading !== null}
            onClick={() => onDemoLogin('ADMIN')}
            className="w-full py-2.5 px-4 text-xs font-bold bg-[#1854E8] hover:bg-[#1140B8] text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
          >
            {demoLoading === 'ADMIN' ? (
              <><Loader2 size={15} className="animate-spin mr-2" /> Opening Admin...</>
            ) : (
              <>Continue as Admin <ArrowRight size={14} className="ml-1" /></>
            )}
          </button>
        </div>

        {/* FACULTY */}
        <div className="bg-white border border-[#DEE5EF] hover:border-[#1854E8]/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center font-bold text-sm shrink-0">
                <GraduationCap size={20} />
              </div>
              <div>
                <h4 className="font-bold text-[#101B33] text-base leading-tight">Faculty</h4>
                <p className="text-xs font-semibold text-[#1854E8]">Dr. Priya Sharma</p>
              </div>
            </div>

            <p className="text-[11px] font-mono text-[#5F6B7A] bg-[#F5F7FB] px-2 py-0.5 rounded border border-[#DEE5EF] mb-3 truncate" title="faculty.demo@campusos.local">
              faculty.demo@campusos.local
            </p>

            <p className="text-xs text-[#5F6B7A] leading-relaxed mb-4">
              Manage assigned courses, timetable, attendance, assessments and student progress.
            </p>

            <div className="space-y-1.5 mb-5 text-[11px] text-[#101B33] font-medium">
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Teaching Schedule</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Classroom Attendance</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Assignments & Grading</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Student Support Alerts</div>
            </div>
          </div>

          <button
            type="button"
            disabled={demoLoading !== null}
            onClick={() => onDemoLogin('FACULTY')}
            className="w-full py-2.5 px-4 text-xs font-bold bg-[#1854E8] hover:bg-[#1140B8] text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
          >
            {demoLoading === 'FACULTY' ? (
              <><Loader2 size={15} className="animate-spin mr-2" /> Opening Faculty...</>
            ) : (
              <>Continue as Faculty <ArrowRight size={14} className="ml-1" /></>
            )}
          </button>
        </div>

        {/* STUDENT */}
        <div className="bg-white border border-[#DEE5EF] hover:border-[#1854E8]/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center font-bold text-sm shrink-0">
                <UserCheck size={20} />
              </div>
              <div>
                <h4 className="font-bold text-[#101B33] text-base leading-tight">Student</h4>
                <p className="text-xs font-semibold text-[#1854E8]">Rohan Verma</p>
              </div>
            </div>

            <p className="text-[11px] font-mono text-[#5F6B7A] bg-[#F5F7FB] px-2 py-0.5 rounded border border-[#DEE5EF] mb-3 truncate" title="student.demo@campusos.local">
              student.demo@campusos.local
            </p>

            <p className="text-xs text-[#5F6B7A] leading-relaxed mb-4">
              Access classes, attendance, assignments, results, fees and campus services.
            </p>

            <div className="space-y-1.5 mb-5 text-[11px] text-[#101B33] font-medium">
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Class Timetable</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Learning & Submissions</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Results & Attendance</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Fees & Student Perks</div>
            </div>
          </div>

          <button
            type="button"
            disabled={demoLoading !== null}
            onClick={() => onDemoLogin('STUDENT')}
            className="w-full py-2.5 px-4 text-xs font-bold bg-[#1854E8] hover:bg-[#1140B8] text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
          >
            {demoLoading === 'STUDENT' ? (
              <><Loader2 size={15} className="animate-spin mr-2" /> Opening Student...</>
            ) : (
              <>Continue as Student <ArrowRight size={14} className="ml-1" /></>
            )}
          </button>
        </div>

        {/* PARENT */}
        <div className="bg-white border border-[#DEE5EF] hover:border-[#1854E8]/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center font-bold text-sm shrink-0">
                <Users size={20} />
              </div>
              <div>
                <h4 className="font-bold text-[#101B33] text-base leading-tight">Parent</h4>
                <p className="text-xs font-semibold text-[#1854E8]">Anita Verma</p>
              </div>
            </div>

            <p className="text-[11px] font-mono text-[#5F6B7A] bg-[#F5F7FB] px-2 py-0.5 rounded border border-[#DEE5EF] mb-3 truncate" title="parent.demo@campusos.local">
              parent.demo@campusos.local
            </p>

            <p className="text-xs text-[#5F6B7A] leading-relaxed mb-4">
              View authorized attendance, fees, results, notices and progress for a linked student.
            </p>

            <div className="space-y-1.5 mb-5 text-[11px] text-[#101B33] font-medium">
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Linked Student Overview</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Attendance Tracker</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Published Exam Results</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#078A57]" /> Fee Invoices & Dues</div>
            </div>
          </div>

          <button
            type="button"
            disabled={demoLoading !== null}
            onClick={() => onDemoLogin('PARENT')}
            className="w-full py-2.5 px-4 text-xs font-bold bg-[#1854E8] hover:bg-[#1140B8] text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
          >
            {demoLoading === 'PARENT' ? (
              <><Loader2 size={15} className="animate-spin mr-2" /> Opening Parent...</>
            ) : (
              <>Continue as Parent <ArrowRight size={14} className="ml-1" /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
