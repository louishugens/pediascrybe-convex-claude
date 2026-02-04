import { gateway } from 'ai';

/**
 * AI Provider Configuration
 *
 * Uses Vercel AI Gateway for multi-provider support with automatic fallbacks.
 * Set AI_PRIMARY_PROVIDER env var to switch primary provider (openai/anthropic/google).
 */

export type Provider = 'openai' | 'anthropic' | 'google';
export type ModelTier = 'fast' | 'balanced' | 'powerful';

// Primary provider from environment (defaults to openai)
export const PRIMARY_PROVIDER: Provider =
  (process.env.AI_PRIMARY_PROVIDER as Provider) || 'openai';

// Model mappings per tier and provider
const MODEL_TIERS: Record<ModelTier, Record<Provider, string>> = {
  fast: {
    openai: 'openai/gpt-4o-mini',
    anthropic: 'anthropic/claude-3-5-haiku-latest',
    google: 'google/gemini-2.0-flash',
  },
  balanced: {
    openai: 'openai/gpt-5-mini',
    anthropic: 'anthropic/claude-sonnet-4',
    google: 'google/gemini-2.0-flash',
  },
  powerful: {
    openai: 'openai/gpt-4.1',
    anthropic: 'anthropic/claude-opus-4',
    google: 'google/gemini-2.0-pro',
  },
} as const;

// Alternative model for nano-tier (classification tasks)
const NANO_MODELS: Record<Provider, string> = {
  openai: 'openai/gpt-4.1-nano',
  anthropic: 'anthropic/claude-3-5-haiku-latest',
  google: 'google/gemini-2.0-flash',
};

/**
 * Get model configuration with automatic fallbacks.
 *
 * @param tier - Model tier (fast/balanced/powerful)
 * @param overrideProvider - Optional: override the primary provider for this call
 * @returns Model and providerOptions for use with streamText/streamObject
 *
 * @example
 * const result = streamText({
 *   ...getModel('balanced'),
 *   prompt: 'Hello',
 * });
 */
export function getModel(tier: ModelTier, overrideProvider?: Provider) {
  const provider = overrideProvider || PRIMARY_PROVIDER;
  const primary = MODEL_TIERS[tier][provider];

  // Build fallback chain from other providers
  const fallbacks = (Object.entries(MODEL_TIERS[tier]) as [Provider, string][])
    .filter(([p]) => p !== provider)
    .map(([, model]) => model);

  return {
    model: gateway(primary),
    providerOptions: {
      gateway: {
        models: fallbacks,
      },
    },
  };
}

/**
 * Get nano-tier model for lightweight classification tasks.
 *
 * @param overrideProvider - Optional: override the primary provider
 * @returns Model and providerOptions for use with generateObject/streamObject
 */
export function getNanoModel(overrideProvider?: Provider) {
  const provider = overrideProvider || PRIMARY_PROVIDER;
  const primary = NANO_MODELS[provider];

  const fallbacks = (Object.entries(NANO_MODELS) as [Provider, string][])
    .filter(([p]) => p !== provider)
    .map(([, model]) => model);

  return {
    model: gateway(primary),
    providerOptions: {
      gateway: {
        models: fallbacks,
      },
    },
  };
}

/**
 * Get a specific model by ID with optional fallbacks.
 *
 * @param modelId - Full model ID (e.g., 'openai/gpt-4o')
 * @param fallbacks - Optional array of fallback model IDs
 * @returns Model and providerOptions
 *
 * @example
 * const result = streamText({
 *   ...getSpecificModel('openai/gpt-4o', ['anthropic/claude-sonnet-4']),
 *   prompt: 'Hello',
 * });
 */
export function getSpecificModel(modelId: string, fallbacks: string[] = []) {
  return {
    model: gateway(modelId),
    providerOptions: {
      gateway: {
        models: fallbacks,
      },
    },
  };
}

/**
 * Pre-configured model getters for specific use cases.
 * These provide semantic names for common operations.
 */
export const models = {
  /** Chat conversations - balanced between speed and capability */
  chat: (provider?: Provider) => getModel('balanced', provider),

  /** Diagnostic suggestions - balanced model */
  diagnostic: (provider?: Provider) => getModel('balanced', provider),

  /** Lab exam suggestions - powerful model for medical accuracy */
  exams: (provider?: Provider) => getModel('powerful', provider),

  /** Prescription generation - balanced model */
  prescriptions: (provider?: Provider) => getModel('balanced', provider),

  /** Report generation - fast model for efficiency */
  report: (provider?: Provider) => getModel('fast', provider),

  /** Condition classification - nano model for simple categorization */
  classify: (provider?: Provider) => getNanoModel(provider),
};
