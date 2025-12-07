/**
 * Transcript Analyzer for Pest Pressure System
 *
 * Uses Google Gemini AI to analyze call transcripts and extract:
 * - Pest types mentioned
 * - Mention counts
 * - Urgency level (1-10)
 * - Infestation severity (minor, moderate, severe, critical)
 * - Context (symptoms, location, duration, concerns)
 */

import { getGeminiClient } from '../gemini-client';
import type { TranscriptAnalysisResult, InfestationSeverity } from './types';

/**
 * Analyze a call transcript to extract pest pressure data
 */
export async function analyzeTranscriptForPests(
  transcript: string
): Promise<TranscriptAnalysisResult> {
  const gemini = getGeminiClient();

  const prompt = buildPestAnalysisPrompt(transcript);

  try {
    const response = await gemini.generate<{
      pest_types: Array<{
        pest_type: string;
        mentions_count: number;
        confidence: number;
      }>;
      urgency_level: number;
      infestation_severity?: InfestationSeverity;
      extracted_context: {
        symptoms?: string[];
        location_in_home?: string[];
        duration?: string;
        customer_concerns?: string[];
      };
      overall_confidence: number;
    }>(prompt, {
      temperature: 0.3, // Lower temperature for more deterministic extraction
      maxOutputTokens: 1024,
      jsonMode: true,
      retries: 2,
    });

    if (!response.success || !response.data) {
      console.error('[Transcript Analyzer] Failed to get valid response from Gemini');
      return getDefaultAnalysisResult();
    }

    // Validate and sanitize the response
    const data = response.data;

    // Ensure pest_types is an array
    if (!Array.isArray(data.pest_types) || data.pest_types.length === 0) {
      console.warn('[Transcript Analyzer] No pest types found in transcript');
      return getDefaultAnalysisResult();
    }

    // Normalize pest type names (lowercase, trim, standardize common variations)
    const normalizedPestTypes = data.pest_types.map((pest) => ({
      pest_type: normalizePestType(pest.pest_type),
      mentions_count: Math.max(1, pest.mentions_count || 1),
      confidence: Math.min(1, Math.max(0, pest.confidence || 0.5)),
    }));

    // Clamp urgency level to 1-10
    const urgencyLevel = Math.min(10, Math.max(1, data.urgency_level || 5));

    // Validate severity
    const validSeverities: InfestationSeverity[] = ['minor', 'moderate', 'severe', 'critical'];
    const severity = validSeverities.includes(data.infestation_severity as InfestationSeverity)
      ? data.infestation_severity
      : undefined;

    return {
      pest_types: normalizedPestTypes,
      urgency_level: urgencyLevel,
      infestation_severity: severity,
      extracted_context: data.extracted_context || {},
      overall_confidence: Math.min(1, Math.max(0, data.overall_confidence || 0.5)),
    };
  } catch (error) {
    console.error('[Transcript Analyzer] Error analyzing transcript:', error);
    // Don't throw - return low-confidence default result
    return getDefaultAnalysisResult();
  }
}

/**
 * Build the prompt for Gemini to analyze pest-related information
 */
function buildPestAnalysisPrompt(transcript: string): string {
  return `You are a pest control industry expert analyzing a customer service call transcript to extract pest-related information.

**Transcript:**
${transcript}

**Task:**
Analyze this transcript and extract structured information about pest activity. Return a JSON object with the following structure:

{
  "pest_types": [
    {
      "pest_type": "string (e.g., 'ants', 'termites', 'roaches', 'mice', 'bed bugs')",
      "mentions_count": number (how many times this pest was mentioned),
      "confidence": number (0.0-1.0, how confident you are this pest was discussed)
    }
  ],
  "urgency_level": number (1-10, based on customer's urgency, keywords like 'emergency', 'asap', 'right away'),
  "infestation_severity": "minor" | "moderate" | "severe" | "critical" (or null if unclear),
  "extracted_context": {
    "symptoms": ["string array of observed pest symptoms"],
    "location_in_home": ["string array of affected areas like 'kitchen', 'bathroom', 'basement'"],
    "duration": "string describing how long the problem has existed (e.g., '2 weeks', 'just started')",
    "customer_concerns": ["string array of customer's main concerns"]
  },
  "overall_confidence": number (0.0-1.0, overall confidence in this analysis)
}

**Guidelines:**
- Only include pests that are explicitly mentioned or clearly implied
- Normalize pest names (e.g., "cockroach" → "roaches", "carpenter ant" → "ants")
- Count mentions across the entire conversation
- Urgency: 1-3 (casual inquiry), 4-6 (moderate concern), 7-8 (urgent), 9-10 (emergency)
- Severity: minor (1-2 pests seen), moderate (several sightings), severe (daily sightings/damage), critical (extreme infestation/health risk)
- If no pest is clearly mentioned, return empty pest_types array with confidence 0.0
- Be conservative with severity ratings - only mark as "critical" for extreme cases

**Common pest types in pest control:**
ants, termites, roaches, bed bugs, mice, rats, mosquitoes, fleas, ticks, spiders, wasps, bees, hornets, silverfish, earwigs, crickets, centipedes, millipedes

Return ONLY the JSON object, no additional text.`;
}

