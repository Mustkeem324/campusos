import jwt from 'jsonwebtoken';

const MFA_CHALLENGE_TTL_SECONDS = 5 * 60;

type MfaChallengePayload = {
  purpose: 'campusos-mfa';
  userId: string;
  tenantId: string;
  rememberMe: boolean;
};

function challengeSecret() {
  const secret = process.env.MFA_CHALLENGE_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MFA_CHALLENGE_SECRET or JWT_SECRET must be configured.');
    }
    return 'campusos-development-mfa-challenge-secret';
  }
  return secret;
}

export function createMfaChallenge(userId: string, tenantId: string, rememberMe = false) {
  const payload: MfaChallengePayload = {
    purpose: 'campusos-mfa',
    userId,
    tenantId,
    rememberMe,
  };
  return jwt.sign(payload, challengeSecret(), {
    expiresIn: MFA_CHALLENGE_TTL_SECONDS,
    audience: 'campusos-mfa-verification',
    issuer: 'campusos-auth',
  });
}

export function verifyMfaChallenge(token: string): MfaChallengePayload | null {
  try {
    const decoded = jwt.verify(token, challengeSecret(), {
      audience: 'campusos-mfa-verification',
      issuer: 'campusos-auth',
    });
    if (
      !decoded ||
      typeof decoded === 'string' ||
      decoded.purpose !== 'campusos-mfa' ||
      typeof decoded.userId !== 'string' ||
      typeof decoded.tenantId !== 'string' ||
      (decoded.rememberMe !== undefined && typeof decoded.rememberMe !== 'boolean')
    ) {
      return null;
    }
    return {
      purpose: 'campusos-mfa',
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      // Challenges issued immediately before deployment did not include this
      // claim; defaulting them to a browser-session cookie is fail-safe.
      rememberMe: decoded.rememberMe === true,
    };
  } catch {
    return null;
  }
}
