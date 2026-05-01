import Anthropic from '@anthropic-ai/sdk';

let cachedClient: Anthropic | null = null;

/**
 * Singleton Anthropic SDK client. Reads ANTHROPIC_API_KEY from env.
 *
 * Throws if the env var is missing — callers should surface this as a 502
 * configuration error rather than a 500.
 */
export function getAnthropicClient(): Anthropic {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to your environment to enable AI report generation.'
    );
  }

  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

export { Anthropic };
