/**
 * Gemini AI CSV Parser for Bulk Lead Uploads
 *
 * Uses Google's Gemini AI to intelligently parse and normalize CSV data
 * with flexible column names into standardized lead records.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Normalized lead data from CSV
 */
export interface NormalizedLeadData {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  pest_type?: string | null;
  comments?: string | null;
  lead_source?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimated_value?: number | null;
  service_type?: string | null;
}

/**
 * Result from CSV parsing
 */
export interface CSVParseResult {
  success: boolean;
  leads: NormalizedLeadData[];
  confidence: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicates: Array<{
    rowIndex: number;
    email?: string;
    phone?: string;
    reason: string;
  }>;
  error?: string;
}

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

      // Check if error is retryable
      const isRetryable =
        error?.status === 503 ||
        error?.status === 429 ||
        error?.message?.includes('overloaded') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('network');

      if (!isRetryable || attempt === retries) {
        throw error;
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      console.log(`⏳ Gemini API retry ${attempt + 1}/${retries} after ${delay}ms...`);

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Parse CSV string into array of objects
 * Handles quoted fields, commas within quotes, and escaped quotes
 */
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse a single CSV line handling quotes properly
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator (not in quotes)
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current.trim());

    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const values = parseLine(lines[i]);

    // Only add rows with data
    if (values.some(v => v.length > 0)) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Parse CSV data using Gemini AI to normalize lead records
 *
 * @param csvContent - Raw CSV content as string
 * @param existingLeads - Array of existing leads (email/phone) for duplicate detection
 * @returns Normalized lead data with duplicate warnings
 */
