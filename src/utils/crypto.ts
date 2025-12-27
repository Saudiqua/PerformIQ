import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env, isEncryptionConfigured } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  if (!isEncryptionConfigured()) {
    throw new Error('ENCRYPTION_KEY_BASE64 not configured - OAuth operations require encryption key');
  }
  const key = Buffer.from(env.ENCRYPTION_KEY_BASE64!, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY_BASE64 must be 32 bytes when decoded');
  }
  return key;
}

export function canEncrypt(): boolean {
  if (!isEncryptionConfigured()) {
    return false;
  }
  try {
    const key = Buffer.from(env.ENCRYPTION_KEY_BASE64!, 'base64');
    return key.length === 32;
  } catch {
    return false;
  }
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  const result = Buffer.concat([iv, authTag, encrypted]);
  return result.toString('base64');
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const data = Buffer.from(ciphertext, 'base64');
  
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  
  return decrypted.toString('utf8');
}

export function encryptTokens(tokens: Record<string, unknown>): string {
  return encrypt(JSON.stringify(tokens));
}

export function decryptTokens(encryptedTokens: string): Record<string, unknown> {
  return JSON.parse(decrypt(encryptedTokens));
}
