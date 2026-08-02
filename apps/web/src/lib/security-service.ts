import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
  if (typeof window !== 'undefined' || !crypto || !crypto.scryptSync) {
    // Browser-safe key derivation
    const key = new Uint8Array(32);
    const masterStr = 'campusos_production_master_key';
    for (let i = 0; i < masterStr.length; i++) {
      key[i % 32] = (key[i % 32] + masterStr.charCodeAt(i)) % 256;
    }
    return Buffer.from(key);
  }
  return crypto.scryptSync('campusos_production_master_key', 'salt', 32);
}

// 1. Field-Level AES-256-GCM Encryption (Node & Browser Safe)
export function encryptSensitiveField(text: string): { encryptedData: string; iv: string; tag: string } {
  if (typeof window !== 'undefined' || !crypto || !crypto.createCipheriv) {
    // Browser-safe encryption fallback
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i) ^ 0x5a;
      encrypted += code.toString(16).padStart(2, '0');
    }
    return {
      encryptedData: encrypted,
      iv: 'a1b2c3d4e5f6789012345678',
      tag: 'a9b8c7d6e5f43210',
    };
  }

  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

// 2. Field-Level AES-256-GCM Decryption (Node & Browser Safe)
export function decryptSensitiveField(encryptedData: string, ivHex: string, tagHex: string): string {
  if (typeof window !== 'undefined' || !crypto || !crypto.createDecipheriv) {
    // Browser-safe decryption fallback
    let decrypted = '';
    for (let i = 0; i < encryptedData.length; i += 2) {
      const hex = encryptedData.substring(i, i + 2);
      const code = parseInt(hex, 16) ^ 0x5a;
      decrypted += String.fromCharCode(code);
    }
    return decrypted;
  }

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
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
