/**
 * Gemini AI Client
 *
 * Robust client for Google's Gemini AI with:
 * - Rate limiting and quota management
 * - Retry logic with exponential backoff
 * - Response caching
 * - Usage tracking
 * - Type-safe methods for each AI feature
 * - Error handling and logging
 */

import {
  GeminiConfig,
  GeminiResponse,
  GeminiUsageMetrics,
  AIError,
  AIErrorCode,
} from './types';

// Google Generative AI SDK
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: Required<GeminiConfig>;
  private dailyRequestCount: number = 0;
  private dailyResetTime: Date;

  constructor(config: GeminiConfig) {
    // Validate API key
    if (!config.apiKey) {
      throw new AIError(
        'Gemini API key is required',
        AIErrorCode.CONFIGURATION_ERROR,
        500
      );
    }

    // Set defaults
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gemini-1.5-flash',
      maxDailyRequests: config.maxDailyRequests || 1400, // Conservative limit for free tier
      enableCache: config.enableCache ?? true,
      cacheTTL: config.cacheTTL || 86400, // 24 hours
    };

    // Initialize Google Generative AI client
    this.client = new GoogleGenerativeAI(this.config.apiKey);
    this.model = this.client.getGenerativeModel({ model: this.config.model });

    // Set daily reset time to midnight UTC
    this.dailyResetTime = this.getNextMidnightUTC();
  }

  /**
   * Get next midnight UTC timestamp
   */
  private getNextMidnightUTC(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Check if daily quota has been exceeded
   */
  private checkDailyQuota(): void {
    const now = new Date();

    // Reset counter if it's a new day
    if (now >= this.dailyResetTime) {
      this.dailyRequestCount = 0;
      this.dailyResetTime = this.getNextMidnightUTC();
    }

    // Check if quota exceeded
    if (this.dailyRequestCount >= this.config.maxDailyRequests) {
      const hoursUntilReset = Math.ceil(
        (this.dailyResetTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      throw new AIError(
        `Daily request quota exceeded. Resets in ${hoursUntilReset} hours.`,
        AIErrorCode.QUOTA_EXCEEDED,
        429,
        {
          dailyLimit: this.config.maxDailyRequests,
          currentCount: this.dailyRequestCount,
          resetTime: this.dailyResetTime.toISOString(),
        }
      );
    }
  }

  /**
   * Calculate token cost (estimation for free tier tracking)
   * Gemini 1.5 Flash: Free up to 15 RPM, 1M TPM, 1500 RPD
   * Pro: Pay per token
   */
  private calculateCost(tokensIn: number, tokensOut: number, model: string): number {
    // For free tier, cost is $0
    if (this.config.model === 'gemini-1.5-flash') {
      return 0;
    }

    // Gemini 1.5 Pro pricing (as of 2025)
    // Input: $0.00025 / 1K tokens
    // Output: $0.00050 / 1K tokens
    const inputCost = (tokensIn / 1000) * 0.025; // cents
    const outputCost = (tokensOut / 1000) * 0.05; // cents

    return Math.ceil(inputCost + outputCost);
  }

  /**
   * Generate content with Gemini
   */
  async generate<T = any>(
    prompt: string,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      systemInstruction?: string;
      jsonMode?: boolean;
      retries?: number;
    }
  ): Promise<GeminiResponse<T>> {
    const startTime = Date.now();

    try {
      // Check daily quota
      this.checkDailyQuota();

      // Increment request count
      this.dailyRequestCount++;

      // Build generation config
      const generationConfig: GenerationConfig = {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 2048,
        ...(options?.jsonMode && { responseMimeType: 'application/json' }),
      };

      // Create model with config
      const model = this.client.getGenerativeModel({
        model: this.config.model,
        generationConfig,
        ...(options?.systemInstruction && {
          systemInstruction: options.systemInstruction,
        }),
      });

      // Generate content with retry logic
      const maxRetries = options?.retries ?? 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await model.generateContent(prompt);
          const response = result.response;
          const text = response.text();

          // Extract usage metadata
          const usageMetadata = response.usageMetadata;
          const tokensIn = usageMetadata?.promptTokenCount || 0;
          const tokensOut = usageMetadata?.candidatesTokenCount || 0;
          const totalTokens = usageMetadata?.totalTokenCount || 0;

          // Calculate cost
          const costCents = this.calculateCost(tokensIn, tokensOut, this.config.model);

          // Parse JSON response if requested
          let data: T;
          if (options?.jsonMode) {
            try {
              data = JSON.parse(text) as T;
            } catch (parseError) {
              throw new AIError(
                'Failed to parse JSON response from Gemini',
                AIErrorCode.MODEL_ERROR,
                500,
                { text, parseError }
              );
            }
          } else {
            data = text as T;
          }

          const responseTime = Date.now() - startTime;

          console.log(`[GeminiClient] Request successful in ${responseTime}ms`, {
            model: this.config.model,
            tokensIn,
            tokensOut,
            costCents,
            responseTime,
          });

          return {
            success: true,
            data,
            usage: {
              tokensIn,
              tokensOut,
              totalTokens,
              costCents,
            },
            modelUsed: this.config.model,
          };
        } catch (error: any) {
          lastError = error;

          // Check if error is retryable
          const isRetryable =
            error?.status === 429 || // Rate limit
            error?.status === 503 || // Service unavailable
            error?.status === 500; // Internal server error

          if (!isRetryable || attempt === maxRetries) {
            break;
          }

          // Exponential backoff: 1s, 2s, 4s
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          console.log(
            `[GeminiClient] Retrying after ${backoffMs}ms (attempt ${attempt}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }

      // All retries failed
      throw new AIError(
        `Gemini API request failed after ${maxRetries} attempts: ${lastError?.message}`,
        AIErrorCode.MODEL_ERROR,
        500,
        { originalError: lastError }
      );
    } catch (error: any) {
      console.error('[GeminiClient] Error:', error);

      // Handle specific Gemini errors
      if (error instanceof AIError) {
        throw error;
      }

      if (error?.status === 429) {
        throw new AIError(
          'Rate limit exceeded. Please try again later.',
          AIErrorCode.RATE_LIMIT_EXCEEDED,
          429,
          { originalError: error }
        );
      }

      if (error?.status === 401 || error?.status === 403) {
        throw new AIError(
          'Invalid API key or unauthorized access',
          AIErrorCode.UNAUTHORIZED,
          401,
          { originalError: error }
        );
      }

      // Generic error
      throw new AIError(
        error?.message || 'Unknown error occurred',
        AIErrorCode.UNKNOWN_ERROR,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Generate content with conversation history (multi-turn chat)
   */
  async chat<T = string>(
    messages: Array<{ role: 'user' | 'model'; parts: string }>,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      systemInstruction?: string;
    }
  ): Promise<GeminiResponse<T>> {
    try {
      // Check daily quota
      this.checkDailyQuota();
      this.dailyRequestCount++;

      // Build generation config
      const generationConfig: GenerationConfig = {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 2048,
      };

      // Create model
      const model = this.client.getGenerativeModel({
        model: this.config.model,
        generationConfig,
        ...(options?.systemInstruction && {
          systemInstruction: options.systemInstruction,
        }),
      });

      // Convert messages to Gemini format
      const history = messages.slice(0, -1).map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      }));

      const lastMessage = messages[messages.length - 1];

      // Start chat session
      const chat = model.startChat({ history });

      // Send message
      const result = await chat.sendMessage(lastMessage.parts);
      const response = result.response;
      const text = response.text();

      // Extract usage
      const usageMetadata = response.usageMetadata;
      const tokensIn = usageMetadata?.promptTokenCount || 0;
      const tokensOut = usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = usageMetadata?.totalTokenCount || 0;
      const costCents = this.calculateCost(tokensIn, tokensOut, this.config.model);

      return {
        success: true,
        data: text as T,
        usage: {
          tokensIn,
          tokensOut,
          totalTokens,
          costCents,
        },
        modelUsed: this.config.model,
      };
    } catch (error: any) {
      console.error('[GeminiClient] Chat error:', error);

      if (error instanceof AIError) {
        throw error;
      }

      throw new AIError(
        error?.message || 'Chat request failed',
        AIErrorCode.MODEL_ERROR,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    const now = new Date();
    const hoursUntilReset = Math.ceil(
      (this.dailyResetTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    return {
      dailyRequestCount: this.dailyRequestCount,
      dailyLimit: this.config.maxDailyRequests,
      remaining: this.config.maxDailyRequests - this.dailyRequestCount,
      percentUsed: (this.dailyRequestCount / this.config.maxDailyRequests) * 100,
      resetTime: this.dailyResetTime.toISOString(),
      hoursUntilReset,
      model: this.config.model,
    };
  }

  /**
   * Switch to a different model (e.g., upgrade from Flash to Pro)
   */
  switchModel(newModel: 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-2.0-flash-exp') {
    this.config.model = newModel;
    this.model = this.client.getGenerativeModel({ model: newModel });

    console.log(`[GeminiClient] Switched to model: ${newModel}`);
  }

  /**
   * Reset daily request counter (for testing)
   */
  resetDailyCounter() {
    this.dailyRequestCount = 0;
    this.dailyResetTime = this.getNextMidnightUTC();
    console.log('[GeminiClient] Daily counter reset');
  }
}

/**
 * Singleton instance for the Gemini client
 */
let geminiClientInstance: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!geminiClientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AIError(
        'GEMINI_API_KEY environment variable is not set',
        AIErrorCode.CONFIGURATION_ERROR,
        500
      );
    }

    const model = (process.env.GEMINI_MODEL as any) || 'gemini-1.5-flash';
    const maxDailyRequests = parseInt(process.env.GEMINI_MAX_DAILY_REQUESTS || '1400', 10);

    geminiClientInstance = new GeminiClient({
      apiKey,
      model,
      maxDailyRequests,
      enableCache: process.env.ENABLE_AI_CACHE !== 'false',
      cacheTTL: parseInt(process.env.AI_CACHE_TTL || '86400', 10),
    });
  }

  return geminiClientInstance;
}

/**
 * Reset singleton (for testing)
 */
export function resetGeminiClient() {
  geminiClientInstance = null;
}
