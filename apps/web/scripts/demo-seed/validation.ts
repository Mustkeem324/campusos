import { PrismaClient } from '@prisma/client';
import { DemoSeedConfig } from './config';

export interface ValidationReport {
  isValid: boolean;
  tenantCode: string;
  studentCount: number;
  facultyCount: number;
  employeeCount: number;
  guardianCount: number;
  invoiceCount: number;
  errors: string[];
}

export async function validateDemoSeed(prisma: PrismaClient, config: DemoSeedConfig): Promise<ValidationReport> {
  const errors: string[] = [];

  // 1. Fetch Demo Institution
  const tenant = await prisma.institution.findFirst({
    where: { code: config.tenantCode },
  });

  if (!tenant) {
    return {
      isValid: false,
      tenantCode: config.tenantCode,
      studentCount: 0,
      facultyCount: 0,
      employeeCount: 0,
      guardianCount: 0,
      invoiceCount: 0,
      errors: [`Demo tenant ${config.tenantCode} not found in database.`],
    };
  }

  // 2. Count Entities
  const studentCount = await prisma.student.count({ where: { tenantId: tenant.id } });
  const facultyCount = await prisma.staff.count({ where: { tenantId: tenant.id, designation: { in: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Instructor'] } } });
  const employeeCount = await prisma.staff.count({ where: { tenantId: tenant.id, designation: { notIn: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Instructor'] } } });
  const guardianCount = await prisma.guardian.count({ where: { tenantId: tenant.id } });
  const invoiceCount = await prisma.invoice.count({ where: { tenantId: tenant.id } });

  if (studentCount !== config.students) {
    errors.push(`Student count mismatch: expected ${config.students}, found ${studentCount}`);
  }

  if (facultyCount < Math.min(config.faculty, 5)) {
    errors.push(`Faculty count too low: expected ${config.faculty}, found ${facultyCount}`);
  }

  // 3. Unique Email Check & Domain Check
  const users = await prisma.user.findMany({
    where: { tenantId: tenant.id },
    select: { email: true, role: true },
  });

  const emails = users.map(u => u.email);
  const uniqueEmails = new Set(emails);
  if (uniqueEmails.size !== emails.length) {
    errors.push(`Duplicate email addresses found in tenant ${config.tenantCode}`);
  }

  const invalidDomains = emails.filter(e => !e.endsWith('.local') && !e.endsWith('.test') && !e.endsWith('@campusos.com'));
  if (invalidDomains.length > 0) {
    errors.push(`Non-synthetic email domain detected in demo tenant: ${invalidDomains.slice(0, 3).join(', ')}`);
  }

  // 4. Financial Consistency Check
  const invoices = await prisma.invoice.findMany({
    where: { tenantId: tenant.id },
    include: { payments: true },
  });

  for (const inv of invoices) {
    const paidSum = inv.payments.reduce((acc, p) => acc + (p.status === 'PAID' ? p.amount : 0), 0);
    if (inv.status === 'PAID' && Math.abs(inv.amount - paidSum) > 0.01) {
      errors.push(`Invoice ${inv.id} paid status inconsistency: Total ${inv.amount}, Paid sum ${paidSum}`);
    }
  }

  // 5. Cross-tenant Leakage Check
  const foreignRecords = await prisma.user.count({
    where: {
      tenantId: { not: tenant.id },
      email: { endsWith: '@demo-campusos.local' },
    }
  });

  if (foreignRecords > 0) {
    errors.push(`Cross-tenant data leakage: Found ${foreignRecords} demo emails outside tenant ${tenant.code}`);
  }

  return {
    isValid: errors.length === 0,
    tenantCode: tenant.code,
    studentCount,
    facultyCount,
    employeeCount,
    guardianCount,
    invoiceCount,
    errors,
  };
}
