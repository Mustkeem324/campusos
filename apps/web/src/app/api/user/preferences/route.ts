import { NextResponse } from 'next/server';
import { z } from 'zod';

const preferencesSchema = z.object({
  language: z.string().optional(),
  appearance: z.string().optional(),
  accessibility: z.boolean().optional(),
  timeZone: z.string().optional(),
  startPage: z.string().optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
  }).optional(),
  quietHours: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = preferencesSchema.parse(json);
    
    // In a real app we'd save to DB for the authenticated user
    // await prisma.user.update({ where: { id: userId }, data: { preferences: data } })
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      language: 'en',
      appearance: 'system',
      accessibility: false,
      timeZone: 'UTC',
      startPage: '/dashboard',
      notificationPreferences: {
        email: true,
        sms: false,
        push: true,
      },
      quietHours: false,
    }
  });
}
