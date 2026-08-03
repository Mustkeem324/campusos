import React from 'react';
import Link from 'next/link';
import { 
  GraduationCap, UserPlus, IndianRupee, Settings, 
  Users, MessageSquare, LineChart, ArrowRight, Check 
} from 'lucide-react';

const systems = [
  {
    title: 'Academics',
    icon: GraduationCap,
    description: 'Complete curriculum, learning and assessment management.',
    modules: ['Curriculum Planning', 'Timetable Generation', 'LMS & Assignments', 'Examination Management', 'Outcome Based Education (OBE)'],
    roles: ['Faculty', 'Students', 'Admins'],
    href: '/platform/academics'
  },
  {
    title: 'Admissions',
    icon: UserPlus,
    description: 'End-to-end applicant lifecycle and enrollment management.',
    modules: ['Custom Application Forms', 'Lead Management (CRM)', 'Merit List Generation', 'Fee Collection & Seat Allotment', 'Document Verification'],
    roles: ['Admissions Team', 'Applicants'],
    href: '/platform/admissions'
  },
  {
    title: 'Finance',
    icon: IndianRupee,
    description: 'Comprehensive fee collection, accounting and payroll.',
    modules: ['Fee Management & Invoicing', 'Payment Gateway Integration', 'Scholarships & Concessions', 'Asset Management', 'Expense Tracking'],
    roles: ['Finance Dept', 'Students', 'Staff'],
    href: '/platform/finance'
  },
  {
    title: 'Campus Operations',
    icon: Settings,
    description: 'Streamline physical infrastructure and student services.',
    modules: ['Hostel & Dormitory Allocation', 'Transport & Fleet Routing', 'Library Management (OPAC)', 'Gate Pass & Visitor Security', 'Helpdesk Ticketing'],
    roles: ['Operations', 'Students', 'Staff'],
    href: '/platform/operations'
  },
  {
    title: 'People & HR',
    icon: Users,
    description: 'Manage staff lifecycle, attendance and performance.',
    modules: ['Employee Onboarding', 'Biometric Attendance', 'Leave Management', 'Appraisal & Promotions', 'Payroll Generation'],
    roles: ['HR Team', 'Staff', 'Leadership'],
    href: '/platform/people'
  },
  {
    title: 'Communication',
    icon: MessageSquare,
    description: 'Secure, targeted messaging across the institution.',
    modules: ['Internal Email System', 'SMS & Push Notifications', 'Secure Chat Communities', 'Event Announcements', 'Disciplinary Notices'],
    roles: ['All Users'],
    href: '/platform/communication'
  },
  {
    title: 'Analytics & Intelligence',
    icon: LineChart,
    description: 'Data-driven insights for proactive institutional decision making.',
    modules: ['NAAC & NIRF Reporting', 'Student At-Risk Prediction', 'Financial Health Dashboards', 'Faculty Workload Analysis', 'Custom Query Builder'],
    roles: ['Leadership', 'Administrators'],
    href: '/platform/analytics',
    featured: true
  }
];

export function PlatformSystemsSection() {
  return (
    <section className="bg-[#F5F7FB] py-24 md:py-32">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="text-center mb-16">
          <span className="text-[12px] md:text-[13px] font-semibold text-[#1854E8] tracking-[0.08em] uppercase mb-4 block">
            THE PLATFORM
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-[#101B33] mb-6">
            Seven interconnected core systems
          </h2>
          <p className="text-[17px] text-[#5F6B7A] max-w-[680px] mx-auto">
            A complete suite of applications that work together natively, eliminating data silos and redundant data entry.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {systems.map((system, index) => {
            const Icon = system.icon;
            const isFeatured = system.featured;
            
            return (
              <div 
                key={index}
                className={`flex flex-col bg-white rounded-[14px] p-8 transition-all duration-200 shadow-sm ${
                  isFeatured 
                    ? 'border-2 border-[#1854E8] lg:col-span-3 xl:col-span-1 xl:row-span-2' 
                    : 'border border-[#DEE5EF] hover:border-[#C9D3E1]'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-[48px] h-[48px] rounded-lg flex items-center justify-center shrink-0 ${
                    isFeatured ? 'bg-[#1854E8] text-white' : 'bg-[#EEF3FF] text-[#1854E8]'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-[20px] font-semibold text-[#101828]">
                    {system.title}
                  </h3>
                </div>
                
                <p className="text-[15px] text-[#5F6B7A] mb-6">
                  {system.description}
                </p>

                <div className="mb-8 flex-1">
                  <div className="text-[12px] font-bold text-[#101828] uppercase tracking-wider mb-3">Key Modules</div>
                  <ul className="space-y-2.5">
                    {system.modules.map((mod, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#5F6B7A]">
                        <Check size={16} className="text-[#078A57] mt-0.5 shrink-0" />
                        <span>{mod}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {system.roles.map((role, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-[#F5F7FB] border border-[#DEE5EF] text-[12px] font-medium text-[#5F6B7A]">
                        {role}
                      </span>
                    ))}
                  </div>
                  <Link 
                    href={system.href}
                    className={`inline-flex items-center gap-2 text-[15px] font-semibold transition-colors ${
                      isFeatured ? 'text-[#1854E8] hover:text-[#123FC0]' : 'text-[#1854E8] hover:text-[#123FC0]'
                    }`}
                  >
                    Explore system <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