/**
 * Normalize pest type names for consistency
 */
function normalizePestType(pestType: string): string {
  const normalized = pestType.toLowerCase().trim();

  // Map common variations to standard names
  const variations: Record<string, string> = {
    cockroach: 'roaches',
    cockroaches: 'roaches',
    roach: 'roaches',
    ant: 'ants',
    'carpenter ant': 'carpenter ants',
    'fire ant': 'fire ants',
    termite: 'termites',
    'bed bug': 'bed bugs',
    bedbug: 'bed bugs',
    mouse: 'mice',
    rat: 'rats',
    rodent: 'rodents',
    rodents: 'rodents',
    mosquito: 'mosquitoes',
    flea: 'fleas',
    tick: 'ticks',
    spider: 'spiders',
    wasp: 'wasps',
    bee: 'bees',
    hornet: 'hornets',
    silverfish: 'silverfish',
    earwig: 'earwigs',
    cricket: 'crickets',
    centipede: 'centipedes',
    millipede: 'millipedes',
  };

  return variations[normalized] || normalized;
}

/**
 * Get default analysis result when AI analysis fails
 */
function getDefaultAnalysisResult(): TranscriptAnalysisResult {
  return {
    pest_types: [],
    urgency_level: 5,
    infestation_severity: undefined,
    extracted_context: {},
    overall_confidence: 0.0,
  };
}

/**
 * Batch analyze multiple transcripts (more efficient for background jobs)
 */
export async function analyzeTranscriptsBatch(
  transcripts: Array<{ id: string; transcript: string }>
): Promise<Map<string, TranscriptAnalysisResult>> {
  const results = new Map<string, TranscriptAnalysisResult>();

  // Process transcripts sequentially to avoid rate limits
  // In production, consider batching with delays between requests
  for (const { id, transcript } of transcripts) {
    try {
      const result = await analyzeTranscriptForPests(transcript);
      results.set(id, result);

      // Small delay to avoid rate limits (15 RPM = ~4 seconds between requests)
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`[Transcript Analyzer] Failed to analyze transcript ${id}:`, error);
      results.set(id, getDefaultAnalysisResult());
    }
  }

  return results;
}

/**
 * Calculate aggregate urgency and severity from multiple transcripts
 * Useful for analyzing patterns across a geographic area
 */
export function calculateAggregateMetrics(
  analyses: TranscriptAnalysisResult[]
): {
  avgUrgency: number;
  mostCommonSeverity: InfestationSeverity | null;
  topPestTypes: Array<{ pest_type: string; count: number }>;
} {
  if (analyses.length === 0) {
    return {
      avgUrgency: 5,
      mostCommonSeverity: null,
      topPestTypes: [],
    };
  }

  // Calculate average urgency
  const totalUrgency = analyses.reduce((sum, a) => sum + a.urgency_level, 0);
  const avgUrgency = totalUrgency / analyses.length;

  // Find most common severity
  const severityCounts: Record<string, number> = {};
  analyses.forEach((a) => {
    if (a.infestation_severity) {
      severityCounts[a.infestation_severity] =
        (severityCounts[a.infestation_severity] || 0) + 1;
    }
  });

  const mostCommonSeverity =
    Object.keys(severityCounts).length > 0
      ? (Object.entries(severityCounts).sort((a, b) => b[1] - a[1])[0][0] as InfestationSeverity)
      : null;

  // Aggregate pest types
  const pestCounts: Record<string, number> = {};
  analyses.forEach((a) => {
    a.pest_types.forEach((p) => {
      pestCounts[p.pest_type] = (pestCounts[p.pest_type] || 0) + p.mentions_count;
    });
  });

  const topPestTypes = Object.entries(pestCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pest_type, count]) => ({ pest_type, count }));

  return {
    avgUrgency: Math.round(avgUrgency * 10) / 10,
    mostCommonSeverity,
    topPestTypes,
  };
}
