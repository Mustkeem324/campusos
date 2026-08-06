import React from 'react';

import { StudentBenefitsConsole } from '@/components/student/StudentBenefitsConsole';

export const metadata = {
  title: 'Verified Student Benefits Directory | CampusOS',
  description:
    'Search official student software, cloud credits, education licences, learning offers and regional discounts with transparent eligibility and renewal notes.',
};

export default function StudentBenefitsPublicPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FA] py-8 dark:bg-[#080D16] sm:py-12 lg:py-16">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <StudentBenefitsConsole />
      </div>
    </div>
  );
}
