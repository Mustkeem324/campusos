import type { ReactNode } from 'react';

import { CareersFooterBanner } from '@/components/public/CareersFooterBanner';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9FD] font-sans">
      <PublicHeader />
      <main id="main-content" className="flex flex-1 flex-col">
        {children}
      </main>
      <CareersFooterBanner />
      <PublicFooter />
    </div>
  );
}
