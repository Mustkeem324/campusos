import type { CareerOpening } from './careers-types';

const demoOpenings: CareerOpening[] = [
  {
    id: 'demo-product-engineer',
    referenceCode: 'DEMO-ENG-001',
    slug: 'demo-senior-product-engineer',
    title: 'Senior Product Engineer',
    summary: 'Help design reliable, accessible workflows for institutions, educators and learners.',
    department: 'Engineering',
    team: 'Product Platform',
    location: 'India',
    workplaceType: 'HYBRID',
    employmentType: 'FULL_TIME',
    experienceLevel: 'Senior',
    status: 'PUBLISHED',
    responsibilities: [
      'Build and review accessible product workflows in Next.js and TypeScript.',
      'Partner with product, design and security teams on dependable platform capabilities.',
      'Improve testing, observability and release quality across shared services.',
    ],
    requiredQualifications: [
      'Strong TypeScript, React and backend API experience.',
      'Experience shipping secure, production-facing web applications.',
      'Clear written communication and thoughtful technical decision-making.',
    ],
    preferredQualifications: [
      'Experience with Next.js App Router, PostgreSQL or Prisma.',
      'Experience building multi-tenant SaaS products.',
      'Interest in higher-education technology and accessibility.',
    ],
    skills: ['TypeScript', 'Next.js', 'PostgreSQL', 'Testing', 'Accessibility'],
    benefits: ['Role-specific learning budget', 'Flexible collaboration model', 'Structured growth conversations'],
    postedAt: '2026-08-01',
    isDemo: true,
  },
  {
    id: 'demo-implementation-consultant',
    referenceCode: 'DEMO-IMP-001',
    slug: 'demo-implementation-consultant',
    title: 'Implementation Consultant',
    summary: 'Guide institutions through discovery, configuration, migration and launch planning.',
    department: 'Customer Success',
    team: 'Implementation',
    location: 'India',
    workplaceType: 'REMOTE',
    employmentType: 'FULL_TIME',
    experienceLevel: 'Mid-level',
    status: 'PUBLISHED',
    responsibilities: [
      'Map institutional processes into clear implementation plans.',
      'Coordinate data preparation, configuration review and launch readiness.',
      'Create clear documentation and maintain accountable project updates.',
    ],
    requiredQualifications: [
      'Experience in ERP implementation, operations or customer success.',
      'Strong workshop facilitation and documentation skills.',
      'Ability to work with academic and administrative stakeholders.',
    ],
    preferredQualifications: [
      'Higher-education operations experience.',
      'Experience with data migration and change management.',
    ],
    skills: ['Implementation', 'Process Mapping', 'Data Migration', 'Stakeholder Management'],
    benefits: ['Structured onboarding', 'Cross-functional exposure', 'Flexible collaboration model'],
    postedAt: '2026-08-01',
    isDemo: true,
  },
  {
    id: 'demo-product-design-intern',
    referenceCode: 'DEMO-INT-001',
    slug: 'demo-product-design-intern',
    title: 'Product Design Intern',
    summary: 'Support research and interface design for complex education workflows.',
    department: 'Design',
    team: 'Product Design',
    location: 'India',
    workplaceType: 'REMOTE',
    employmentType: 'INTERNSHIP',
    experienceLevel: 'Internship',
    status: 'PUBLISHED',
    responsibilities: [
      'Create clear user flows, wireframes and interaction specifications.',
      'Support usability reviews and accessibility checks.',
      'Document design decisions for engineering handoff.',
    ],
    requiredQualifications: [
      'A portfolio demonstrating product thinking and interface design.',
      'Comfort working with feedback and documenting decisions.',
      'Understanding of responsive design fundamentals.',
    ],
    preferredQualifications: [
      'Familiarity with accessibility standards.',
      'Interest in education, operations or enterprise software.',
    ],
    skills: ['Product Design', 'Figma', 'Accessibility', 'User Research'],
    benefits: ['Mentored project work', 'Portfolio-ready outcomes', 'Flexible collaboration model'],
    postedAt: '2026-08-01',
    isDemo: true,
  },
];

function isCareerOpening(value: unknown): value is CareerOpening {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CareerOpening>;
  return Boolean(
    candidate.id &&
      candidate.referenceCode &&
      candidate.slug &&
      candidate.title &&
      candidate.summary &&
      candidate.department &&
      candidate.team &&
      candidate.location &&
      candidate.workplaceType &&
      candidate.employmentType &&
      candidate.experienceLevel &&
      candidate.status &&
      Array.isArray(candidate.responsibilities) &&
      Array.isArray(candidate.requiredQualifications) &&
      Array.isArray(candidate.preferredQualifications) &&
      Array.isArray(candidate.skills) &&
      Array.isArray(candidate.benefits),
  );
}

function configuredOpenings(): CareerOpening[] {
  const raw = process.env.CAREERS_JOBS_JSON;
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCareerOpening);
  } catch {
    return [];
  }
}

export function getCareerOpenings(options?: { includeUnpublished?: boolean; includeDemo?: boolean }): CareerOpening[] {
  const configured = configuredOpenings();
  const includeDemo = options?.includeDemo ?? process.env.DEMO_MODE === 'true';
  const combined = includeDemo && configured.length === 0 ? demoOpenings : configured;

  if (options?.includeUnpublished) return combined;
  return combined.filter((opening) => opening.status === 'PUBLISHED');
}

export function getCareerOpeningBySlug(slug: string, options?: { includeUnpublished?: boolean; includeDemo?: boolean }) {
  return getCareerOpenings(options).find((opening) => opening.slug === slug) ?? null;
}
