/**
 * Retry middleware configuration options.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds between retries (default: 10000) */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Custom function to determine if error is retryable */
  isRetryable?: (error: Error) => boolean;
}

// Default patterns for retryable errors
const RETRYABLE_PATTERNS = [
  '429', // Rate limit
  '500', // Server error
  '502', // Bad gateway
  '503', // Service unavailable
  '504', // Gateway timeout
  'rate_limit',
  'timeout',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'overloaded',
  'capacity',
];

/**
 * Default function to check if an error is retryable.
 */
function defaultIsRetryable(error: Error): boolean {
  const message = error.message?.toLowerCase() || '';
  const name = error.name?.toLowerCase() || '';
  const combined = `${message} ${name}`;

  return RETRYABLE_PATTERNS.some((pattern) =>
    combined.includes(pattern.toLowerCase())
  );
}

/**
 * Creates retry middleware for AI model calls.
 *
 * Implements exponential backoff with configurable retry limits.
 * Only retries on transient errors (rate limits, timeouts, server errors).
 *
 * @param options - Retry configuration options
 * @returns Middleware function for use with wrapLanguageModel
 *
 * @example
 * const model = wrapLanguageModel({
 *   model: gateway('openai/gpt-4o'),
 *   middleware: createRetryMiddleware({ maxRetries: 3 }),
 * });
 */
export function createRetryMiddleware(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    isRetryable = defaultIsRetryable,
  } = options;

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const calculateDelay = (attempt: number): number => {
    const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt);
    // Add jitter (0-25% of delay) to prevent thundering herd
    const jitter = delay * Math.random() * 0.25;
    return Math.min(delay + jitter, maxDelayMs);
  };

  // Return middleware with the correct shape
  return async (params: { doGenerate: () => Promise<any>; doStream: () => Promise<any> }) => {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await params.doGenerate();
      } catch (error) {
        lastError = error as Error;

        // Log retry attempt
        if (attempt < maxRetries) {
          console.warn(
            `[AI Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed:`,
            lastError.message
          );
        }

        // Check if we should retry
        if (!isRetryable(lastError) || attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        const delay = calculateDelay(attempt);
        console.log(`[AI Retry] Waiting ${Math.round(delay)}ms before retry`);
        await sleep(delay);
      }
    }

    throw lastError;
  };
}

/**
 * Pre-configured retry middleware for common scenarios.
 */
export const retryMiddleware = {
  /** Standard retry with 3 attempts */
  standard: () => createRetryMiddleware({ maxRetries: 3 }),

  /** Aggressive retry with 5 attempts and longer delays */
  aggressive: () =>
    createRetryMiddleware({
      maxRetries: 5,
      initialDelayMs: 2000,
      maxDelayMs: 30000,
    }),

  /** Light retry with 2 attempts for fast responses */
  light: () =>
    createRetryMiddleware({
      maxRetries: 2,
      initialDelayMs: 500,
      maxDelayMs: 3000,
    }),
};
