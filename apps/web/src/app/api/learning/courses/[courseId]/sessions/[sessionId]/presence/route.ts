import { NextResponse } from 'next/server';
import { LearningSessionAccessError, requireLearningSessionParticipant } from '../../../../../../../../lib/learning-session-access';

export async function POST(_: Request, { params }: { params: { courseId: string; sessionId: string } }) {
  try {
    const { db, session } = await requireLearningSessionParticipant(params.courseId, params.sessionId);
    const existing = await db.learningSessionPresence.findFirst({ where: { sessionId: params.sessionId, userId: session.userId } });
    const presence = existing ? await db.learningSessionPresence.update({ where: { id: existing.id }, data: { lastSeenAt: new Date(), isOnline: true } }) : await db.learningSessionPresence.create({ data: { sessionId: params.sessionId, userId: session.userId, lastSeenAt: new Date(), isOnline: true } });
    return NextResponse.json(presence);
  } catch (error: unknown) {
    if (error instanceof LearningSessionAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Unable to update presence' }, { status: 500 });
  }
}
