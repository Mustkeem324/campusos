'use client';

import React from 'react';
import { useAuthStore } from '../../lib/auth-store';
import {
  Users,
  GraduationCap,
  CheckSquare,
  DollarSign,
  Building2,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileText,
  Clock,
  Award,
  BookOpen,
  UserCheck,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export function RoleDashboard() {
  const { currentSession } = useAuthStore();
  const role = currentSession.role;

  const renderSuperAdmin = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Active Institutions" value="48" change="+6 this month" icon={Building2} color="indigo" />
        <StatCard title="Total Platform Users" value="142,850" change="+12.4%" icon={Users} color="emerald" />
        <StatCard title="System API Latency" value="184 ms" change="p95 SLA < 300ms" icon={Sparkles} color="sky" />
        <StatCard title="Monthly Recurring Rev" value="$84,200" change="+18% YoY" icon={DollarSign} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
            <span>Multi-Tenant Infrastructure Status</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-medium">
              100% Operational
            </span>
          </h3>
          <div className="space-y-3 text-xs">
            <TenantRow name="Apex Technological University" domain="apex.campusos.edu" users="14,200" status="Healthy" />
            <TenantRow name="St. Jude Medical Institute" domain="stjude.campusos.edu" users="8,450" status="Healthy" />
            <TenantRow name="National Institute of Science" domain="nis.campusos.edu" users="22,100" status="Healthy" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Security & Compliance Feed</h3>
          <div className="space-y-3 text-xs">
            <LogEntry time="2m ago" action="Tenant RLS Policy Audit" detail="Verified 55 tables for inst_apex_univ" />
            <LogEntry time="14m ago" action="Admin Impersonation Start" detail="Super Admin logged into inst_stjude" />
            <LogEntry time="1h ago" action="SAML IdP Rotation" detail="Key pair updated for SAML 2.0 gateway" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderInstAdmin = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Students Enrolled" value="14,200" change="Term 2 Active" icon={GraduationCap} color="indigo" />
        <StatCard title="Faculty & Staff" value="840" change="4 Departments" icon={Users} color="emerald" />
        <StatCard title="Course Offerings" value="312" change="Registration Open" icon={BookOpen} color="sky" />
        <StatCard title="Term Fee Collection" value="$1.84M" change="84% collected" icon={DollarSign} color="amber" />
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl">
        <h3 className="text-lg font-extrabold mb-1">Academic Year 2026-2 Term 2 Configuration</h3>
        <p className="text-xs text-indigo-100 mb-4">
          Course registration window closes in 4 days. Elective auto-allotment algorithm scheduled for Friday.
        </p>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-bold text-xs shadow-md">
            Manage Registration Windows
          </button>
          <button className="px-4 py-2 rounded-xl bg-indigo-700/60 text-white font-medium text-xs hover:bg-indigo-700">
            View Elective Ranking Matrix
          </button>
        </div>
      </div>
    </div>
  );

  const renderHOD = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Dept Courses Offered" value="42" change="CS & Engineering" icon={BookOpen} color="indigo" />
        <StatCard title="Faculty Workload Avg" value="14.2 hrs/wk" change="Balanced" icon={UserCheck} color="emerald" />
        <StatCard title="Defaulter Attendance" value="18 Students" change="<75% Threshold" icon={AlertTriangle} color="amber" />
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Pending Exam Marks Lock Approvals</h3>
        <div className="space-y-2">
          <ApprovalRow course="CS401 Data Structures" faculty="Prof. Alan Turing" section="Sec A" status="Ready for HOD Sign-off" />
          <ApprovalRow course="CS405 Machine Learning" faculty="Dr. Fei-Fei Li" section="Sec B" status="Ready for HOD Sign-off" />
        </div>
      </div>
    </div>
  );

  const renderFaculty = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Today's Lectures" value="3 Classes" change="Next at 11:00 AM" icon={Calendar} color="indigo" />
        <StatCard title="Attendance Marked" value="94%" change="2 sessions pending" icon={CheckSquare} color="emerald" />
        <StatCard title="Assignments to Grade" value="28 Submissions" change="Rubric active" icon={FileText} color="amber" />
        <StatCard title="Open Student Doubts" value="5 Threads" change="CS401 Forum" icon={Users} color="sky" />
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Today's Class Schedule</h3>
        <div className="space-y-3">
          <ClassSlot time="09:00 - 10:30 AM" course="CS401 Data Structures" room="Lab 3B (Cap: 60)" status="Completed" />
          <ClassSlot time="11:00 - 12:30 PM" course="CS405 Artificial Intelligence" room="Hall A1" status="Upcoming" />
          <ClassSlot time="02:00 - 03:30 PM" course="CS499 Capstone Project Review" room="Seminar Room 2" status="Upcoming" />
        </div>
      </div>
    </div>
  );

  const renderStudent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Current CGPA" value="3.84 / 4.0" change="Top 5% in Batch" icon={Award} color="emerald" />
        <StatCard title="Attendance Health" value="88.5%" change="+13.5% above cutoff" icon={CheckSquare} color="indigo" />
        <StatCard title="Enrolled Credits" value="22 Credits" change="Term 2 Enrolled" icon={BookOpen} color="sky" />
        <StatCard title="Fee Dues Pending" value="$0.00" change="All Receipts Paid" icon={CheckCircle2} color="emerald" />
      </div>

      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-emerald-200 font-bold">Course Registration Window</span>
            <h3 className="text-lg font-extrabold mt-0.5">Term 2 Elective Allotment Active</h3>
            <p className="text-xs text-emerald-100 mt-1">Real-time seat counter enabled with optimistic locking protection.</p>
          </div>
          <button className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-extrabold text-xs shadow-lg">
            Open Registration Console
          </button>
        </div>
      </div>
    </div>
  );

  const renderParent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Child Attendance" value="91.2%" change="Alex Vance (B.Tech CS)" icon={CheckSquare} color="emerald" />
        <StatCard title="Latest Term Grade" value="SGPA 3.9" change="Term 1 Marksheet Verified" icon={GraduationCap} color="indigo" />
        <StatCard title="Upcoming Fee Due" value="$0.00" change="Paid on Jan 14" icon={DollarSign} color="emerald" />
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Hostel Outpass Approval Requests</h3>
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">Weekend Overnight Outpass</h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-300">Destination: Home Visit (Aug 8 - Aug 10)</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs">Approve Outpass</button>
            <button className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">Decline</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWarden = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Hostel Rooms" value="240 Beds" change="Hostel Block A" icon={Building2} color="indigo" />
        <StatCard title="Occupancy Rate" value="96%" change="230 Resident Students" icon={Users} color="emerald" />
        <StatCard title="Students Out of Campus" value="14 Students" change="Approved Outpasses" icon={Clock} color="amber" />
        <StatCard title="Open Mess Complaints" value="2 Tickets" change="SLA < 24h" icon={AlertTriangle} color="sky" />
      </div>
    </div>
  );

  const renderAccountant = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Today's Collections" value="$42,800" change="Razorpay + UPI + Cash" icon={DollarSign} color="emerald" />
        <StatCard title="Total Dues Pending" value="$124,500" change="184 Student Invoices" icon={AlertTriangle} color="amber" />
        <StatCard title="Reconciled Webhooks" value="99.8%" change="Idempotency Verified" icon={ShieldCheck} color="indigo" />
        <StatCard title="Scholarship Disbursed" value="$45,000" change="State Merit Scheme" icon={Award} color="sky" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
            {role.replace('_', ' ')} Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Welcome back, {currentSession.name} • {currentSession.institutionName}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            Tenant: {currentSession.tenantId}
          </span>
        </div>
      </div>

      {role === 'SUPER_ADMIN' && renderSuperAdmin()}
      {role === 'INSTITUTION_ADMIN' && renderInstAdmin()}
      {role === 'HOD' && renderHOD()}
      {role === 'FACULTY' && renderFaculty()}
      {role === 'STUDENT' && renderStudent()}
      {role === 'PARENT' && renderParent()}
      {role === 'WARDEN' && renderWarden()}
      {role === 'ACCOUNTANT' && renderAccountant()}
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, color }: any) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{value}</h3>
        <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">{change}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl bg-${color}-50 dark:bg-${color}-950/80 text-${color}-600 dark:text-${color}-400 flex items-center justify-center shrink-0`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

