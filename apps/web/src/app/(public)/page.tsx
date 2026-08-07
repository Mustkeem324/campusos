import { cookies } from 'next/headers';
import Link from 'next/link';
import React from 'react';
import { AlertTriangle, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';

import { CustomerProofSection } from '@/components/public/homepage/CustomerProofSection';
import { EnterpriseHomepageSuite } from '@/components/public/homepage/EnterpriseHomepageSuite';
import { EnterprisePublicOverview } from '@/components/public/homepage/EnterprisePublicOverview';
import { EnterpriseWorkspaceHomePremium } from '@/components/public/homepage/EnterpriseWorkspaceHomePremium';
import { FinalCta } from '@/components/public/homepage/FinalCta';
import { HeroSection } from '@/components/public/homepage/HeroSection';
import { ImplementationJourney } from '@/components/public/homepage/ImplementationJourney';
import { IndianCampaignPopup } from '@/components/public/homepage/IndianCampaignPopup';
import { InstitutionalAssuranceRoadmap } from '@/components/public/homepage/InstitutionalAssuranceRoadmap';
import { InstitutionTypeSection } from '@/components/public/homepage/InstitutionTypeSection';
import { OperatingStorySection } from '@/components/public/homepage/OperatingStorySection';
import { PlatformSystemsSection } from '@/components/public/homepage/PlatformSystemsSection';
import { PricingSection } from '@/components/public/homepage/PricingSection';
import { RegionalCapabilities } from '@/components/public/homepage/RegionalCapabilities';
import { ResourcePreview } from '@/components/public/homepage/ResourcePreview';
import { SecuritySection } from '@/components/public/homepage/SecuritySection';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { sanitizeEnterpriseHomeData } from '@/lib/homepage/sanitize';
import { getEnterpriseHomepageData } from '@/lib/homepage/workspace';

export const dynamic = 'force-dynamic';

export default async function Homepage() {
  const hasSessionCookie = cookies().has('campusos_session');
  const context = hasSessionCookie
    ? await requireActiveUserContext().catch((error: unknown) => {
        console.error('Unable to resolve active homepage context:', error);
        return null;
      })
    : null;

  const workspaceData = context
    ? await getEnterpriseHomepageData(context)
        .then(sanitizeEnterpriseHomeData)
        .catch((error: unknown) => {
          console.error('Unable to load enterprise homepage workspace:', error);
          return null;
        })
    : null;

  const workspaceFailed = hasSessionCookie && (!context || !workspaceData);

  return (
    <div className="flex w-full flex-col overflow-x-clip bg-white text-[#101828]">
      {!hasSessionCookie && <IndianCampaignPopup />}
      {workspaceData && <EnterpriseWorkspaceHomePremium data={workspaceData} />}
      {workspaceFailed && <WorkspaceLoadError />}

      <div id="platform-overview" className="w-full">
        <HeroSection />
        <EnterprisePublicOverview />
        <EnterpriseHomepageSuite />
        <OperatingStorySection />
        <InstitutionTypeSection />
        <PlatformSystemsSection />
        <RegionalCapabilities />
        <ImplementationJourney />
        <SecuritySection />
        <InstitutionalAssuranceRoadmap />
        <ResourcePreview />
        <CustomerProofSection />
        <PricingSection />
        <FinalCta />
      </div>
    </div>
  );
}

function WorkspaceLoadError() {
  return (
    <section className="border-b border-[#E2E8F0] bg-[#F6F8FB] px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="workspace-load-error-title">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-5 overflow-hidden rounded-[12px] border border-[#E8C8C4] bg-white shadow-[0_5px_16px_rgba(16,24,40,0.04)] lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
          <div className="flex h-full min-h-28 items-center justify-center border-b border-[#F0D6D2] bg-[#FFF7F6] px-6 lg:border-b-0 lg:border-r">
            <span className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#F0B9B5] bg-white text-[#B42318]"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></span>
          </div>
          <div className="px-5 pb-2 lg:py-5">
            <div className="flex flex-wrap items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#B42318]"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Signed-in workspace</div>
            <h1 id="workspace-load-error-title" className="mt-2 text-xl font-extrabold tracking-[-0.03em] text-[#101828]">Your session exists, but the role workspace could not be prepared.</h1>
            <p className="mt-2 max-w-[800px] text-xs leading-5 text-[#667085]">CampusOS did not fall back to a visitor/demo experience. Refresh the authorised workspace or sign in again if your role, profile or institution context has changed.</p>
          </div>
          <div className="flex flex-col gap-2 px-5 pb-5 lg:px-5 lg:py-5">
            <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-[#101D38] px-4 text-xs font-extrabold text-white hover:bg-[#17284A]"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Retry workspace</Link>
            <Link href="/login" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-[#C9D5E4] bg-white px-4 text-xs font-extrabold text-[#1754E8] hover:bg-[#F7F9FC]">Sign in again <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
