import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const participants = await prisma.learningSessionParticipant.findMany({
      where: { sessionId, userId }
    });

    if (participants.length > 0) {
      // Re-joined
      await prisma.learningSessionParticipant.update({
        where: { id: participants[0].id },
        data: { leftAt: null, joinedAt: new Date() }
      });
      return NextResponse.json(participants[0]);
    }

    const participant = await prisma.learningSessionParticipant.create({
      data: {
        sessionId,
        userId,
      },
    });

    return NextResponse.json(participant);
  } catch (error) {
    console.error("Join Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
