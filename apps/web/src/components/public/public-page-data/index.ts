import { platformSeeds } from './platform';
import { pricingSeeds } from './pricing';
import { resourceSeeds } from './resources';
import { roleSeeds } from './roles';
import { securitySeeds } from './security';
import { solutionSeeds } from './solutions';
import type {
  PublicPageAction,
  PublicPageKind,
  PublicPageProfile,
  PublicPageSeed,
} from './types';

export type {
  PublicPageAction,
  PublicPageKind,
  PublicPageProfile,
  PublicPageQuestion,
  PublicPageRelatedLink,
  PublicPageSeed,
  PublicPageWorkflowStep,
} from './types';

const rootSeeds: readonly PublicPageSeed[] = [
  {
    href: '/platform',
    title: 'CampusOS Platform',
    kind: 'platform',
    summary:
      'Connect academic, administrative, financial and student-facing work through one role-aware institutional operating platform.',
    focus: [
      'Shared institutional records and identity context',
      'Role-specific workspaces and accountable actions',
      'Connected workflows across departments and campuses',
      'Governed reporting, integration and operational improvement',
    ],
  },
  {
    href: '/solutions',
    title: 'Institutional Solutions',
    kind: 'solutions',
    summary:
      'Configure CampusOS around the institution type, strategic priority, governance model and delivery approach that shape your operations.',
    focus: [
      'Institution-specific academic and service structures',
      'Strategic transformation and modernisation priorities',
      'Phased adoption across teams and campuses',
      'Measurable service, governance and operating outcomes',
    ],
  },
  {
    href: '/roles',
    title: 'Role-Aware Workspaces',
    kind: 'roles',
    summary:
      'Give every authorised user a focused workspace built around their responsibilities, approvals, information needs and next actions.',
    focus: [
      'Leadership oversight and institutional decisions',
      'Academic delivery, assessment and student support',
      'Administrative, finance and campus operations',
      'Student, parent and community self-service',
    ],
  },
  {
    href: '/resources',
    title: 'CampusOS Resources',
    kind: 'resources',
    summary:
      'Use practical guides, planning tools, product documentation and implementation material to support an informed institutional decision.',
    focus: [
      'Platform evaluation and requirements planning',
      'Implementation, migration and adoption guidance',
      'Security, procurement and architecture review',
      'Product learning, updates and operational support',
    ],
  },
  {
    href: '/about',
    title: 'About CampusOS',
    kind: 'company',
    summary:
      'CampusOS is designed to help higher-education institutions coordinate the accountable work behind learning, administration and student service.',
    focus: [
      'Higher-education operating context',
      'Connected and responsible product design',
      'Institutional partnership and implementation discipline',
      'Long-term trust, service and product improvement',
    ],
  },
  {
    href: '/contact',
    title: 'Contact CampusOS',
    kind: 'contact',
    summary:
      'Discuss your institution, current systems, priority workflows and implementation expectations with the CampusOS team.',
    focus: [
      'Institution profile and operational priorities',
      'Current systems, data and integration landscape',
      'Required modules, users and campus scope',
      'Timeline, procurement and next-step planning',
    ],
  },
  {
    href: '/demo',
    title: 'Book a CampusOS Demo',
    kind: 'contact',
    summary:
      'Plan a role-focused product walkthrough around the workflows, decisions and service experiences most relevant to your institution.',
    focus: [
      'Institution and participant context',
      'Priority modules and workflows',
      'Role-based product walkthrough',
      'Questions, fit assessment and next steps',
    ],
  },
  {
    href: '/integrations',
    title: 'CampusOS Integrations',
    kind: 'platform',
    summary:
      'Plan controlled connections between CampusOS and approved identity, payment, learning, communication and institutional systems.',
    focus: [
      'System ownership and integration scope',
      'Authentication, interfaces and data mapping',
      'Monitoring, reconciliation and exception handling',
      'Security boundaries and long-term support ownership',
    ],
  },
  {
    href: '/trust',
    title: 'CampusOS Trust Centre',
    kind: 'security',
    summary:
      'Review public information about security, privacy, availability, subprocessors and responsible service operations.',
    focus: [
      'Security architecture and access controls',
      'Privacy and institutional data responsibilities',
      'Availability, continuity and incident communication',
      'Supplier, portability and assurance information',
    ],
  },
  {
    href: '/partners',
    title: 'CampusOS Partners',
    kind: 'company',
    summary:
      'Coordinate technology, delivery and advisory partnerships around clear responsibilities and institutional outcomes.',
    focus: [
      'Technology and integration partnerships',
      'Implementation and service-delivery partnerships',
      'Higher-education advisory collaboration',
      'Shared governance, enablement and customer outcomes',
    ],
  },
  {
    href: '/status',
    title: 'CampusOS System Status',
    kind: 'security',
    summary:
      'Review the currently published status of CampusOS application, API, database and deployment services.',
    focus: [
      'Current service availability',
      'Component-level health information',
      'Incident and maintenance communication',
      'Transparent operational follow-up',
    ],
  },
] as const;

