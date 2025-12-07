/**
 * Gemini AI Form Parser
 *
 * Uses Google's Gemini AI to intelligently parse and normalize flexible form submissions
 * into a standardized schema, regardless of original field naming conventions.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiParseResult, NormalizedFormData, TicketMetadata } from '@/types/form-submission';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // Start with 1 second

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff for Gemini API calls
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable (503, 429, network errors)
      const isRetryable =
        error?.status === 503 || // Service Unavailable
        error?.status === 429 || // Too Many Requests
        error?.message?.includes('overloaded') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('network');

      // If not retryable or no more retries, throw immediately
      if (!isRetryable || attempt === retries) {
        throw error;
      }

      // Calculate exponential backoff delay: 1s, 2s, 4s, 8s...
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Parse a form submission using Gemini AI to normalize field names and extract structured data
 *
 * @param rawPayload - Raw form data as key-value pairs (from either JSON or form-urlencoded)
 * @returns Normalized data, ticket metadata, and confidence score
 */
export async function parseFormSubmission(
  rawPayload: Record<string, any>
): Promise<GeminiParseResult> {
  try {
    // Use Gemini model from environment variable with fallback
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
    });

    const prompt = `You are a data extraction AI for a pest control service company. Extract and normalize form submission data.

INPUT DATA (raw form submission):
${JSON.stringify(rawPayload, null, 2)}

YOUR TASK:
1. Extract customer information and normalize field names to this exact schema:
   - first_name (string)
   - last_name (string)
   - email (string)
   - phone_number (string, format: (XXX) XXX-XXXX if possible)
   - street_address (string)
   - city (string)
   - state (string, 2-letter code if possible)
   - zip (string)
   - pest_issue (string, describe the pest problem)
   - own_or_rent (string, must be exactly "own", "rent", or "unknown")
   - additional_comments (string)

2. Generate ticket metadata:
   - description (1-2 sentences describing the service request)
   - priority (low/medium/high/urgent based on urgency indicators)
   - service_type (MUST be either "Support" or "Sales" - this is for department routing)
   - pest_type (e.g., "Rodent Control", "Mosquito Control", "Bed Bug Control", "Termite Control", "General Pest Control")

3. Determine service_type (department routing) based on form content:
   - "Sales" indicators: new customer inquiry, requesting quote, asking about pricing, "interested in service", first-time contact, comparing services
   - "Support" indicators: existing customer issues, reporting problems, complaints, service follow-ups, requesting support, technical issues
   - DEFAULT to "Support" when unclear or insufficient information

4. Calculate a confidence score (0.0-1.0) based on:
   - How much data was successfully extracted
   - Quality of field matching
   - Completeness of information

FIELD MAPPING EXAMPLES:
- firstName, first, fname → first_name
- lastName, last, surname → last_name
- phone, phoneNumber, mobile, cell → phone_number
- address, street, address1 → street_address
- homeOwner, ownHome, property_status ("own"/"rent") → own_or_rent
- comments, message, notes, details → additional_comments
- issue, problem, pest, pestType → pest_issue

RESPONSE FORMAT (valid JSON only):
{
  "normalized": {
    "first_name": "extracted value or null",
    "last_name": "extracted value or null",
    "email": "extracted value or null",
    "phone_number": "extracted value or null",
    "street_address": "extracted value or null",
    "city": "extracted value or null",
    "state": "extracted value or null",
    "zip": "extracted value or null",
    "pest_issue": "extracted value or null",
    "own_or_rent": "own|rent|unknown",
    "additional_comments": "extracted value or null"
  },
  "ticket": {
    "description": "generated description",
    "priority": "low|medium|high|urgent",
    "service_type": "Support|Sales",
    "pest_type": "Rodent Control|Mosquito Control|Bed Bug Control|etc"
  },
  "confidence": 0.85
}

IMPORTANT:
- Return ONLY valid JSON, no markdown, no code blocks, no explanations
- Use null for missing fields
- Be flexible with field name matching
- If address is combined (e.g., "123 Main St, Austin, TX 78701"), parse it into separate fields
- Phone numbers: accept any format, normalize to (XXX) XXX-XXXX if possible`;

    // Retry Gemini API call with exponential backoff
    const result = await retryWithBackoff(async () => {
      return await model.generateContent(prompt);
    });

    const responseText = result.response.text();

    // Clean the response (remove markdown code blocks if present)
    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse JSON response
    const parsed = JSON.parse(cleanedText);

    // Validate and return
    return {
      normalized: parsed.normalized as NormalizedFormData,
      ticket: parsed.ticket as TicketMetadata,
      confidence: parsed.confidence || 0.5,
      success: true,
    };
  } catch (error) {
    console.error('Gemini parsing error:', error);

    // Return fallback with raw data
    return {
      normalized: extractBasicFields(rawPayload),
      ticket: generateFallbackTicket(rawPayload),
      confidence: 0.3,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fallback extraction for basic fields when Gemini fails
 * Returns minimal/empty data - we rely on Gemini for intelligent field mapping
 */
function extractBasicFields(payload: Record<string, any>): NormalizedFormData {
  // Return empty normalized data - let Gemini do all the heavy lifting
  // This is just a safety fallback for when Gemini is unavailable
  return {
    own_or_rent: 'unknown'
  };
}

/**
 * Generate basic ticket metadata when Gemini fails
 */
function generateFallbackTicket(payload: Record<string, any>): TicketMetadata {
  const issue = payload.pest_issue || payload.issue || payload.problem || 'Service Request';

  return {
    description: `Form submission received with issue: ${issue}. Please review the submission details.`,
    priority: 'medium',
    service_type: 'Support', // Default to Support when AI fails
    pest_type: 'General Pest Control', // Default pest type
  };
}
