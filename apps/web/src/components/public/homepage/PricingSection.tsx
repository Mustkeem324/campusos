import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    profile: 'For small colleges',
    desc: 'Core operational tools to digitise paper-based processes.',
    features: ['Academics & Timetabling', 'Basic Admissions Form', 'Student & Faculty Portals', 'Fee Collection Gateway', 'Email Notifications', 'Standard Support'],
    deploy: 'Cloud-hosted multi-tenant'
  },
  {
    name: 'Growth',
    profile: 'For growing universities',
    desc: 'Advanced modules for comprehensive institutional management.',
    features: ['Everything in Starter', 'Advanced Exam & OBE Management', 'People & HR Module', 'Campus Operations & Hostel', 'Custom Analytics Dashboards', 'Priority Support'],
    deploy: 'Cloud-hosted isolated database',
    featured: true
  },
  {
    name: 'Enterprise',
    profile: 'For large university groups',
    desc: 'Unrestricted access, custom workflows and dedicated infrastructure.',
    features: ['Everything in Growth', 'Multi-campus Central Control', 'Custom Module Development', 'ERP Integration APIs', 'White-labeled Mobile App', 'Dedicated Success Manager'],
    deploy: 'Single-tenant or On-premise'
  }
];

export function PricingSection() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="text-center mb-16">
          <span className="text-[12px] md:text-[13px] font-semibold text-[#1854E8] tracking-[0.08em] uppercase mb-4 block">
            TRANSPARENT PRICING
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-[#101B33] mb-6">
            Scale your digital infrastructure
          </h2>
          <p className="text-[17px] text-[#5F6B7A] max-w-[680px] mx-auto">
            Choose a plan that fits your institution&apos;s size and complexity. We price based on active student enrollment, not per module.
          </p>
        </div>

        <div className="max-w-[1050px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, index) => {
            const isFeatured = plan.featured;
            return (
              <div 
                key={index} 
                className={`flex flex-col bg-white rounded-2xl p-7 lg:p-8 relative transition-all duration-200 ${
                  isFeatured 
                    ? 'border-2 border-[#1854E8] shadow-lg md:-mt-4 md:mb-[-16px]' 
                    : 'border border-[#DEE5EF] shadow-sm mt-0'
                }`}
              >
                {isFeatured && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1854E8] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Recommended
                  </div>
                )}
                
                <h3 className="text-[22px] font-bold text-[#101828] mb-1">{plan.name}</h3>
                <div className="text-[13px] font-semibold text-[#1854E8] mb-4">{plan.profile}</div>
                <p className="text-[14px] text-[#5F6B7A] mb-6 h-12">{plan.desc}</p>
                
                <Link 
                  href="/pricing"
                  className={`w-full py-3 rounded-lg text-[15px] font-semibold text-center transition-colors mb-8 ${
                    isFeatured 
                      ? 'bg-[#1854E8] text-white hover:bg-[#123FC0]' 
                      : 'bg-white border border-[#C9D3E1] text-[#101828] hover:bg-[#F5F7FB]'
                  }`}
                >
                  Request tailored pricing
                </Link>

                <div className="flex-1">
                  <div className="text-[11px] font-bold text-[#101828] uppercase tracking-wider mb-4">Included Capabilities</div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#5F6B7A]">
                        <Check size={16} className="text-[#078A57] mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-[#DEE5EF] mt-auto">
                  <div className="text-[12px] font-medium text-[#5F6B7A]">
                    <strong className="text-[#101828]">Deployment:</strong> {plan.deploy}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
