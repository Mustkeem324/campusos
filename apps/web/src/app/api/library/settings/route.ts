import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { LibraryError, updateLibrarySettings } from '@/lib/library-operations';

export const dynamic = 'force-dynamic';

const settingsPatchSchema = z.object({
  timezone: z.string().max(64).optional(),
  currency: z.string().regex(/^[A-Za-z]{3}$/).optional(),
  accessionPrefix: z.string().max(16).optional(),
  accessionYearFormat: z.enum(['YYYY', 'YY']).optional(),
  defaultStudentLoanDays: z.number().int().min(1).max(365).optional(),
  defaultFacultyLoanDays: z.number().int().min(1).max(365).optional(),
  defaultMaxRenewals: z.number().int().min(0).max(20).optional(),
  defaultMaxActiveLoans: z.number().int().min(1).max(100).optional(),
  defaultFinePerDayMinor: z.number().int().min(0).optional(),
  fineGraceDays: z.number().int().min(0).max(365).optional(),
  fineMaxCapMinor: z.number().int().min(0).optional(),
  reservationHoldHours: z.number().int().min(1).max(24 * 30).optional(),
  reservationMaxActive: z.number().int().min(1).max(50).optional(),
  clearanceRequiresFinance: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = settingsPatchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid library settings payload.' }, { status: 400 });
    const settings = await updateLibrarySettings(context, parsed.data as Parameters<typeof updateLibrarySettings>[1]);
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to update library settings.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
