/**
 * AI Logging Utilities
 *
 * Provides structured logging for AI operations,
 * useful for debugging, monitoring, and analytics.
 */

/**
 * Log entry for an AI request.
 */
export interface AILogEntry {
  /** Timestamp in ISO format */
  timestamp: string;
  /** API endpoint or operation name */
  endpoint: string;
  /** Model ID used */
  model: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Whether the request succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Error code if applicable */
  errorCode?: string;
  /** Number of input tokens (if available) */
  inputTokens?: number;
  /** Number of output tokens (if available) */
  outputTokens?: number;
  /** Whether result was cached */
  cached?: boolean;
  /** Provider that handled the request */
  provider?: string;
  /** Whether fallback was used */
  usedFallback?: boolean;
}

/**
 * Log an AI request.
 *
 * Outputs structured JSON to console for ingestion by log aggregators.
 *
 * @param entry - Log entry data
 *
 * @example
 * const start = Date.now();
 * try {
 *   const result = await streamText({ ... });
 *   logAIRequest({
 *     endpoint: '/api/ai/chat',
 *     model: 'openai/gpt-5-mini',
 *     durationMs: Date.now() - start,
 *     success: true,
 *   });
 * } catch (error) {
 *   logAIRequest({
 *     endpoint: '/api/ai/chat',
 *     model: 'openai/gpt-5-mini',
 *     durationMs: Date.now() - start,
 *     success: false,
 *     error: error.message,
 *   });
 * }
 */
export function logAIRequest(
  entry: Omit<AILogEntry, 'timestamp'>
): void {
  const logEntry: AILogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  // Output as JSON for structured logging
  console.log(JSON.stringify({ type: 'ai_request', ...logEntry }));
}

/**
 * Create a timer for measuring AI request duration.
 *
 * @returns Object with stop() method that returns duration in ms
 *
 * @example
 * const timer = createAITimer();
 * const result = await streamText({ ... });
 * const durationMs = timer.stop();
 */
export function createAITimer(): { stop: () => number } {
  const start = performance.now();
  return {
    stop: () => Math.round(performance.now() - start),
  };
}

/**
 * Wrapper that automatically logs AI operations.
 *
 * @param endpoint - Name of the endpoint/operation
 * @param model - Model ID being used
 * @param operation - Async operation to execute
 * @returns Result of the operation
 *
 * @example
 * const result = await withAILogging(
 *   '/api/ai/chat',
 *   'openai/gpt-5-mini',
 *   () => streamText({ ... })
 * );
 */
export async function withAILogging<T>(
  endpoint: string,
  model: string,
  operation: () => Promise<T>,
  options?: {
    cached?: boolean;
    provider?: string;
  }
): Promise<T> {
  const timer = createAITimer();

  try {
    const result = await operation();
    logAIRequest({
      endpoint,
      model,
      durationMs: timer.stop(),
      success: true,
      cached: options?.cached,
      provider: options?.provider,
    });
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logAIRequest({
      endpoint,
      model,
      durationMs: timer.stop(),
      success: false,
      error: errorMessage,
      cached: options?.cached,
      provider: options?.provider,
    });
    throw error;
  }
}

/**
 * Log a cache event.
 */
export function logCacheEvent(
  event: 'hit' | 'miss' | 'set' | 'invalidate',
  key: string,
  ttl?: number
): void {
  console.log(
    JSON.stringify({
      type: 'ai_cache',
      timestamp: new Date().toISOString(),
      event,
      key,
      ...(ttl !== undefined && { ttl }),
    })
  );
}

/**
 * Log a retry attempt.
 */
export function logRetryAttempt(
  attempt: number,
  maxAttempts: number,
  error: string,
  delayMs: number
): void {
  console.log(
    JSON.stringify({
      type: 'ai_retry',
      timestamp: new Date().toISOString(),
      attempt,
      maxAttempts,
      error,
      delayMs,
    })
  );
}

/**
 * Log a fallback event.
 */
export function logFallback(
  fromModel: string,
  toModel: string,
  reason: string
): void {
  console.log(
    JSON.stringify({
      type: 'ai_fallback',
      timestamp: new Date().toISOString(),
      fromModel,
      toModel,
      reason,
    })
  );
}
