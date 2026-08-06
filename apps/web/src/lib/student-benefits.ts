export type StudentBenefitCategory =
  | 'technology'
  | 'design'
  | 'productivity'
  | 'learning'
  | 'financial-support'
  | 'career'
  | 'academic-services'
  | 'wellbeing';

export type StudentBenefitAccess =
  | 'free'
  | 'discount'
  | 'institution'
  | 'application';

export type StudentBenefitRegion = 'india' | 'global' | 'institution';

export type StudentBenefitSort = 'featured' | 'recent' | 'az';

export type StudentBenefit = {
  id: string;
  title: string;
  provider: string;
  category: StudentBenefitCategory;
  access: StudentBenefitAccess;
  regions: StudentBenefitRegion[];
  valueLabel: string;
  summary: string;
  eligibility: string;
  requirements: string[];
  steps: string[];
  tags: string[];
  officialUrl: string;
  officialDomain: string;
  sourceLabel: string;
  verifiedOn: string;
  featured?: boolean;
  availabilityNote?: string;
};

export type StudentBenefitFilters = {
  query?: string;
  category?: StudentBenefitCategory | 'all';
  access?: StudentBenefitAccess | 'all';
  region?: StudentBenefitRegion | 'all';
  sort?: StudentBenefitSort;
};

export const STUDENT_BENEFIT_CATEGORIES: Array<{
  id: StudentBenefitCategory;
  label: string;
}> = [
  { id: 'technology', label: 'Technology & cloud' },
  { id: 'design', label: 'Design & creative' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'learning', label: 'Learning & courses' },
  { id: 'financial-support', label: 'Scholarships & finance' },
  { id: 'career', label: 'Internships & careers' },
  { id: 'academic-services', label: 'Academic services' },
  { id: 'wellbeing', label: 'Safety & wellbeing' },
];

export const STUDENT_BENEFIT_ACCESS_LABELS: Record<StudentBenefitAccess, string> = {
  free: 'Free access',
  discount: 'Student discount',
  institution: 'Institution access',
  application: 'Application required',
};

export const STUDENT_BENEFIT_REGION_LABELS: Record<StudentBenefitRegion, string> = {
  india: 'India',
  global: 'Global',
  institution: 'Institution dependent',
};

const VERIFIED_ON = '2026-08-06';
const GITHUB_PACK_URL = 'https://education.github.com/pack';

