/**
 * Business Hours Formatting Utility
 *
 * Intelligently groups business days with identical hours for display
 */

interface DayHours {
  start: string;
  end: string;
  closed: boolean;
}

interface BusinessHoursData {
  [day: string]: DayHours;
}

interface FormattedHours {
  days: string;
  hours: string;
}

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_NAMES: { [key: string]: string } = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

/**
 * Converts 24-hour time format to 12-hour with am/pm
 * @param time - Time in HH:MM format (e.g., "09:00")
 * @returns Formatted time (e.g., "9am")
 */
function formatTime(time: string): string {
  // Guard against undefined, null, or empty string
  if (!time || typeof time !== 'string') {
    return 'N/A';
  }

  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const period = hour >= 12 ? 'pm' : 'am';

  // Convert to 12-hour format
  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }

  // Only include minutes if not :00
  if (minute === 0) {
    return `${hour}${period}`;
  }

  return `${hour}:${minuteStr}${period}`;
}

/**
 * Creates a unique signature for a day's hours
 * @param dayData - Day's hours data
 * @returns Unique key for grouping
 */
function getDaySignature(dayData: DayHours): string {
  if (dayData.closed) {
    return 'CLOSED';
  }
  return `${dayData.start}-${dayData.end}`;
}

/**
 * Checks if an array of days are consecutive
 * @param days - Array of day names in lowercase
 * @returns true if days are consecutive
 */
function isConsecutive(days: string[]): boolean {
  if (days.length <= 1) return true;

  const indices = days.map(day => DAYS_ORDER.indexOf(day));

  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) {
      return false;
    }
  }

  return true;
}

/**
 * Formats a range of days
 * @param days - Array of day names in lowercase
 * @returns Formatted day range (e.g., "Monday-Friday" or "Monday, Wednesday, Friday")
 */
function formatDayRange(days: string[]): string {
  if (days.length === 0) return '';
  if (days.length === 1) return DAY_NAMES[days[0]];

  if (isConsecutive(days)) {
    // Consecutive range: "Monday-Friday"
    return `${DAY_NAMES[days[0]]}-${DAY_NAMES[days[days.length - 1]]}`;
  }

  // Non-consecutive: "Monday, Wednesday, Friday"
  return days.map(day => DAY_NAMES[day]).join(', ');
}

/**
 * Formats business hours for display
 * @param businessHours - Business hours data from database
 * @returns Array of formatted hour groups
 */
export function formatBusinessHoursForDisplay(businessHours: BusinessHoursData): FormattedHours[] {
  if (!businessHours) return [];

  // Group days by their signature (same hours)
  const grouped: { [signature: string]: string[] } = {};

  for (const day of DAYS_ORDER) {
    const dayData = businessHours[day];
    if (!dayData) continue;

    const signature = getDaySignature(dayData);
    if (!grouped[signature]) {
      grouped[signature] = [];
    }
    grouped[signature].push(day);
  }

  // Convert grouped data to formatted output
  const result: FormattedHours[] = [];

  for (const signature of Object.keys(grouped)) {
    const days = grouped[signature];
    const dayData = businessHours[days[0]];

    const formattedDays = formatDayRange(days);
    const formattedHours = dayData.closed || !dayData.start || !dayData.end
      ? 'Closed'
      : `${formatTime(dayData.start)}-${formatTime(dayData.end)}`;

    result.push({
      days: formattedDays,
      hours: formattedHours,
    });
  }

  return result;
}
