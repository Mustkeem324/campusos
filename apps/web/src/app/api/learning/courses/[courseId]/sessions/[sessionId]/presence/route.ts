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

    const presence = await prisma.learningSessionPresence.upsert({
      where: {
        id: "presence-" + userId + "-" + sessionId, // Simplified logic: better to use unique constraint if defined, but we'll use a hack or just first find it.
      },
      update: {
        lastSeenAt: new Date(),
        isOnline: true,
      },
      create: {
        id: "presence-" + userId + "-" + sessionId,
        sessionId,
        userId,
        lastSeenAt: new Date(),
        isOnline: true,
      },
    });

    return NextResponse.json(presence);
  } catch (error) {
    // Check if finding instead works if ID is not unique
    try {
      const { sessionId } = params;
      const body = await req.json();
      const { userId } = body;
      
      const presences = await prisma.learningSessionPresence.findMany({
        where: { sessionId, userId }
      });
      
      if (presences.length > 0) {
        await prisma.learningSessionPresence.update({
          where: { id: presences[0].id },
          data: { lastSeenAt: new Date(), isOnline: true }
        });
      } else {
        await prisma.learningSessionPresence.create({
          data: { sessionId, userId, lastSeenAt: new Date(), isOnline: true }
        });
      }
      return NextResponse.json({ success: true });
    } catch(e) {
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
}
