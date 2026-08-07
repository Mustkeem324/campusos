import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import {
  borrowDigitalItem,
  cancelLibraryReservation,
  checkoutPhysicalItem,
  libraryError,
  renewLibraryLoan,
  reserveLibraryItem,
  returnLibraryLoan,
  setLibraryPolicy,
  type LibraryPolicy,
} from '@/lib/library-workspace';

export const dynamic = 'force-dynamic';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('RESERVE'), itemId: z.string().uuid() }),
  z.object({ action: z.literal('CANCEL_RESERVATION'), reservationId: z.string().uuid() }),
  z.object({ action: z.literal('BORROW_DIGITAL'), itemId: z.string().uuid() }),
  z.object({ action: z.literal('RENEW'), loanId: z.string().uuid() }),
  z.object({ action: z.literal('CHECKOUT_PHYSICAL'), borrowerEmail: z.string().trim().email(), barcode: z.string().trim().min(2).max(120) }),
  z.object({ action: z.literal('RETURN'), loanId: z.string().uuid() }),
  z.object({
    action: z.literal('SET_POLICY'),
    studentLoanDays: z.number().int().min(1).max(180),
    facultyLoanDays: z.number().int().min(1).max(365),
    renewalDays: z.number().int().min(1).max(90),
    maxRenewals: z.number().int().min(0).max(10),
    maxActiveLoans: z.number().int().min(1).max(50),
    reservationHoldHours: z.number().int().min(1).max(720),
    finePerDay: z.number().min(0).max(10000),
    currency: z.string().trim().min(3).max(3).transform((value) => value.toUpperCase()),
    defaultDigitalLoanDays: z.number().int().min(1).max(180),
  }),
]);

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const input = schema.parse(await request.json());

    switch (input.action) {
      case 'RESERVE':
        return NextResponse.json({ success: true, reservation: await reserveLibraryItem(context, input.itemId) }, { status: 201 });
      case 'CANCEL_RESERVATION':
        await cancelLibraryReservation(context, input.reservationId);
        return NextResponse.json({ success: true });
      case 'BORROW_DIGITAL':
        return NextResponse.json({ success: true, loan: await borrowDigitalItem(context, input.itemId) }, { status: 201 });
      case 'RENEW':
        return NextResponse.json({ success: true, loan: await renewLibraryLoan(context, input.loanId) });
      case 'CHECKOUT_PHYSICAL':
        return NextResponse.json({ success: true, loan: await checkoutPhysicalItem(context, input.borrowerEmail, input.barcode) }, { status: 201 });
      case 'RETURN':
        return NextResponse.json({ success: true, loan: await returnLibraryLoan(context, input.loanId) });
      case 'SET_POLICY': {
        const policy: LibraryPolicy = {
          version: 2,
          studentLoanDays: input.studentLoanDays,
          facultyLoanDays: input.facultyLoanDays,
          renewalDays: input.renewalDays,
          maxRenewals: input.maxRenewals,
          maxActiveLoans: input.maxActiveLoans,
          reservationHoldHours: input.reservationHoldHours,
          finePerDay: input.finePerDay,
          currency: input.currency,
          defaultDigitalLoanDays: input.defaultDigitalLoanDays,
        };
        await setLibraryPolicy(context, policy);
        return NextResponse.json({ success: true, policy });
      }
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Please check the library action details.', details: error.errors }, { status: 400 });
    const failure = libraryError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
