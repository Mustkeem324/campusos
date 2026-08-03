import React from 'react';
import Link from 'next/link';
import { Shield, ArrowRight, Lock, Users, Key, Database, FileLock, Server, EyeOff, FileText } from 'lucide-react';

const securityCapabilities = [
  { title: 'Tenant Isolation', icon: Database, status: 'Implemented', statusColor: 'text-[#078A57] bg-[#e6f4ed]', desc: 'Strict logical separation of institutional data.' },
  { title: 'Data Protection', icon: Lock, status: 'Implemented', statusColor: 'text-[#078A57] bg-[#e6f4ed]', desc: 'Controls for protecting institutional data in configured workflows.' },
  { title: 'RBAC and ABAC', icon: Users, status: 'Implemented', statusColor: 'text-[#078A57] bg-[#e6f4ed]', desc: 'Granular permissions based on roles and attributes.' },
  { title: 'Multi-Factor Auth', icon: Key, status: 'Implemented', statusColor: 'text-[#078A57] bg-[#e6f4ed]', desc: 'Additional sign-in verification can be configured for appropriate roles.' },
  { title: 'Immutable Audit Logs', icon: FileText, status: 'Implemented', statusColor: 'text-[#078A57] bg-[#e6f4ed]', desc: 'Tamper-evident logging of all write operations.' },
  { title: 'Secure File Storage', icon: FileLock, status: 'Implemented', statusColor: 'text-[#078A57] bg-[#e6f4ed]', desc: 'Private bucket isolation with signed URLs.' },
  { title: 'Backup & Recovery', icon: Server, status: 'In progress', statusColor: 'text-[#D66A00] bg-[#fdf0e6]', desc: 'Automated point-in-time database restoration.' },
  { title: 'Privacy Controls', icon: EyeOff, status: 'Planned', statusColor: 'text-[#5F6C7B] bg-[#F0F4FA]', desc: 'Planned controls for institution-configured privacy workflows.' }
];

export function SecuritySection() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <div className="w-16 h-16 rounded-xl bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center mb-6">
              <Shield size={32} />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-[#101B33] mb-6 leading-tight">
              Enterprise-grade security by design
            </h2>
            <p className="text-[17px] text-[#5F6B7A] leading-[1.6] mb-8">
              CampusOS is designed to help institutions govern sensitive student, financial and operational information through configurable access, monitoring and review practices.
            </p>
            <Link 
              href="/security" 
              className="inline-flex items-center gap-2 text-[16px] font-semibold text-[#1854E8] hover:text-[#123FC0] transition-colors"
            >
              Visit our Security Centre <ArrowRight size={18} />
            </Link>
          </div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {securityCapabilities.map((cap, index) => {
                const Icon = cap.icon;
                return (
                  <div key={index} className="bg-white rounded-xl border border-[#DEE5EF] p-5 shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#F5F7FB] text-[#101828] flex items-center justify-center">
                        <Icon size={20} />
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${cap.statusColor}`}>
                        {cap.status}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-semibold text-[#101828] mb-2">{cap.title}</h3>
                    <p className="text-[14px] text-[#5F6B7A]">{cap.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
