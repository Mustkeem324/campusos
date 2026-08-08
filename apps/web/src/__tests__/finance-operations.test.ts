import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleType } from '@prisma/client';

import type { ActiveUserContext } from '../lib/active-user-context';

type PaymentRow = { id: string; amount: number; invoiceId: string; invoice?: { studentId: string } };
type StudentRow = { id: string; tenantId: string; userId: string; batch?: { programId: string } };

type FakeState = {
  payments?: PaymentRow[];
  students?: StudentRow[];
  refunded?: Array<{ approved_minor: number; status: string }>;
  program?: {
    id: string;
    name: string;
    value_type: string;
    budget_minor: number;
    awarded_minor: number;
    program_ids: unknown;
    applies_to_components: unknown;
    status: string;
    application_closes?: Date | null;
  };
  invoices?: Array<{ id: string; amount: number; status: string }>;
  guardian?: { students: Array<{ id: string }> };
  refundRow?: Record<string, unknown>;
};

let fakeState: FakeState = {};

/**
 * In-memory fake for lib/db. The engine talks to `prisma` (raw SQL + model
 * calls) and `getTenantDb`. Raw queries are routed by SQL text so each test
 * can seed the rows the engine expects via `seed()`.
 */
function makeFakeDb() {
  const prisma = {
    $queryRaw: vi.fn(async (query: { text?: string } | TemplateStringsArray, ..._values: unknown[]) => {
      const text = (query as { text?: string }).text ?? (query as TemplateStringsArray).join('?');
      if (fakeState.refundRow && text.includes('FROM campusos_finance.refund_requests') && text.includes('requested_by')) {
        return [fakeState.refundRow];
      }
      // Settings lookup must be matched before the generic invoice-sequence
      // branch: the settings SELECT also contains invoice_sequence_next.
      if (text.includes('FROM campusos_finance.finance_settings') && text.includes('SELECT currency')) {
        return [];
      }
      if (text.includes('SUM(approved_minor)')) {
        return fakeState.refunded ?? [];
      }
      if (text.includes('invoice_sequence_next')) {
        return [{ invoice_sequence_next: 1 }];
      }
      if (text.includes('scholarship_programs')) {
        return fakeState.program ? [fakeState.program] : [];
      }
      if (text.includes('FROM public.invoices') && text.includes('FOR UPDATE')) {
        return fakeState.invoices ?? [];
      }
      if (text.includes('financial_holds') && text.includes('COUNT')) {
        return [{ count: 0 }];
      }
      return [];
    }),
    $executeRaw: vi.fn(async () => 1),
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = { ...prisma };
      return callback(tx);
    }),
    payment: {
      findMany: vi.fn(async ({ where }: { where?: { invoice?: { studentId?: { in: string[] } }; status?: string } }) => {
        const allowed = where?.invoice?.studentId?.in;
        if (allowed && fakeState.payments) {
          return fakeState.payments.filter((payment) => payment.invoice && allowed.includes(payment.invoice.studentId));
        }
        return fakeState.payments ?? [];
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return (fakeState.payments ?? []).find((payment) => payment.id === where.id) ?? null;
      }),
      create: vi.fn(async () => ({})),
    },
    student: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const student = (fakeState.students ?? []).find((item) => item.id === where.id);
        return student ? { ...student, tenantId: student.tenantId } : null;
      }),
      findFirst: vi.fn(async () => (fakeState.students ?? [])[0] ?? null),
    },
    invoice: {
      findMany: vi.fn(async () => fakeState.invoices ?? []),
      update: vi.fn(async () => ({})),
      findUnique: vi.fn(async () => null),
    },
    refund: { create: vi.fn(async () => ({})) },
    guardian: {
      findFirst: vi.fn(async () => fakeState.guardian ?? null),
    },
    institution: { findUnique: vi.fn(async () => ({ id: 'tenant-1', name: 'Test University', subdomain: 'test' })) },
    feeStructure: { findMany: vi.fn(async () => []) },
    batch: { findMany: vi.fn(async () => []) },
  };
  return prisma;
}

