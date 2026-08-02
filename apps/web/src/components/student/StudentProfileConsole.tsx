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
  Users
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';

export function StudentProfileConsole() {
  const { currentSession } = useAuthStore();
  const [subTab, setSubTab] = useState<'profile' | 'academic-journey' | 'attendance' | 'certificates'>('profile');

  const academicJourney = [
    {
      sem: 'Semester 4',
      status: 'Active',
      isCurrent: true,
      batch: '2024 - 2025_JUL',
      programme: 'MBA_BA_ON',
      classroom: 'MBA_BA_ON-A',
      courseReg: 'Completed',
      color: 'bg-emerald-500',
    },
    {
      sem: 'Semester 3',
      status: 'Promoted',
      isCurrent: false,
      batch: '2024 - 2025_JUL',
      programme: 'MBA_BA_ON',
      classroom: 'MBA_BA_ON-A',
      courseReg: 'Completed',
      color: 'bg-indigo-500',
    },
    {
      sem: 'Semester 2',
      status: 'Promoted',
      isCurrent: false,
      batch: '2024 - 2025_JUL',
      programme: 'MBA_BA_ON',
      classroom: 'MBA_BA_ON-A',
      courseReg: 'Pending',
      color: 'bg-amber-500',
    },
    {
      sem: 'Semester 1',
      status: 'Promoted',
      isCurrent: false,
      batch: '2024 - 2025_JUL',
      programme: 'MBA_BA_ON',
      classroom: 'MBA_BA_ON-A',
      courseReg: 'Completed',
      color: 'bg-indigo-500',
    },
  ];

  const attendanceData = [
    { code: 'MBA801', title: 'Business Analytics & Decision Science', attended: 28, total: 30, pct: 93.3 },
    { code: 'MBA802', title: 'Predictive Modeling & Machine Learning', attended: 26, total: 28, pct: 92.8 },
    { code: 'MBA803', title: 'Big Data & Cloud Analytics Workspace', attended: 30, total: 32, pct: 93.7 },
    { code: 'MBA804', title: 'Financial Analytics & Enterprise Valuation', attended: 24, total: 26, pct: 92.3 },
  ];

  const certificates = [
    { title: 'Bonafide Student Certificate', issueDate: '07/20/2025', hash: 'CERT-2026-UPES-9941', status: 'VERIFIED' },
    { title: 'Semester 3 Official Grade Transcript', issueDate: '01/15/2026', hash: 'CERT-2026-UPES-8820', status: 'VERIFIED' },
    { title: 'Academic Bank of Credits (ABC APAAR) Deposit', issueDate: '02/01/2026', hash: 'APAAR-979214070636', status: 'SYNCHRONIZED' },
  ];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      {/* Student Profile Top Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-black text-3xl border-2 border-indigo-400 shadow-inner">
              MA
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight">MUSTKEEM AHMAD</h1>
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow">
                  Active
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-mono mt-1">
                Roll / SAP ID: <span className="font-extrabold text-amber-300">500129078</span> • Admission ID: 3744
              </p>
              <p className="text-xs text-indigo-100 font-semibold mt-0.5">
                MBA (Business Analytics) • Batch 2024 - 2025_JUL • Year 2 · Sem 4 (Sec A)
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-right text-xs font-mono">
            <span className="px-3 py-1 rounded-xl bg-white/10 text-emerald-300 font-bold border border-white/20">
              Scholarship Awarded 🎓
            </span>
            <span className="text-[10px] text-indigo-200">APAAR ID: 979214070636</span>
          </div>
        </div>

        {/* Profile Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 border-t border-white/10 text-xs font-bold">
          <button
            onClick={() => setSubTab('profile')}
            className={`px-4 py-2 rounded-xl transition ${
              subTab === 'profile'
                ? 'bg-white text-indigo-900 shadow'
                : 'text-indigo-200 hover:bg-white/10'
            }`}
          >
            Full Profile Details
          </button>
          <button
            onClick={() => setSubTab('academic-journey')}
            className={`px-4 py-2 rounded-xl transition ${
              subTab === 'academic-journey'
                ? 'bg-white text-indigo-900 shadow'
                : 'text-indigo-200 hover:bg-white/10'
            }`}
          >
            Academic Journey
          </button>
          <button
            onClick={() => setSubTab('attendance')}
            className={`px-4 py-2 rounded-xl transition ${
              subTab === 'attendance'
                ? 'bg-white text-indigo-900 shadow'
                : 'text-indigo-200 hover:bg-white/10'
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setSubTab('certificates')}
            className={`px-4 py-2 rounded-xl transition ${
              subTab === 'certificates'
                ? 'bg-white text-indigo-900 shadow'
                : 'text-indigo-200 hover:bg-white/10'
            }`}
          >
            Certificates
          </button>
        </div>
      </div>

      {/* SubTab 1: Detailed Profile */}
      {subTab === 'profile' && (
        <div className="space-y-6">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-500">Degree & Program</span>
              <p className="font-extrabold text-sm text-gray-900 dark:text-white">MBA (Business Analytics)</p>
              <p className="text-[10px] text-gray-500">Branch: MBA_BA_ON</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Current Progress</span>
              <p className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">Year 2 · Sem 4 (Sec A)</p>
              <p className="text-[10px] text-gray-500">Classroom: MBA_BA_ON-A</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-600">Admitted Batch</span>
              <p className="font-extrabold text-sm text-amber-600 dark:text-amber-400">2024 - 2025_JUL</p>
              <p className="text-[10px] text-gray-500">Joined: 05/29/2024</p>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-600">Scholarship Status</span>
              <p className="font-extrabold text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <BadgeCheck size={16} /> HAS SCHOLARSHIP
              </p>
              <p className="text-[10px] text-gray-500">Quota: UPESON</p>
            </div>
          </div>

          {/* Academic Identity Details */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
              <GraduationCap size={18} className="text-indigo-500" />
              <span>Academic Identity</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Admission ID</span>
                <p className="font-mono font-extrabold text-indigo-500">3744</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Roll / SAP Number</span>
                <p className="font-mono font-extrabold text-gray-900 dark:text-white">500129078</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Level</span>
                <p className="font-extrabold text-gray-900 dark:text-white">POST GRADUATE</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Admission Type</span>
                <p className="font-extrabold text-gray-900 dark:text-white">Direct (Quota: UPESON)</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Date of Joining</span>
                <p className="font-extrabold text-gray-900 dark:text-white">05/29/2024</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Confirmed Date</span>
                <p className="font-extrabold text-gray-900 dark:text-white">07/20/2025</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Lateral Entry</span>
                <p className="font-extrabold text-gray-900 dark:text-white">No</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Enrollment Status</span>
                <p className="font-extrabold text-emerald-500">Active</p>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
              <User size={18} className="text-indigo-500" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Full Name</span>
                <p className="font-extrabold text-gray-900 dark:text-white">MUSTKEEM AHMAD</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Mobile Number</span>
                <p className="font-mono font-bold text-gray-900 dark:text-white">+91 7905800532</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Institutional Email</span>
                <p className="font-mono text-indigo-500 font-bold">mustkeem.129078@stu.upes.ac.in</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Alternate Email</span>
                <p className="font-mono text-gray-900 dark:text-white">mustkeem324@gmail.com</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Date of Birth</span>
                <p className="font-extrabold text-gray-900 dark:text-white">09/01/1997</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Gender</span>
                <p className="font-extrabold text-gray-900 dark:text-white">Male</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Aadhaar Number</span>
                <p className="font-mono text-gray-900 dark:text-white">5570 3378 1249</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">APAAR ID</span>
                <p className="font-mono font-extrabold text-indigo-500">9792 1407 0636</p>
              </div>
            </div>
          </div>

          {/* Address & Family Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border space-y-3">
              <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
                <MapPin size={16} className="text-indigo-500" />
                <span>Communication & Permanent Address</span>
              </h3>
              <div>
                <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">Permanent Address</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  C/O: Mahfooz Ahmad, Beerkaji Near IFFCO Gate No/03, PHULPUR, Allahabad, Uttar Pradesh, 212402, India
                </p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">Current City / State</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200">Allahabad, Uttar Pradesh (Pincode: 212402)</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border space-y-3">
              <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
                <Users size={16} className="text-indigo-500" />
                <span>Parent & Guardian Information</span>
              </h3>
              <div>
                <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">Father&apos;s Name</span>
                <p className="font-bold text-gray-900 dark:text-white">Mahfooz Ahmad</p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">Nationality</span>
                <p className="font-bold text-gray-900 dark:text-white">Indian</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Academic Journey */}
      {subTab === 'academic-journey' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Academic Journey</h3>
              <p className="text-xs text-gray-500">Track semester progression, course registration status, and classroom allotments</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academicJourney.map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-gray-900 dark:text-white">{item.sem}</span>
                  <div className="flex items-center gap-2">
                    {item.isCurrent && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold text-[10px] uppercase">
                        Current
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-white font-bold text-[10px] ${item.color}`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1 border-t">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Batch</span>
                    <p className="font-bold text-gray-900 dark:text-white">{item.batch}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Programme</span>
                    <p className="font-bold text-gray-900 dark:text-white">{item.programme}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Classroom</span>
                    <p className="font-bold text-gray-900 dark:text-white">{item.classroom}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Course Reg</span>
                    <p className={`font-bold ${item.courseReg === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {item.courseReg}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 3: Attendance */}
      {subTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Attendance Ledger & Health</h3>
              <p className="text-xs text-gray-500">Real-time lecture attendance records for Semester 4 (Overall: 93.1%)</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-extrabold text-xs">
              75% Shortage Threshold Safe
            </span>
          </div>

          <div className="space-y-3">
            {attendanceData.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-indigo-500 font-bold">{item.code}</span>
                    <h4 className="font-bold text-gray-900 dark:text-white">{item.title}</h4>
                  </div>
                  <span className="font-mono font-extrabold text-sm text-emerald-500">{item.pct}%</span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${item.pct}%` }}></div>
                </div>

                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span>Lectures Attended: {item.attended} / {item.total}</span>
                  <span>Shortage Risk: 0%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 4: Certificates */}
      {subTab === 'certificates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Verified Certificates & Transcripts</h3>
              <p className="text-xs text-gray-500">DigiLocker & APAAR synchronized academic records</p>
            </div>
          </div>

          <div className="space-y-3">
            {certificates.map((cert, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <BadgeCheck size={24} className="text-emerald-500" />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{cert.title}</h4>
                    <p className="font-mono text-[10px] text-gray-400">Hash: {cert.hash} • Issued: {cert.issueDate}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-extrabold font-mono text-[10px]">
                  {cert.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