const allSeeds: readonly PublicPageSeed[] = [
  ...rootSeeds,
  ...platformSeeds,
  ...solutionSeeds,
  ...roleSeeds,
  ...resourceSeeds,
  ...securitySeeds,
  ...pricingSeeds,
];

const seedByHref = new Map(allSeeds.map((seed) => [normalisePath(seed.href), seed]));

const kindLabels: Record<PublicPageKind, string> = {
  platform: 'CONNECTED PLATFORM',
  solution: 'INSTITUTIONAL SOLUTION',
  solutions: 'SOLUTION PORTFOLIO',
  role: 'ROLE-AWARE WORKSPACE',
  roles: 'INSTITUTIONAL ROLES',
  resource: 'PRACTICAL RESOURCE',
  resources: 'RESOURCE CENTRE',
  security: 'TRUST AND SECURITY',
  pricing: 'COMMERCIAL PLANNING',
  company: 'ABOUT CAMPUSOS',
  contact: 'START A CONVERSATION',
};

const categoryLabels: Record<PublicPageKind, string> = {
  platform: 'Platform capability',
  solution: 'Institutional model',
  solutions: 'Institutional solutions',
  role: 'Role experience',
  roles: 'Role experiences',
  resource: 'Planning resource',
  resources: 'Resource library',
  security: 'Trust information',
  pricing: 'Pricing and procurement',
  company: 'Company information',
  contact: 'Consultation and discovery',
};

const audienceByKind: Record<PublicPageKind, readonly string[]> = {
  platform: ['Functional owners', 'Institution administrators', 'Technology teams', 'Authorised end users'],
  solution: ['Institution leadership', 'Transformation teams', 'Functional owners', 'Technology and procurement teams'],
  solutions: ['Institution leadership', 'Programme sponsors', 'Operations leaders', 'Technology teams'],
  role: ['Role holders', 'Line managers', 'Institution administrators', 'Implementation teams'],
  roles: ['Leadership teams', 'Academic teams', 'Administrative teams', 'Students and community users'],
  resource: ['Decision makers', 'Project teams', 'Functional owners', 'Technology and governance teams'],
  resources: ['Evaluation teams', 'Implementation teams', 'Administrators', 'Product users'],
  security: ['Security and privacy teams', 'Technology leaders', 'Procurement teams', 'Institution administrators'],
  pricing: ['Procurement teams', 'Executive sponsors', 'Technology leaders', 'Implementation owners'],
  company: ['Institution leaders', 'Prospective partners', 'Candidates', 'Higher-education stakeholders'],
  contact: ['Institution leaders', 'Project sponsors', 'Functional owners', 'Technology and procurement teams'],
};

const governanceByKind: Record<PublicPageKind, readonly string[]> = {
  platform: [
    'Access should follow authenticated institution, role and permission context.',
    'Important workflow changes should retain actor, time, status and record references.',
    'Configuration and availability can vary by selected modules and deployment scope.',
    'Integrations require agreed data ownership, monitoring and support responsibilities.',
  ],
  solution: [
    'Institution structure, terminology and policies are confirmed during discovery.',
    'Programme and campus differences should remain visible instead of being flattened.',
    'Implementation should be phased around data readiness, ownership and operational risk.',
    'Outcome measures must use definitions agreed by the institution.',
  ],
  solutions: [
    'Solution design starts with the institution’s operating model and priorities.',
    'Selected capabilities remain subject to configuration, deployment and module scope.',
    'Cross-team ownership and escalation routes should be agreed before rollout.',
    'Progress should be reviewed using institution-approved evidence and measures.',
  ],
  role: [
    'The workspace should expose only information and actions relevant to assigned responsibility.',
    'Approvals and exceptions require clear ownership and escalation paths.',
    'Role changes and delegated access should be controlled and reviewable.',
    'No role should silently fall back to a broader administrator experience.',
  ],
  roles: [
    'Role definitions and permissions are configured by the institution.',
    'Shared records can be presented differently without creating conflicting sources of truth.',
    'Sensitive actions should require explicit authority and retain reviewable history.',
    'Mobile and self-service experiences should preserve the same access boundaries.',
  ],
  resource: [
    'Guidance should be adapted to the institution’s policies, systems and legal advice.',
    'Templates and calculators depend on transparent assumptions and user-provided inputs.',
    'Product status and availability should be confirmed against current documentation.',
    'Resources support evaluation and planning; they do not replace institutional approval.',
  ],
  resources: [
    'Use the latest published version of each resource during evaluation.',
    'Validate product and security claims against applicable evidence and deployment scope.',
    'Record assumptions, owners and decisions when using planning tools.',
    'Escalate unresolved technical or procurement questions to the appropriate specialist.',
  ],
  security: [
    'Security capabilities depend on deployment architecture and institution configuration.',
    'Access, encryption, retention and monitoring requirements should be documented before go-live.',
    'Assurance or certification claims require separate supporting evidence.',
    'Security responsibilities are shared across CampusOS, the institution and approved suppliers.',
  ],
  pricing: [
    'Commercial scope should clearly identify modules, users, campuses and environments.',
    'Implementation, migration, integration and support assumptions should be documented.',
    'Taxes, third-party services and institution-specific requirements may affect final pricing.',
    'A final proposal should be reviewed through the institution’s procurement process.',
  ],
  company: [
    'Public company information should distinguish current capability from future direction.',
    'Partnership commitments require agreed scope, ownership and commercial terms.',
    'Institutional and customer information must be handled under appropriate confidentiality.',
    'Product decisions should prioritise responsible, accessible and supportable delivery.',
  ],
  contact: [
    'Discovery information should be shared only by authorised institutional representatives.',
    'A demonstration uses fictional or approved non-production information.',
    'Requirements, timelines and commercial assumptions are confirmed after discovery.',
    'No implementation commitment is created until scope and responsibilities are agreed.',
  ],
};

