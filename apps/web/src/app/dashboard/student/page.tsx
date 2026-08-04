'use client';

import React from 'react';
import { RoleDashboard } from '@/components/dashboard/RoleDashboard';
import { RoleDashboardGuard } from '@/components/auth/RoleDashboardGuard';

export default function StudentDashboardPage() {
  return (
    <RoleDashboardGuard role="STUDENT"><div className="py-6 px-4 sm:px-6"><RoleDashboard /></div></RoleDashboardGuard>
  );
}
