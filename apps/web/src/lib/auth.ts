import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { RoleType } from '@prisma/client';
import { prisma } from './db';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_campusos_key_for_development';

export interface TokenPayload {
  sessionId: string;
  userId: string;
  tenantId: string;
  role: RoleType;
}

export function signToken(payload: TokenPayload, expiresIn = 3600): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12); // Argon2 is better but bcrypt 12 is strong standard for this env
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export async function getSessionFromCookies(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('campusos_session')?.value;
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;

  // Validate session against database for real production auth
  try {
    const session = await prisma.session.findUnique({
      where: { token: payload.sessionId },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || session.userId !== payload.userId) {
      return null;
    }

    if (!session.user.isActive || session.user.tenantId !== payload.tenantId || session.user.role !== payload.role) {
       return null;
    }

    return payload;
  } catch (err) {
    console.error('Session DB verification failed:', err);
    return null;
  }
}

export async function createSession(userId: string, userAgent: string | null, ipAddress: string | null) {
  const sessionToken = generateRandomToken(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await prisma.session.create({
    data: {
      userId,
      token: sessionToken,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  return session;
}
