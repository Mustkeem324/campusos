const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  const passwordHash = await bcrypt.hash('demo123', 10);
  
  // 1. Institution & Campus
  const institution = await prisma.institution.upsert({
    where: { code: 'CDU' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'CampusOS Demo University',
      code: 'CDU',
      subdomain: 'demo-campusos-v2',
      logoUrl: '',
      status: 'ACTIVE',
    }
  });

  const campus = await prisma.campus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      tenantId: institution.id,
      name: 'Main Campus',
      code: 'MC',
    }
  });

  // 2. Department & Program & Batch & Section
  const department = await prisma.department.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      tenantId: institution.id,
      campusId: campus.id,
      name: 'Computer Science and Engineering',
      code: 'CSE',
    }
  });

  const program = await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      tenantId: institution.id,
      departmentId: department.id,
      name: 'B.Tech Computer Science',
      code: 'BTECH-CS',
      durationYears: 4,
    }
  });

  const batch = await prisma.batch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      tenantId: institution.id,
      programId: program.id,
      name: 'Batch 2024-2028',
      startYear: 2024,
      endYear: 2028,
    }
  });

  const section = await prisma.section.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      tenantId: institution.id,
      batchId: batch.id,
      name: 'Section A',
      capacity: 60,
    }
  });

  // Users
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: institution.id, email: 'admin.demo@campusos.local' } },
    update: { passwordHash, tenantId: institution.id, role: 'INSTITUTION_ADMIN', isActive: true },
    create: {
      email: 'admin.demo@campusos.local',
      name: 'Aarav Mehta',
      passwordHash,
      role: 'INSTITUTION_ADMIN',
      tenantId: institution.id,
      isActive: true,
    }
  });

  const facultyUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: institution.id, email: 'faculty.demo@campusos.local' } },
    update: { passwordHash, tenantId: institution.id, role: 'FACULTY', isActive: true },
    create: {
      email: 'faculty.demo@campusos.local',
      name: 'Dr. Priya Sharma',
      passwordHash,
      role: 'FACULTY',
      tenantId: institution.id,
      isActive: true,
    }
  });
  
  await prisma.staff.upsert({
    where: { userId: facultyUser.id },
    update: { departmentId: department.id },
    create: {
      tenantId: institution.id,
      userId: facultyUser.id,
      employeeId: 'EMP-FAC-001',
      designation: 'Professor',
      departmentId: department.id,
    }
  });

  const parentUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: institution.id, email: 'parent.demo@campusos.local' } },
    update: { passwordHash, tenantId: institution.id, role: 'PARENT', isActive: true },
    create: {
      email: 'parent.demo@campusos.local',
      name: 'Anita Verma',
      passwordHash,
      role: 'PARENT',
      tenantId: institution.id,
      isActive: true,
    }
  });
  
  const guardian = await prisma.guardian.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      tenantId: institution.id,
      userId: parentUser.id,
      relationship: 'Mother',
    }
  });

  const studentUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: institution.id, email: 'student.demo@campusos.local' } },
    update: { passwordHash, tenantId: institution.id, role: 'STUDENT', isActive: true },
    create: {
      email: 'student.demo@campusos.local',
      name: 'Rohan Verma',
      passwordHash,
      role: 'STUDENT',
      tenantId: institution.id,
      isActive: true,
    }
  });
  
  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: { guardianId: guardian.id, batchId: batch.id, sectionId: section.id, cgpa: 3.8, creditsEarned: 45 },
    create: {
      tenantId: institution.id,
      userId: studentUser.id,
      rollNumber: 'STU-24-001',
      batchId: batch.id,
      sectionId: section.id,
      guardianId: guardian.id,
      cgpa: 3.8,
      creditsEarned: 45,
    }
  });

  // 6. AI Platform Models & Tenant Policy
  await prisma.aiModel.upsert({
    where: { modelId: 'campusos-mock-v1' },
    update: {},
    create: {
      provider: 'mock',
      modelId: 'campusos-mock-v1',
      name: 'CampusOS Native Engine (Mock/Local)',
      capability: 'chat',
      contextLimit: 128000,
      costClass: 'standard',
      isEnabled: true,
    }
  });

  await prisma.aiModel.upsert({
    where: { modelId: 'gpt-4o' },
    update: {},
    create: {
      provider: 'openai',
      modelId: 'gpt-4o',
      name: 'OpenAI GPT-4o (Enterprise RAG)',
      capability: 'chat',
      contextLimit: 128000,
      costClass: 'premium',
      isEnabled: true,
    }
  });

  await prisma.aiTenantPolicy.upsert({
    where: { tenantId: institution.id },
    update: {},
    create: {
      tenantId: institution.id,
      isEnabled: true,
      allowedRoles: ['STUDENT', 'FACULTY', 'INSTITUTION_ADMIN', 'PARENT'],
      maxMonthlyBudgetUsd: 500.0,
      currentMonthlySpendUsd: 12.45,
      rateLimitPerMin: 30,
      requireHumanApproval: true,
      retentionDays: 90,
    }
  });

  // 7. Seed Institutional RAG Knowledge Base Documents
  const policyDoc = await prisma.aiKnowledgeDocument.upsert({
    where: { id: '00000000-0000-0000-0000-000000000099' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000099',
      tenantId: institution.id,
      title: 'University Attendance & Examination Eligibility Policy 2026',
      category: 'Academic Regulations',
      scope: 'INSTITUTION',
      audience: 'ALL',
      classification: 'PUBLIC',
      publicationStatus: 'PUBLISHED',
      content: `1. Minimum Attendance Requirement: All registered students must maintain a minimum of 75% attendance in each course to be eligible for end-semester examinations.
2. Shortage & De-barment: Students falling between 60% and 74.9% attendance may submit a medical condonation petition to the Dean of Academic Affairs. Students with less than 60% attendance are automatically de-barred from writing the final examination.
3. Re-evaluation & Scrutiny: Students may apply for mark re-evaluation within 14 days of result publication upon payment of the ₹500 fee per course.`,
      authorName: 'Office of the Registrar',
    }
  });

  await prisma.aiKnowledgeChunk.upsert({
    where: { id: '00000000-0000-0000-0000-000000000098' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000098',
      documentId: policyDoc.id,
      tenantId: institution.id,
      chunkIndex: 0,
      content: policyDoc.content,
      tokenCount: 150,
    }
  });

  // 8. Phases 81-90 Ecosystem Seed
  await prisma.analyticsMetric.upsert({
    where: { id: '00000000-0000-0000-0000-000000000081' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000081',
      tenantId: institution.id,
      metricKey: 'ENROLLMENT_YIELD',
      name: 'Enrollment Yield Rate',
      category: 'Admissions',
      definition: 'Percentage of admitted students who complete enrollment registration',
      certificationStatus: 'CERTIFIED',
      currentValue: 84.2,
      previousValue: 81.5,
      unit: '%',
    }
  });

  await prisma.planningScenario.upsert({
    where: { id: '00000000-0000-0000-0000-000000000082' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000082',
      tenantId: institution.id,
      title: '2026-2028 Campus Expansion & Student Growth Simulation',
      baselineYear: 2026,
      targetEnrollment: 4500,
      facultyToStudentRatio: 18,
      projectedRevenueInr: 450000000,
      projectedExpenseInr: 320000000,
      status: 'DRAFT',
      assumptionsJson: { hostelExpansionBeds: 500, newFacultyHires: 35, tuitionIncreasePct: 5 },
    }
  });

  await prisma.studentSuccessCase.upsert({
    where: { id: '00000000-0000-0000-0000-000000000083' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000083',
      tenantId: institution.id,
      studentRollNumber: 'STU-24-001',
      studentName: 'Rohan Verma',
      riskCategory: 'ATTENDANCE_SHORTAGE',
      riskLevel: 'MEDIUM',
      status: 'INTERVENTION_PLANNED',
      assignedAdvisorId: facultyUser.id,
      notes: 'Scheduled academic review meeting with faculty advisor Dr. Priya Sharma.',
    }
  });

  await prisma.integrationConnection.upsert({
    where: { id: '00000000-0000-0000-0000-000000000084' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000084',
      tenantId: institution.id,
      provider: 'digilocker',
      category: 'Regulatory',
      status: 'ACTIVE',
      syncFrequency: 'REALTIME',
    }
  });

  await prisma.marketplaceApp.upsert({
    where: { slug: 'turnitin-plagiarism-checker' },
    update: {},
    create: {
      slug: 'turnitin-plagiarism-checker',
      name: 'Turnitin Academic Integrity Suite',
      publisher: 'Turnitin Inc',
      category: 'Learning',
      description: 'Automated plagiarism and similarity detection for assignments and research theses.',
      requestedPermissions: ['assignments:read', 'submissions:read'],
      status: 'VERIFIED',
    }
  });

  await prisma.smartDevice.upsert({
    where: { id: '00000000-0000-0000-0000-000000000087' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000087',
      tenantId: institution.id,
      deviceName: 'Central Library Occupancy Monitor',
      deviceType: 'OCCUPANCY_SENSOR',
      spaceName: 'Main Library 2F',
      status: 'ONLINE',
      lastReading: '142 / 200 Seats Occupied (71%)',
    }
  });

  await prisma.implementationProject.upsert({
    where: { id: '00000000-0000-0000-0000-000000000088' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000088',
      tenantId: institution.id,
      projectName: 'CampusOS Enterprise Digital Transformation',
      currentStage: 'PILOT',
      overallProgressPct: 85,
      targetGoLiveDate: new Date('2026-09-01'),
    }
  });

  await prisma.supportCase.upsert({
    where: { caseNumber: 'CAS-2026-001' },
    update: {},
    create: {
      tenantId: institution.id,
      userId: adminUser.id,
      caseNumber: 'CAS-2026-001',
      title: 'Legacy Data Migration Verification Support',
      category: 'Data Migration',
      priority: 'HIGH',
      status: 'INVESTIGATING',
    }
  });

  console.log('Seed successful');
}

seed().catch(e => console.error(e)).finally(() => prisma.$disconnect());
