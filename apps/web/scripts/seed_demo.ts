import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  const passwordHash = await bcrypt.hash('demo123', 10);
  
  const institution = await prisma.institution.upsert({
    where: { code: 'DEMO-UNI' },
    update: {},
    create: {
      name: 'Demo University',
      code: 'DEMO-UNI',
      subdomain: 'demo',
      logoUrl: '',
    }
  });

  const users = [
    { email: 'admin@campusos.com', name: 'Admin Demo', role: 'INSTITUTION_ADMIN' },
    { email: 'faculty@campusos.com', name: 'Faculty Demo', role: 'FACULTY' },
    { email: 'student@campusos.com', name: 'Student Demo', role: 'STUDENT' },
    { email: 'parent@campusos.com', name: 'Parent Demo', role: 'PARENT' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: institution.id, email: u.email } },
      update: { passwordHash, tenantId: institution.id, role: u.role as any },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role as any,
        tenantId: institution.id,
        isActive: true,
      }
    });
    console.log(`Upserted ${u.email}`);
  }
}

seed().catch(e => console.error(e)).finally(() => prisma.$disconnect());
