/**
 * AI Error Handling Utilities
 *
 * Provides standardized error handling for AI operations,
 * with automatic detection of retryable errors and proper HTTP status codes.
 */

/**
 * Custom error class for AI-related errors.
 */
export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: AIErrorCode,
    public readonly statusCode: number = 500,
    public readonly retryable: boolean = false,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AIError';
  }

  /**
   * Convert to JSON for API responses.
   */
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      retryable: this.retryable,
    };
  }
}

/**
 * Error codes for categorizing AI errors.
 */
export type AIErrorCode =
  | 'rate_limit'
  | 'timeout'
  | 'server_error'
  | 'authentication'
  | 'invalid_request'
  | 'content_filter'
  | 'model_unavailable'
  | 'unknown';

/**
 * Parse an error and create appropriate AIError.
 */
export function parseAIError(error: unknown): AIError {
  if (error instanceof AIError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const originalError = error instanceof Error ? error : undefined;
  const lowerMessage = message.toLowerCase();

  // Rate limiting
  if (lowerMessage.includes('429') || lowerMessage.includes('rate_limit') || lowerMessage.includes('rate limit')) {
    return new AIError(
      'Rate limit exceeded. Please try again in a moment.',
      'rate_limit',
      429,
      true,
      originalError
    );
  }

  // Timeout
  if (lowerMessage.includes('timeout') || lowerMessage.includes('etimedout') || lowerMessage.includes('timed out')) {
    return new AIError(
      'Request timed out. Please try again.',
      'timeout',
      504,
      true,
      originalError
    );
  }

  // Server errors (retryable)
  if (lowerMessage.includes('500') || lowerMessage.includes('502') || lowerMessage.includes('503') || lowerMessage.includes('504')) {
    return new AIError(
      'AI service temporarily unavailable. Please try again.',
      'server_error',
      503,
      true,
      originalError
    );
  }

  // Authentication
  if (lowerMessage.includes('401') || lowerMessage.includes('403') || lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
    return new AIError(
      'Authentication error with AI service.',
      'authentication',
      401,
      false,
      originalError
    );
  }

  // Invalid request
  if (lowerMessage.includes('400') || lowerMessage.includes('invalid') || lowerMessage.includes('bad request')) {
    return new AIError(
      'Invalid request to AI service.',
      'invalid_request',
      400,
      false,
      originalError
    );
  }

  // Content filter
  if (lowerMessage.includes('content_filter') || lowerMessage.includes('content filter') || lowerMessage.includes('flagged')) {
    return new AIError(
      'Content was filtered by safety systems.',
      'content_filter',
      400,
      false,
      originalError
    );
  }

  // Model unavailable
  if (lowerMessage.includes('model') && (lowerMessage.includes('unavailable') || lowerMessage.includes('not found'))) {
    return new AIError(
      'AI model is currently unavailable.',
      'model_unavailable',
      503,
      true,
      originalError
    );
  }

  // Unknown error
  return new AIError(
    'An unexpected error occurred with the AI service.',
    'unknown',
    500,
    false,
    originalError
  );
}

/**
 * Create a standardized error Response for API routes.
 *
 * @param error - The error to handle
 * @returns Response object suitable for returning from API route
 *
 * @example
 * try {
 *   const result = await streamText({ ... });
 *   return result.toTextStreamResponse();
 * } catch (error) {
 *   return handleAIError(error);
 * }
 */
export function handleAIError(error: unknown): Response {
  const aiError = parseAIError(error);

  // Log the error for debugging
  console.error('[AI Error]', {
    code: aiError.code,
    message: aiError.message,
    retryable: aiError.retryable,
    originalError: aiError.originalError?.stack || aiError.originalError?.message,
  });

  return new Response(JSON.stringify(aiError.toJSON()), {
    status: aiError.statusCode,
    headers: {
      'Content-Type': 'application/json',
      // Add retry-after header for rate limits
      ...(aiError.code === 'rate_limit' && { 'Retry-After': '60' }),
    },
  });
}

/**
 * Check if an error is retryable.
 *
 * @param error - Error to check
 * @returns true if the error is likely transient and worth retrying
 */
export function isRetryableError(error: unknown): boolean {
  return parseAIError(error).retryable;
}

/**
 * Wrap an async function with error handling.
 *
 * @param fn - Async function to wrap
 * @returns Wrapped function that catches and handles AI errors
 *
 * @example
 * const safeGenerate = withAIErrorHandling(async () => {
 *   return streamText({ ... });
 * });
 */
export function withAIErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw parseAIError(error);
    }
  };
}