vi.mock('../lib/db', () => ({
  prisma: makeFakeDb(),
  getTenantDb: () => ({
    student: { findMany: vi.fn(async () => []) },
    batch: { findMany: vi.fn(async () => []) },
    invoice: { findMany: vi.fn(async () => []) },
    payment: { findMany: vi.fn(async () => []) },
  }),
}));

import { prisma } from '../lib/db';
import {
  applyForScholarship,
  awardScholarship,
  createFeeStructure,
  FinanceError,
  recordOfflinePayment,
  requestRefund,
  reviewRefund,
} from '../lib/finance-operations';

function adminContext(overrides: Partial<ActiveUserContext> = {}): ActiveUserContext {
  return {
    userId: 'user-admin-1',
    tenantId: 'tenant-1',
    activeRole: RoleType.INSTITUTION_ADMIN,
    roleAssignmentId: 'ra-1',
    permissions: [],
    ...overrides,
  };
}

function accountantContext(overrides: Partial<ActiveUserContext> = {}): ActiveUserContext {
  return {
    userId: 'user-accountant-1',
    tenantId: 'tenant-1',
    activeRole: RoleType.ACCOUNTANT,
    roleAssignmentId: 'ra-3',
    permissions: [],
    ...overrides,
  };
}

function studentContext(overrides: Partial<ActiveUserContext> = {}): ActiveUserContext {
  return {
    userId: 'user-student-1',
    tenantId: 'tenant-1',
    activeRole: RoleType.STUDENT,
    roleAssignmentId: 'ra-2',
    studentProfileId: 'student-1',
    permissions: [],
    ...overrides,
  };
}

