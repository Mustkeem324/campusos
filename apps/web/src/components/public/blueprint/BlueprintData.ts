export type BlueprintCategory = 
  | 'Product Philosophy' 
  | 'Platform Architecture' 
  | 'AI' 
  | 'Experience' 
  | 'Technology' 
  | 'Security and Trust' 
  | 'Configuration' 
  | 'Extensibility';

export type BlueprintAudience = 
  | 'Executive' 
  | 'Product' 
  | 'Technology' 
  | 'Security' 
  | 'Developer' 
  | 'Procurement';

export type ImplementationStatus = 'IMPLEMENTED' | 'PARTIAL' | 'IN_DEVELOPMENT' | 'PLANNED' | 'NOT_APPLICABLE';
export type PublicStatus = 'APPROVED' | 'UNDER_REVIEW' | 'ARCHIVED';

export interface BlueprintTopic {
  id: string;
  number: string;
  label: string;
  question: string;
  description: string;
  readingTime: string;
  category: BlueprintCategory;
  audiences: BlueprintAudience[];
  implementationStatus: ImplementationStatus;
  publicStatus: PublicStatus;
  featured?: boolean;
}

export const blueprintTopics: BlueprintTopic[] = [
  {
    id: 'thesis',
    number: '01',
    label: 'THESIS',
    question: 'What is CampusOS?',
    description: 'Why a university needs an operating system rather than disconnected applications.',
    readingTime: '3 min read',
    category: 'Product Philosophy',
    audiences: ['Executive', 'Procurement', 'Product'],
    implementationStatus: 'IMPLEMENTED',
    publicStatus: 'APPROVED'
  },
  {
    id: 'institutional-problem',
    number: '02',
    label: 'THE PROBLEM',
    question: 'Why does conventional campus software fail?',
    description: 'The cost of fragmented systems, duplicate records, and departmental silos.',
    readingTime: '4 min read',
    category: 'Product Philosophy',
    audiences: ['Executive', 'Procurement'],
    implementationStatus: 'NOT_APPLICABLE',
    publicStatus: 'APPROVED'
  },
  {
    id: 'shared-core',
    number: '03',
    label: 'SHARED CORE',
    question: 'What does every CampusOS service inherit?',
    description: 'One secure foundation for identity, permissions, workflow, and audit logging.',
    readingTime: '6 min read',
    category: 'Platform Architecture',
    audiences: ['Technology', 'Security', 'Developer'],
    implementationStatus: 'IMPLEMENTED',
    publicStatus: 'APPROVED',
    featured: true
  },
  {
    id: 'context-access',
    number: '04',
    label: 'CONTEXT-AWARE ACCESS',
    question: 'How is access resolved?',
    description: 'Permissions enforced across institution, campus, role, and workflow state.',
    readingTime: '5 min read',
    category: 'Security and Trust',
    audiences: ['Security', 'Technology'],
    implementationStatus: 'IMPLEMENTED',
    publicStatus: 'APPROVED'
  },
  {
    id: 'platform-systems',
    number: '05',
    label: 'SYSTEMS',
    question: 'How is CampusOS organised?',
    description: 'The 11 integrated systems driving the modern campus experience.',
    readingTime: '8 min read',
    category: 'Platform Architecture',
    audiences: ['Product', 'Executive', 'Procurement'],
    implementationStatus: 'IMPLEMENTED',
    publicStatus: 'APPROVED',
    featured: true
  },
  {
    id: 'platform-ai',
    number: '06',
    label: 'PLATFORM AI',
    question: 'How is AI built into CampusOS?',
    description: 'Embedded, permission-scoped intelligence requiring human accountability.',
    readingTime: '5 min read',
    category: 'AI',
    audiences: ['Technology', 'Executive', 'Product'],
    implementationStatus: 'PARTIAL',
    publicStatus: 'APPROVED'
  },
  {
    id: 'ai-features',
    number: '07',
    label: 'AI FEATURES',
    question: 'Where does AI appear?',
    description: 'Practical intelligence for students, faculty, and administrators.',
    readingTime: '4 min read',
    category: 'AI',
    audiences: ['Product', 'Executive'],
    implementationStatus: 'IN_DEVELOPMENT',
    publicStatus: 'APPROVED'
  },
  {
    id: 'ai-principles',
    number: '08',
    label: 'AI PRINCIPLES',
    question: 'How does CampusOS think about AI?',
    description: 'Our 10 principles for responsible, auditable, and secure campus intelligence.',
    readingTime: '3 min read',
    category: 'AI',
    audiences: ['Security', 'Executive', 'Procurement'],
    implementationStatus: 'NOT_APPLICABLE',
    publicStatus: 'APPROVED'
  },
  {
    id: 'design-system',
    number: '09',
    label: 'DESIGN SYSTEM',
    question: 'How does CampusOS remain coherent?',
    description: 'A unified interaction language across every role and workspace.',
    readingTime: '4 min read',
    category: 'Experience',
    audiences: ['Product', 'Developer'],
    implementationStatus: 'IMPLEMENTED',
    publicStatus: 'APPROVED'
  },
  {
    id: 'technology-stack',
    number: '10',
    label: 'STACK',
    question: 'What is CampusOS built on?',
    description: 'The proven enterprise technologies powering our SaaS infrastructure.',
    readingTime: '6 min read',
    category: 'Technology',
    audiences: ['Technology', 'Developer', 'Security'],
    implementationStatus: 'IMPLEMENTED',
    publicStatus: 'APPROVED'
  },
  {
    id: 'security-architecture',
    number: '11',
    label: 'SECURITY',
    question: 'How is institutional data protected?',
    description: 'Defense-in-depth architecture, tenant isolation, and verifiable controls.',
    readingTime: '7 min read',
    category: 'Security and Trust',
    audiences: ['Security', 'Technology', 'Procurement'],
    implementationStatus: 'IMPLEMENTED',
    publicStatus: 'APPROVED',
    featured: true
  },
  {
    id: 'compliance',
    number: '12',
    label: 'COMPLIANCE',
    question: 'What institutional requirements can CampusOS support?',
    description: 'Workflows designed to support regional and global regulatory readiness.',
    readingTime: '5 min read',
    category: 'Security and Trust',
    audiences: ['Executive', 'Security', 'Procurement'],
    implementationStatus: 'IMPLEMENTED',
    publicStatus: 'APPROVED'
  },
  {
    id: 'configuration',
    number: '13',
    label: 'CONFIGURATION',
    question: 'How does CampusOS adapt to an institution?',
    description: 'Deep parameterization across academics, operations, and deployment.',
    readingTime: '5 min read',
    category: 'Configuration',
    audiences: ['Product', 'Technology'],
    implementationStatus: 'IMPLEMENTED',
    publicStatus: 'APPROVED'
  },
  {
    id: 'developer',
    number: '14',
    label: 'DEVELOPER',
    question: 'Can institutions extend CampusOS?',
    description: 'APIs, webhooks, and secure integration adapters for custom workflows.',
    readingTime: '6 min read',
    category: 'Extensibility',
    audiences: ['Developer', 'Technology'],
    implementationStatus: 'PARTIAL',
    publicStatus: 'APPROVED'
  },
  {
    id: 'institution-types',
    number: '15',
    label: 'WHO IT IS FOR',
    question: 'Which institutions can use CampusOS?',
    description: 'Tailored solutions for universities, autonomous colleges, and campus groups.',
    readingTime: '3 min read',
    category: 'Product Philosophy',
    audiences: ['Executive', 'Procurement'],
    implementationStatus: 'IMPLEMENTED',
    publicStatus: 'APPROVED'
  }
];