export const STUDENT_BENEFITS: StudentBenefit[] = [
  {
    id: 'national-scholarship-portal',
    title: 'National Scholarship Portal',
    provider: 'Government of India',
    category: 'financial-support',
    access: 'application',
    regions: ['india'],
    valueLabel: 'Multiple central and state schemes',
    summary:
      'A single government portal for discovering, applying to and tracking eligible scholarship schemes.',
    eligibility:
      'Eligibility depends on the individual scholarship, academic level, category, income and institution requirements.',
    requirements: ['Aadhaar or accepted identity details', 'Academic and income documents', 'Eligible institution and course'],
    steps: ['Create or sign in to your portal account.', 'Complete the profile and scheme eligibility details.', 'Apply only to schemes whose official criteria you meet.'],
    tags: ['scholarship', 'financial aid', 'government', 'DBT'],
    officialUrl: 'https://scholarships.gov.in/',
    officialDomain: 'scholarships.gov.in',
    sourceLabel: 'Government portal',
    verifiedOn: VERIFIED_ON,
    featured: true,
    availabilityNote: 'Applications and deadlines vary by scheme and academic year.',
  },
  {
    id: 'github-student-developer-pack',
    title: 'GitHub Student Developer Pack',
    provider: 'GitHub Education',
    category: 'technology',
    access: 'application',
    regions: ['global'],
    valueLabel: 'GitHub Pro and rotating partner offers',
    summary:
      'Verified students can access GitHub Pro plus a changing catalogue of developer, cloud, learning and productivity offers.',
    eligibility:
      'Available to verified students aged 13 or older. GitHub determines verification and renewal eligibility.',
    requirements: ['GitHub account', 'Current proof of student status', 'Age 13 or older'],
    steps: ['Open the GitHub Education application.', 'Submit current academic proof.', 'Review each partner offer before redemption.'],
    tags: ['coding', 'developer tools', 'cloud', 'GitHub Pro'],
    officialUrl: GITHUB_PACK_URL,
    officialDomain: 'education.github.com',
    sourceLabel: 'Official provider',
    verifiedOn: VERIFIED_ON,
    featured: true,
    availabilityNote: 'Partner offers, limits and redemption windows can change.',
  },
  {
    id: 'swayam',
    title: 'SWAYAM Online Courses',
    provider: 'Ministry of Education, Government of India',
    category: 'learning',
    access: 'free',
    regions: ['india', 'global'],
    valueLabel: 'Free course enrolment',
    summary:
      'Government-backed online courses from national coordinators including UGC, AICTE, NPTEL, IGNOU and IIM Bangalore.',
    eligibility:
      'Anyone may join most courses. Certificate exams can carry a fee, and academic credit depends on your institution.',
    requirements: ['Learner account', 'Course-specific prerequisites where listed'],
    steps: ['Search the official course catalogue.', 'Check dates, prerequisites and credit details.', 'Enrol free; register separately for a certificate exam when required.'],
    tags: ['MOOC', 'NPTEL', 'certificate', 'university credit'],
    officialUrl: 'https://swayam.gov.in/',
    officialDomain: 'swayam.gov.in',
    sourceLabel: 'Government learning platform',
    verifiedOn: VERIFIED_ON,
    featured: true,
    availabilityNote: 'Certificates and proctored examinations may require payment.',
  },
  {
    id: 'azure-for-students',
    title: 'Azure for Students',
    provider: 'Microsoft Azure',
    category: 'technology',
    access: 'application',
    regions: ['india', 'global'],
    valueLabel: 'Cloud credit and selected free services',
    summary:
      'Eligible full-time higher-education students can start with Azure credit and selected services without a credit card.',
    eligibility:
      'Microsoft lists age, full-time enrolment and accredited degree-granting institution requirements for the main offer.',
    requirements: ['Microsoft account', 'Academic status verification', 'Offer-specific age and institution eligibility'],
    steps: ['Review the current offer details.', 'Verify your student status.', 'Set budgets and alerts before deploying paid resources.'],
    tags: ['cloud', 'Azure', 'AI', 'developer'],
    officialUrl: 'https://azure.microsoft.com/en-in/free/students/',
    officialDomain: 'azure.microsoft.com',
    sourceLabel: 'Official provider',
    verifiedOn: VERIFIED_ON,
    featured: true,
    availabilityNote: 'Service limits, credit and renewal rules are controlled by Microsoft.',
  },
  {
    id: 'aicte-internship-portal',
    title: 'AICTE Internship Portal',
    provider: 'All India Council for Technical Education',
    category: 'career',
    access: 'free',
    regions: ['india'],
    valueLabel: 'Free internship search and applications',
    summary:
      'A national portal listing internships and work-based learning opportunities from participating organisations.',
    eligibility:
      'Openings have their own degree, location, skill and graduation requirements. Students should inspect every listing before applying.',
    requirements: ['Student profile', 'Institution and enrolment details', 'Documents requested by the listing'],
    steps: ['Register on the student portal.', 'Complete your profile accurately.', 'Check stipend, duration, deadline and employer details before applying.'],
    tags: ['internship', 'AICTE', 'career', 'work-based learning'],
    officialUrl: 'https://internship.aicte-india.org/',
    officialDomain: 'internship.aicte-india.org',
    sourceLabel: 'Government education portal',
    verifiedOn: VERIFIED_ON,
    featured: true,
    availabilityNote: 'CampusOS does not endorse or guarantee individual listings or selection.',
  },
  {
    id: 'notion-education',
    title: 'Notion Education Plus Plan',
    provider: 'Notion',
    category: 'productivity',
    access: 'application',
    regions: ['global'],
    valueLabel: 'Free one-member Plus workspace',
    summary:
      'Eligible higher-education students and educators can upgrade a one-member workspace to the Education Plus plan.',
    eligibility:
      'Requires an education email from an accredited institution recognised in the World Higher Education Database.',
    requirements: ['Valid institution email', 'One-member workspace', 'Accredited higher-education institution'],
    steps: ['Sign in with your institution email.', 'Open Settings and select Upgrade plan.', 'Choose the free education plan when eligible.'],
    tags: ['notes', 'project planning', 'workspace', 'productivity'],
    officialUrl: 'https://www.notion.com/help/notion-for-education',
    officialDomain: 'notion.com',
    sourceLabel: 'Official help centre',
    verifiedOn: VERIFIED_ON,
    featured: true,
    availabilityNote: 'Notion states that student ID documents are not accepted for this specific verification flow.',
  },
  {
    id: 'figma-education',
    title: 'Figma for Education',
    provider: 'Figma',
    category: 'design',
    access: 'application',
    regions: ['global'],
    valueLabel: 'Professional education team features',
    summary:
      'Verified higher-education students can use professional design and collaboration capabilities through an Education team.',
    eligibility:
      'Education verification is required and plan availability depends on Figma’s current student and programme criteria.',
    requirements: ['Figma account', 'Current education verification', 'Eligible study programme'],
    steps: ['Create or sign in to Figma.', 'Start education verification.', 'Create, upgrade or join an eligible Education team.'],
    tags: ['UI UX', 'prototyping', 'FigJam', 'design'],
    officialUrl: 'https://www.figma.com/education/higher-education/',
    officialDomain: 'figma.com',
    sourceLabel: 'Official provider',
    verifiedOn: VERIFIED_ON,
    featured: true,
  },
  {
    id: 'pm-vidyalaxmi',
    title: 'PM-Vidyalaxmi Scheme Information',
    provider: 'Ministry of Education, Government of India',
    category: 'financial-support',
    access: 'application',
    regions: ['india'],
    valueLabel: 'Education-loan support for eligible students',
    summary:
      'Official scheme guidelines and updates for financial support connected to quality higher education.',
    eligibility:
      'Eligibility depends on the notified institution, admission, course, income and scheme conditions in the current guidelines.',
    requirements: ['Qualifying admission', 'Identity and academic documents', 'Financial documents required by the scheme or lender'],
    steps: ['Read the current Ministry guidelines.', 'Confirm that your institution and course qualify.', 'Use only the official application route named in the current guidance.'],
    tags: ['education loan', 'financial support', 'higher education'],
    officialUrl: 'https://www.education.gov.in/pradhan-mantri-vidyalaxmi-pm-vidyalaxmi-scheme-guidelines',
    officialDomain: 'education.gov.in',
    sourceLabel: 'Government scheme guidance',
    verifiedOn: VERIFIED_ON,
    availabilityNote: 'This directory does not assess loan eligibility or provide financial advice.',
  },
  {
    id: 'jetbrains-student',
    title: 'JetBrains Student Pack',
    provider: 'JetBrains',
    category: 'technology',
    access: 'application',
    regions: ['global'],
    valueLabel: 'Free renewable student subscription',
    summary:
      'Professional JetBrains desktop IDEs and developer tools for eligible students, renewed while student status remains valid.',
    eligibility:
      'JetBrains verifies current student status and applies its education licence terms, including non-commercial educational use rules.',
    requirements: ['JetBrains account', 'Current student verification'],
    steps: ['Open the student application.', 'Choose an accepted verification method.', 'Renew when prompted while still eligible.'],
    tags: ['IntelliJ IDEA', 'PyCharm', 'WebStorm', 'IDE'],
    officialUrl: 'https://www.jetbrains.com/community/education/#students',
    officialDomain: 'jetbrains.com',
    sourceLabel: 'Official provider',
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'microsoft-365-education',
    title: 'Microsoft 365 Education',
    provider: 'Microsoft Education',
    category: 'productivity',
    access: 'institution',
    regions: ['india', 'global', 'institution'],
    valueLabel: 'Free web apps through eligible institutions',
    summary:
      'Eligible institutions can provide web versions of Word, Excel, PowerPoint, OneNote, Teams and other education services.',
    eligibility:
      'Access depends on whether your institution is eligible and has provisioned an education account or licence for you.',
    requirements: ['Eligible institution account', 'Institution-issued sign-in'],
    steps: ['Check your institution email and IT guidance.', 'Use Microsoft’s eligibility flow.', 'Ask campus IT if an account has not been provisioned.'],
    tags: ['Word', 'Excel', 'PowerPoint', 'Teams'],
    officialUrl: 'https://www.microsoft.com/en-in/education/products/office/',
    officialDomain: 'microsoft.com',
    sourceLabel: 'Official provider',
    verifiedOn: VERIFIED_ON,
    availabilityNote: 'Desktop apps and advanced services depend on the institution’s plan.',
  },
  {
    id: 'autodesk-education',
    title: 'Autodesk Education Plan',
    provider: 'Autodesk',
    category: 'design',
    access: 'application',
    regions: ['india', 'global'],
    valueLabel: 'Renewable one-year education access',
    summary:
      'Eligible students can obtain single-user access to Autodesk software for educational, non-commercial purposes.',
    eligibility:
      'Autodesk verifies enrolment at a qualified educational institution and applies minimum-age and use restrictions.',
    requirements: ['Autodesk account', 'Academic eligibility documents', 'Educational use only'],
    steps: ['Create an Autodesk account.', 'Verify education eligibility.', 'Select the required software and renew annually while eligible.'],
    tags: ['AutoCAD', 'Fusion', 'Revit', '3D design'],
    officialUrl: 'https://www.autodesk.com/in/education/edu-software/overview',
    officialDomain: 'autodesk.com',
    sourceLabel: 'Official provider',
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'aws-educate',
    title: 'AWS Educate',
    provider: 'Amazon Web Services',
    category: 'learning',
    access: 'free',
    regions: ['global'],
    valueLabel: 'Free cloud learning resources',
    summary:
      'Self-paced cloud learning pathways and hands-on educational resources for learners exploring AWS skills.',
    eligibility:
      'Account and regional availability rules are set by AWS. Do not assume promotional cloud credit is included.',
    requirements: ['AWS Educate account', 'Offer-specific age and region eligibility'],
    steps: ['Create an AWS Educate account.', 'Choose a learning pathway.', 'Review any lab or service limits before use.'],
    tags: ['AWS', 'cloud', 'training', 'career skills'],
    officialUrl: 'https://aws.amazon.com/education/awseducate/',
    officialDomain: 'aws.amazon.com',
    sourceLabel: 'Official provider',
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'tableau-students',
    title: 'Tableau for Students',
    provider: 'Tableau',
    category: 'learning',
    access: 'free',
    regions: ['global'],
    valueLabel: 'Free Tableau learning and public-edition tools',
    summary:
      'Students can learn data visualisation using Tableau’s current academic resources and free public-edition offering.',
    eligibility:
      'The current student page explains the available public edition and its public, non-commercial data limitations.',
    requirements: ['Tableau account where required', 'Data suitable for public publishing'],
    steps: ['Read the current student programme details.', 'Install or access the offered edition.', 'Never publish private or confidential data to a public profile.'],
    tags: ['data visualisation', 'analytics', 'Tableau Public'],
    officialUrl: 'https://www.tableau.com/academic/students',
    officialDomain: 'tableau.com',
    sourceLabel: 'Official provider',
    verifiedOn: VERIFIED_ON,
    availabilityNote: 'Public-edition work may be visible publicly; review privacy terms first.',
  },
  {
    id: 'datacamp-github-pack',
    title: 'DataCamp Student Pack Offer',
    provider: 'DataCamp via GitHub Education',
    category: 'learning',
    access: 'application',
    regions: ['global'],
    valueLabel: 'Current GitHub Pack learning offer',
    summary:
      'A time-limited DataCamp learning offer may be redeemed by eligible GitHub Student Developer Pack members.',
    eligibility:
      'Requires an active GitHub Student Developer Pack membership and acceptance of DataCamp’s current redemption terms.',
    requirements: ['Active GitHub Student Developer Pack', 'DataCamp account'],
    steps: ['Open the current GitHub Pack catalogue.', 'Find the DataCamp offer.', 'Read the duration, renewal and billing terms before redeeming.'],
    tags: ['Python', 'SQL', 'data science', 'learning'],
    officialUrl: GITHUB_PACK_URL,
    officialDomain: 'education.github.com',
    sourceLabel: 'Official partner catalogue',
    verifiedOn: VERIFIED_ON,
    availabilityNote: 'Offer duration and renewal conditions can change.',
  },
  {
    id: 'frontend-masters-github-pack',
    title: 'Frontend Masters Student Offer',
    provider: 'Frontend Masters via GitHub Education',
    category: 'learning',
    access: 'application',
    regions: ['global'],
    valueLabel: 'Current GitHub Pack course access',
    summary:
      'Eligible GitHub Student Developer Pack members can redeem the currently listed Frontend Masters learning offer.',
    eligibility: 'Requires active GitHub Student Developer Pack verification and the partner’s current redemption rules.',
    requirements: ['Active GitHub Student Developer Pack', 'Frontend Masters account'],
    steps: ['Open the GitHub Pack catalogue.', 'Locate Frontend Masters.', 'Review the current access period before activation.'],
    tags: ['JavaScript', 'web development', 'courses'],
    officialUrl: GITHUB_PACK_URL,
    officialDomain: 'education.github.com',
    sourceLabel: 'Official partner catalogue',
    verifiedOn: VERIFIED_ON,
    availabilityNote: 'The current pack lists a limited access period; verify it before redeeming.',
  },
  {
    id: 'appwrite-github-pack',
    title: 'Appwrite Education Plan',
    provider: 'Appwrite via GitHub Education',
    category: 'technology',
    access: 'application',
    regions: ['global'],
    valueLabel: 'Education cloud projects while eligible',
    summary:
      'A student plan for building web, mobile and AI applications is available through the GitHub Student Developer Pack.',
    eligibility: 'Requires active GitHub Student Developer Pack membership and Appwrite account eligibility.',
    requirements: ['Active GitHub Student Developer Pack', 'Appwrite account'],
    steps: ['Open the GitHub Pack offer.', 'Connect or create an Appwrite account.', 'Review resource limits before creating projects.'],
    tags: ['backend', 'cloud', 'app development', 'open source'],
    officialUrl: GITHUB_PACK_URL,
    officialDomain: 'education.github.com',
    sourceLabel: 'Official partner catalogue',
    verifiedOn: VERIFIED_ON,
    availabilityNote: 'Resource limits remain controlled by Appwrite and can change.',
  },
  {
    id: 'one-password-github-pack',
    title: '1Password Student Offer',
    provider: '1Password via GitHub Education',
    category: 'productivity',
    access: 'application',
    regions: ['global'],
    valueLabel: 'Current student security offer',
    summary:
      'The GitHub Student Developer Pack lists a time-limited 1Password offer including developer-oriented features.',
    eligibility: 'Requires active GitHub Student Developer Pack membership and acceptance of 1Password’s terms.',
    requirements: ['Active GitHub Student Developer Pack', '1Password account'],
    steps: ['Open the current GitHub Pack catalogue.', 'Select the 1Password offer.', 'Set a secure recovery process before storing credentials.'],
    tags: ['password manager', 'security', 'developer tools'],
    officialUrl: GITHUB_PACK_URL,
    officialDomain: 'education.github.com',
    sourceLabel: 'Official partner catalogue',
    verifiedOn: VERIFIED_ON,
    availabilityNote: 'Review renewal pricing before the promotional period ends.',
  },
  {
    id: 'tech-domain-github-pack',
    title: '.TECH Student Domain Offer',
    provider: '.TECH via GitHub Education',
    category: 'technology',
    access: 'application',
    regions: ['global'],
    valueLabel: 'Current student domain offer',
    summary:
      'Eligible GitHub Student Developer Pack members can redeem the currently listed standard .TECH domain offer.',
    eligibility: 'Requires an active GitHub Student Developer Pack account and an available eligible domain name.',
    requirements: ['Active GitHub Student Developer Pack', 'Available domain selection'],
    steps: ['Find .TECH in the GitHub Pack.', 'Check domain availability and renewal price.', 'Redeem only after reviewing future renewal costs.'],
    tags: ['domain', 'portfolio', 'website'],
    officialUrl: GITHUB_PACK_URL,
    officialDomain: 'education.github.com',
    sourceLabel: 'Official partner catalogue',
    verifiedOn: VERIFIED_ON,
    availabilityNote: 'A free first term can renew at a paid rate; check the registrar terms.',
  },
  {
    id: 'github-campus-experts',
    title: 'GitHub Campus Experts',
    provider: 'GitHub Education',
    category: 'career',
    access: 'application',
    regions: ['global'],
    valueLabel: 'Community leadership programme',
    summary:
      'A programme for students who build inclusive technical communities on campus, with training and programme support.',
    eligibility: 'Applicants must meet GitHub’s current student, community and programme requirements.',
    requirements: ['Current student status', 'GitHub account', 'Demonstrated campus-community interest'],
    steps: ['Read the programme requirements.', 'Prepare examples of community work.', 'Apply during an open application window.'],
    tags: ['leadership', 'community', 'open source', 'career'],
    officialUrl: 'https://education.github.com/experts',
    officialDomain: 'education.github.com',
    sourceLabel: 'Official provider',
    verifiedOn: VERIFIED_ON,
    availabilityNote: 'Applications may open and close in cohorts.',
  },
  {
    id: 'ugc-student-corner',
    title: 'UGC Student Corner',
    provider: 'University Grants Commission',
    category: 'academic-services',
    access: 'free',
    regions: ['india'],
    valueLabel: 'Official scholarship and support directory',
    summary:
      'A central UGC directory for fellowships, scholarships and student portals such as SWAYAM, NAD, ABC and e-Samadhaan.',
    eligibility: 'Each linked scheme or portal sets its own eligibility and documentation requirements.',
    requirements: ['Review the official notice for the selected service'],
    steps: ['Open Student Corner.', 'Choose scholarships, fellowships or student portals.', 'Follow only the linked official instructions.'],
    tags: ['UGC', 'fellowship', 'scholarship', 'grievance'],
    officialUrl: 'https://www.ugc.gov.in/Home/student_Corner',
    officialDomain: 'ugc.gov.in',
    sourceLabel: 'Government education directory',
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'ndli',
    title: 'National Digital Library of India',
    provider: 'IIT Kharagpur and Ministry of Education',
    category: 'learning',
    access: 'free',
    regions: ['india', 'global'],
    valueLabel: 'Single-window learning-resource discovery',
    summary:
      'A national digital-library service for discovering educational resources across subjects, levels and formats.',
    eligibility: 'Public discovery is broadly available; access to individual resources can depend on the content provider.',
    requirements: ['Account for features that require sign-in'],
    steps: ['Search by subject, resource type or education level.', 'Review the source and access conditions.', 'Save or organise resources using available account features.'],
    tags: ['library', 'books', 'research', 'learning resources'],
    officialUrl: 'https://ndl.iitkgp.ac.in/',
    officialDomain: 'ndl.iitkgp.ac.in',
    sourceLabel: 'Government-funded learning platform',
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'nats',
    title: 'National Apprenticeship Training Scheme',
    provider: 'Ministry of Education, Government of India',
    category: 'career',
    access: 'application',
    regions: ['india'],
    valueLabel: 'Apprenticeship opportunities and training records',
    summary:
      'NATS connects eligible graduates, diploma holders and vocational certificate holders with apprenticeship training.',
    eligibility:
      'Qualification, pass-out status, discipline and employer criteria apply. The official portal states that the scheme is free.',
    requirements: ['Eligible qualification', 'Academic records', 'Student registration on NATS 2.0'],
    steps: ['Register on the NATS student portal.', 'Complete and verify your profile.', 'Apply only to advertisements matching your qualification.'],
    tags: ['apprenticeship', 'graduate', 'diploma', 'on-the-job training'],
    officialUrl: 'https://nats.education.gov.in/',
    officialDomain: 'nats.education.gov.in',
    sourceLabel: 'Government apprenticeship portal',
    verifiedOn: VERIFIED_ON,
    availabilityNote: 'Never pay an intermediary for NATS registration or services.',
  },
  {
    id: 'national-career-service',
    title: 'National Career Service',
    provider: 'Ministry of Labour & Employment',
    category: 'career',
    access: 'free',
    regions: ['india'],
    valueLabel: 'Jobs, internships and career services',
    summary:
      'A government career portal with searchable jobs, internships and employment-related services across India.',
    eligibility: 'Every listing has its own education, experience, location and skill criteria.',
    requirements: ['Jobseeker profile', 'Accurate education and skill details'],
    steps: ['Create or update your jobseeker profile.', 'Filter for internships or suitable jobs.', 'Verify employer details and never pay an application fee to an untrusted party.'],
    tags: ['jobs', 'internship', 'career', 'employment'],
    officialUrl: 'https://www.ncs.gov.in/internships-jobs',
    officialDomain: 'ncs.gov.in',
    sourceLabel: 'Government career portal',
    verifiedOn: VERIFIED_ON,
    availabilityNote: 'CampusOS does not guarantee the accuracy or outcome of individual employer listings.',
  },
  {
    id: 'digilocker-nad',
    title: 'DigiLocker and National Academic Depository',
    provider: 'Digital India and Ministry of Education',
    category: 'academic-services',
    access: 'free',
    regions: ['india'],
    valueLabel: 'Official digital academic documents',
    summary:
      'Students can retrieve academic awards issued to DigiLocker and use consent-based digital document sharing and verification.',
    eligibility: 'A document is available only when the issuing board or institution has published it to the supported system.',
    requirements: ['DigiLocker account', 'Identity details required by DigiLocker', 'Matching issuer records'],
    steps: ['Sign in to DigiLocker.', 'Search the issuing institution or board.', 'Fetch the award into Issued Documents and share only when needed.'],
    tags: ['marksheet', 'degree', 'certificate', 'digital documents'],
    officialUrl: 'https://nad.digilocker.gov.in/students',
    officialDomain: 'nad.digilocker.gov.in',
    sourceLabel: 'Government digital-document service',
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'anti-ragging',
    title: 'National Anti-Ragging Portal',
    provider: 'UGC National Ragging Prevention Programme',
    category: 'wellbeing',
    access: 'free',
    regions: ['india'],
    valueLabel: 'Undertaking, complaint and helpline services',
    summary:
      'Official anti-ragging information, student undertakings, complaint registration and complaint-status services.',
    eligibility: 'Available for students and institutions covered by the national higher-education anti-ragging framework.',
    requirements: ['Institution and student details for relevant forms', 'Evidence where available for a complaint'],
    steps: ['Use the official undertaking or complaint form.', 'Keep the generated reference details.', 'Use the official helpline for urgent anti-ragging support.'],
    tags: ['safety', 'complaint', 'UGC', 'helpline'],
    officialUrl: 'https://www.antiragging.in/',
    officialDomain: 'antiragging.in',
    sourceLabel: 'Official national safety portal',
    verifiedOn: VERIFIED_ON,
    featured: true,
  },
  {
    id: 'manodarpan',
    title: 'Manodarpan Student Support',
    provider: 'Ministry of Education, Government of India',
    category: 'wellbeing',
    access: 'free',
    regions: ['india'],
    valueLabel: 'Psychosocial guidance and student support',
    summary:
      'Government student wellbeing resources, advisories and emotional-support guidance for students, families and educators.',
    eligibility: 'The public resources are intended for students, parents, teachers and education communities in India.',
    requirements: ['No application required for public resources'],
    steps: ['Open the official support resource.', 'Choose guidance for students or higher education.', 'Use professional or emergency support when the situation requires it.'],
    tags: ['mental health', 'wellbeing', 'student support', 'counselling'],
    officialUrl: 'https://manodarpan.education.gov.in/',
    officialDomain: 'manodarpan.education.gov.in',
    sourceLabel: 'Government wellbeing resource',
    verifiedOn: VERIFIED_ON,
    featured: true,
    availabilityNote: 'This directory is informational and is not a substitute for professional or emergency care.',
  },
];