describe('Finance 2.0 operations — server-side authority', () => {
  beforeEach(() => {
    fakeState = {};
    vi.clearAllMocks();
  });

  describe('offline payments', () => {
    it('rejects a non-finance role before touching any invoice', async () => {
      const db = prisma as unknown as ReturnType<typeof makeFakeDb>;
      await expect(
        recordOfflinePayment(studentContext(), { invoiceIds: ['invoice-1'], amountMinor: 500000, method: 'CASH' }),
      ).rejects.toThrow(/Forbidden/);
      expect(db.payment.findMany).not.toHaveBeenCalled();
    });

    it('rejects an offline payment that exceeds the remaining invoice balance', async () => {
      fakeState = {
        payments: [{ id: 'payment-1', amount: 5000, invoiceId: 'invoice-1', invoice: { studentId: 'student-1' } }],
        invoices: [{ id: 'invoice-1', amount: 5000, status: 'PENDING' }],
      };
      const context = adminContext({ activeRole: RoleType.FINANCE_OFFICER });
      await expect(
        recordOfflinePayment(context, { invoiceIds: ['invoice-1'], amountMinor: 5_000_000, method: 'CASH' }),
      ).rejects.toBeInstanceOf(FinanceError);
    });
  });

  describe('refund workflow', () => {
    it('rejects a refund larger than the refundable paid balance', async () => {
      fakeState = {
        payments: [{ id: 'payment-1', amount: 5000, invoiceId: 'invoice-1', invoice: { studentId: 'student-1' } }],
        refunded: [{ approved_minor: 0, status: 'COMPLETED' }],
      };
      await expect(
        requestRefund(studentContext(), { paymentId: 'payment-1', requestedMinor: 500_001, reason: 'Duplicate payment made in error' }),
      ).rejects.toMatchObject({ status: 422 });
    });

    it('accepts a refund within the refundable balance', async () => {
      fakeState = {
        payments: [{ id: 'payment-1', amount: 5000, invoiceId: 'invoice-1', invoice: { studentId: 'student-1' } }],
        refunded: [{ approved_minor: 0, status: 'COMPLETED' }],
      };
      const refund = await requestRefund(studentContext(), { paymentId: 'payment-1', requestedMinor: 200_000, reason: 'Overpayment on semester invoice' });
      expect(refund.status).toBe('REQUESTED');
      expect(refund.requestedMinor).toBe(200_000);
    });

    it('allows an accountant to request a refund for a student payment', async () => {
      fakeState = {
        payments: [{ id: 'payment-1', amount: 5000, invoiceId: 'invoice-1', invoice: { studentId: 'student-1' } }],
        refunded: [{ approved_minor: 0, status: 'COMPLETED' }],
      };
      const refund = await requestRefund(accountantContext(), {
        paymentId: 'payment-1',
        requestedMinor: 100_000,
        reason: 'Duplicate payment recorded by accountant',
      });
      expect(refund.status).toBe('REQUESTED');
      expect(refund.paymentId).toBe('payment-1');
    });

    it('rejects a refund referencing a payment outside the requester authority', async () => {
      fakeState = {
        payments: [{ id: 'payment-other', amount: 5000, invoiceId: 'invoice-other', invoice: { studentId: 'student-other' } }],
      };
      await expect(
        requestRefund(studentContext(), { paymentId: 'payment-other', requestedMinor: 100_000, reason: 'Refund for another student' }),
      ).rejects.toMatchObject({ status: 404 });
    });

    it('enforces maker-checker separation when the requester tries to decide', async () => {
      fakeState = {
        refundRow: {
          id: 'refund-1',
          payment_id: 'payment-1',
          invoice_id: 'invoice-1',
          requested_minor: 100000,
          approved_minor: null,
          status: 'REQUESTED',
          reason: 'test refund',
          requested_role: 'ACCOUNTANT',
          review_note: null,
          completion_reference: null,
          created_at: new Date(),
          student_id: 'student-1',
          tenant_id: 'tenant-1',
          requested_by: 'user-accountant-1',
        },
      };
      // The same accountant who requested the refund cannot approve it.
      await expect(
        reviewRefund(accountantContext(), 'refund-1', 'APPROVE'),
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('scholarship workflow', () => {
    it('rejects a scholarship award exceeding the program budget', async () => {
      fakeState = {
        program: {
          id: 'program-1',
          name: 'Merit Scholarship',
          value_type: 'FIXED',
          budget_minor: 100_000,
          awarded_minor: 90_000,
          program_ids: '[]',
          applies_to_components: '["TUITION"]',
          status: 'OPEN',
        },
        students: [{ id: 'student-1', tenantId: 'tenant-1', userId: 'user-student-1' }],
        invoices: [{ id: 'invoice-1', amount: 100000, status: 'PENDING' }],
      };
      await expect(
        awardScholarship(adminContext(), { programId: 'program-1', studentId: 'student-1', awardedMinor: 20_000 }),
      ).rejects.toMatchObject({ status: 422 });
    });

    it('rejects a scholarship award for a student in another tenant', async () => {
      fakeState = {
        program: {
          id: 'program-1',
          name: 'Merit Scholarship',
          value_type: 'FIXED',
          budget_minor: 1_000_000,
          awarded_minor: 0,
          program_ids: '[]',
          applies_to_components: '["TUITION"]',
          status: 'OPEN',
        },
        students: [{ id: 'student-other', tenantId: 'tenant-2', userId: 'user-other' }],
      };
      await expect(
        awardScholarship(adminContext(), { programId: 'program-1', studentId: 'student-other', awardedMinor: 10_000 }),
      ).rejects.toMatchObject({ status: 403 });
    });

    it('rejects a scholarship application when the program is closed', async () => {
      fakeState = {
        program: {
          id: 'program-1',
          name: 'Closed Scholarship',
          value_type: 'FIXED',
          budget_minor: 1_000_000,
          awarded_minor: 0,
          program_ids: '[]',
          applies_to_components: '["TUITION"]',
          status: 'CLOSED',
        },
      };
      await expect(
        applyForScholarship(studentContext(), { programId: 'program-1' }),
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('fee structures', () => {
    it('requires a finance configurator role to create fee structures', async () => {
      const db = prisma as unknown as ReturnType<typeof makeFakeDb>;
      await expect(
        createFeeStructure(studentContext(), { name: 'Tuition', amountMinor: 500000, effectiveFrom: '2026-08-01' }),
      ).rejects.toThrow(/Forbidden/);
      expect(db.$executeRaw).not.toHaveBeenCalled();
    });

    it('rejects invalid amounts before creating any records', async () => {
      await expect(
        createFeeStructure(adminContext(), { name: 'Tuition', amountMinor: -5, effectiveFrom: '2026-08-01' }),
      ).rejects.toMatchObject({ status: 400 });
    });
  });
});