export async function parseCSVLeads(
  csvContent: string,
  existingLeads: Array<{ email?: string; phone_number?: string }> = []
): Promise<CSVParseResult> {
  try {
    // Parse CSV into rows
    const rows = parseCSV(csvContent);

    console.log('📊 Parsed CSV rows:', {
      totalRows: rows.length,
      headers: rows.length > 0 ? Object.keys(rows[0]) : [],
      firstRow: rows[0]
    });

    if (rows.length === 0) {
      return {
        success: false,
        leads: [],
        confidence: 0,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        duplicates: [],
        error: 'No valid data found in CSV',
      };
    }

    // Use Gemini model from environment variable with fallback
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
    });

    const prompt = `You are a data extraction AI for a pest control CRM system. Parse CSV data into standardized lead records.

INPUT DATA (CSV rows as JSON):
${JSON.stringify(rows, null, 2)}

YOUR TASK:
1. For EACH row, extract and normalize lead information to this exact schema:
   - first_name (string)
   - last_name (string)
   - email (string, lowercase)
   - phone_number (string, format: (XXX) XXX-XXXX if possible)
   - street_address (string)
   - city (string)
   - state (string, 2-letter code if possible)
   - zip (string)
   - pest_type (string, e.g., "Termite Control", "Rodent Control", "Mosquito Control", "General Pest Control")
   - comments (string, any additional notes or details)
   - lead_source (one of: organic, referral, google_cpc, facebook_ads, linkedin, email_campaign, cold_call, trade_show, webinar, content_marketing, other)
   - priority (low/medium/high/urgent based on urgency indicators)
   - estimated_value (number, dollar amount if mentioned)
   - service_type (string, type of service requested)

2. Determine priority based on content:
   - "urgent": emergency pest issues, time-sensitive requests
   - "high": new customer inquiries, quote requests
   - "medium": general inquiries, follow-ups
   - "low": informational requests

3. Default values for missing fields:
   - lead_source: "other"
   - priority: "medium"

4. Calculate overall confidence score (0.0-1.0) based on:
   - Data completeness across all rows
   - Quality of field matching
   - Consistency of data

FLEXIBLE FIELD MAPPING EXAMPLES:
- "First Name", "FirstName", "fname", "first" → first_name
- "Last Name", "LastName", "lname", "surname" → last_name
- "Email Address", "Email", "e-mail" → email
- "Phone", "Phone Number", "Mobile", "Cell" → phone_number
- "Address", "Street", "Address Line 1" → street_address
- "Pest Issue", "Pest Type", "Service Needed" → pest_type
- "Notes", "Comments", "Additional Info" → comments
- "Value", "Estimated Revenue", "Deal Size" → estimated_value
- "Source", "Lead Source", "How did you hear" → lead_source

RESPONSE FORMAT (valid JSON only):
{
  "leads": [
    {
      "first_name": "value or null",
      "last_name": "value or null",
      "email": "value or null",
      "phone_number": "value or null",
      "street_address": "value or null",
      "city": "value or null",
      "state": "value or null",
      "zip": "value or null",
      "pest_type": "value or null",
      "comments": "value or null",
      "lead_source": "organic|referral|google_cpc|facebook_ads|etc",
      "priority": "low|medium|high|urgent",
      "estimated_value": number or null,
      "service_type": "value or null"
    }
  ],
  "confidence": 0.85
}

IMPORTANT:
- Return ONLY valid JSON, no markdown, no code blocks, no explanations
- Use null for missing fields
- Be flexible with column name matching
- Phone numbers: normalize to (XXX) XXX-XXXX format
- Email: convert to lowercase
- Each row in the input should produce one lead in the output`;

    // Retry Gemini API call with exponential backoff
    const result = await retryWithBackoff(async () => {
      return await model.generateContent(prompt);
    });

    const responseText = result.response.text();

    // Clean the response
    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse JSON response
    const parsed = JSON.parse(cleanedText);

    console.log('🤖 Gemini AI response:', {
      totalLeads: parsed.leads?.length || 0,
      confidence: parsed.confidence,
      firstLead: parsed.leads?.[0]
    });

    // Detect duplicates
    const duplicates: Array<{
      rowIndex: number;
      email?: string;
      phone?: string;
      reason: string;
    }> = [];

    const normalizedLeads = parsed.leads || [];

    normalizedLeads.forEach((lead: NormalizedLeadData, index: number) => {
      const email = lead.email?.toLowerCase();
      const phone = lead.phone_number;

      // Check against existing leads
      const emailMatch = email && existingLeads.some(
        existing => existing.email?.toLowerCase() === email
      );
      const phoneMatch = phone && existingLeads.some(
        existing => existing.phone_number === phone
      );

      // Check against other leads in this batch (appearing earlier)
      const batchEmailMatch = email && normalizedLeads.slice(0, index).some(
        (other: NormalizedLeadData) => other.email?.toLowerCase() === email
      );
      const batchPhoneMatch = phone && normalizedLeads.slice(0, index).some(
        (other: NormalizedLeadData) => other.phone_number === phone
      );

      if (emailMatch || phoneMatch || batchEmailMatch || batchPhoneMatch) {
        let reason = 'Duplicate detected: ';
        if (emailMatch || batchEmailMatch) reason += `Email already exists`;
        if ((emailMatch || batchEmailMatch) && (phoneMatch || batchPhoneMatch)) reason += ' and ';
        if (phoneMatch || batchPhoneMatch) reason += `Phone already exists`;

        duplicates.push({
          rowIndex: index,
          email: email || undefined,
          phone: phone || undefined,
          reason,
        });
      }
    });

    // Filter out duplicates from the leads array
    const validLeads = normalizedLeads.filter(
      (_: any, index: number) => !duplicates.some(dup => dup.rowIndex === index)
    );

    return {
      success: true,
      leads: validLeads,
      confidence: parsed.confidence || 0.5,
      totalRows: rows.length,
      validRows: validLeads.length,
      invalidRows: normalizedLeads.length - validLeads.length,
      duplicates,
    };
  } catch (error) {
    console.error('CSV parsing error:', error);

    return {
      success: false,
      leads: [],
      confidence: 0,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicates: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