function normaliseSearch(value: string) {
  return value.trim().toLocaleLowerCase('en-IN').replace(/\s+/g, ' ');
}

function searchableText(benefit: StudentBenefit) {
  return normaliseSearch(
    [
      benefit.title,
      benefit.provider,
      benefit.summary,
      benefit.eligibility,
      benefit.valueLabel,
      benefit.tags.join(' '),
      STUDENT_BENEFIT_ACCESS_LABELS[benefit.access],
      benefit.regions.map((region) => STUDENT_BENEFIT_REGION_LABELS[region]).join(' '),
    ].join(' '),
  );
}

export function filterStudentBenefits(
  benefits: StudentBenefit[],
  filters: StudentBenefitFilters,
) {
  const query = normaliseSearch(filters.query ?? '');
  const category = filters.category ?? 'all';
  const access = filters.access ?? 'all';
  const region = filters.region ?? 'all';
  const sort = filters.sort ?? 'featured';

  const filtered = benefits.filter((benefit) => {
    if (category !== 'all' && benefit.category !== category) return false;
    if (access !== 'all' && benefit.access !== access) return false;
    if (region !== 'all' && !benefit.regions.includes(region)) return false;
    if (query && !searchableText(benefit).includes(query)) return false;
    return true;
  });

  return [...filtered].sort((left, right) => {
    if (sort === 'az') return left.title.localeCompare(right.title, 'en-IN');
    if (sort === 'recent') {
      return right.verifiedOn.localeCompare(left.verifiedOn) || left.title.localeCompare(right.title, 'en-IN');
    }
    return Number(Boolean(right.featured)) - Number(Boolean(left.featured)) || left.title.localeCompare(right.title, 'en-IN');
  });
}

export function studentBenefitCategoryCounts(benefits: StudentBenefit[]) {
  return STUDENT_BENEFIT_CATEGORIES.reduce<Record<StudentBenefitCategory, number>>(
    (counts, category) => {
      counts[category.id] = benefits.filter((benefit) => benefit.category === category.id).length;
      return counts;
    },
    {
      technology: 0,
      design: 0,
      productivity: 0,
      learning: 0,
      'financial-support': 0,
      career: 0,
      'academic-services': 0,
      wellbeing: 0,
    },
  );
}
