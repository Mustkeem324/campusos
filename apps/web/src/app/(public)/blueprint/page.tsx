import { Metadata } from 'next';
import { BlueprintHero, BlueprintDirectory, BlueprintFinalCta } from '@/components/public/blueprint/BlueprintComponents';

export const metadata: Metadata = {
  title: 'CampusOS Blueprint — University Platform Architecture',
  description: 'Explore the architecture, shared foundation, security, AI governance, configuration and developer platform behind CampusOS.',
  openGraph: {
    title: 'CampusOS Blueprint',
    description: 'Explore the architecture behind CampusOS.',
    type: 'article',
  }
};

export default function BlueprintPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "CampusOS",
            "applicationCategory": "EducationalSoftware",
            "description": "University Operating System",
            "operatingSystem": "Web",
          })
        }}
      />
      
      <BlueprintHero />
      <BlueprintDirectory />
      <BlueprintFinalCta />
    </>
  );
}
