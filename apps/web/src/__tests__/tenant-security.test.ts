import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma, getTenantDb } from '../lib/db';
import { generateRandomToken } from '../lib/auth';

describe('Phase 3: Multi-Tenancy & Security Isolation Engine', () => {
  let tenantA_Id: string;
  let tenantB_Id: string;
  let deptA_Id: string;
  
  beforeAll(async () => {
    // Create Tenant A
    const tenantA = await prisma.institution.create({
      data: {
        name: 'Test University A',
        code: `TU_A_${Date.now()}`,
        subdomain: `tua-${Date.now()}`,
        status: 'ACTIVE',
      }
    });
    tenantA_Id = tenantA.id;

    // Create Campus & Department for Tenant A
    const campusA = await prisma.campus.create({
      data: { tenantId: tenantA_Id, name: 'Campus A', code: 'CA' }
    });
    const deptA = await prisma.department.create({
      data: { tenantId: tenantA_Id, campusId: campusA.id, name: 'CS Dept A', code: 'CSA' }
    });
    deptA_Id = deptA.id;

    // Create Tenant B
    const tenantB = await prisma.institution.create({
      data: {
        name: 'Test University B',
        code: `TU_B_${Date.now()}`,
        subdomain: `tub-${Date.now()}`,
        status: 'ACTIVE',
      }
    });
    tenantB_Id = tenantB.id;

    // Create Campus & Department for Tenant B
    const campusB = await prisma.campus.create({
      data: { tenantId: tenantB_Id, name: 'Campus B', code: 'CB' }
    });
    const deptB = await prisma.department.create({
      data: { tenantId: tenantB_Id, campusId: campusB.id, name: 'Math Dept B', code: 'MTHB' }
    });
    
    // Seed some data bypassing the tenant wrapper (raw admin level)
    await prisma.course.createMany({
      data: [
        { tenantId: tenantA_Id, title: 'Intro to CS (A)', code: 'CS101A', departmentId: deptA.id, lectureCredits: 3, tutorialCredits: 1, practicalCredits: 0 },
        { tenantId: tenantA_Id, title: 'Data Structures (A)', code: 'CS102A', departmentId: deptA.id, lectureCredits: 3, tutorialCredits: 1, practicalCredits: 0 },
        { tenantId: tenantB_Id, title: 'Intro to Math (B)', code: 'MTH101B', departmentId: deptB.id, lectureCredits: 3, tutorialCredits: 1, practicalCredits: 0 },
      ]
    });
  });

  it('Tenant A cannot read Tenant B data', async () => {
    const dbA = getTenantDb(tenantA_Id);
    
    // Attempt to query all courses
    const allCoursesVisibleToA = await dbA.course.findMany();
    
    expect(allCoursesVisibleToA.length).toBe(2);
    expect(allCoursesVisibleToA.every(c => c.tenantId === tenantA_Id)).toBe(true);
    
    // Attempt to directly read a Tenant B course
    const bCourse = await prisma.course.findFirst({ where: { tenantId: tenantB_Id } });
    const illegalRead = await dbA.course.findUnique({ where: { id: bCourse!.id } });
    
    expect(illegalRead).toBeNull();
  });

  it('Tenant A cannot update Tenant B data', async () => {
    const dbA = getTenantDb(tenantA_Id);
    const bCourse = await prisma.course.findFirst({ where: { tenantId: tenantB_Id } });
    
    // Attempt to update Tenant B's course
    try {
      await dbA.course.update({
        where: { id: bCourse!.id },
        data: { title: 'Hacked by A' }
      });
      // Should not reach here if isolation works (Prisma throws RecordNotFound)
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe('P2025'); // Record not found
    }
    
    // Verify it wasn't updated
    const verifyB = await prisma.course.findUnique({ where: { id: bCourse!.id } });
    expect(verifyB!.title).toBe('Intro to Math (B)');
  });

  it('Tenant A cannot delete Tenant B data', async () => {
    const dbA = getTenantDb(tenantA_Id);
    const bCourse = await prisma.course.findFirst({ where: { tenantId: tenantB_Id } });
    
    try {
      await dbA.course.delete({
        where: { id: bCourse!.id }
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe('P2025');
    }
  });

  it('New records automatically inherit the active tenant context', async () => {
    const dbA = getTenantDb(tenantA_Id);
    
    const newCourse = await dbA.course.create({
      data: {
        title: 'Physics 101',
        code: 'PHY101',
        departmentId: deptA_Id,
        lectureCredits: 3,
        tutorialCredits: 0,
        practicalCredits: 0,
      }
    });
    
    // The tenantId should have been injected seamlessly
    expect(newCourse.tenantId).toBe(tenantA_Id);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.institution.delete({ where: { id: tenantA_Id } });
    await prisma.institution.delete({ where: { id: tenantB_Id } });
  });
});
