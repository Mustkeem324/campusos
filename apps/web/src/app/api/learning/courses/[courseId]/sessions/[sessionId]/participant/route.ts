import { NextResponse } from 'next/server';
import { LearningSessionAccessError, requireLearningSessionParticipant } from '../../../../../../../../lib/learning-session-access';

export async function PATCH(request: Request, { params }: { params: { courseId: string; sessionId: string } }) {
  try {
    const body: unknown = await request.json();
    const settings = getParticipantSettings(body);
    if (!settings) return NextResponse.json({ error: 'At least one participant setting must be a boolean' }, { status: 400 });
    const { db, participant } = await requireLearningSessionParticipant(params.courseId, params.sessionId);
    const updated = await db.learningSessionParticipant.update({ where: { id: participant.id }, data: settings });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof LearningSessionAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Unable to update participant settings' }, { status: 500 });
  }
}

function getParticipantSettings(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const settings: { micEnabled?: boolean; cameraEnabled?: boolean; screenSharing?: boolean; handRaised?: boolean } = {};
  for (const key of ['micEnabled', 'cameraEnabled', 'screenSharing', 'handRaised'] as const) if (typeof source[key] === 'boolean') settings[key] = source[key] as boolean;
  return Object.keys(settings).length > 0 ? settings : null;
}
