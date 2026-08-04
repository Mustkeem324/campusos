import React from 'react';
import { ScenarioWorkspaceConsole } from '@/components/demo/ScenarioWorkspaceConsole';

export const metadata = {
  title: 'Scenario Workspace | CampusOS Connected Story Mode',
  description: 'Interactive scenario workspace for cross-role workflow execution and verification.',
};

export default function ScenarioWorkspacePage({ params }: { params: { scenarioId: string } }) {
  return (
    <div className="bg-[#F5F7FB] min-h-screen py-8 md:py-12">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <ScenarioWorkspaceConsole scenarioId={params.scenarioId} />
      </div>
    </div>
  );
}
