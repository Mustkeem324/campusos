import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleType } from '@prisma/client';
import { POST, GET } from '../app/api/departments/route';
import { PUT, DELETE } from '../app/api/departments/[id]/route';

const CAMPUS_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_CAMPUS_ID = '22222222-2222-4222-8222-222222222222';
const DEPARTMENT_ID = '33333333-3333-4333-8333-333333333333';

type TestSession = { userId: string; tenantId: string; role: RoleType } | null;
let testSession: TestSession = null;
let campusExists: boolean;
let departmentIdForRoute: string;
let db: ReturnType<typeof makeDb>;

function auditLogData() {
  const call = db.auditLog.create.mock.calls[0]?.[0] as { data: Record<string, unknown> } | undefined;
  return call?.data;
}

const dbMock = vi.hoisted(() => ({
  getTenantDb: vi.fn(),
}));

vi.mock('../lib/db', () => dbMock);

vi.mock('../lib/tenant-context', async () => {
  const { getTenantDb } = await import('../lib/db');
  return {
    requireTenantContext: vi.fn(async () => {
      if (!testSession) throw new Error('Unauthorized: No valid tenant context found in session.');
      return {
        db: getTenantDb(testSession.tenantId),
        session: testSession,
        tenantId: testSession.tenantId,
        userId: testSession.userId,
        role: testSession.role,
      };
    }),
  };
});

function makeDb() {
  return {
    department: {
      findMany: vi.fn(async (_args: { where?: Record<string, unknown>; include?: unknown; orderBy?: unknown }) => [
        {
          id: DEPARTMENT_ID,
          name: 'Computer Science',
          code: 'CSE',
          campusId: CAMPUS_ID,
          campus: { name: 'Main Campus' },
          _count: { programs: 2, courses: 5 },
        },
      ]),
      create: vi.fn(async (args: any) => ({
        id: DEPARTMENT_ID,
        ...args.data,
        campus: { name: 'Main Campus' },
      })),
      update: vi.fn(async (args: any) => ({
        id: DEPARTMENT_ID,
        name: 'Updated Name',
        code: 'UPD',
        campusId: CAMPUS_ID,
        campus: { name: 'Main Campus' },
        ...args.data,
      })),
      delete: vi.fn(async (args: any) => ({
        id: args.where.id,
        name: 'Computer Science',
        code: 'CSE',
      })),
    },
    campus: {
      findUnique: vi.fn(async ({ where }: any) =>
        campusExists && where.id === CAMPUS_ID ? { id: CAMPUS_ID, name: 'Main Campus' } : null,
      ),
    },
    auditLog: {
      create: vi.fn(async (args: any) => ({ id: 'audit-uuid', ...args.data })),
    },
  };
}

function makeRequest(url: string, init: RequestInit = {}): Request {
  return new Request(url, {
    method: init.method ?? 'GET',
    headers: { 'content-type': 'application/json', ...init.headers },
    body: init.body,
  });
}

