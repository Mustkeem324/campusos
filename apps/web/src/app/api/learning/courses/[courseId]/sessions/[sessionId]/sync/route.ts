import { NextResponse } from 'next/server';
import { LearningSessionAccessError, requireLearningSessionAccess } from '../../../../../../../../lib/learning-session-access';

export async function GET(_: Request, { params }: { params: { courseId: string; sessionId: string } }) {
  try {
    const { db, learningSession } = await requireLearningSessionAccess(params.courseId, params.sessionId);
    const current = await db.learningSession.findFirst({
      where: { id: learningSession.id },
      include: {
        participants: true,
        chatMessages: { orderBy: { createdAt: 'asc' } },
        presences: { where: { lastSeenAt: { gte: new Date(Date.now() - 30_000) } } },
        polls: { include: { votes: true } },
      },
    });
    if (!current) return NextResponse.json({ error: 'Learning session not found' }, { status: 404 });
    return NextResponse.json({
      session: current,
      participants: current.participants.map((participant) => ({ ...participant, isOnline: current.presences.some((presence) => presence.userId === participant.userId) })),
    });
  } catch (error: unknown) {
    if (error instanceof LearningSessionAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Unable to synchronise learning session' }, { status: 500 });
  }
}
