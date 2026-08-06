import React from 'react';

import { CustomerProofSection } from '@/components/public/homepage/CustomerProofSection';
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

export default function Homepage() {
  return (
    <div className="flex w-full flex-col bg-white">
      <IndianCampaignPopup />
      <HeroSection />
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
  );
}
