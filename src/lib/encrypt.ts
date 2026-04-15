import crypto from 'crypto';

// Key source priority: dedicated Plaid key → NextAuth secret → insecure dev fallback
const KEY_SOURCE =
  process.env.PLAID_ENCRYPTION_KEY ||
  process.env.NEXTAUTH_SECRET ||
  'dev-key-not-for-production';

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a colon-delimited string: <iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
export function encrypt(text: string): string {
  const key = crypto.scryptSync(KEY_SOURCE, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + tag + ':' + encrypted;
}

/**
 * Decrypt a value produced by encrypt().
 * Throws if the data is tampered with (bad auth tag) or malformed.
 */
export function decrypt(data: string): string {
  const parts = data.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  const [ivHex, tagHex, encrypted] = parts;
  const key = crypto.scryptSync(KEY_SOURCE, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
