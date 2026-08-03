const fs = require('fs');
const path = require('path');

const routes = {
  'lms': 'LMSWorkspace',
  'assignments': 'LMSWorkspace',
  'timetable': 'TimetableWorkspace',
  'attendance': 'AttendanceConsole',
  'registration': 'RegistrationConsole',
  'examinations': 'LMSWorkspace', // mock
  'results': 'GradeCardMarksheet',
  'helpdesk': 'StudentHelpdeskConsole',
  'hostel': 'HostelManagementConsole',
  'opac': 'LibraryOPACConsole',
  'transport': 'TransportTrackerConsole',
  'forum': 'DiscussionForumConsole',
  'webinars': 'StudentWebinarsConsole',
  'payments': 'PaymentPage',
  'scholarships': 'PaymentPage', // mock
  'receipts': 'PaymentPage', // mock
  'student-profile': 'StudentProfileConsole',
  'documents': 'StudentProfileConsole', // mock
  'settings': 'StudentProfileConsole', // mock
  
  // Extra components from the massive list that we might want to map
  'audit': 'AuditLogViewer',
  'governance': 'GovernanceConsole',
  'digital-id': 'DigitalIDWalletConsole',
  'international': 'InternationalStudentsConsole',
  'microcredentials': 'MicrocredentialsConsole',
  'data-migration': 'DataMigrationConsole',
  'legal-risk': 'LegalRiskConsole',
  'sustainability': 'SustainabilityESGConsole',
  'ai-governance': 'AIGovernanceConsole'
};

const baseDir = path.join(__dirname, 'apps', 'web', 'src', 'app', '(dashboard)');

const componentImports = {
  'LMSWorkspace': "import { LMSWorkspace } from '../../../components/lms/LMSWorkspace';",
  'TimetableWorkspace': "import { TimetableWorkspace } from '../../../components/timetable/TimetableWorkspace';",
  'AttendanceConsole': "import { AttendanceConsole } from '../../../components/attendance/AttendanceConsole';",
  'RegistrationConsole': "import { RegistrationConsole } from '../../../components/registration/RegistrationConsole';",
  'GradeCardMarksheet': "import { GradeCardMarksheet } from '../../../components/exams/GradeCardMarksheet';",
  'StudentHelpdeskConsole': "import { StudentHelpdeskConsole } from '../../../components/campus/StudentHelpdeskConsole';",
  'HostelManagementConsole': "import { HostelManagementConsole } from '../../../components/campus/HostelManagementConsole';",
  'LibraryOPACConsole': "import { LibraryOPACConsole } from '../../../components/campus/LibraryOPACConsole';",
  'TransportTrackerConsole': "import { TransportTrackerConsole } from '../../../components/campus/TransportTrackerConsole';",
  'DiscussionForumConsole': "import { DiscussionForumConsole } from '../../../components/student/DiscussionForumConsole';",
  'StudentWebinarsConsole': "import { StudentWebinarsConsole } from '../../../components/student/StudentWebinarsConsole';",
  'PaymentPage': "import { PaymentPage } from '../../../components/finance/payment/PaymentPage';",
  'StudentProfileConsole': "import { StudentProfileConsole } from '../../../components/student/StudentProfileConsole';",
  'AuditLogViewer': "import { AuditLogViewer } from '../../../components/audit/AuditLogViewer';",
  'GovernanceConsole': "import { GovernanceConsole } from '../../../components/governance/GovernanceConsole';",
  'DigitalIDWalletConsole': "import { DigitalIDWalletConsole } from '../../../components/campus/DigitalIDWalletConsole';",
  'InternationalStudentsConsole': "import { InternationalStudentsConsole } from '../../../components/international/InternationalStudentsConsole';",
  'MicrocredentialsConsole': "import { MicrocredentialsConsole } from '../../../components/academics/MicrocredentialsConsole';",
  'DataMigrationConsole': "import { DataMigrationConsole } from '../../../components/system/DataMigrationConsole';",
  'LegalRiskConsole': "import { LegalRiskConsole } from '../../../components/compliance/LegalRiskConsole';",
  'SustainabilityESGConsole': "import { SustainabilityESGConsole } from '../../../components/campus/SustainabilityESGConsole';",
  'AIGovernanceConsole': "import { AIGovernanceConsole } from '../../../components/ai/AIGovernanceConsole';"
};

for (const [route, component] of Object.entries(routes)) {
  const dirPath = path.join(baseDir, route);
  fs.mkdirSync(dirPath, { recursive: true });
  
  const pageContent = `'use client';\n\nimport React from 'react';\n${componentImports[component]}\n\nexport default function Page() {\n  return <${component} />;\n}\n`;
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), pageContent);
}

console.log('Routes generated successfully.');
