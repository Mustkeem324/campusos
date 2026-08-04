import React from 'react';
import { StudentBenefitsConsole } from '@/components/student/StudentBenefitsConsole';

export const metadata = {
  title: 'Student Benefits & Developer Pack Hub | CampusOS',
  description: 'Unlock over $3,500/year in free developer tools, software licenses, AI subscriptions, and learning resources with your CampusOS student credentials.',
};

export default function StudentBenefitsPublicPage() {
  return (
    <div className="bg-[#F5F7FB] min-h-screen py-10 md:py-16">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <StudentBenefitsConsole />
      </div>
    </div>
  );
}
