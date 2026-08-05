import { PrismaClient, Institution, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DemoSeedConfig } from '../config';
import { SeededRandom } from '../random';

export interface DemoPersonas {
  institution: Institution;
  adminUser: User;
  facultyUser: User;
  studentUser: User;
  parentUser: User;
  financeUser: User;
  passwordHash: string;
}

export async function seedInstitutionAndPersonas(
  prisma: PrismaClient,
  config: DemoSeedConfig,
  random: SeededRandom
): Promise<DemoPersonas> {
  const passwordHash = await bcrypt.hash('demo123', 10);
  const instId = random.generateStableId(1, 0);

  const institution = await prisma.institution.upsert({
    where: { code: config.tenantCode },
    update: {
      name: config.tenantName,
      subdomain: config.tenantDomain,
      status: 'ACTIVE',
    },
    create: {
      id: instId,
      name: config.tenantName,
      code: config.tenantCode,
      subdomain: config.tenantDomain,
      logoUrl: '',
      status: 'ACTIVE',
    }
  });

  // Quick Demo Admin
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: institution.id, email: 'admin.demo@campusos.local' } },
    update: { passwordHash, role: 'INSTITUTION_ADMIN', isActive: true, name: 'Aarav Mehta' },
    create: {
      id: random.generateStableId(7, 1),
      email: 'admin.demo@campusos.local',
      name: 'Aarav Mehta',
      passwordHash,
      role: 'INSTITUTION_ADMIN',
      tenantId: institution.id,
      isActive: true,
    }
  });

  // Quick Demo Faculty
  const facultyUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: institution.id, email: 'faculty.demo@campusos.local' } },
    update: { passwordHash, role: 'FACULTY', isActive: true, name: 'Dr. Priya Sharma' },
    create: {
      id: random.generateStableId(7, 2),
      email: 'faculty.demo@campusos.local',
      name: 'Dr. Priya Sharma',
      passwordHash,
      role: 'FACULTY',
      tenantId: institution.id,
      isActive: true,
    }
  });

  // Quick Demo Student
  const studentUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: institution.id, email: 'student.demo@campusos.local' } },
    update: { passwordHash, role: 'STUDENT', isActive: true, name: 'Rohan Verma' },
    create: {
      id: random.generateStableId(7, 3),
      email: 'student.demo@campusos.local',
      name: 'Rohan Verma',
      passwordHash,
      role: 'STUDENT',
      tenantId: institution.id,
      isActive: true,
    }
  });

  // Quick Demo Parent
  const parentUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: institution.id, email: 'parent.demo@campusos.local' } },
    update: { passwordHash, role: 'PARENT', isActive: true, name: 'Anita Verma' },
    create: {
      id: random.generateStableId(7, 4),
      email: 'parent.demo@campusos.local',
      name: 'Anita Verma',
      passwordHash,
      role: 'PARENT',
      tenantId: institution.id,
      isActive: true,
    }
  });

  // Quick Demo Finance Officer
  const financeUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: institution.id, email: 'finance.demo@campusos.local' } },
    update: { passwordHash, role: 'FINANCE_OFFICER', isActive: true, name: 'Kavya Nair' },
    create: {
      id: random.generateStableId(7, 5),
      email: 'finance.demo@campusos.local',
      name: 'Kavya Nair',
      passwordHash,
      role: 'FINANCE_OFFICER',
      tenantId: institution.id,
      isActive: true,
    }
  });

  return {
    institution,
    adminUser,
    facultyUser,
    studentUser,
    parentUser,
    financeUser,
    passwordHash,
  };
}
