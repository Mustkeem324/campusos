import React from 'react';

import { CampusCommandCenterSection } from '@/components/public/homepage/CampusCommandCenterSection';
import { CustomerProofSection } from '@/components/public/homepage/CustomerProofSection';
import { FinalCta } from '@/components/public/homepage/FinalCta';
import { HeroSection } from '@/components/public/homepage/HeroSection';
import { ImplementationJourney } from '@/components/public/homepage/ImplementationJourney';
import { InstitutionTypeSection } from '@/components/public/homepage/InstitutionTypeSection';
import { OperatingStorySection } from '@/components/public/homepage/OperatingStorySection';
import { PlatformSystemsSection } from '@/components/public/homepage/PlatformSystemsSection';
import { PricingSection } from '@/components/public/homepage/PricingSection';
import { ProductTourSection } from '@/components/public/homepage/ProductTourSection';
import { RegionalCapabilities } from '@/components/public/homepage/RegionalCapabilities';
import { ResourcePreview } from '@/components/public/homepage/ResourcePreview';
import { RoleExperienceSection } from '@/components/public/homepage/RoleExperienceSection';
import { SecuritySection } from '@/components/public/homepage/SecuritySection';
import { WorkflowSection } from '@/components/public/homepage/WorkflowSection';

export default function Homepage() {
  return (
    <div className="flex w-full flex-col bg-white">
      <HeroSection />
      <OperatingStorySection />
      <CampusCommandCenterSection />
      <InstitutionTypeSection />
      <PlatformSystemsSection />
      <RoleExperienceSection />
      <ProductTourSection />
      <WorkflowSection />
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
