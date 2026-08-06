export type StudentBenefitCategory =
  | 'developer'
  | 'cloud'
  | 'ai'
  | 'productivity'
  | 'design'
  | 'learning'
  | 'career'
  | 'lifestyle';

export type StudentBenefitKind = 'free' | 'credit' | 'discount' | 'institution';

export type StudentBenefitAvailability = 'global' | 'regional' | 'institution';

export type StudentBenefit = {
  id: string;
  title: string;
  provider: string;
  category: StudentBenefitCategory;
  kind: StudentBenefitKind;
  availability: StudentBenefitAvailability;
  offerLabel: string;
  summary: string;
  eligibility: string;
  requirements: string[];
  tags: string[];
  claimUrl: string;
  sourceUrl: string;
  featured?: boolean;
  caveat?: string;
  lastVerified: string;
};

export const STUDENT_BENEFIT_CATEGORIES: Array<{
  id: StudentBenefitCategory;
  label: string;
}> = [
  { id: 'developer', label: 'Developer tools' },
  { id: 'cloud', label: 'Cloud & hosting' },
  { id: 'ai', label: 'AI tools' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'design', label: 'Design & 3D' },
  { id: 'learning', label: 'Learning' },
  { id: 'career', label: 'Career' },
  { id: 'lifestyle', label: 'Lifestyle' },
];

export const STUDENT_BENEFIT_KINDS: Array<{
  id: StudentBenefitKind;
  label: string;
}> = [
  { id: 'free', label: 'Free access' },
  { id: 'credit', label: 'Credits' },
  { id: 'discount', label: 'Student discount' },
  { id: 'institution', label: 'Institution access' },
];

const VERIFIED_ON = '2026-08-06';

