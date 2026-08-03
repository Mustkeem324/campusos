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

  console.log('Seed successful');
}

seed().catch(e => console.error(e)).finally(() => prisma.$disconnect());
