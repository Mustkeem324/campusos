export type Region = 'us' | 'in' | 'global';

export const regions: Record<Region, { label: string; currency: string; institution: string; contact: string }> = {
  us: { label: 'United States', currency: 'USD', institution: 'college or university', contact: 'us@campusos.example' },
  in: { label: 'India', currency: 'INR', institution: 'university or college', contact: 'india@campusos.example' },
  global: { label: 'Global', currency: 'Local currency', institution: 'higher-education institution', contact: 'hello@campusos.example' },
};

export const menuGroups = [
  { label: 'Platform', href: '/platform', groups: [
    { title: 'Core systems', links: [['Student Information System','/platform/student-information-system'],['Academic Management','/platform/academics'],['Admissions and Enrollment','/platform/admissions'],['Finance and Billing','/platform/finance'],['People and HR','/platform/people'],['Campus Operations','/platform/campus-operations']] },
    { title: 'Teaching and learning', links: [['Learning Management','/platform/learning-management'],['Course Workspace','/platform/course-workspace'],['Live Learning','/platform/live-learning'],['Assignments and Assessments','/platform/assignments'],['Examinations and Results','/platform/examinations'],['Faculty Tools','/platform/faculty-portal']] },
    { title: 'Student experience', links: [['Student Portal','/platform/student-portal'],['Mobile App','/platform/mobile'],['Community and Messaging','/platform/community'],['Digital Campus ID','/platform/digital-id'],['Parent Portal','/platform/parent-portal'],['Student Services','/platform/student-services']] },
    { title: 'Data and intelligence', links: [['Institutional Analytics','/platform/analytics'],['Student Success','/platform/student-success'],['AI Assistant','/platform/ai'],['Workflow Automation','/platform/workflow-automation'],['Integrations','/platform/integrations'],['Multi-Campus Management','/platform/multi-campus']] },
  ]},
  { label: 'Solutions', href: '/solutions', groups: [
    { title: 'United States', links: [['Public Universities','/solutions/public-universities'],['Private Universities','/solutions/private-universities'],['Community Colleges','/solutions/community-colleges'],['Liberal Arts Colleges','/solutions/liberal-arts-colleges'],['Research Universities','/solutions/research-universities'],['Online and Hybrid Institutions','/solutions/online-and-hybrid-learning']] },
    { title: 'India', links: [['Central and State Universities','/solutions/central-state-universities'],['Private Universities','/solutions/private-universities'],['Autonomous Colleges','/solutions/autonomous-colleges'],['Affiliated Colleges','/solutions/affiliated-colleges'],['Engineering Colleges','/solutions/engineering-colleges'],['Medical Institutions','/solutions/medical-institutions'],['Multi-College Groups','/solutions/college-groups']] },
    { title: 'Strategic need', links: [['Legacy ERP Replacement','/solutions/legacy-system-replacement'],['Enrollment Modernization','/solutions/enrollment-modernization'],['Student Retention','/solutions/student-retention'],['Multi-Campus Operations','/solutions/multi-campus'],['Academic Automation','/solutions/academic-automation'],['Compliance Readiness','/solutions/compliance-readiness']] },
  ]},
  { label: 'Roles', href: '/roles', groups: [
    { title: 'Leadership', links: [['President / Vice Chancellor','/roles/president'],['Provost / Pro Vice Chancellor','/roles/provost'],['CIO','/roles/cio'],['CFO','/roles/cfo'],['Registrar','/roles/registrar']] },
    { title: 'Academics', links: [['Dean','/roles/dean'],['HOD / Department Chair','/roles/hod'],['Examination Controller','/roles/examination-controller'],['Faculty','/roles/faculty'],['Academic Advisor','/roles/academic-advisor']] },
    { title: 'Operations', links: [['Admissions','/roles/admissions'],['Finance','/roles/finance'],['HR','/roles/hr'],['Campus Operations','/roles/campus-operations'],['Student Success','/roles/student-success'],['Career Services','/roles/career-services']] },
    { title: 'Community', links: [['Student','/roles/student'],['Parent or Guardian','/roles/parent'],['Alumni','/roles/alumni']] },
  ]},
  { label: 'Resources', href: '/resources', groups: [
    { title: 'Learn', links: [['Guides','/resources/guides'],['Blog','/resources/blog'],['Research','/resources/research'],['Webinars','/resources/webinars'],['Events','/resources/events'],['Product Tours','/resources/product-tours']] },
    { title: 'Plan', links: [["Buyer’s Guide",'/resources/buyers-guide'],['ERP Evaluation Checklist','/resources/erp-evaluation-checklist'],['RFP Toolkit','/resources/rfp-toolkit'],['ROI Calculator','/resources/roi-calculator'],['Implementation Guide','/resources/implementation-guide'],['Data Migration Guide','/resources/data-migration-guide']] },
    { title: 'Product', links: [['Help Centre','/resources/help'],['Documentation','/developers'],['Blueprint Architecture','/blueprint'],['Release Notes','/resources/release-notes'],['Roadmap','/resources/roadmap'],['System Status','/trust/availability']] },
  ]},
  { label: 'Security', href: '/security', groups: [
    { title: 'Trust', links: [['Security Overview','/security'],['Trust Centre','/trust'],['Privacy','/trust/privacy'],['Accessibility','/security/accessibility'],['Subprocessors','/trust/subprocessors'],['Vulnerability Disclosure','/security/vulnerability-disclosure']] },
    { title: 'Controls', links: [['Identity and Access','/security/identity-access'],['Data Protection','/security/data-protection'],['Audit and Monitoring','/security/audit-monitoring'],['Payment Security','/security/payment-security'],['Biometric Security','/security/biometric-security'],['AI Governance','/security/ai-governance']] },
  ]},
  { label: 'Pricing', href: '/pricing', groups: [
    { title: 'Pricing', links: [['Pricing Overview','/pricing'],['Plans','/pricing/plans'],['Module Add-ons','/pricing/modules']] },
    { title: 'Buying process', links: [['Implementation','/pricing/implementation'],['Support Plans','/pricing/support'],['Request a Quote','/pricing/request-quote'],['Procurement Information','/pricing/procurement']] },
  ]},
];

