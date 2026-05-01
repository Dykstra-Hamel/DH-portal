/**
 * Format date to YYYY-MM-DD string for API calls
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Format a `requested_date`-style value (either a day-of-week name like
 * "monday" or a date string) into a capitalized day-of-week name. Returns
 * the fallback when the input is missing or unparseable.
 */
export function formatPreferredDay(
  value?: string | null,
  fallback: string = '—'
): string {
  if (!value) return fallback;
  if (/^[a-zA-Z]+$/.test(value)) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const parsed = ymd
    ? new Date(Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])))
    : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return DAY_NAMES[ymd ? parsed.getUTCDay() : parsed.getDay()];
}

/**
 * Format a date-only string (YYYY-MM-DD) in local time without timezone shift.
 */
export function formatDateOnlyLocal(dateString: string): Date | null {
  if (!dateString) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Parse a date string into a Date, preserving local date-only values.
 */
export function parseDateString(dateString?: string | null): Date | null {
  if (!dateString) return null;
  const localDate = formatDateOnlyLocal(dateString);
  const parsed = localDate ?? new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format duration in minutes to a readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Format an elapsed duration as a compact age label using the largest
 * appropriate unit: minutes, hours, or days.
 *
 * Examples: "10m", "32m", "1hr", "23hr", "1d", "10d".
 *
 * Accepts a Date, ISO string, or millisecond timestamp. Returns "0m" for
 * invalid or future timestamps.
 */
export function formatAge(input: Date | string | number): string {
  const past =
    input instanceof Date
      ? input.getTime()
      : typeof input === 'number'
        ? input
        : new Date(input).getTime();

  if (Number.isNaN(past)) return '0m';

  const diffMs = Math.max(0, Date.now() - past);
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}hr`;
  return `${days}d`;
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

/**
 * Check if a ticket has a live call in progress
 */
export function hasLiveCall(ticket: any): boolean {
  if (!ticket.call_records || !Array.isArray(ticket.call_records)) {
    return false;
  }

  // Check if any call record has status indicating live call
  const hasLive = ticket.call_records.some((record: any) => {
    // Check for live call statuses
    const liveStatuses = ['ongoing', 'in-progress', 'active', 'ringing', 'connecting'];
    const hasLiveStatus = liveStatuses.includes(record.call_status);

    // Check for calls that have started but not ended (backup logic)
    const hasStartNoEnd = record.start_timestamp && !record.end_timestamp;

    // Additional validation - ensure start_timestamp is recent (within last hour)
    const isRecent = record.start_timestamp ?
      (new Date().getTime() - new Date(record.start_timestamp).getTime()) < (60 * 60 * 1000) : false;

    return hasLiveStatus || (hasStartNoEnd && isRecent);
  });

  return hasLive;
}

/**
 * Check if a call record represents an active/live call
 */
export function isLiveCallRecord(record: any): boolean {
  if (!record) return false;

  // Check for live call statuses
  const liveStatuses = ['ongoing', 'in-progress', 'active', 'ringing', 'connecting'];
  const hasLiveStatus = liveStatuses.includes(record.call_status);

  // Check for calls that have started but not ended
  const hasStartNoEnd = record.start_timestamp && !record.end_timestamp;

  // Ensure the call is recent (within last hour to prevent stale calls)
  const isRecent = record.start_timestamp ?
    (new Date().getTime() - new Date(record.start_timestamp).getTime()) < (60 * 60 * 1000) : false;

  return hasLiveStatus || (hasStartNoEnd && isRecent);
}

/**
 * Format date with ordinal suffix (e.g., "19th Sept 9:40PM")
 */
export function formatDateWithOrdinal(date: Date | string): string {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const time = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Get ordinal suffix
  const getOrdinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return `${day}${getOrdinalSuffix(day)} ${month} ${time}`;
}

/**
 * Format date for display in headers (e.g., "8/20/2024, 11:23 am")
 */
export function formatHeaderDate(date: Date | string, includeTime: boolean = true): string {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const month = dateObj.getMonth() + 1; // 0-indexed
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();

  if (!includeTime) {
    return `${month}/${day}/${year}`;
  }

  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12; // Convert to 12-hour format
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${month}/${day}/${year}, ${displayHours}:${displayMinutes} ${ampm}`;
}
