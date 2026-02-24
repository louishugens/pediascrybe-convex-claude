import { Redis } from '@upstash/redis';
import { createHmac, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Redis client for AI response caching.
 * Uses existing Upstash Redis configuration from environment.
 */
const redis = Redis.fromEnv();

// Secret for HMAC cache keys — falls back to a dev key if not set
const CACHE_KEY_SECRET = process.env.CACHE_KEY_SECRET || 'pediascrybe-dev-cache-key-secret';

// Secret for encrypting cached values — falls back to a dev key if not set
const CACHE_ENCRYPTION_KEY = process.env.CACHE_ENCRYPTION_KEY || 'pediascrybe-dev-encrypt-key!!'; // Must be 32 bytes for AES-256

/**
 * Get a 32-byte key for AES-256 encryption.
 */
function getEncryptionKey(): Buffer {
  // Derive a consistent 32-byte key from the secret
  const hmac = createHmac('sha256', 'encryption-key-derivation');
  hmac.update(CACHE_ENCRYPTION_KEY);
  return hmac.digest();
}

/**
 * Encrypt a string value using AES-256-GCM.
 */
function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a string value encrypted with AES-256-GCM.
 */
function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, ciphertext] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Cache configuration options.
 */
export interface CacheOptions {
  /** Time-to-live in seconds (default: 3600 = 1 hour) */
  ttlSeconds?: number;
  /** Key prefix for namespacing (default: 'ai') */
  keyPrefix?: string;
  /** Whether to skip cache (useful for testing) */
  skipCache?: boolean;
}

/**
 * Get cached value or generate and cache new value.
 * Values are encrypted at rest in Redis using AES-256-GCM.
 */
export async function getCachedOrGenerate<T>(
  cacheKey: string,
  generator: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttlSeconds = 3600, keyPrefix = 'ai', skipCache = false } = options;

  if (skipCache) {
    return generator();
  }

  const fullKey = `${keyPrefix}:${cacheKey}`;

  try {
    const cached = await redis.get<string>(fullKey);
    if (cached !== null) {
      const decrypted = decrypt(cached);
      return JSON.parse(decrypted) as T;
    }
  } catch (error) {
    console.warn(`[AI Cache] Read error`, error);
  }

  const result = await generator();

  try {
    const encrypted = encrypt(JSON.stringify(result));
    await redis.set(fullKey, encrypted, { ex: ttlSeconds });
  } catch (error) {
    console.warn(`[AI Cache] Write error`, error);
  }

  return result;
}

/**
 * Generate a deterministic cache key from inputs using HMAC-SHA256.
 *
 * Uses HMAC instead of plain MD5 to prevent cache key enumeration
 * and hide input data from the key itself.
 */
export function hashInputs(inputs: Record<string, unknown>): string {
  // Sort keys for deterministic ordering
  const sorted = Object.keys(inputs)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = inputs[key];
        return acc;
      },
      {} as Record<string, unknown>
    );

  // Create HMAC-SHA256 hash (secure, prevents key enumeration)
  const hmac = createHmac('sha256', CACHE_KEY_SECRET);
  hmac.update(JSON.stringify(sorted));
  const hash = hmac.digest('hex');

  // Return first 16 characters for brevity
  return hash.slice(0, 16);
}

/**
 * Invalidate a cached value.
 */
export async function invalidateCache(
  cacheKey: string,
  keyPrefix = 'ai'
): Promise<void> {
  const fullKey = `${keyPrefix}:${cacheKey}`;
  try {
    await redis.del(fullKey);
  } catch (error) {
    console.warn(`[AI Cache] Invalidation error`, error);
  }
}

/**
 * Invalidate all cached values matching a pattern.
 */
export async function invalidateCachePattern(
  pattern: string,
  keyPrefix = 'ai'
): Promise<void> {
  const fullPattern = `${keyPrefix}:${pattern}`;
  try {
    const keys = await redis.keys(fullPattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn(`[AI Cache] Pattern invalidation error`, error);
  }
}

/**
 * Create a cache key builder for a specific use case.
 */
export function createCacheKeyBuilder(prefix: string) {
  return (inputs: Record<string, unknown>): string => {
    return `${prefix}:${hashInputs(inputs)}`;
  };
}
