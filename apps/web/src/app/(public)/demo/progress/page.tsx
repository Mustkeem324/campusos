import React from 'react';
import { DemoProgressConsole } from '@/components/demo/DemoProgressConsole';

export const metadata = {
  title: 'Demo Progress Centre | CampusOS',
  description: 'Track your story mode exploration progress, roles tested, and workflow completions.',
};

export default function DemoProgressPage() {
  return (
    <div className="bg-[#F5F7FB] min-h-screen py-10 md:py-16">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <DemoProgressConsole />
      </div>
    </div>
  );
}
