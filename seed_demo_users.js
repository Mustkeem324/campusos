const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  const passwordHash = await bcrypt.hash('demo123', 10);
  
  // Create a Demo Institution
  const institution = await prisma.institution.upsert({
    where: { slug: 'demo-university' },
    update: {},
    create: {
      name: 'Demo University',
      slug: 'demo-university',
      domain: 'demo.campusos.com',
      logoUrl: '',
      theme: {},
      settings: {}
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
      where: { email: u.email },
      update: { passwordHash, tenantId: institution.id, role: u.role },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
        tenantId: institution.id,
        isActive: true,
      }
    });
    console.log(`Upserted ${u.email}`);
  }
}

seed()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
