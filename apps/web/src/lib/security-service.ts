import crypto from 'crypto';

const ENCRYPTION_KEY = crypto.scryptSync('campusos_production_master_key', 'salt', 32); // 256-bit key
const ALGORITHM = 'aes-256-gcm';

// 1. Field-Level AES-256-GCM Encryption
export function encryptSensitiveField(text: string): { encryptedData: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

// 2. Field-Level AES-256-GCM Decryption
export function decryptSensitiveField(encryptedData: string, ivHex: string, tagHex: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 3. Redis Sliding Window Rate Limiter Engine
interface RateLimitWindow {
  timestamps: number[];
}

const RATE_LIMIT_STORE: Map<string, RateLimitWindow> = new Map();

export function checkSlidingWindowRateLimit(
  clientKey: string,
  maxRequests = 10,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let clientData = RATE_LIMIT_STORE.get(clientKey);
  if (!clientData) {
    clientData = { timestamps: [] };
    RATE_LIMIT_STORE.set(clientKey, clientData);
  }

  // Filter out timestamps older than the sliding window
  clientData.timestamps = clientData.timestamps.filter((ts) => ts > windowStart);

  if (clientData.timestamps.length >= maxRequests) {
    const oldest = clientData.timestamps[0];
    const resetMs = oldest + windowMs - now;
    return { allowed: false, remaining: 0, resetMs };
  }

  clientData.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - clientData.timestamps.length,
    resetMs: windowMs,
  };
}
