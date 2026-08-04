import React from 'react';
import { ScenarioCentreConsole } from '@/components/demo/ScenarioCentreConsole';

export const metadata = {
  title: 'Demo Scenarios | CampusOS Help Centre',
  description: 'Explore connected campus workflows and switch roles in real time.',
};

export default function HelpDemoScenariosPage() {
  return (
    <div className="py-6">
      <ScenarioCentreConsole />
    </div>
  );
}
