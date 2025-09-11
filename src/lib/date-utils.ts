import { DateFilterOption } from '@/contexts/DateFilterContext';

/**
 * Format date to YYYY-MM-DD string for API calls
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get date range based on filter option
 */
export function getDateRangeFromFilter(filter: DateFilterOption): {
  startDate: Date | null;
  endDate: Date;
} {
  const endDate = new Date();
  let startDate: Date | null = null;

  switch (filter) {
    case 'Past 7 Days':
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'Past 30 Days':
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      break;
    case 'Past 90 Days':
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 90);
      break;
    case 'All Time':
      startDate = null; // No start date limit
      break;
  }

  return { startDate, endDate };
}

/**
 * Convert filter to days count for APIs that expect days parameter
 */
export function getDaysFromFilter(filter: DateFilterOption): number | null {
  switch (filter) {
    case 'Past 7 Days':
      return 7;
    case 'Past 30 Days':
      return 30;
    case 'Past 90 Days':
      return 90;
    case 'All Time':
      return null; // Unlimited
  }
}

/**
 * Convert filter to API parameters for date filtering
 */
export function getApiDateParamsFromFilter(filter: DateFilterOption): {
  dateFrom?: string;
  dateTo?: string;
} {
  const { startDate, endDate } = getDateRangeFromFilter(filter);
  
  if (!startDate) {
    // All Time - no date filtering
    return {};
  }

  return {
    dateFrom: formatDateForApi(startDate),
    dateTo: formatDateForApi(endDate),
  };
}

/**
 * Check if a date is within the filter range
 */
export function isDateInRange(
  date: Date,
  filter: DateFilterOption
): boolean {
  const { startDate, endDate } = getDateRangeFromFilter(filter);
  
  if (!startDate) {
    // All Time - always in range
    return true;
  }

  return date >= startDate && date <= endDate;
}

/**
 * Format date range for display
 */
export function formatDateRangeForDisplay(filter: DateFilterOption): string {
  const { startDate, endDate } = getDateRangeFromFilter(filter);
  
  if (!startDate) {
    return 'All Time';
  }

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };

  const startFormatted = startDate.toLocaleDateString('en-US', options);
  const endFormatted = endDate.toLocaleDateString('en-US', options);

  return `${startFormatted} - ${endFormatted}`;
}