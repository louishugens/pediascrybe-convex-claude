import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';

/**
 * Redis client for AI response caching.
 * Uses existing Upstash Redis configuration from environment.
 */
const redis = Redis.fromEnv();

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
 *
 * @param cacheKey - Unique key for this cached item
 * @param generator - Async function to generate value if not cached
 * @param options - Cache configuration
 * @returns Cached or newly generated value
 *
 * @example
 * const suggestions = await getCachedOrGenerate(
 *   `exams:${patientId}:${appointmentId}`,
 *   async () => {
 *     const result = await streamObject({ ... });
 *     return result.object;
 *   },
 *   { ttlSeconds: 3600 }
 * );
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
    // Try to get from cache
    const cached = await redis.get<T>(fullKey);
    if (cached !== null) {
      console.log(`[AI Cache] Hit: ${fullKey}`);
      return cached;
    }
  } catch (error) {
    // Log cache read error but continue to generate
    console.warn(`[AI Cache] Read error for ${fullKey}:`, error);
  }

  // Generate new value
  console.log(`[AI Cache] Miss: ${fullKey}`);
  const result = await generator();

  try {
    // Cache the result
    await redis.set(fullKey, result, { ex: ttlSeconds });
    console.log(`[AI Cache] Stored: ${fullKey} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    // Log cache write error but return result anyway
    console.warn(`[AI Cache] Write error for ${fullKey}:`, error);
  }

  return result;
}

/**
 * Generate a deterministic cache key from inputs.
 *
 * Creates a short hash from the input object for use as a cache key.
 * Order of keys doesn't matter - the hash is stable.
 *
 * @param inputs - Object containing values to hash
 * @returns 16-character hex string suitable for cache keys
 *
 * @example
 * const key = hashInputs({
 *   patientId: '123',
 *   symptoms: ['fever', 'cough'],
 *   language: 'en',
 * });
 * // Returns something like: 'a1b2c3d4e5f6g7h8'
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

  // Create MD5 hash (fast, no security needed for cache keys)
  const hash = createHash('md5').update(JSON.stringify(sorted)).digest('hex');

  // Return first 16 characters for brevity
  return hash.slice(0, 16);
}

/**
 * Invalidate a cached value.
 *
 * @param cacheKey - Key to invalidate
 * @param keyPrefix - Optional prefix (default: 'ai')
 */
export async function invalidateCache(
  cacheKey: string,
  keyPrefix = 'ai'
): Promise<void> {
  const fullKey = `${keyPrefix}:${cacheKey}`;
  try {
    await redis.del(fullKey);
    console.log(`[AI Cache] Invalidated: ${fullKey}`);
  } catch (error) {
    console.warn(`[AI Cache] Invalidation error for ${fullKey}:`, error);
  }
}

/**
 * Invalidate all cached values matching a pattern.
 *
 * @param pattern - Glob pattern to match (e.g., 'exams:patient123:*')
 * @param keyPrefix - Optional prefix (default: 'ai')
 */
export async function invalidateCachePattern(
  pattern: string,
  keyPrefix = 'ai'
): Promise<void> {
  const fullPattern = `${keyPrefix}:${pattern}`;
  try {
    // Note: SCAN is more efficient for large keyspaces
    const keys = await redis.keys(fullPattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(
        `[AI Cache] Invalidated ${keys.length} keys matching: ${fullPattern}`
      );
    }
  } catch (error) {
    console.warn(
      `[AI Cache] Pattern invalidation error for ${fullPattern}:`,
      error
    );
  }
}

/**
 * Create a cache key builder for a specific use case.
 *
 * @param prefix - Prefix for all keys (e.g., 'exams', 'prescriptions')
 * @returns Function that builds cache keys from inputs
 *
 * @example
 * const examsCacheKey = createCacheKeyBuilder('exams');
 * const key = examsCacheKey({ patientId: '123', appointmentId: '456' });
 * // Returns: 'exams:a1b2c3d4e5f6g7h8'
 */
export function createCacheKeyBuilder(prefix: string) {
  return (inputs: Record<string, unknown>): string => {
    return `${prefix}:${hashInputs(inputs)}`;
  };
}
