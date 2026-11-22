import crypto from 'crypto';
import { env } from '../config/env.js';
import { UserRole } from '../types/attendance.js';

export interface AuthTokenPayload {
  id: string;
  name: string;
  registrationNo: string;
  role: UserRole;
  discordUserId?: string;
  exp?: number;
  iat?: number;
}

/**
 * Encodes a string or Buffer to Base64URL without padding.
 */
function base64UrlEncode(data: string | Buffer): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decodes a Base64URL string to UTF-8.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Signs a standard HMAC-SHA256 JWT using Node's native crypto.
 */
export function createToken(
  payload: Omit<AuthTokenPayload, 'exp' | 'iat'>,
  expiresInSeconds: number = 7 * 24 * 60 * 60 // 7 days
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AuthTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  const encodedSignature = base64UrlEncode(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 JWT token.
 * Returns null if token is invalid or expired.
 */
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();

    const actualSignature = Buffer.from(
      encodedSignature.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    );

    if (
      expectedSignature.length !== actualSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, actualSignature)
    ) {
      return null;
    }

    const payload: AuthTokenPayload = JSON.parse(base64UrlDecode(encodedPayload));

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Hashes a password using scrypt with a cryptographically secure random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored salt:hash string.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;

    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    const keyBuf = Buffer.from(key, 'hex');
    const testBuf = Buffer.from(testHash, 'hex');

    if (keyBuf.length !== testBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, testBuf);
  } catch {
    return false;
  }
}
