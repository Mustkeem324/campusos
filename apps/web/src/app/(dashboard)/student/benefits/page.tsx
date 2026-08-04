import React from 'react';
import { StudentBenefitsConsole } from '@/components/student/StudentBenefitsConsole';

export const metadata = {
  title: 'Student Benefits & Perks | CampusOS Dashboard',
  description: 'Access student developer pack perks, cloud credits, and software licenses.',
};

export default function StudentBenefitsDashboardPage() {
  return (
    <div className="pt-2">
      <StudentBenefitsConsole />
    </div>
  );
}
