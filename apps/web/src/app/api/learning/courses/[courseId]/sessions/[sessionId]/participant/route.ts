import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../../lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const body = await req.json();
    const { userId, micEnabled, cameraEnabled, screenSharing, handRaised } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const participants = await prisma.learningSessionParticipant.findMany({
      where: { sessionId, userId }
    });

    if (participants.length === 0) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const updated = await prisma.learningSessionParticipant.update({
      where: { id: participants[0].id },
      data: {
        ...(micEnabled !== undefined && { micEnabled }),
        ...(cameraEnabled !== undefined && { cameraEnabled }),
        ...(screenSharing !== undefined && { screenSharing }),
        ...(handRaised !== undefined && { handRaised }),
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Participant Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
