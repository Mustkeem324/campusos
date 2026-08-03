import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { hashPassword, generateRandomToken } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const { 
      legalName,
      institutionType,
      country,
      city,
      officialEmail,
      campuses,
      students,
      currentErp,
      contactFirstName,
      contactLastName,
      contactRole,
      contactPhone,
      modules,
      deploymentType,
      consent
    } = await request.json();

    if (!legalName || !officialEmail || !contactFirstName || !contactLastName || !consent) {
      return NextResponse.json({ error: 'Missing required fields or consent' }, { status: 400 });
    }

    // Rate limiting logic mock
    // Check if email is already in use globally
    const existingUser = await prisma.user.findFirst({
      where: { email: officialEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Generate a slugified subdomain
    let baseSubdomain = legalName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let subdomain = baseSubdomain;
    let counter = 1;
    
    while (true) {
      const existing = await prisma.institution.findUnique({ where: { subdomain } });
      if (!existing) break;
      subdomain = `\${baseSubdomain}\${counter}`;
      counter++;
    }

    // Create the institution code
    const institutionCode = subdomain.toUpperCase().substring(0, 10);
    // Temporary password until they set one via email activation
    const hashedPassword = await hashPassword(generateRandomToken(16));
    const verificationToken = generateRandomToken(32);

    const institution = await prisma.$transaction(async (tx) => {
      const inst = await tx.institution.create({
        data: {
          name: legalName,
          code: institutionCode,
          subdomain,
          status: 'EMAIL_VERIFICATION_PENDING',
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: inst.id,
          email: officialEmail,
          phone: contactPhone,
          passwordHash: hashedPassword,
          name: `\${contactFirstName} \${contactLastName}`,
          role: 'INSTITUTION_ADMIN',
          isActive: false, 
          verificationToken: verificationToken,
        },
      });

      // Audit Log for Institution Creation
      await tx.auditLog.create({
        data: {
          tenantId: inst.id,
          userId: user.id,
          action: 'INSTITUTION_SIGNUP',
          entity: 'Institution',
          diffJson: JSON.stringify({
            country, city, students, campuses, institutionType, contactRole, currentErp, modules, deploymentType
          }),
          ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        }
      });

      return inst;
    });

    return NextResponse.json({ success: true, institutionId: institution.id });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
