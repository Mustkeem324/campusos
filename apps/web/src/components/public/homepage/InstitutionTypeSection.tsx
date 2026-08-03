import React from 'react';
import Link from 'next/link';
import { 
  Building, Library, Layers, 
  Cpu, HeartPulse, Globe, ArrowRight 
} from 'lucide-react';

const institutionTypes = [
  {
    title: 'Universities',
    description: 'Manage multiple faculties, constituent colleges, large-scale examinations, and complex governance structures.',
    icon: Building,
    href: '/solutions/universities'
  },
  {
    title: 'Autonomous Colleges',
    description: 'Handle independent curriculum design, grading systems, and end-to-end examination management.',
    icon: Library,
    href: '/solutions/autonomous-colleges'
  },
  {
    title: 'College Groups',
    description: 'Centralised control over multiple institutes with unified reporting and shared resources.',
    icon: Layers,
    href: '/solutions/college-groups'
  },
  {
    title: 'Engineering Colleges',
    description: 'Track lab sessions, NBA compliance, project evaluations, and specialized placement drives.',
    icon: Cpu,
    href: '/solutions/engineering-colleges'
  },
  {
    title: 'Medical Institutions',
    description: 'Manage clinical rotations, hospital duty rosters, compliance, and specialized attendance.',
    icon: HeartPulse,
    href: '/solutions/medical-colleges'
  },
  {
    title: 'Online & Distance Learning',
    description: 'Deliver asynchronous content, manage remote proctoring, and support global cohorts.',
    icon: Globe,
    href: '/solutions/online-learning'
  }
];

export function InstitutionTypeSection() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="text-center mb-16">
          <span className="text-[12px] md:text-[13px] font-semibold text-[#1854E8] tracking-[0.08em] uppercase mb-4 block">
            DESIGNED FOR EVERY TYPE OF INSTITUTION
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-[#101B33] mb-6">
            Purpose-built for higher education
          </h2>
          <p className="text-[17px] text-[#5F6B7A] max-w-[680px] mx-auto">
            CampusOS adapts to the operational, academic and compliance needs of your institution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {institutionTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <Link 
                key={index} 
                href={type.href}
                className="group flex flex-col bg-white border border-[#DEE5EF] rounded-[14px] p-6 hover:border-[#1854E8] hover:shadow-sm transition-all duration-200 min-h-[230px]"
              >
                <div className="w-[44px] h-[44px] rounded-lg bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center mb-5 shrink-0">
                  <Icon size={22} />
                </div>
                <h3 className="text-[18px] font-semibold text-[#101828] mb-3">
                  {type.title}
                </h3>
                <p className="text-[14px] text-[#5F6B7A] leading-[1.5] mb-6 flex-1">
                  {type.description}
                </p>
                <div className="mt-auto flex items-center gap-2 text-[14px] font-semibold text-[#1854E8]">
                  Learn more <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
