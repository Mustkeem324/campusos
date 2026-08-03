import React from 'react';
import { HeroSection } from '@/components/public/homepage/HeroSection';
import { InstitutionTypeSection } from '@/components/public/homepage/InstitutionTypeSection';
import { PlatformSystemsSection } from '@/components/public/homepage/PlatformSystemsSection';
import { RoleExperienceSection } from '@/components/public/homepage/RoleExperienceSection';
import { WorkflowSection } from '@/components/public/homepage/WorkflowSection';
import { ImplementationJourney } from '@/components/public/homepage/ImplementationJourney';
import { SecuritySection } from '@/components/public/homepage/SecuritySection';
import { CustomerProofSection } from '@/components/public/homepage/CustomerProofSection';
import { PricingSection } from '@/components/public/homepage/PricingSection';
import { FinalCta } from '@/components/public/homepage/FinalCta';
import { RegionalCapabilities } from '@/components/public/homepage/RegionalCapabilities';
import { ResourcePreview } from '@/components/public/homepage/ResourcePreview';

export default function Homepage() {
  return (
    <div className="flex flex-col w-full bg-white">
      <HeroSection />
      <InstitutionTypeSection />
      <PlatformSystemsSection />
      <RoleExperienceSection />
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
