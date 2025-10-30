/**
 * State Normalization Utility
 *
 * Converts full US state names to 2-character abbreviations for database storage.
 * Handles case variations and ensures consistency across the application.
 */

/**
 * Map of full state names (lowercase) to their 2-character abbreviations
 * Includes all 50 US states, DC, and common territories
 */
const STATE_NAME_TO_ABBREV: Record<string, string> = {
  // US States
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',

  // District of Columbia
  'district of columbia': 'DC',
  'washington dc': 'DC',
  'washington d.c.': 'DC',

  // US Territories
  'puerto rico': 'PR',
  'virgin islands': 'VI',
  'u.s. virgin islands': 'VI',
  guam: 'GU',
  'american samoa': 'AS',
  'northern mariana islands': 'MP',
};

/**
 * Set of valid 2-character state abbreviations for quick validation
 */
const VALID_STATE_ABBREVS = new Set([
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  'DC',
  'PR',
  'VI',
  'GU',
  'AS',
  'MP',
]);

/**
 * Normalize a state name or abbreviation to a standard 2-character uppercase abbreviation
 *
 * @param state - State name or abbreviation (can be any case)
 * @returns 2-character uppercase state abbreviation, or undefined if unrecognized
 *
 * @example
 * normalizeStateToAbbreviation('California')  // 'CA'
 * normalizeStateToAbbreviation('ca')          // 'CA'
 * normalizeStateToAbbreviation('CA')          // 'CA'
 * normalizeStateToAbbreviation('New York')    // 'NY'
 * normalizeStateToAbbreviation('Ontario')     // undefined (not US state)
 * normalizeStateToAbbreviation(null)          // undefined
 */
export function normalizeStateToAbbreviation(
  state: string | null | undefined
): string | undefined {
  // Handle null/undefined/empty
  if (!state) {
    return undefined;
  }

  const trimmed = state.trim();

  // Handle empty string after trim
  if (trimmed.length === 0) {
    return undefined;
  }

  // If already 2 characters, validate and return uppercase
  if (trimmed.length === 2) {
    const upper = trimmed.toUpperCase();
    return VALID_STATE_ABBREVS.has(upper) ? upper : undefined;
  }

  // Lookup full state name (case-insensitive)
  const normalized = trimmed.toLowerCase();
  const abbreviation = STATE_NAME_TO_ABBREV[normalized];

  if (abbreviation) {
    return abbreviation;
  }

  // Unrecognized state - could be international, typo, etc.
  // Return undefined to skip this data point gracefully
  return undefined;
}

/**
 * Check if a string is a valid US state abbreviation
 *
 * @param abbrev - Potential state abbreviation
 * @returns true if valid US state abbreviation
 */
export function isValidStateAbbreviation(abbrev: string | null | undefined): boolean {
  if (!abbrev || abbrev.length !== 2) {
    return false;
  }

  return VALID_STATE_ABBREVS.has(abbrev.toUpperCase());
}

/**
 * Get the full state name from an abbreviation
 *
 * @param abbrev - 2-character state abbreviation
 * @returns Full state name, or undefined if not found
 */
export function getStateFullName(abbrev: string | null | undefined): string | undefined {
  if (!abbrev || abbrev.length !== 2) {
    return undefined;
  }

  const upper = abbrev.toUpperCase();

  // Reverse lookup in the map
  for (const [fullName, stateAbbrev] of Object.entries(STATE_NAME_TO_ABBREV)) {
    if (stateAbbrev === upper) {
      // Return title-cased version
      return fullName
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }

  return undefined;
}
