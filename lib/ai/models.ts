import { gateway } from 'ai';
import {
  getModel,
  getNanoModel,
  getSpecificModel,
  type Provider,
  type ModelTier,
} from './providers';
import { type RetryOptions } from './middleware/retry';

/**
 * Options for creating a robust model.
 */
export interface RobustModelOptions {
  /** Provider override (default: from AI_PRIMARY_PROVIDER env) */
  provider?: Provider;
  /** Retry configuration (currently disabled due to type incompatibility) */
  retry?: RetryOptions;
  /** Whether to disable retry middleware (default: false) - kept for API compatibility */
  disableRetry?: boolean;
}

/**
 * Creates a robust model with provider fallbacks.
 * Note: Retry middleware temporarily disabled due to ai SDK v6 type changes.
 * Retry logic is handled by workflow steps and provider fallbacks.
 *
 * @param tier - Model tier (fast/balanced/powerful)
 * @param options - Configuration options
 * @returns Model ready for use with streamText/streamObject
 *
 * @example
 * const result = streamText({
 *   model: createRobustModel('balanced'),
 *   prompt: 'Hello',
 * });
 */
export function createRobustModel(
  tier: ModelTier,
  options: RobustModelOptions = {}
) {
  const { provider } = options;
  const modelConfig = getModel(tier, provider);
  return modelConfig.model;
}

/**
 * Creates a robust nano model for classification tasks.
 *
 * @param options - Configuration options
 * @returns Model ready for use with generateObject/streamObject
 */
export function createRobustNanoModel(options: RobustModelOptions = {}) {
  const { provider } = options;
  const modelConfig = getNanoModel(provider);
  return modelConfig.model;
}

/**
 * Creates a robust model from a specific model ID.
 *
 * @param modelId - Full model ID (e.g., 'openai/gpt-4o')
 * @param fallbacks - Optional fallback model IDs
 * @param options - Configuration options
 * @returns Model ready for use
 */
export function createRobustSpecificModel(
  modelId: string,
  fallbacks: string[] = [],
  options: Omit<RobustModelOptions, 'provider'> = {}
) {
  const modelConfig = getSpecificModel(modelId, fallbacks);
  return modelConfig.model;
}

/**
 * Pre-configured robust models for specific use cases.
 *
 * Each model comes with:
 * - Automatic provider fallbacks via AI Gateway
 * - Appropriate tier for the use case
 *
 * @example
 * const result = streamText({
 *   model: robustModels.chat(),
 *   system: 'You are a helpful assistant',
 *   messages,
 * });
 */
export const robustModels = {
  /**
   * Chat conversations - balanced model.
   * Use for: patient chat, general medical Q&A
   */
  chat: (options?: RobustModelOptions) =>
    createRobustModel('balanced', options),

  /**
   * Diagnostic suggestions - balanced model.
   * Use for: diagnostic analysis, symptom evaluation
   */
  diagnostic: (options?: RobustModelOptions) =>
    createRobustModel('balanced', options),

  /**
   * Lab exam suggestions - powerful model for accuracy.
   * Use for: recommending lab tests, clinical decision support
   */
  exams: (options?: RobustModelOptions) =>
    createRobustModel('powerful', options),

  /**
   * Prescription generation - balanced model.
   * Use for: medication suggestions, dosage calculations
   */
  prescriptions: (options?: RobustModelOptions) =>
    createRobustModel('balanced', options),

  /**
   * Report generation - fast model for efficiency.
   * Use for: generating clinical reports, summaries
   */
  report: (options?: RobustModelOptions) =>
    createRobustModel('fast', options),

  /**
   * Condition classification - nano model for simple tasks.
   * Use for: categorizing diagnoses, grouping conditions
   */
  classify: (options?: RobustModelOptions) =>
    createRobustNanoModel(options),
};

/**
 * Get model configuration with fallbacks (for use with providerOptions).
 *
 * Use this when you need both the model and providerOptions separately.
 *
 * @example
 * const { model, providerOptions } = getModelWithFallbacks('balanced');
 * const result = streamText({
 *   model,
 *   providerOptions,
 *   prompt: 'Hello',
 * });
 */
export function getModelWithFallbacks(
  tier: ModelTier,
  options?: RobustModelOptions
) {
  const { provider } = options || {};
  const config = getModel(tier, provider);

  return {
    model: config.model,
    providerOptions: config.providerOptions,
  };
}

// Re-export types and utilities
export type { Provider, ModelTier } from './providers';
export { PRIMARY_PROVIDER } from './providers';