const noteByKind: Record<PublicPageKind, string> = {
  platform: 'Capability availability depends on the institution configuration, selected modules, deployment model and implementation scope.',
  solution: 'This solution describes an operating pattern, not a promise that every institution uses the same structure or workflow.',
  solutions: 'Institutional fit is confirmed through discovery, requirements review and implementation planning.',
  role: 'The final workspace is permission-aware and may differ according to the user’s assigned responsibilities and institution configuration.',
  roles: 'Role names, responsibilities and access boundaries are configured by each institution.',
  resource: 'This material supports planning and evaluation and should be reviewed with the institution’s functional, technical and governance teams.',
  resources: 'Resource content may be updated as the product, implementation approach and institutional requirements evolve.',
  security: 'Security information is descriptive and must be validated against the selected deployment and available assurance evidence.',
  pricing: 'Illustrative scope information is not a binding quote. Final pricing requires confirmed requirements and commercial review.',
  company: 'Public information describes CampusOS direction and operating principles without disclosing confidential customer or employee information.',
  contact: 'Information submitted during discovery should be accurate, authorised and limited to what is necessary for the discussion.',
};

function normalisePath(path: string) {
  if (!path) return '/';
  const withoutQuery = path.split('?')[0].split('#')[0];
  const prefixed = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return prefixed.length > 1 ? prefixed.replace(/\/+$/, '') : prefixed;
}

