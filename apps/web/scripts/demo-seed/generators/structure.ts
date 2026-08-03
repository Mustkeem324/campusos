import { PrismaClient, Institution, Campus, Department, Program, Batch, Section, AcademicYear, Term } from '@prisma/client';
import { DemoSeedConfig } from '../config';
import { SeededRandom } from '../random';
import { DEPARTMENTS, PROGRAMMES } from '../constants';

export interface AcademicStructure {
  campuses: Campus[];
  departments: Department[];
  programmes: Program[];
  batches: Batch[];
  sections: Section[];
  academicYears: AcademicYear[];
  terms: Term[];
}

export async function seedAcademicStructure(
  prisma: PrismaClient,
  institution: Institution,
  config: DemoSeedConfig,
  random: SeededRandom
): Promise<AcademicStructure> {
  // 1. Campuses
  const campusNames = ['Central Campus', 'Innovation Campus', 'South City Campus', 'Tech Park Campus'];
  const campuses: Campus[] = [];

  for (let i = 0; i < config.campuses; i++) {
    const campusName = campusNames[i % campusNames.length];
    const code = `CAMP-${i + 1}`;
    const id = random.generateStableId(2, i);

    const campus = await prisma.campus.upsert({
      where: { id },
      update: { name: campusName, code },
      create: {
        id,
        tenantId: institution.id,
        name: campusName,
        code,
      }
    });
    campuses.push(campus);
  }

  // 2. Departments
  const departments: Department[] = [];
  const activeDepts = DEPARTMENTS.slice(0, config.departments);

  for (let i = 0; i < activeDepts.length; i++) {
    const deptInfo = activeDepts[i];
    const campus = campuses[i % campuses.length];
    const id = random.generateStableId(3, i);

    const dept = await prisma.department.upsert({
      where: { id },
      update: { name: deptInfo.name, code: deptInfo.code, campusId: campus.id },
      create: {
        id,
        tenantId: institution.id,
        campusId: campus.id,
        name: deptInfo.name,
        code: deptInfo.code,
      }
    });
    departments.push(dept);
  }

  // 3. Programmes
  const programmes: Program[] = [];
  const activeProgs = PROGRAMMES.slice(0, config.programmes);

  for (let i = 0; i < activeProgs.length; i++) {
    const progInfo = activeProgs[i];
    const dept = departments.find(d => d.code === progInfo.deptCode) || departments[i % departments.length];
    const id = random.generateStableId(4, i);

    const prog = await prisma.program.upsert({
      where: { id },
      update: { name: progInfo.name, code: progInfo.code, departmentId: dept.id, durationYears: progInfo.durationYears },
      create: {
        id,
        tenantId: institution.id,
        departmentId: dept.id,
        name: progInfo.name,
        code: progInfo.code,
        durationYears: progInfo.durationYears,
      }
    });
    programmes.push(prog);
  }

  // 4. Batches
  const batches: Batch[] = [];
  let batchIndex = 0;

  for (const prog of programmes) {
    for (let yr = 0; yr < config.academicYears; yr++) {
      const startYear = 2024 - yr;
      const endYear = startYear + prog.durationYears;
      const batchName = `Batch ${startYear}-${endYear}`;
      const id = random.generateStableId(5, batchIndex);

      const batch = await prisma.batch.upsert({
        where: { id },
        update: { name: batchName, startYear, endYear },
        create: {
          id,
          tenantId: institution.id,
          programId: prog.id,
          name: batchName,
          startYear,
          endYear,
        }
      });
      batches.push(batch);
      batchIndex++;
    }
  }

  // 5. Sections
  const sections: Section[] = [];
  let sectionIndex = 0;
  const sectionLetters = ['A', 'B', 'C', 'D'];

  for (const batch of batches) {
    const sectionCount = Math.max(1, Math.floor(config.sections / batches.length));
    for (let s = 0; s < sectionCount; s++) {
      const secName = `Section ${sectionLetters[s % sectionLetters.length]}`;
      const id = random.generateStableId(6, sectionIndex);

      const sec = await prisma.section.upsert({
        where: { id },
        update: { name: secName, capacity: 60 },
        create: {
          id,
          tenantId: institution.id,
          batchId: batch.id,
          name: secName,
          capacity: 60,
        }
      });
      sections.push(sec);
      sectionIndex++;
    }
  }

  // 6. Academic Years & Terms
  const academicYears: AcademicYear[] = [];
  const terms: Term[] = [];

  const ayId = random.generateStableId(23, 0);
  const academicYear = await prisma.academicYear.upsert({
    where: { id: ayId },
    update: { name: '2026-2027', isCurrent: true },
    create: {
      id: ayId,
      tenantId: institution.id,
      name: '2026-2027',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-06-30'),
      isCurrent: true,
    }
  });
  academicYears.push(academicYear);

  const termId = random.generateStableId(24, 0);
  const term = await prisma.term.upsert({
    where: { id: termId },
    update: { name: 'Fall Semester 2026', number: 1 },
    create: {
      id: termId,
      tenantId: institution.id,
      academicYearId: academicYear.id,
      name: 'Fall Semester 2026',
      number: 1,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-12-31'),
    }
  });
  terms.push(term);

  return {
    campuses,
    departments,
    programmes,
    batches,
    sections,
    academicYears,
    terms,
  };
}
