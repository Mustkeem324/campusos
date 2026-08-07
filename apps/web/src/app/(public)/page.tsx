import React from 'react';

import { CustomerProofSection } from '@/components/public/homepage/CustomerProofSection';
import { EnterprisePublicOverview } from '@/components/public/homepage/EnterprisePublicOverview';
import { EnterpriseWorkspaceHome } from '@/components/public/homepage/EnterpriseWorkspaceHome';
import { FinalCta } from '@/components/public/homepage/FinalCta';
import { HeroSection } from '@/components/public/homepage/HeroSection';
import { ImplementationJourney } from '@/components/public/homepage/ImplementationJourney';
import { IndianCampaignPopup } from '@/components/public/homepage/IndianCampaignPopup';
import { InstitutionTypeSection } from '@/components/public/homepage/InstitutionTypeSection';
import { OperatingStorySection } from '@/components/public/homepage/OperatingStorySection';
import { PlatformSystemsSection } from '@/components/public/homepage/PlatformSystemsSection';
import { PricingSection } from '@/components/public/homepage/PricingSection';
import { RegionalCapabilities } from '@/components/public/homepage/RegionalCapabilities';
import { ResourcePreview } from '@/components/public/homepage/ResourcePreview';
import { SecuritySection } from '@/components/public/homepage/SecuritySection';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getEnterpriseHomepageData } from '@/lib/homepage/workspace';

export const dynamic = 'force-dynamic';

export default async function Homepage() {
  const context = await requireActiveUserContext().catch(() => null);
  const workspaceData = context
    ? await getEnterpriseHomepageData(context).catch((error: unknown) => {
        console.error('Unable to load enterprise homepage workspace:', error);
        return null;
      })
    : null;

  return (
    <div className="flex w-full flex-col bg-white">
      {!context && <IndianCampaignPopup />}
      {workspaceData && <EnterpriseWorkspaceHome data={workspaceData} />}

      <div id="platform-overview">
        <HeroSection />
        <EnterprisePublicOverview />
        <OperatingStorySection />
        <InstitutionTypeSection />
        <PlatformSystemsSection />
        <RegionalCapabilities />
        <ImplementationJourney />
        <SecuritySection />
        <ResourcePreview />
        <CustomerProofSection />
        <PricingSection />
        <FinalCta />
      </div>
    </div>
  );
}