function titleFromPath(path: string) {
  const finalSegment = normalisePath(path).split('/').filter(Boolean).at(-1) ?? 'CampusOS';
  return finalSegment
    .split('-')
    .map((word) => {
      if (word.toLowerCase() === 'ai') return 'AI';
      if (word.toLowerCase() === 'erp') return 'ERP';
      if (word.toLowerCase() === 'hr') return 'HR';
      if (word.toLowerCase() === 'roi') return 'ROI';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function inferredKind(path: string): PublicPageKind {
  const root = normalisePath(path).split('/').filter(Boolean)[0];
  if (root === 'platform' || root === 'integrations') return 'platform';
  if (root === 'solutions') return 'solution';
  if (root === 'roles') return 'role';
  if (root === 'security' || root === 'trust' || root === 'status') return 'security';
  if (root === 'pricing') return 'pricing';
  if (root === 'resources' || root === 'developers' || root === 'blueprint' || root === 'careers') return 'resource';
  if (root === 'contact' || root === 'demo') return 'contact';
  return 'company';
}

function fallbackSeed(path: string): PublicPageSeed {
  const title = titleFromPath(path);
  const kind = inferredKind(path);
  return {
    href: normalisePath(path),
    title,
    kind,
    summary: `Review the scope, operating considerations and implementation context for ${title.toLowerCase()} within CampusOS.`,
    focus: [
      `${title} scope and institutional context`,
      'Responsible teams, records and workflow ownership',
      'Configuration, integration and operating requirements',
      'Governance, review and implementation planning',
    ],
  };
}

function actionPair(kind: PublicPageKind): [PublicPageAction, PublicPageAction] {
  if (kind === 'pricing') {
    return [
      { label: 'Request tailored pricing', href: '/pricing/request-quote' },
      { label: 'Review implementation', href: '/pricing/implementation' },
    ];
  }
  if (kind === 'security') {
    return [
      { label: 'Visit the Trust Centre', href: '/trust' },
      { label: 'Contact our team', href: '/contact' },
    ];
  }
  if (kind === 'resource' || kind === 'resources') {
    return [
      { label: 'Browse all resources', href: '/resources' },
      { label: 'Discuss your requirements', href: '/contact' },
    ];
  }
  if (kind === 'role' || kind === 'roles') {
    return [
      { label: 'Book a role-based demo', href: '/demo' },
      { label: 'Explore the platform', href: '/platform' },
    ];
  }
  if (kind === 'solution' || kind === 'solutions') {
    return [
      { label: 'Discuss your institution', href: '/contact' },
      { label: 'Explore the platform', href: '/platform' },
    ];
  }
  if (kind === 'contact') {
    return [
      { label: 'Book a demonstration', href: '/demo' },
      { label: 'Explore the platform', href: '/platform' },
    ];
  }
  if (kind === 'company') {
    return [
      { label: 'Talk to CampusOS', href: '/contact' },
      { label: 'Explore the platform', href: '/platform' },
    ];
  }
  return [
    { label: 'Book a personalised demo', href: '/demo' },
    { label: 'Explore connected capabilities', href: '/platform' },
  ];
}

function profileForSeed(seed: PublicPageSeed): PublicPageProfile {
  const [primaryAction, secondaryAction] = actionPair(seed.kind);
  const sameKind = allSeeds.filter(
    (candidate) => candidate.kind === seed.kind && normalisePath(candidate.href) !== normalisePath(seed.href),
  );
  const relatedPool = sameKind.length >= 3 ? sameKind : allSeeds.filter((candidate) => candidate.href !== seed.href);

  return {
    ...seed,
    eyebrow: kindLabels[seed.kind],
    categoryLabel: categoryLabels[seed.kind],
    audiences: audienceByKind[seed.kind],
    outcomes: [
      `Create clearer ownership and shared context for ${seed.focus[0].toLowerCase()}.`,
      `Reduce fragmented handoffs around ${seed.focus[1].toLowerCase()}.`,
      `Give authorised teams visible status and next actions for ${seed.focus[2].toLowerCase()}.`,
      `Retain reviewable evidence and decisions for ${seed.focus[3].toLowerCase()}.`,
    ],
    workflow: [
      {
        number: '01',
        title: 'Define the operating scope',
        description: `Confirm the records, owners, policies and current process involved in ${seed.focus[0].toLowerCase()}.`,
      },
      {
        number: '02',
        title: 'Configure responsibilities',
        description: `Set up the roles, rules, statuses and handoffs needed for ${seed.focus[1].toLowerCase()}.`,
      },
      {
        number: '03',
        title: 'Run accountable work',
        description: `Bring tasks, exceptions and communication together around ${seed.focus[2].toLowerCase()}.`,
      },
      {
        number: '04',
        title: 'Review and improve',
        description: `Use authorised evidence to assess ${seed.focus[3].toLowerCase()} and agree the next improvement cycle.`,
      },
    ],
    governance: governanceByKind[seed.kind],
    questions: [
      {
        question: `What does ${seed.title} cover?`,
        answer: `${seed.summary} The detailed scope includes ${seed.focus.join(', ').toLowerCase()}.`,
      },
      {
        question: 'Who should be involved in evaluation?',
        answer: `A useful review normally includes ${audienceByKind[seed.kind].join(', ').toLowerCase()}, with responsibilities agreed before configuration or rollout.`,
      },
      {
        question: 'Can this work with existing institutional systems?',
        answer: 'That depends on the current system landscape, available interfaces, data ownership, security requirements and the agreed integration scope. These are confirmed during discovery.',
      },
      {
        question: 'How is access and accountability handled?',
        answer: 'CampusOS is designed around authenticated institution context, assigned roles, permission-aware actions and reviewable workflow history. Final controls depend on the selected deployment and configuration.',
      },
    ],
    note: noteByKind[seed.kind],
    primaryAction,
    secondaryAction,
    related: relatedPool.slice(0, 3).map((candidate) => ({
      label: candidate.title,
      href: candidate.href,
      description: candidate.summary,
    })),
  };
}

export function publicPageProfileForPath(path: string): PublicPageProfile {
  const normalised = normalisePath(path);
  return profileForSeed(seedByHref.get(normalised) ?? fallbackSeed(normalised));
}

export function menuDescriptionForHref(href: string): string {
  return (seedByHref.get(normalisePath(href)) ?? fallbackSeed(href)).summary;
}

export function menuCategoryForHref(href: string): string {
  const seed = seedByHref.get(normalisePath(href)) ?? fallbackSeed(href);
  return categoryLabels[seed.kind];
}

export function allDetailedPublicPagePaths(): readonly string[] {
  return allSeeds.map((seed) => seed.href);
}
