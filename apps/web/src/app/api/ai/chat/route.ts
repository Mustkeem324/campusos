import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AiSafetyEngine } from '@/lib/ai/safety-engine';
import { AiProviderService } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. Safety check & prompt injection scanning
    const safety = AiSafetyEngine.scanPrompt(prompt);
    if (!safety.isSafe) {
      // Audit log injection attempt
      await prisma.aiAuditLog.create({
        data: {
          tenantId: session.tenantId,
          userId: session.userId,
          userRole: session.role,
          feature: 'ai_chat',
          actionType: 'PROMPT_INJECTION_BLOCKED',
          modelUsed: 'campusos-safety-v1',
          promptInjectionBlocked: true,
          status: 'BLOCKED',
        }
      });

      return NextResponse.json({
        content: `⚠️ ${safety.blockedReason}`,
        modelUsed: 'campusos-safety-v1',
        citations: [],
        proposals: [],
        promptInjectionBlocked: true,
      });
    }

    // 2. Fetch Institutional RAG Knowledge Documents
    const docs = await prisma.aiKnowledgeDocument.findMany({
      where: {
        tenantId: session.tenantId,
        publicationStatus: 'PUBLISHED',
      },
      take: 3,
    });

    const citations = docs.map(doc => ({
      title: doc.title,
      category: doc.category,
      snippet: doc.content.slice(0, 150) + '...',
      sourceUrl: doc.sourceUrl || '/blueprint',
    }));

    const contextText = docs.map(d => d.content).join('\n\n');

    // 3. Generate Provider Response
    const response = await AiProviderService.generateChatResponse({
      userRole: session.role,
      prompt: safety.sanitizedPrompt,
      contextData: contextText,
      citations,
      tenantId: session.tenantId,
    });

    // 4. Save audit log
    await prisma.aiAuditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        userRole: session.role,
        feature: 'ai_chat',
        actionType: 'CHAT_COMPLETION',
        modelUsed: response.modelUsed,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        estimatedCostUsd: 0.001,
        promptInjectionBlocked: false,
        status: 'SUCCESS',
      }
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'AI assistance is temporarily unavailable. Core CampusOS features remain available.' },
      { status: 500 }
    );
  }
}

