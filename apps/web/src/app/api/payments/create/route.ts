import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../lib/tenant-context';
import { requirePermission } from '../../../../lib/rbac';
import { z } from 'zod';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const createOrderSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  gateway: z.enum(['UPI', 'CARD', 'NETBANKING']).default('UPI'),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate & Authorize
    // Only students (or parents) should pay their own invoices, or finance admins
    const { db, session } = await requireTenantContext();
    requirePermission(session.role as any, 'view_finance');

    const body = await request.json();
    const { invoiceId, amount, gateway } = createOrderSchema.parse(body);

    // 2. Validate Invoice Ownership & State
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Tenant Isolation Check (Handled implicitly by db extension, but good to be explicit for finance)
    if (invoice.tenantId !== session.tenantId) {
       return NextResponse.json({ error: 'Unauthorized ledger access' }, { status: 403 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice is already fully paid' }, { status: 400 });
    }

    const amountPaid = invoice.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const amountDue = invoice.amount - amountPaid;

    if (amount > amountDue) {
      return NextResponse.json({ error: 'Payment amount exceeds remaining balance' }, { status: 400 });
    }

    // 3. Create Gateway Order (Mocked for demonstration)
    const orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    
    // In a real integration:
    // const razorpayOrder = await razorpay.orders.create({ amount: amount * 100, currency: 'INR', receipt: invoiceId })

    // 4. Audit Log Initiation
    await db.auditLog.create({
      data: {
        action: 'PAYMENT_INITIATED',
        entity: 'INVOICE',
        tenantId: session.tenantId,
        diffJson: JSON.stringify({ entityId: invoiceId, amount, gateway, orderId }),
        userId: session.userId
      }
    });

    return NextResponse.json({
      orderId,
      amount,
      currency: 'INR',
      key: process.env.PAYMENT_GATEWAY_KEY || 'mock_public_key',
      invoiceId
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[PAYMENT_CREATE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
