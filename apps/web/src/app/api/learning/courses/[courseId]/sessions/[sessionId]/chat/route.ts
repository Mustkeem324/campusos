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
    const { userId, content } = body;

    if (!userId || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const message = await prisma.learningSessionChatMessage.create({
      data: {
        sessionId,
        userId,
        content,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
