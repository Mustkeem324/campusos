import React from 'react';
import { HowCampusOsWorksConsole } from '@/components/demo/HowCampusOsWorksConsole';

export const metadata = {
  title: 'How CampusOS Works | Multi-Tenant Architecture & Workflows',
  description: 'Learn how CampusOS connects university departments, multi-tenant row-level security, role workspaces, and automated academic/finance workflows.',
};

export default function HowCampusOsWorksPage() {
  return (
    <div className="bg-[#F5F7FB] min-h-screen py-10 md:py-16">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <HowCampusOsWorksConsole />
      </div>
    </div>
  );
}
