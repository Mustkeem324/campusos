import React from 'react';
import { ScenarioCentreConsole } from '@/components/demo/ScenarioCentreConsole';

export const metadata = {
  title: 'Explore Connected CampusOS Workflows | Demo Scenarios',
  description: 'Complete fictional campus workflows and switch roles to see how one action updates the right people, records and dashboards.',
};

export default function DemoScenariosPage() {
  return (
    <div className="bg-[#F5F7FB] min-h-screen py-10 md:py-16">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <ScenarioCentreConsole />
      </div>
    </div>
  );
}
