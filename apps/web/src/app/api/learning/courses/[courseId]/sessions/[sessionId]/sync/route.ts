import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { courseId: string; sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
        chatMessages: {
          orderBy: { createdAt: "asc" },
        },
        presences: {
          where: {
            lastSeenAt: {
              gte: new Date(Date.now() - 30000), // active in last 30s
            },
          },
        },
        polls: {
          include: {
            votes: true,
          }
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({
      session,
      participants: session.participants.map((p: any) => {
        const isOnline = session.presences.some((pr: any) => pr.userId === p.userId);
        return {
          ...p,
          isOnline
        };
      })
    });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
