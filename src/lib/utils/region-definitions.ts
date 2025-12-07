/**
 * Regional Definitions for Cross-Company Pest Pressure Analytics
 *
 * Defines common pest control service regions for geographic aggregation.
 * Regions can span multiple states or focus on specific metropolitan areas.
 */

export interface RegionDefinition {
  id: string;
  name: string;
  description?: string;
  states?: string[]; // Array of state abbreviations (e.g., ['AZ', 'NM'])
  cities?: Array<{ city: string; state: string }>; // Specific cities
  includesSurrounding?: boolean; // Whether to include surrounding areas
}

/**
 * Predefined pest control regions
 * These can be expanded or customized based on business needs
 */
export const PEST_CONTROL_REGIONS: Record<string, RegionDefinition> = {
  // ========== Metropolitan Areas ==========
  'phoenix-metro': {
    id: 'phoenix-metro',
    name: 'Phoenix Metro',
    description: 'Greater Phoenix metropolitan area',
    states: ['AZ'],
    cities: [
      { city: 'Phoenix', state: 'AZ' },
      { city: 'Scottsdale', state: 'AZ' },
      { city: 'Tempe', state: 'AZ' },
      { city: 'Mesa', state: 'AZ' },
      { city: 'Chandler', state: 'AZ' },
      { city: 'Glendale', state: 'AZ' },
      { city: 'Gilbert', state: 'AZ' },
      { city: 'Peoria', state: 'AZ' },
    ],
  },

  'tucson-metro': {
    id: 'tucson-metro',
    name: 'Tucson Metro',
    description: 'Greater Tucson metropolitan area',
    states: ['AZ'],
    cities: [
      { city: 'Tucson', state: 'AZ' },
      { city: 'Oro Valley', state: 'AZ' },
      { city: 'Marana', state: 'AZ' },
      { city: 'Sahuarita', state: 'AZ' },
    ],
  },

  'las-vegas-metro': {
    id: 'las-vegas-metro',
    name: 'Las Vegas Metro',
    description: 'Greater Las Vegas metropolitan area',
    states: ['NV'],
    cities: [
      { city: 'Las Vegas', state: 'NV' },
      { city: 'Henderson', state: 'NV' },
      { city: 'North Las Vegas', state: 'NV' },
      { city: 'Paradise', state: 'NV' },
    ],
  },

  'albuquerque-metro': {
    id: 'albuquerque-metro',
    name: 'Albuquerque Metro',
    description: 'Greater Albuquerque metropolitan area',
    states: ['NM'],
    cities: [
      { city: 'Albuquerque', state: 'NM' },
      { city: 'Rio Rancho', state: 'NM' },
      { city: 'Santa Fe', state: 'NM' },
    ],
  },

  // ========== Regional Groupings ==========
  'southwest': {
    id: 'southwest',
    name: 'Southwest Region',
    description: 'Southwestern United States',
    states: ['AZ', 'NM', 'NV', 'UT'],
  },

  'desert-southwest': {
    id: 'desert-southwest',
    name: 'Desert Southwest',
    description: 'Hot desert climates in Southwest US',
    states: ['AZ', 'NM', 'NV'],
  },

  'california': {
    id: 'california',
    name: 'California',
    description: 'State of California',
    states: ['CA'],
  },

  'texas': {
    id: 'texas',
    name: 'Texas',
    description: 'State of Texas',
    states: ['TX'],
  },

  'florida': {
    id: 'florida',
    name: 'Florida',
    description: 'State of Florida',
    states: ['FL'],
  },

  'gulf-coast': {
    id: 'gulf-coast',
    name: 'Gulf Coast',
    description: 'Gulf Coast states',
    states: ['TX', 'LA', 'MS', 'AL', 'FL'],
  },

  'southeast': {
    id: 'southeast',
    name: 'Southeast Region',
    description: 'Southeastern United States',
    states: ['FL', 'GA', 'SC', 'NC', 'AL', 'MS', 'TN', 'KY', 'VA'],
  },

  'northeast': {
    id: 'northeast',
    name: 'Northeast Region',
    description: 'Northeastern United States',
    states: ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'PA', 'NJ', 'DE', 'MD'],
  },

  'midwest': {
    id: 'midwest',
    name: 'Midwest Region',
    description: 'Midwestern United States',
    states: ['OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
  },

  'west-coast': {
    id: 'west-coast',
    name: 'West Coast',
    description: 'Pacific Coast states',
    states: ['CA', 'OR', 'WA'],
  },

  'mountain-west': {
    id: 'mountain-west',
    name: 'Mountain West',
    description: 'Mountain states',
    states: ['MT', 'ID', 'WY', 'CO', 'UT', 'NV'],
  },
};

/**
 * Get all region IDs
 */
export function getRegionIds(): string[] {
  return Object.keys(PEST_CONTROL_REGIONS);
}

/**
 * Get region definition by ID
 */
export function getRegionById(regionId: string): RegionDefinition | undefined {
  return PEST_CONTROL_REGIONS[regionId];
}

/**
 * Get all metropolitan area regions
 */
export function getMetroRegions(): RegionDefinition[] {
  return Object.values(PEST_CONTROL_REGIONS).filter(
    (region) => region.id.endsWith('-metro')
  );
}

/**
 * Get all state/multi-state regions
 */
export function getStateRegions(): RegionDefinition[] {
  return Object.values(PEST_CONTROL_REGIONS).filter(
    (region) => !region.id.endsWith('-metro') && region.states && !region.cities
  );
}

/**
 * Check if a city/state belongs to a region
 */
export function isLocationInRegion(
  city: string | undefined,
  state: string | undefined,
  regionId: string
): boolean {
  const region = getRegionById(regionId);
  if (!region) return false;

  // Check if state is in region
  if (state && region.states && region.states.includes(state)) {
    // If region has specific cities, check city match
    if (region.cities && city) {
      return region.cities.some(
        (c) =>
          c.city.toLowerCase() === city.toLowerCase() &&
          c.state.toUpperCase() === state.toUpperCase()
      );
    }
    // Otherwise, any city in the state matches
    return true;
  }

  return false;
}

/**
 * Get regions that contain a specific state
 */
export function getRegionsForState(stateAbbrev: string): RegionDefinition[] {
  return Object.values(PEST_CONTROL_REGIONS).filter(
    (region) => region.states && region.states.includes(stateAbbrev.toUpperCase())
  );
}

/**
 * Get regions that contain a specific city
 */
export function getRegionsForCity(city: string, state: string): RegionDefinition[] {
  return Object.values(PEST_CONTROL_REGIONS).filter((region) =>
    isLocationInRegion(city, state, region.id)
  );
}

/**
 * Format region for display
 */
export function formatRegionDisplay(region: RegionDefinition): string {
  if (region.cities && region.cities.length > 0) {
    return `${region.name} (${region.cities.length} cities)`;
  }
  if (region.states && region.states.length > 0) {
    return `${region.name} (${region.states.join(', ')})`;
  }
  return region.name;
}
