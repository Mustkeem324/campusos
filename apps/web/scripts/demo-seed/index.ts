import { PrismaClient } from '@prisma/client';
import { parseSeedConfig } from './config';
import { assertSeedSafety } from './safety';
import { SeededRandom } from './random';
import { resetDemoTenantData } from './cleanup';
import { validateDemoSeed } from './validation';
import { seedInstitutionAndPersonas } from './generators/institution';
import { seedAcademicStructure } from './generators/structure';
import { seedPeople } from './generators/people';
import { seedAcademics } from './generators/academics';
import { seedFinance } from './generators/finance';
import { seedOperations } from './generators/operations';
import { seedStudentLife } from './generators/studentLife';
import { seedLmsContent } from './generators/lmsContent';
import { seedGradebook } from './generators/gradebook';

const prisma = new PrismaClient();

async function runDemoSeed() {
  const startTime = Date.now();
  const config = parseSeedConfig();

  // 1. Enforce Safety Guardrails
  assertSeedSafety(config);

  console.log('----------------------------------------------------');
  console.log(`🎓 CampusOS Deterministic Demo Seed Generator v2.0`);
  console.log('----------------------------------------------------');
  console.log(`Tenant:           ${config.tenantName} (${config.tenantCode})`);
  console.log(`Seed Value:       ${config.seed}`);
  console.log(`Target Students:  ${config.students}`);
  console.log(`Target Faculty:   ${config.faculty}`);
  console.log(`Target Courses:   ${config.courses}`);
  console.log(`Reset First:      ${config.reset ? 'YES' : 'NO'}`);
  console.log(`Dry Run:          ${config.dryRun ? 'YES' : 'NO'}`);
  console.log('----------------------------------------------------\n');

  // 2. Handle Dry Run Mode
  if (config.dryRun) {
    console.log('[DRY-RUN] Safety check passed.');
    console.log('[DRY-RUN] Database classification: Ephemeral/Development DB.');
    console.log('[DRY-RUN] Planned creations:');
    console.log(`  - Campuses:     ${config.campuses}`);
    console.log(`  - Departments:  ${config.departments}`);
    console.log(`  - Programmes:   ${config.programmes}`);
    console.log(`  - Students:     ${config.students}`);
    console.log(`  - Faculty:      ${config.faculty}`);
    console.log(`  - Courses:      ${config.courses}`);
    console.log('[DRY-RUN] No database mutations executed.');
    return;
  }

  // 3. Handle Validate Only Mode
  if (config.validateOnly) {
    console.log('[VALIDATE-ONLY] Running validation checks...');
    const report = await validateDemoSeed(prisma, config);
    if (report.isValid) {
      console.log('✓ Validation PASSED');
      console.log(`  Tenant:     ${report.tenantCode}`);
      console.log(`  Students:   ${report.studentCount}`);
      console.log(`  Faculty:    ${report.facultyCount}`);
      console.log(`  Guardians:  ${report.guardianCount}`);
      console.log(`  Invoices:   ${report.invoiceCount}`);
      process.exit(0);
    } else {
      console.error('❌ Validation FAILED:');
      report.errors.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    }
  }

  const random = new SeededRandom(config.seed);

  // 4. Reset Demo Tenant Data if Requested
  const existingTenant = await prisma.institution.findFirst({ where: { code: config.tenantCode } });
  if (config.reset && existingTenant) {
    await resetDemoTenantData(prisma, existingTenant.id);
  }

  // 5. Execute Generation Pipeline
  console.log('Seeding demo institution & quick demo personas...');
  const personas = await seedInstitutionAndPersonas(prisma, config, random);

  console.log('Seeding academic structure (campuses, departments, programmes, batches, sections)...');
  const structure = await seedAcademicStructure(prisma, personas.institution, config, random);

  console.log('Seeding faculty, staff, guardians and students...');
  const people = await seedPeople(prisma, personas.institution, structure, personas, config, random);

  console.log('Seeding courses, course offerings, registrations, attendance, and assignments...');
  const academics = await seedAcademics(prisma, personas.institution, structure, people, config, random);

  console.log('Seeding fee structures, invoices, payments and scholarships...');
  const finance = await seedFinance(prisma, personas.institution, people, config, random);

  console.log('Seeding operations, smart campus devices, and AI governance...');
  await seedOperations(prisma, personas.institution, people, config, random);

  console.log('Seeding student-life records (notices, exams, results, hostel, services)...');
  await seedStudentLife(prisma, personas.institution, structure, people, academics, random);

  console.log('Seeding LMS course modules and lessons...');
  await seedLmsContent(prisma, personas.institution, academics, random);

  console.log('Seeding rubrics and gradebook content...');
  await seedGradebook(prisma, personas.institution, academics, random);

  // 6. Post-Seed Validation
  console.log('Validating generated demo dataset...');
  const report = await validateDemoSeed(prisma, config);

  if (!report.isValid) {
    console.error('❌ Post-seed validation FAILED:');
    report.errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  const elapsedMs = Date.now() - startTime;

  // 7. Print Seed Summary Report
  console.log('\n====================================================');
  console.log('CampusOS Demo Seed Completed');
  console.log('====================================================');
  console.log(`Seed:              ${config.seed}`);
  console.log(`Tenant:            ${personas.institution.name} (${personas.institution.code})`);
  console.log(`Execution Time:    ${(elapsedMs / 1000).toFixed(2)}s`);
  console.log('\nGenerated Records:');
  console.log(`  Campuses:        ${structure.campuses.length}`);
  console.log(`  Departments:     ${structure.departments.length}`);
  console.log(`  Programmes:      ${structure.programmes.length}`);
  console.log(`  Batches:         ${structure.batches.length}`);
  console.log(`  Sections:        ${structure.sections.length}`);
  console.log(`  Students:        ${people.students.length}`);
  console.log(`  Guardians:       ${people.guardians.length}`);
  console.log(`  Faculty:         ${people.facultyStaff.length}`);
  console.log(`  Employees:       ${people.employeeStaff.length}`);
  console.log(`  Courses:         ${academics.courses.length}`);
  console.log(`  CourseOfferings: ${academics.courseOfferings.length}`);
  console.log(`  Registrations:   ${academics.registrations.length}`);
  console.log(`  Invoices:        ${finance.invoices.length}`);
  console.log('\nValidation:');
  console.log('  Status:          PASSED');
  console.log('====================================================\n');
}

runDemoSeed()
  .catch((error) => {
    console.error('Demo Seed Execution Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
