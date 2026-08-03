import { NextResponse } from 'next/server';
import { LearningSessionAccessError, requireLearningSessionParticipant } from '../../../../../../../../lib/learning-session-access';

export async function POST(request: Request, { params }: { params: { courseId: string; sessionId: string } }) {
  try {
    const body: unknown = await request.json();
    const content = getContent(body);
    if (!content) return NextResponse.json({ error: 'Message content must be between 1 and 5,000 characters' }, { status: 400 });
    const { db, session } = await requireLearningSessionParticipant(params.courseId, params.sessionId);
    const message = await db.learningSessionChatMessage.create({ data: { sessionId: params.sessionId, userId: session.userId, content } });
    return NextResponse.json(message, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof LearningSessionAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Unable to send message' }, { status: 500 });
  }
}

function getContent(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const content = (value as { content?: unknown }).content;
  if (typeof content !== 'string') return null;
  const trimmed = content.trim();
  return trimmed.length > 0 && trimmed.length <= 5000 ? trimmed : null;
}
