import React from 'react';
import Link from 'next/link';

import { Logo } from '@/components/ui/Logo';
import { RegionSelector } from './RegionSelector';

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-[#DEE5EF] pt-16 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16">
          
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Logo className="w-8 h-8" showText={true} />
            </Link>
            <p className="text-[13px] text-[#5F6B7A] leading-[1.6]">
              The connected university operating system for modern higher education institutions.
            </p>
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-[#101828] uppercase tracking-wider mb-4">Platform</h4>
            <ul className="flex flex-col gap-3 text-[14px] text-[#5F6B7A]">
              <li><Link href="/platform/academics" className="hover:text-[#1854E8] transition-colors">Academics</Link></li>
              <li><Link href="/platform/admissions" className="hover:text-[#1854E8] transition-colors">Admissions</Link></li>
              <li><Link href="/platform/finance" className="hover:text-[#1854E8] transition-colors">Finance</Link></li>
              <li><Link href="/platform/operations" className="hover:text-[#1854E8] transition-colors">Operations</Link></li>
              <li><Link href="/platform/people" className="hover:text-[#1854E8] transition-colors">People & HR</Link></li>
              <li><Link href="/platform/communication" className="hover:text-[#1854E8] transition-colors">Communication</Link></li>
              <li><Link href="/platform/analytics" className="hover:text-[#1854E8] transition-colors">Analytics</Link></li>
              <li><Link href="/platform/ai" className="hover:text-[#1854E8] transition-colors">AI Assistant</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-[#101828] uppercase tracking-wider mb-4">Solutions</h4>
            <ul className="flex flex-col gap-3 text-[14px] text-[#5F6B7A]">
              <li><Link href="/solutions/universities" className="hover:text-[#1854E8] transition-colors">Universities</Link></li>
              <li><Link href="/solutions/autonomous-colleges" className="hover:text-[#1854E8] transition-colors">Autonomous Colleges</Link></li>
              <li><Link href="/solutions/college-groups" className="hover:text-[#1854E8] transition-colors">College Groups</Link></li>
              <li><Link href="/solutions/engineering-colleges" className="hover:text-[#1854E8] transition-colors">Engineering</Link></li>
              <li><Link href="/solutions/medical-colleges" className="hover:text-[#1854E8] transition-colors">Medical</Link></li>
              <li><Link href="/solutions/online-learning" className="hover:text-[#1854E8] transition-colors">Online Learning</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-[#101828] uppercase tracking-wider mb-4">Roles & Resources</h4>
            <ul className="flex flex-col gap-3 text-[14px] text-[#5F6B7A]">
              <li><Link href="/roles/leadership" className="hover:text-[#1854E8] transition-colors">Leadership</Link></li>
              <li><Link href="/roles/administrators" className="hover:text-[#1854E8] transition-colors">Administrators</Link></li>
              <li><Link href="/roles/faculty" className="hover:text-[#1854E8] transition-colors">Faculty</Link></li>
              <li><Link href="/roles/students" className="hover:text-[#1854E8] transition-colors">Students</Link></li>
              <li><Link href="/resources/guides" className="hover:text-[#1854E8] transition-colors">Guides</Link></li>
              <li><Link href="/resources/blog" className="hover:text-[#1854E8] transition-colors">Blog</Link></li>
              <li><Link href="/resources/webinars" className="hover:text-[#1854E8] transition-colors">Webinars</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-[#101828] uppercase tracking-wider mb-4">Company & Legal</h4>
            <ul className="flex flex-col gap-3 text-[14px] text-[#5F6B7A]">
              <li><Link href="/about" className="hover:text-[#1854E8] transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-[#1854E8] transition-colors">Contact</Link></li>
              <li><Link href="/security" className="hover:text-[#1854E8] transition-colors">Security</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-[#1854E8] transition-colors">Privacy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-[#1854E8] transition-colors">Terms</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-[#1854E8] transition-colors">Cookies</Link></li>
              <li><Link href="/legal/dpa" className="hover:text-[#1854E8] transition-colors">DPA</Link></li>
            </ul>
          </div>
          
        </div>

        <div className="pt-8 border-t border-[#DEE5EF] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[13px] text-[#5F6B7A]">
            &copy; {new Date().getFullYear()} CampusOS Platform. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-[13px] text-[#5F6B7A]">
            <span>Build v2.1.0</span>
            <span className="hidden md:inline text-[#DEE5EF]">|</span>
            <RegionSelector compact />
            <span className="hidden md:inline text-[#DEE5EF]">|</span>
            <Link href="/legal/cookies" className="hover:text-[#101828] transition-colors">Cookie Preferences</Link>
            <span className="hidden md:inline text-[#DEE5EF]">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#078A57]"></span>
              <Link href="/status">All systems operational</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
