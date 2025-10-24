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
    // Use Gemini 2.0 Flash for fast, efficient parsing
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
   - title (concise, 3-8 words summarizing the issue)
   - description (1-2 sentences describing the service request)
   - priority (low/medium/high/urgent based on urgency indicators)
   - service_type (e.g., "Pest Control", "Termite Inspection", "Rodent Removal")

3. Calculate a confidence score (0.0-1.0) based on:
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
    "title": "generated title",
    "description": "generated description",
    "priority": "low|medium|high|urgent",
    "service_type": "service type"
  },
  "confidence": 0.85
}

IMPORTANT:
- Return ONLY valid JSON, no markdown, no code blocks, no explanations
- Use null for missing fields
- Be flexible with field name matching
- If address is combined (e.g., "123 Main St, Austin, TX 78701"), parse it into separate fields
- Phone numbers: accept any format, normalize to (XXX) XXX-XXXX if possible`;

    const result = await model.generateContent(prompt);
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
    title: `New Form Submission: ${issue}`,
    description: `Form submission received with issue: ${issue}. Please review the submission details.`,
    priority: 'medium',
    service_type: 'Pest Control',
  };
}
