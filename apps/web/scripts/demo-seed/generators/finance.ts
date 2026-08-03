import { PrismaClient, Institution, Invoice, PaymentStatus, PaymentMethod } from '@prisma/client';
import { DemoSeedConfig } from '../config';
import { SeededRandom } from '../random';
import { PeopleDataset } from './people';

export interface FinanceDataset {
  invoices: Invoice[];
}

export async function seedFinance(
  prisma: PrismaClient,
  institution: Institution,
  people: PeopleDataset,
  config: DemoSeedConfig,
  random: SeededRandom
): Promise<FinanceDataset> {
  // 1. Fee Structure
  const feeStructId = random.generateStableId(18, 0);
  const feeStructure = await prisma.feeStructure.upsert({
    where: { id: feeStructId },
    update: { name: 'Standard Undergraduate Tuition Fee 2026', amount: 100000 },
    create: {
      id: feeStructId,
      tenantId: institution.id,
      name: 'Standard Undergraduate Tuition Fee 2026',
      amount: 100000,
    }
  });

  // 2. Scholarships
  const scholarshipId = random.generateStableId(19, 0);
  const scholarship = await prisma.scholarship.upsert({
    where: { id: scholarshipId },
    update: { discountPct: 20.0 },
    create: {
      id: scholarshipId,
      tenantId: institution.id,
      name: 'Merit Academic Scholarship 2026',
      discountPct: 20.0,
    }
  });

  // 3. Invoices & Payments for Students
  const invoices: Invoice[] = [];
  let invIdx = 0;

  for (const student of people.students) {
    const invId = random.generateStableId(20, invIdx);
    const dueDate = new Date('2026-09-30');

    const getsScholarship = invIdx % 5 === 0;
    const grossAmount = feeStructure.amount;
    const scholarshipDiscount = getsScholarship ? grossAmount * (scholarship.discountPct / 100) : 0;
    const netAmount = grossAmount - scholarshipDiscount;

    let paidAmount = 0;
    let paymentStatus: PaymentStatus = 'PENDING';

    const dist = invIdx % 20;
    if (dist < 12) {
      paidAmount = netAmount;
      paymentStatus = 'PAID';
    } else if (dist < 16) {
      paidAmount = netAmount / 2;
      paymentStatus = 'PARTIAL';
    } else if (dist < 19) {
      paidAmount = 0;
      paymentStatus = 'PENDING';
    } else {
      paidAmount = 0;
      paymentStatus = 'FAILED';
    }

    const invoice = await prisma.invoice.upsert({
      where: { id: invId },
      update: {
        amount: netAmount,
        status: paymentStatus,
        feeStructureId: feeStructure.id,
      },
      create: {
        id: invId,
        tenantId: institution.id,
        studentId: student.id,
        feeStructureId: feeStructure.id,
        amount: netAmount,
        status: paymentStatus,
        dueDate,
      }
    });
    invoices.push(invoice);

    if (paidAmount > 0) {
      const payId = random.generateStableId(21, invIdx);
      const transactionId = `TXN-SYNTHETIC-${random.generateStableId(21, invIdx).slice(-8)}`;

      await prisma.payment.upsert({
        where: { id: payId },
        update: { amount: paidAmount, status: 'PAID' },
        create: {
          id: payId,
          tenantId: institution.id,
          invoiceId: invoice.id,
          transactionId,
          amount: paidAmount,
          method: PaymentMethod.UPI,
          status: 'PAID',
          paidAt: new Date('2026-08-01'),
        }
      });
    }

    invIdx++;
  }

  return { invoices };
}
