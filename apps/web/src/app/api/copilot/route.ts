import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { answerPhase7Copilot } from '@/lib/phase7';

const copilotSchema = z.object({
  question: z.string().trim().min(2).max(500),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const { question } = copilotSchema.parse(await request.json());
    const result = await answerPhase7Copilot(context, question);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Enter a question between 2 and 500 characters.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'The copilot could not answer this request.' },
      { status: 401 },
    );
  }
}