describe('Departments API validation and authorization', () => {
  beforeEach(() => {
    testSession = { userId: 'user-admin-1', tenantId: 'tenant-1', role: RoleType.INSTITUTION_ADMIN };
    campusExists = true;
    departmentIdForRoute = DEPARTMENT_ID;
    db = makeDb();
    dbMock.getTenantDb.mockImplementation(() => db);
  });

  describe('POST /api/departments', () => {
    it('rejects a role without edit_academic_records with 403', async () => {
      testSession = { userId: 'user-student-1', tenantId: 'tenant-1', role: RoleType.STUDENT };
      const res = await POST(
        makeRequest('http://localhost/api/departments', {
          method: 'POST',
          body: JSON.stringify({ name: 'Computer Science', code: 'CSE', campusId: CAMPUS_ID }),
        }),
      );
      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({ error: expect.stringContaining('lacks permission') });
      // Tenant context is resolved first, but no department write may run
      // for a forbidden actor.
      expect(db.department.create).not.toHaveBeenCalled();
      expect(db.campus.findUnique).not.toHaveBeenCalled();
    });

    it('returns 400 when the department code is shorter than the Zod minimum', async () => {
      const res = await POST(
        makeRequest('http://localhost/api/departments', {
          method: 'POST',
          body: JSON.stringify({ name: 'IT', code: '', campusId: CAMPUS_ID }),
        }),
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Validation Error');
      expect(JSON.stringify(json.details)).toContain('code');
    });

    it('returns 400 for a non-UUID campusId', async () => {
      const res = await POST(
        makeRequest('http://localhost/api/departments', {
          method: 'POST',
          body: JSON.stringify({ name: 'Computer Science', code: 'CSE', campusId: 'not-a-uuid' }),
        }),
      );
      expect(res.status).toBe(400);
      expect(JSON.stringify((await res.json()).details)).toContain('campusId');
    });

    it('returns 404 when the campus does not belong to the tenant', async () => {
      campusExists = false;
      const res = await POST(
        makeRequest('http://localhost/api/departments', {
          method: 'POST',
          body: JSON.stringify({ name: 'Computer Science', code: 'CSE', campusId: OTHER_CAMPUS_ID }),
        }),
      );
      expect(res.status).toBe(404);
      expect(await res.json()).toMatchObject({ error: 'Campus not found' });
    });

    it('creates the department, uppercases the code, and writes an audit log', async () => {
      const res = await POST(
        makeRequest('http://localhost/api/departments', {
          method: 'POST',
          body: JSON.stringify({ name: 'Computer Science', code: 'cse', campusId: CAMPUS_ID }),
        }),
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.code).toBe('CSE'); // Zod .toUpperCase() transform
      expect(body.tenantId).toBe('tenant-1');

      const createCall = db.department.create.mock.calls[0]?.[0] as { data: any };
      expect(createCall.data.tenantId).toBe('tenant-1');
      expect(createCall.data.campusId).toBe(CAMPUS_ID);

      expect(db.auditLog.create).toHaveBeenCalledTimes(1);
      expect(auditLogData()).toMatchObject({
        action: 'CREATE',
        entity: 'DEPARTMENT',
        tenantId: 'tenant-1',
        userId: 'user-admin-1',
      });
    });
  });

  describe('GET /api/departments', () => {
    it('lists departments for the tenant without a campus filter', async () => {
      const res = await GET(makeRequest('http://localhost/api/departments'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({ code: 'CSE', campus: { name: 'Main Campus' } });
      const findManyCall = db.department.findMany.mock.calls[0]?.[0] as { where: any };
      expect(findManyCall.where).toEqual({});
    });

    it('passes a campusId filter through to the query', async () => {
      const res = await GET(makeRequest(`http://localhost/api/departments?campusId=${CAMPUS_ID}`));
      expect(res.status).toBe(200);
      const findManyCall = db.department.findMany.mock.calls[0]?.[0] as { where: any };
      expect(findManyCall.where).toEqual({ campusId: CAMPUS_ID });
    });

    it('returns 401 when no session is present', async () => {
      testSession = null;
      const res = await GET(makeRequest('http://localhost/api/departments'));
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/departments/[id]', () => {
    it('updates a department and writes an audit log', async () => {
      const res = await PUT(
        makeRequest(`http://localhost/api/departments/${DEPARTMENT_ID}`, {
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated Name' }),
        }),
        { params: Promise.resolve({ id: departmentIdForRoute }) },
      );
      expect(res.status).toBe(200);
      expect((await res.json()).name).toBe('Updated Name');
      expect(db.department.update.mock.calls[0]?.[0]).toMatchObject({ where: { id: DEPARTMENT_ID } });
      expect(db.auditLog.create).toHaveBeenCalledTimes(1);
      expect(auditLogData()).toMatchObject({ action: 'UPDATE', entity: 'DEPARTMENT' });
    });

    it('rejects an invalid update payload with 400', async () => {
      const res = await PUT(
        makeRequest(`http://localhost/api/departments/${DEPARTMENT_ID}`, {
          method: 'PUT',
          body: JSON.stringify({ code: 'x' }), // shorter than the 2-char minimum
        }),
        { params: Promise.resolve({ id: departmentIdForRoute }) },
      );
      expect(res.status).toBe(400);
      expect(JSON.stringify((await res.json()).details)).toContain('code');
    });

    it('returns 404 when the department does not exist (Prisma P2025)', async () => {
      db.department.update.mockRejectedValueOnce(Object.assign(new Error('Record not found'), { code: 'P2025' }));
      const res = await PUT(
        makeRequest(`http://localhost/api/departments/${DEPARTMENT_ID}`, {
          method: 'PUT',
          body: JSON.stringify({ name: 'Anything' }),
        }),
        { params: Promise.resolve({ id: departmentIdForRoute }) },
      );
      expect(res.status).toBe(404);
      expect(await res.json()).toMatchObject({ error: 'Department not found' });
    });

    it('rejects a forbidden role before touching the database', async () => {
      testSession = { userId: 'user-parent-1', tenantId: 'tenant-1', role: RoleType.PARENT };
      const res = await PUT(
        makeRequest(`http://localhost/api/departments/${DEPARTMENT_ID}`, {
          method: 'PUT',
          body: JSON.stringify({ name: 'Sneaky' }),
        }),
        { params: Promise.resolve({ id: departmentIdForRoute }) },
      );
      expect(res.status).toBe(403);
      expect(db.department.update).not.toHaveBeenCalled();
      expect(db.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/departments/[id]', () => {
    it('deletes a department and writes an audit log', async () => {
      const res = await DELETE(
        makeRequest(`http://localhost/api/departments/${DEPARTMENT_ID}`, { method: 'DELETE' }),
        { params: Promise.resolve({ id: departmentIdForRoute }) },
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true });
      expect(db.department.delete.mock.calls[0]?.[0]).toMatchObject({ where: { id: DEPARTMENT_ID } });
      expect(db.auditLog.create).toHaveBeenCalledTimes(1);
      expect(auditLogData()).toMatchObject({ action: 'DELETE', entity: 'DEPARTMENT' });
    });

    it('returns 404 when deleting a missing department', async () => {
      db.department.delete.mockRejectedValueOnce(Object.assign(new Error('Record not found'), { code: 'P2025' }));
      const res = await DELETE(
        makeRequest(`http://localhost/api/departments/${DEPARTMENT_ID}`, { method: 'DELETE' }),
        { params: Promise.resolve({ id: departmentIdForRoute }) },
      );
      expect(res.status).toBe(404);
      expect(db.auditLog.create).not.toHaveBeenCalled();
    });

    it('rejects an unauthenticated delete with 403', async () => {
      testSession = null;
      const res = await DELETE(
        makeRequest(`http://localhost/api/departments/${DEPARTMENT_ID}`, { method: 'DELETE' }),
        { params: Promise.resolve({ id: departmentIdForRoute }) },
      );
      expect(res.status).toBe(403);
    });
  });
});