export const guides = [
  { slug: 'modern-sis-evaluation', title: 'Modern SIS Evaluation Guide', region: 'us', topic: 'Student Information Systems', audience: 'Registrar and IT leaders', time: '12 min', date: 'June 18, 2026', summary: 'A practical framework for evaluating connected student-record systems without losing institutional context.' },
  { slug: 'ferpa-aware-data-architecture', title: 'FERPA-Aware Student Data Architecture', region: 'us', topic: 'Privacy', audience: 'Technology and compliance teams', time: '10 min', date: 'May 26, 2026', summary: 'Design principles for controlled access, record requests, and accountable data stewardship.' },
  { slug: 'student-retention-analytics', title: 'Student Retention Analytics Guide', region: 'us', topic: 'Student Success', audience: 'Provost and student-success teams', time: '9 min', date: 'April 14, 2026', summary: 'Build intervention workflows around signals your institution can explain and govern.' },
  { slug: 'university-erp-evaluation', title: 'University ERP Evaluation Guide', region: 'in', topic: 'Implementation', audience: 'University leadership and IT', time: '14 min', date: 'July 8, 2026', summary: 'Evaluate academic, examination, fees, and accreditation workflows in one decision process.' },
  { slug: 'accreditation-evidence-management', title: 'Accreditation Evidence Management Guide', region: 'in', topic: 'Academic Operations', audience: 'IQAC and academic leaders', time: '11 min', date: 'June 2, 2026', summary: 'Create an evidence trail that supports institution-configured accreditation preparation.' },
  { slug: 'examinations-results-modernization', title: 'Examination and Results Modernization Guide', region: 'in', topic: 'Academic Operations', audience: 'Examination cells and registrars', time: '13 min', date: 'May 4, 2026', summary: 'Map secure assessment, moderation, and result publication workflows across programmes.' },
];

export function titleFromSlug(slug: string) { return slug.split('-').map((word) => word === 'ai' ? 'AI' : word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }
