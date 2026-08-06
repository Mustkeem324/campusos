import React from 'react';

import { StudentBenefitsConsole } from '@/components/student/StudentBenefitsConsole';

export const metadata = {
  title: 'Student Benefits, Scholarships & Learning Resources | CampusOS',
  description:
    'Search reviewed official student opportunities across scholarships, developer tools, courses, internships, academic services and wellbeing support.',
};

export default function StudentBenefitsPublicPage() {
  return (
    <main className="min-h-screen bg-[#F3F6FA] py-6 text-[#172033] dark:bg-[#090D16] dark:text-slate-100 sm:py-10 lg:py-14">
      <div className="mx-auto w-full max-w-[1500px] px-3 sm:px-5 lg:px-8 xl:px-10">
        <StudentBenefitsConsole />
      </div>
    </main>
  );
}
