'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Award,
  BookOpen,
  Clock,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  BadgeCheck,
  CheckSquare,
  AlertCircle,
  Users,
  Download,
  FileSpreadsheet,
  HelpCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '../../lib/auth-store';

export function StudentProfileConsole() {
  const { currentSession } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'journey' | 'attendance' | 'documents' | 'certificates' | 'requests'>('overview');

  // Dynamic Session Identity (Fallback to Rohan Verma demo persona)
  const studentName = currentSession?.name || 'Rohan Verma';
  const studentEmail = currentSession?.email || 'student.demo@campusos.local';
  const studentInitials = studentName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const academicJourney = [
    { sem: 'Semester 4', status: 'Active', isCurrent: true, batch: '2024-2028', programme: 'B.Tech CS', classroom: 'CSE-4A', courseReg: 'Completed' },
    { sem: 'Semester 3', status: 'Promoted', isCurrent: false, batch: '2024-2028', programme: 'B.Tech CS', classroom: 'CSE-3A', courseReg: 'Completed' },
    { sem: 'Semester 2', status: 'Promoted', isCurrent: false, batch: '2024-2028', programme: 'B.Tech CS', classroom: 'CSE-2A', courseReg: 'Completed' },
    { sem: 'Semester 1', status: 'Promoted', isCurrent: false, batch: '2024-2028', programme: 'B.Tech CS', classroom: 'CSE-1A', courseReg: 'Completed' },
  ];

  const attendanceData = [
    { code: 'CS-301', title: 'Data Structures & Algorithms', attended: 28, total: 30, pct: 93.3 },
    { code: 'CS-302', title: 'Database Management Systems', attended: 26, total: 28, pct: 92.8 },
    { code: 'CS-303', title: 'Operating Systems & System Kernel', attended: 30, total: 32, pct: 93.7 },
    { code: 'CS-304', title: 'Computer Networks & Protocols', attended: 24, total: 26, pct: 92.3 },
  ];

  const certificates = [
    { title: 'Bonafide Student Certificate', issueDate: '07/20/2025', hash: 'CERT-2026-CDU-9941', status: 'VERIFIED' },
    { title: 'Semester 3 Official Grade Transcript', issueDate: '01/15/2026', hash: 'CERT-2026-CDU-8820', status: 'VERIFIED' },
    { title: 'Academic Bank of Credits (ABC APAAR) Deposit', issueDate: '02/01/2026', hash: 'APAAR-979214070636', status: 'SYNCHRONIZED' },
  ];

  const documents = [
    { title: '10th Secondary School Marksheet', category: 'Academic', date: '15 May 2024', status: 'Verified' },
    { title: '12th Senior Secondary Marksheet', category: 'Academic', date: '15 May 2024', status: 'Verified' },
    { title: 'Aadhaar Identity Card', category: 'Identity', date: '29 May 2024', status: 'Verified' },
    { title: 'University Entrance Scorecard', category: 'Admission', date: '29 May 2024', status: 'Verified' },
  ];

  const requests = [
    { id: 'REQ-2026-081', type: 'Library Access Badge Replacement', submitted: '01 Feb 2026', status: 'Resolved', office: 'Student Services Desk' },
    { id: 'REQ-2026-042', type: 'Semester Fee Extension Petition', submitted: '10 Jan 2026', status: 'Approved', office: 'Finance Treasury' },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-6 pb-16">
      
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-[#5F6C7B]" aria-label="Breadcrumb">
        <Link href="/dashboard" className="hover:text-[#1754E8] font-medium transition-colors">Student Workspace</Link>
        <ChevronRight size={12} className="text-[#7C889A]" />
        <span className="font-semibold text-[#101828]" aria-current="page">My Profile</span>
      </nav>

      {/* 2. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DFE6F0] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#101828] tracking-tight">My Profile</h1>
          <p className="text-xs sm:text-sm text-[#5F6C7B] mt-1">
            View your academic identity, programme details, contact information and official documents.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => alert('Downloading official student profile PDF...')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DFE6F0] bg-white hover:bg-[#F6F8FC] text-xs font-bold text-[#101828] transition-colors shadow-sm"
          >
            <Download size={14} className="text-[#1754E8]" /> Download Profile PDF
          </button>
          
          <button
            onClick={() => alert('Profile update request form submitted to Registrar Office.')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1754E8] hover:bg-[#1140B8] text-white text-xs font-bold transition-colors shadow-sm"
          >
            Request Profile Update
          </button>
        </div>
      </div>

      {/* 3. Compact Student Identity Header */}
      <div className="bg-white rounded-2xl border border-[#DFE6F0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-5">
          {/* Avatar (Initials or Photo) */}
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-[#EDF3FF] border border-[#1754E8]/30 flex items-center justify-center text-[#1754E8] font-black text-2xl sm:text-3xl shrink-0 shadow-inner">
            {studentInitials}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#101828] tracking-tight">{studentName}</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#078A57]/10 text-[#078A57] font-bold text-[11px] border border-[#078A57]/20">
                <CheckCircle2 size={12} /> Active Student
              </span>
            </div>

            <p className="text-xs text-[#5F6C7B]">
              <strong className="text-[#101828]">B.Tech Computer Science & Engineering</strong> · Year 2 · Semester 4 (Section A)
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#5F6C7B] pt-0.5">
              <span>Roll Number: <strong className="font-mono text-[#101828]">STU-24-001</strong></span>
              <span>•</span>
              <span>Admission ID: <strong className="font-mono text-[#101828]">3744</strong></span>
              <span>•</span>
              <span>APAAR ID: <strong className="font-mono text-[#1754E8]">9792 1407 0636</strong></span>
            </div>
          </div>
        </div>

        {/* Identity Right Badges */}
        <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-[#DFE6F0] pt-4 md:pt-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EDF3FF] border border-[#1754E8]/20 text-[#1754E8] text-xs font-bold">
            <Award size={14} /> Merit Scholarship Recipient
          </div>
          <span className="text-xs text-[#5F6C7B]">
            Main Campus · CSE Dept
          </span>
        </div>
      </div>

      {/* 4. Profile Navigation Tabs */}
      <div className="border-b border-[#DFE6F0] bg-white rounded-xl px-3 py-1 border shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-bold" role="tablist">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'journey', label: 'Academic Journey' },
            { id: 'attendance', label: 'Attendance Ledger' },
            { id: 'documents', label: 'Documents' },
            { id: 'certificates', label: 'Certificates' },
            { id: 'requests', label: 'Requests & Status' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1754E8] text-white shadow-sm'
                    : 'text-[#5F6C7B] hover:text-[#101828] hover:bg-[#F6F8FC]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Consistent Summary Cards (White background, thin neutral border, soft blue icon) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#DFE6F0] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#5F6C7B] mb-2">
                  <span className="font-semibold">Programme</span>
                  <div className="w-7 h-7 rounded-lg bg-[#EDF3FF] text-[#1754E8] flex items-center justify-center">
                    <BookOpen size={15} />
                  </div>
                </div>
                <div className="text-base font-bold text-[#101828]">B.Tech Computer Science</div>
                <p className="text-xs text-[#5F6C7B] mt-0.5">Specialization: Software Systems</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#DFE6F0] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#5F6C7B] mb-2">
                  <span className="font-semibold">Current Semester</span>
                  <div className="w-7 h-7 rounded-lg bg-[#EDF3FF] text-[#1754E8] flex items-center justify-center">
                    <GraduationCap size={15} />
                  </div>
                </div>
                <div className="text-base font-bold text-[#101828]">Year 2 · Semester 4</div>
                <p className="text-xs text-[#5F6C7B] mt-0.5">Classroom: Section A</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#DFE6F0] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#5F6C7B] mb-2">
                  <span className="font-semibold">Batch & Section</span>
                  <div className="w-7 h-7 rounded-lg bg-[#EDF3FF] text-[#1754E8] flex items-center justify-center">
                    <Calendar size={15} />
                  </div>
                </div>
                <div className="text-base font-bold text-[#101828]">Batch 2024–2028</div>
                <p className="text-xs text-[#5F6C7B] mt-0.5">Admitted: 29 May 2024</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#DFE6F0] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#5F6C7B] mb-2">
                  <span className="font-semibold">Academic Standing</span>
                  <div className="w-7 h-7 rounded-lg bg-[#EDF3FF] text-[#078A57] flex items-center justify-center">
                    <CheckCircle2 size={15} />
                  </div>
                </div>
                <div className="text-base font-bold text-[#078A57]">CGPA: 3.80 / 4.0</div>
                <p className="text-xs text-[#5F6C7B] mt-0.5">Status: Excellent Standing</p>
              </div>
            </div>
          </div>

          {/* Academic Identity Details Section */}
          <div className="bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#DFE6F0] pb-3">
              <h3 className="text-base font-bold text-[#101828] flex items-center gap-2">
                <GraduationCap size={18} className="text-[#1754E8]" /> Academic Identity Details
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#F6F8FC] border border-[#DFE6F0] text-[#5F6C7B]">
                Official Institutional Record
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
              <div>
                <span className="text-[#5F6C7B] font-medium block mb-0.5">Admission ID</span>
                <p className="font-mono font-bold text-[#101828] text-sm">3744</p>
              </div>

              <div>
                <span className="text-[#5F6C7B] font-medium block mb-0.5">Roll / SAP Number</span>
                <p className="font-mono font-bold text-[#101828] text-sm">STU-24-001</p>
              </div>

              <div>
                <span className="text-[#5F6C7B] font-medium block mb-0.5">Academic Level</span>
                <p className="font-bold text-[#101828] text-sm">UNDERGRADUATE</p>
              </div>

              <div>
                <span className="text-[#5F6C7B] font-medium block mb-0.5">Admission Type</span>
                <p className="font-bold text-[#101828] text-sm">Direct Entrance Merit</p>
              </div>

              <div>
                <span className="text-[#5F6C7B] font-medium block mb-0.5">Date of Joining</span>
                <p className="font-bold text-[#101828]">29 May 2024</p>
              </div>

              <div>
                <span className="text-[#5F6C7B] font-medium block mb-0.5">Confirmed Date</span>
                <p className="font-bold text-[#101828]">20 July 2024</p>
              </div>

              <div>
                <span className="text-[#5F6C7B] font-medium block mb-0.5">Department</span>
                <p className="font-bold text-[#101828]">Computer Science & Eng</p>
              </div>

              <div>
                <span className="text-[#5F6C7B] font-medium block mb-0.5">Faculty Advisor</span>
                <p className="font-bold text-[#1754E8]">Dr. Priya Sharma</p>
              </div>
            </div>
          </div>

          {/* Personal & Contact Details */}
          <div className="bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#101828] flex items-center gap-2 border-b border-[#DFE6F0] pb-3">
              <User size={18} className="text-[#1754E8]" /> Personal & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
              <div>
                <span className="text-[#5F6C7B] font-medium block mb-0.5">Full Name</span>
                <p className="font-bold text-[#101828] text-sm">{studentName}</p>
              </div>

              <div>
                <span className="text-[#5F6C7B] font-medium block mb-0.5">Institutional Email</span>
                <p className="font-mono font-semibold text-[#1754E8]">{studentEmail}</p>
              </div>

              <div>
                <span className="text-[#5F6C7B] font-medium block mb-0.5">Mobile Number</span>
                <p className="font-mono font-bold text-[#101828]">+91 98765 43210</p>
              </div>

              <div>
                <span className="text-[#5F6C7B] font-medium block mb-0.5">Gender</span>
                <p className="font-bold text-[#101828]">Male</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 6. TAB CONTENT 2: ACADEMIC JOURNEY */}
      {activeTab === 'journey' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-6">
          <div className="border-b border-[#DFE6F0] pb-3">
            <h3 className="text-lg font-bold text-[#101828]">Academic Journey & Milestone Progression</h3>
            <p className="text-xs text-[#5F6C7B]">Track semester progression, course registration status, and classroom allotments.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {academicJourney.map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#F6F8FC] border border-[#DFE6F0] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#101828]">{item.sem}</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    item.isCurrent ? 'bg-[#078A57] text-white' : 'bg-[#EDF3FF] text-[#1754E8]'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#DFE6F0] pt-2">
                  <div>
                    <span className="text-[#5F6C7B] font-medium block">Batch</span>
                    <strong className="text-[#101828]">{item.batch}</strong>
                  </div>
                  <div>
                    <span className="text-[#5F6C7B] font-medium block">Classroom</span>
                    <strong className="text-[#101828]">{item.classroom}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT 3: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DFE6F0] pb-3">
            <div>
              <h3 className="text-lg font-bold text-[#101828]">Attendance Ledger & Health</h3>
              <p className="text-xs text-[#5F6C7B]">Real-time lecture attendance records for Semester 4 (Overall: 93.1%)</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#078A57]/10 border border-[#078A57]/20 text-[#078A57] font-bold text-xs">
              75% Shortage Threshold Safe
            </span>
          </div>

          <div className="space-y-4">
            {attendanceData.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[#1754E8] font-bold">{item.code}</span>
                    <h4 className="font-bold text-[#101828]">{item.title}</h4>
                  </div>
                  <span className="font-mono font-bold text-sm text-[#078A57]">{item.pct}%</span>
                </div>

                <div className="w-full bg-[#DFE6F0] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#078A57] h-full rounded-full" style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. TAB CONTENT 4: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-6">
          <div className="border-b border-[#DFE6F0] pb-3">
            <h3 className="text-lg font-bold text-[#101828]">Uploaded & Verified Student Documents</h3>
            <p className="text-xs text-[#5F6C7B]">Official verified identity, admission and academic certificates.</p>
          </div>

          <div className="space-y-3">
            {documents.map((doc, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-[#1754E8]" />
                  <div>
                    <h4 className="font-bold text-[#101828]">{doc.title}</h4>
                    <p className="text-[#5F6C7B]">Category: {doc.category} • Uploaded: {doc.date}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-[#078A57]/10 text-[#078A57] font-bold text-xs border border-[#078A57]/20">
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. TAB CONTENT 5: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-6">
          <div className="border-b border-[#DFE6F0] pb-3">
            <h3 className="text-lg font-bold text-[#101828]">Verified Certificates & Transcripts</h3>
            <p className="text-xs text-[#5F6C7B]">DigiLocker & APAAR synchronized academic records.</p>
          </div>

          <div className="space-y-3">
            {certificates.map((cert, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <BadgeCheck size={22} className="text-[#078A57]" />
                  <div>
                    <h4 className="font-bold text-[#101828]">{cert.title}</h4>
                    <p className="font-mono text-[11px] text-[#5F6C7B]">Hash: {cert.hash} • Issued: {cert.issueDate}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-[#078A57]/10 text-[#078A57] font-bold font-mono text-xs border border-[#078A57]/20">
                  {cert.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. TAB CONTENT 6: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-6">
          <div className="border-b border-[#DFE6F0] pb-3">
            <h3 className="text-lg font-bold text-[#101828]">Profile Update & Support Requests</h3>
            <p className="text-xs text-[#5F6C7B]">Track submitted official profile corrections and service desk tickets.</p>
          </div>

          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="p-4 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-[#1754E8] font-bold">{req.id}</span>
                  <h4 className="font-bold text-[#101828]">{req.type}</h4>
                  <p className="text-[#5F6C7B]">Assigned Office: {req.office} • Submitted: {req.submitted}</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-[#078A57]/10 text-[#078A57] font-bold text-xs border border-[#078A57]/20">
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