function TenantRow({ name, domain, users, status }: any) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
        <p className="text-[10px] text-gray-500 font-mono">{domain}</p>
      </div>
      <div className="text-right">
        <span className="font-bold text-gray-800 dark:text-gray-200">{users} Users</span>
        <span className="block text-[10px] text-emerald-500 font-bold">{status}</span>
      </div>
    </div>
  );
}

function LogEntry({ time, action, detail }: any) {
  return (
    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-start gap-3">
      <span className="text-[10px] font-mono text-gray-400 mt-0.5">{time}</span>
      <div>
        <h4 className="font-bold text-gray-800 dark:text-gray-200">{action}</h4>
        <p className="text-gray-500">{detail}</p>
      </div>
    </div>
  );
}

function ApprovalRow({ course, faculty, section, status }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-xs">
      <div>
        <h4 className="font-bold text-gray-900 dark:text-white">{course} ({section})</h4>
        <p className="text-gray-500">{faculty}</p>
      </div>
      <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700">
        {status}
      </button>
    </div>
  );
}

function ClassSlot({ time, course, room, status }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-xs">
      <div className="flex items-center gap-3">
        <div className="w-2 h-8 rounded-full bg-indigo-500" />
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white">{course}</h4>
          <p className="text-gray-500">{time} • {room}</p>
        </div>
      </div>
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
        status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-amber-100 dark:bg-amber-950 text-amber-600'
      }`}>
        {status}
      </span>
    </div>
  );
}
