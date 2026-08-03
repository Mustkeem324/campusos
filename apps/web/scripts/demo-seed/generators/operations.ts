import { PrismaClient, Institution } from '@prisma/client';
import { DemoSeedConfig } from '../config';
import { SeededRandom } from '../random';
import { PeopleDataset } from './people';

export async function seedOperations(
  prisma: PrismaClient,
  institution: Institution,
  people: PeopleDataset,
  config: DemoSeedConfig,
  random: SeededRandom
): Promise<void> {
  // 1. AI Models & Tenant Policy
  await prisma.aiModel.upsert({
    where: { modelId: 'campusos-mock-v1' },
    update: { isEnabled: true },
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
    update: { isEnabled: true },
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
    update: { isEnabled: true },
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

  // RAG Knowledge Base Document
  const docId = random.generateStableId(22, 1);
  const policyDoc = await prisma.aiKnowledgeDocument.upsert({
    where: { id: docId },
    update: {},
    create: {
      id: docId,
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

  const chunkId = random.generateStableId(22, 2);
  await prisma.aiKnowledgeChunk.upsert({
    where: { id: chunkId },
    update: {},
    create: {
      id: chunkId,
      documentId: policyDoc.id,
      tenantId: institution.id,
      chunkIndex: 0,
      content: policyDoc.content,
      tokenCount: 150,
    }
  });

  // 2. Analytics Metric
  const metricId = random.generateStableId(22, 3);
  await prisma.analyticsMetric.upsert({
    where: { id: metricId },
    update: { currentValue: 84.2 },
    create: {
      id: metricId,
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

  // 3. Digital Twin Planning Scenario
  const scenarioId = random.generateStableId(22, 4);
  await prisma.planningScenario.upsert({
    where: { id: scenarioId },
    update: { targetEnrollment: 4500 },
    create: {
      id: scenarioId,
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

  // 4. Student Success Case
  const caseId = random.generateStableId(22, 5);
  await prisma.studentSuccessCase.upsert({
    where: { id: caseId },
    update: { status: 'INTERVENTION_PLANNED' },
    create: {
      id: caseId,
      tenantId: institution.id,
      studentRollNumber: 'CDU-2024-0001',
      studentName: people.studentUsers[0].name,
      riskCategory: 'ATTENDANCE_SHORTAGE',
      riskLevel: 'MEDIUM',
      status: 'INTERVENTION_PLANNED',
      assignedAdvisorId: people.facultyUsers[0].id,
      notes: 'Scheduled academic review meeting with faculty advisor.',
    }
  });

  // 5. Integration Connection
  const connId = random.generateStableId(22, 6);
  await prisma.integrationConnection.upsert({
    where: { id: connId },
    update: { status: 'ACTIVE' },
    create: {
      id: connId,
      tenantId: institution.id,
      provider: 'digilocker',
      category: 'Regulatory',
      status: 'ACTIVE',
      syncFrequency: 'REALTIME',
    }
  });

  // 6. Marketplace App
  await prisma.marketplaceApp.upsert({
    where: { slug: 'turnitin-plagiarism-checker' },
    update: { status: 'VERIFIED' },
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

  // 7. Smart Device
  const devId = random.generateStableId(22, 7);
  await prisma.smartDevice.upsert({
    where: { id: devId },
    update: { status: 'ONLINE' },
    create: {
      id: devId,
      tenantId: institution.id,
      deviceName: 'Central Library Occupancy Monitor',
      deviceType: 'OCCUPANCY_SENSOR',
      spaceName: 'Main Library 2F',
      status: 'ONLINE',
      lastReading: '142 / 200 Seats Occupied (71%)',
    }
  });

  // 8. Implementation Project
  const projId = random.generateStableId(22, 8);
  await prisma.implementationProject.upsert({
    where: { id: projId },
    update: { overallProgressPct: 85 },
    create: {
      id: projId,
      tenantId: institution.id,
      projectName: 'CampusOS Enterprise Digital Transformation',
      currentStage: 'PILOT',
      overallProgressPct: 85,
      targetGoLiveDate: new Date('2026-09-01'),
    }
  });

  // 9. Support Case
  await prisma.supportCase.upsert({
    where: { caseNumber: 'CAS-2026-001' },
    update: { status: 'INVESTIGATING' },
    create: {
      tenantId: institution.id,
      userId: people.facultyUsers[0].id,
      caseNumber: 'CAS-2026-001',
      title: 'Legacy Data Migration Verification Support',
      category: 'Data Migration',
      priority: 'HIGH',
      status: 'INVESTIGATING',
    }
  });
}
