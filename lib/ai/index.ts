/**
 * AI Infrastructure Module
 *
 * Provides a unified interface for AI operations with:
 * - Multi-provider support via Vercel AI Gateway
 * - Automatic fallbacks when primary provider fails
 * - Retry middleware for transient failures
 * - Redis caching for repeated requests
 * - Standardized error handling
 * - Structured logging
 *
 * @example
 * import { robustModels, handleAIError } from '@/lib/ai';
 *
 * export async function POST(req: Request) {
 *   try {
 *     const result = streamText({
 *       model: robustModels.chat(),
 *       messages,
 *     });
 *     return result.toTextStreamResponse();
 *   } catch (error) {
 *     return handleAIError(error);
 *   }
 * }
 */

// Providers
export {
  getModel,
  getNanoModel,
  getSpecificModel,
  models,
  PRIMARY_PROVIDER,
  type Provider,
  type ModelTier,
} from './providers';

// Models with retry middleware
export {
  createRobustModel,
  createRobustNanoModel,
  createRobustSpecificModel,
  robustModels,
  getModelWithFallbacks,
  type RobustModelOptions,
} from './models';

// Retry middleware
export {
  createRetryMiddleware,
  retryMiddleware,
  type RetryOptions,
} from './middleware/retry';

// Caching
export {
  getCachedOrGenerate,
  hashInputs,
  invalidateCache,
  invalidateCachePattern,
  createCacheKeyBuilder,
  type CacheOptions,
} from './cache';

// Error handling
export {
  AIError,
  parseAIError,
  handleAIError,
  isRetryableError,
  withAIErrorHandling,
  type AIErrorCode,
} from './errors';

// Logging
export {
  logAIRequest,
  createAITimer,
  withAILogging,
  logCacheEvent,
  logRetryAttempt,
  logFallback,
  type AILogEntry,
} from './logging';