export const STUDENT_BENEFITS: StudentBenefit[] = [
  {
    id: 'github-student-pack',
    title: 'GitHub Student Developer Pack',
    provider: 'GitHub Education',
    category: 'developer',
    kind: 'free',
    availability: 'global',
    offerLabel: 'Free while verified',
    summary:
      'GitHub Pro plus a changing catalogue of developer, cloud, domain, learning and productivity partner offers.',
    eligibility: 'Verified students aged 13 or older.',
    requirements: [
      'A personal GitHub account',
      'Proof of current student status',
      'A school-issued email or supporting document when requested',
    ],
    tags: ['GitHub Pro', 'partner offers', 'coding', 'domains'],
    claimUrl: 'https://education.github.com/pack/join',
    sourceUrl: 'https://education.github.com/pack',
    featured: true,
    caveat: 'Partner offers, limits and eligibility can change. Review the current pack before claiming.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'github-copilot-student',
    title: 'GitHub Copilot Student',
    provider: 'GitHub',
    category: 'ai',
    kind: 'free',
    availability: 'global',
    offerLabel: 'Free for verified students',
    summary:
      'Student access to GitHub Copilot features for coding assistance across supported editors and GitHub experiences.',
    eligibility: 'A verified GitHub Education student account.',
    requirements: ['Complete GitHub Education verification', 'Enable Copilot Student in GitHub settings'],
    tags: ['AI coding', 'VS Code', 'GitHub', 'Copilot'],
    claimUrl:
      'https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/enable-copilot/set-up-for-students',
    sourceUrl:
      'https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/enable-copilot/set-up-for-students',
    featured: true,
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'jetbrains-student-pack',
    title: 'JetBrains Student Pack',
    provider: 'JetBrains',
    category: 'developer',
    kind: 'free',
    availability: 'global',
    offerLabel: 'Free educational licence',
    summary:
      'Educational access to JetBrains IDEs and developer tools, including IntelliJ IDEA, PyCharm and WebStorm.',
    eligibility: 'Students enrolled at a recognised educational institution.',
    requirements: ['Verify student status', 'Use the tools only under the educational licence terms'],
    tags: ['IDE', 'Java', 'Python', 'WebStorm'],
    claimUrl: 'https://www.jetbrains.com/community/education/#students',
    sourceUrl: 'https://www.jetbrains.com/community/education/#students',
    featured: true,
    caveat: 'Renewal and permitted use follow JetBrains educational licence rules.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'notion-education',
    title: 'Notion Education Plus',
    provider: 'Notion',
    category: 'productivity',
    kind: 'free',
    availability: 'global',
    offerLabel: 'Free Plus plan',
    summary:
      'A free Plus plan for an eligible individual student workspace, with expanded uploads and page history.',
    eligibility: 'Students at accredited colleges or universities using an eligible school email.',
    requirements: ['Use an eligible school email', 'Apply from Notion account settings'],
    tags: ['notes', 'projects', 'wiki', 'productivity'],
    claimUrl: 'https://www.notion.com/help/notion-for-education',
    sourceUrl: 'https://www.notion.com/help/notion-for-education',
    featured: true,
    caveat: 'The individual education plan is intended for a one-member workspace; team offers differ.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'figma-education',
    title: 'Figma for Education',
    provider: 'Figma',
    category: 'design',
    kind: 'free',
    availability: 'global',
    offerLabel: 'Free education plan',
    summary:
      'Education access to Figma and FigJam for UI design, prototyping, collaboration and classroom projects.',
    eligibility: 'Eligible students and educators who complete education verification.',
    requirements: ['Create a Figma account', 'Apply with school information and proof when requested'],
    tags: ['UI/UX', 'prototyping', 'FigJam', 'collaboration'],
    claimUrl: 'https://www.figma.com/education/',
    sourceUrl: 'https://help.figma.com/hc/en-us/articles/360041061214-Figma-for-Education',
    featured: true,
    caveat: 'Available features can differ by education level and programme rules.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'azure-for-students',
    title: 'Azure for Students',
    provider: 'Microsoft Azure',
    category: 'cloud',
    kind: 'credit',
    availability: 'global',
    offerLabel: '$100 Azure credit',
    summary:
      'Cloud credit plus selected free Azure services for eligible students, with no credit card required for signup.',
    eligibility: 'Eligible full-time students who can verify through their school or university.',
    requirements: ['Eligible school email or academic verification', 'One student subscription per eligible customer'],
    tags: ['cloud', 'AI', 'databases', 'hosting'],
    claimUrl: 'https://azure.microsoft.com/free/students/',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/education-hub/about-azure-for-students',
    featured: true,
    caveat: 'Credits expire and service availability varies. Set budgets and review Azure usage limits.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'office-365-education',
    title: 'Office 365 Education',
    provider: 'Microsoft Education',
    category: 'productivity',
    kind: 'institution',
    availability: 'institution',
    offerLabel: 'Free for eligible schools',
    summary:
      'Web versions of Word, Excel, PowerPoint, OneNote and Teams through eligible educational institutions.',
    eligibility: 'Students and educators with an eligible school email at a qualifying institution.',
    requirements: ['Use your school email', 'Your institution must qualify for Office 365 Education'],
    tags: ['Word', 'Excel', 'PowerPoint', 'Teams'],
    claimUrl: 'https://www.microsoft.com/en-in/education/products/office',
    sourceUrl: 'https://www.microsoft.com/en-in/education/products/office',
    caveat: 'Desktop apps and advanced features depend on the plan selected by the institution.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'aws-educate',
    title: 'AWS Educate',
    provider: 'Amazon Web Services',
    category: 'learning',
    kind: 'free',
    availability: 'global',
    offerLabel: 'Free cloud learning',
    summary:
      'Free, self-paced cloud and AI learning paths, hands-on practice, digital badges and career resources.',
    eligibility: 'Open to individual learners; some career features require users to be 18 or older.',
    requirements: ['Create an AWS Educate learner account', 'Complete learning activities at your own pace'],
    tags: ['AWS', 'cloud skills', 'badges', 'career'],
    claimUrl: 'https://aws.amazon.com/education/awseducate/',
    sourceUrl: 'https://aws.amazon.com/education/awseducate/',
    caveat: 'AWS Educate is primarily a learning programme and does not promise promotional cloud credits.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'autodesk-education',
    title: 'Autodesk Education Plan',
    provider: 'Autodesk',
    category: 'design',
    kind: 'free',
    availability: 'global',
    offerLabel: 'Free one-year access',
    summary:
      'Renewable educational access to eligible Autodesk products such as AutoCAD, Fusion, Revit, Maya and 3ds Max.',
    eligibility: 'Eligible students enrolled at a qualified educational institution.',
    requirements: ['Complete Autodesk education verification', 'Use software only for educational purposes'],
    tags: ['AutoCAD', 'Fusion', 'Revit', 'Maya'],
    claimUrl: 'https://www.autodesk.com/in/education/edu-software/overview',
    sourceUrl: 'https://www.autodesk.com/in/education/edu-software/overview',
    featured: true,
    caveat: 'Educational licences are not for commercial, professional or other for-profit use.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'adobe-student',
    title: 'Adobe Creative Cloud Student Pricing',
    provider: 'Adobe',
    category: 'design',
    kind: 'discount',
    availability: 'regional',
    offerLabel: 'Student discount',
    summary:
      'Discounted Creative Cloud pricing for Photoshop, Illustrator, Premiere, Acrobat and other Adobe apps.',
    eligibility: 'Eligible students who meet Adobe age, enrolment and verification requirements.',
    requirements: ['Provide a school email or proof of enrolment', 'Review the annual-plan and renewal terms'],
    tags: ['Photoshop', 'Premiere', 'Illustrator', 'Acrobat'],
    claimUrl: 'https://www.adobe.com/in/education/students/creativecloud.html',
    sourceUrl: 'https://www.adobe.com/in/education/students/creativecloud.html',
    caveat: 'This is a paid subscription. Price, discount and renewal rate vary by country and promotion.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'unity-student',
    title: 'Unity Student Plan',
    provider: 'Unity',
    category: 'design',
    kind: 'free',
    availability: 'global',
    offerLabel: 'Free student plan',
    summary:
      'Verified students receive the Unity Pro Editor and selected student assets, tools and cloud benefits.',
    eligibility: 'Students aged 16 or older enrolled at an accredited educational institution.',
    requirements: ['Create or use a Unity ID', 'Complete SheerID verification', 'Renew while actively enrolled'],
    tags: ['game development', '3D', 'AR/VR', 'Unity Pro'],
    claimUrl: 'https://unity.com/products/unity-student',
    sourceUrl: 'https://unity.com/products/unity-student',
    caveat: 'The plan is individual, time-limited and governed by Unity student-plan terms.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'tableau-students',
    title: 'Tableau for Students',
    provider: 'Tableau',
    category: 'learning',
    kind: 'free',
    availability: 'global',
    offerLabel: 'Free public edition',
    summary:
      'Free Tableau Desktop Public Edition, Tableau Public publishing and student-focused data-learning resources.',
    eligibility: 'Learners who accept the Tableau Public terms; no traditional student licence renewal is required.',
    requirements: ['Create a Tableau Public profile', 'Do not use the Public Edition for commercial work'],
    tags: ['data visualisation', 'analytics', 'Tableau Public', 'portfolio'],
    claimUrl: 'https://www.tableau.com/academic/students',
    sourceUrl: 'https://www.tableau.com/academic/students',
    caveat: 'Work saved or published through Tableau Public is public; do not upload confidential data.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'appwrite-education',
    title: 'Appwrite Education Plan',
    provider: 'Appwrite via GitHub Education',
    category: 'cloud',
    kind: 'free',
    availability: 'global',
    offerLabel: 'Pack partner offer',
    summary:
      'Education-plan access for eligible GitHub Student Developer Pack members building web and mobile backends.',
    eligibility: 'Active GitHub Student Developer Pack membership.',
    requirements: ['Verify through GitHub Education', 'Redeem from the current pack offer'],
    tags: ['backend', 'BaaS', 'databases', 'hosting'],
    claimUrl: 'https://education.github.com/pack',
    sourceUrl: 'https://education.github.com/pack',
    caveat: 'Project limits and plan terms are maintained by Appwrite and GitHub Education and can change.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'datacamp-pack',
    title: 'DataCamp Student Pack Offer',
    provider: 'DataCamp via GitHub Education',
    category: 'learning',
    kind: 'free',
    availability: 'global',
    offerLabel: '3 months free',
    summary:
      'Time-limited access to DataCamp courses and tracks in Python, SQL, data science and machine learning.',
    eligibility: 'Active GitHub Student Developer Pack membership and DataCamp offer eligibility.',
    requirements: ['Open the DataCamp offer from the GitHub pack', 'Redeem using the connected student account'],
    tags: ['Python', 'SQL', 'data science', 'machine learning'],
    claimUrl: 'https://education.github.com/pack',
    sourceUrl: 'https://education.github.com/pack',
    caveat: 'Check billing and cancellation terms before the promotional period ends.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'gitkraken-student',
    title: 'GitKraken Student Offer',
    provider: 'GitKraken via GitHub Education',
    category: 'developer',
    kind: 'discount',
    availability: 'global',
    offerLabel: 'Free period + discount',
    summary:
      'Student access to GitKraken developer tools through the GitHub Student Developer Pack.',
    eligibility: 'Active GitHub Student Developer Pack membership.',
    requirements: ['Redeem through GitHub Education', 'Connect or create a GitKraken account'],
    tags: ['Git client', 'GitLens', 'Git workflow', 'developer tools'],
    claimUrl: 'https://education.github.com/pack',
    sourceUrl: 'https://education.github.com/pack',
    caveat: 'The free period, included products and later discount are controlled by the current pack offer.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'digitalocean-pack',
    title: 'DigitalOcean Student Credit',
    provider: 'DigitalOcean via GitHub Education',
    category: 'cloud',
    kind: 'credit',
    availability: 'global',
    offerLabel: 'Promotional cloud credit',
    summary:
      'A GitHub Student Developer Pack cloud-credit offer for eligible DigitalOcean services.',
    eligibility: 'Active GitHub Student Developer Pack membership and DigitalOcean redemption eligibility.',
    requirements: ['Redeem from the current GitHub pack', 'Review eligible services and expiry before use'],
    tags: ['hosting', 'cloud credit', 'containers', 'databases'],
    claimUrl: 'https://education.github.com/pack',
    sourceUrl: 'https://education.github.com/pack',
    caveat: 'Credit amount, expiry and excluded services can change; the current pack terms are authoritative.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'frontend-masters-pack',
    title: 'Frontend Masters Student Offer',
    provider: 'Frontend Masters via GitHub Education',
    category: 'learning',
    kind: 'free',
    availability: 'global',
    offerLabel: 'Pack learning offer',
    summary:
      'A student-pack learning offer covering modern frontend, JavaScript, web performance and engineering topics.',
    eligibility: 'Active GitHub Student Developer Pack membership and offer availability.',
    requirements: ['Open the offer inside the current GitHub pack', 'Create or connect a learning account'],
    tags: ['JavaScript', 'React', 'frontend', 'web development'],
    claimUrl: 'https://education.github.com/pack',
    sourceUrl: 'https://education.github.com/pack',
    caveat: 'Duration and course access are shown in the current GitHub pack and may change.',
    lastVerified: VERIFIED_ON,
  },
  {
    id: 'spotify-student',
    title: 'Spotify Premium Student',
    provider: 'Spotify',
    category: 'lifestyle',
    kind: 'discount',
    availability: 'regional',
    offerLabel: 'Regional student pricing',
    summary:
      'Discounted Spotify Premium pricing for eligible higher-education students in supported countries.',
    eligibility: 'Eligible students who pass Spotify student verification in a supported market.',
    requirements: ['Choose your country', 'Complete student verification', 'Re-verify when requested'],
    tags: ['music', 'audio', 'student pricing', 'entertainment'],
    claimUrl: 'https://www.spotify.com/student/',
    sourceUrl: 'https://www.spotify.com/student/',
    caveat: 'Price, bundles and availability differ by country. The page does not assume US-only bundles.',
    lastVerified: VERIFIED_ON,
  },
];

export function filterStudentBenefits(
  benefits: StudentBenefit[],
  options: {
    query?: string;
    category?: StudentBenefitCategory | 'all';
    kind?: StudentBenefitKind | 'all';
    savedIds?: Set<string>;
    savedOnly?: boolean;
  },
) {
  const query = options.query?.trim().toLowerCase() ?? '';

  return benefits.filter((benefit) => {
    const matchesCategory = !options.category || options.category === 'all' || benefit.category === options.category;
    const matchesKind = !options.kind || options.kind === 'all' || benefit.kind === options.kind;
    const matchesSaved = !options.savedOnly || Boolean(options.savedIds?.has(benefit.id));
    const searchable = [
      benefit.title,
      benefit.provider,
      benefit.summary,
      benefit.offerLabel,
      benefit.eligibility,
      benefit.category,
      benefit.kind,
      ...benefit.tags,
    ]
      .join(' ')
      .toLowerCase();

    return matchesCategory && matchesKind && matchesSaved && (!query || searchable.includes(query));
  });
}
