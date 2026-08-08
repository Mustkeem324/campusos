import { NextResponse } from 'next/server';
import { LearningSessionAccessError, requireLearningSessionAccess } from '../../../../../../../../lib/learning-session-access';

export const dynamic = 'force-dynamic';

export async function POST(_: Request, { params: paramsPromise }: { params: Promise<{ courseId: string; sessionId: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db, session, learningSession, isHost } = await requireLearningSessionAccess(params.courseId, params.sessionId);
    const existing = await db.learningSessionParticipant.findFirst({ where: { sessionId: learningSession.id, userId: session.userId } });
    const participant = existing ? await db.learningSessionParticipant.update({ where: { id: existing.id }, data: { leftAt: null, joinedAt: new Date() } }) : await db.learningSessionParticipant.create({ data: { sessionId: learningSession.id, userId: session.userId, role: isHost ? 'HOST' : 'PARTICIPANT' } });
    return NextResponse.json(participant);
  } catch (error: unknown) {
    if (error instanceof LearningSessionAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Unable to join session' }, { status: 500 });
  }
}
