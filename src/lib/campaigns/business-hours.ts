/**
 * Business Hours Helper Functions for Campaign Scheduling
 *
 * These functions read from company_settings table to determine
 * when campaigns can send emails and make phone calls.
 */

import { createAdminClient } from '@/lib/supabase/server-admin';

export interface BusinessHoursSettings {
  timezone: string;
  automationBusinessHoursOnly: boolean;
  businessHoursByDay: {
    [key: string]: {
      enabled: boolean;
      start: string; // HH:MM format
      end: string;   // HH:MM format
    };
  };
}

/**
 * Fetches company business hours settings from database
 */
export async function fetchCompanyBusinessHours(companyId: string): Promise<BusinessHoursSettings> {
  const supabase = createAdminClient();

  const { data: settings, error } = await supabase
    .from('company_settings')
    .select('setting_key, setting_value, setting_type')
    .eq('company_id', companyId)
    .in('setting_key', [
      'company_timezone',
      'automation_business_hours_only',
      'business_hours_monday',
      'business_hours_tuesday',
      'business_hours_wednesday',
      'business_hours_thursday',
      'business_hours_friday',
      'business_hours_saturday',
      'business_hours_sunday',
    ]);

  if (error || !settings) {
    console.error('Error fetching business hours settings:', error);
    // Return defaults
    return getDefaultBusinessHours();
  }

  return parseBusinessHoursSettings(settings);
}

/**
 * Parses raw settings array into structured business hours object
 */
export function parseBusinessHoursSettings(settings: any[]): BusinessHoursSettings {
  const settingsMap: Record<string, any> = {};

  for (const setting of settings) {
    let value = setting.setting_value;

    // Parse JSON settings
    if (setting.setting_type === 'json' && typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        console.warn(`Failed to parse JSON setting ${setting.setting_key}:`, e);
      }
    }

    // Parse boolean settings
    if (setting.setting_type === 'boolean') {
      value = value === 'true' || value === true;
    }

    settingsMap[setting.setting_key] = value;
  }

  // Build business hours by day
  const businessHoursByDay: BusinessHoursSettings['businessHoursByDay'] = {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  for (const day of days) {
    const key = `business_hours_${day}`;
    const dayHours = settingsMap[key];

    if (dayHours && typeof dayHours === 'object') {
      businessHoursByDay[day] = {
        enabled: dayHours.enabled ?? true,
        start: dayHours.start || '09:00',
        end: dayHours.end || '17:00',
      };
    } else {
      // Default to 9am-5pm if not set
      businessHoursByDay[day] = {
        enabled: day !== 'saturday' && day !== 'sunday', // Weekdays only by default
        start: '09:00',
        end: '17:00',
      };
    }
  }

  return {
    timezone: settingsMap.company_timezone || 'America/New_York',
    automationBusinessHoursOnly: settingsMap.automation_business_hours_only ?? true,
    businessHoursByDay,
  };
}

/**
 * Returns default business hours (Mon-Fri 9am-5pm EST)
 */
export function getDefaultBusinessHours(): BusinessHoursSettings {
  const businessHoursByDay: BusinessHoursSettings['businessHoursByDay'] = {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  for (const day of days) {
    businessHoursByDay[day] = {
      enabled: day !== 'saturday' && day !== 'sunday',
      start: '09:00',
      end: '17:00',
    };
  }

  return {
    timezone: 'America/New_York',
    automationBusinessHoursOnly: true,
    businessHoursByDay,
  };
}

/**
 * Checks if a given date/time is within business hours
 */
export function isBusinessHours(
  date: Date,
  settings: BusinessHoursSettings
): boolean {
  // If business hours enforcement is disabled, always return true
  if (!settings.automationBusinessHoursOnly) {
    return true;
  }

  // Convert date to company timezone
  const dateInTz = new Date(
    date.toLocaleString('en-US', { timeZone: settings.timezone })
  );

  // Get day of week
  const dayName = dateInTz
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  const dayHours = settings.businessHoursByDay[dayName];

  // If day is not enabled for business, return false
  if (!dayHours || !dayHours.enabled) {
    return false;
  }

  // Get current time in HH:MM format
  const currentTime = dateInTz.toTimeString().slice(0, 5); // HH:MM

  // Check if current time is within business hours
  return currentTime >= dayHours.start && currentTime <= dayHours.end;
}

/**
 * Checks if a given date is a working day (based on business hours settings)
 */
export function isWorkingDay(
  date: Date,
  settings: BusinessHoursSettings
): boolean {
  // Convert date to company timezone
  const dateInTz = new Date(
    date.toLocaleString('en-US', { timeZone: settings.timezone })
  );

  // Get day of week
  const dayName = dateInTz
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  const dayHours = settings.businessHoursByDay[dayName];

  return dayHours?.enabled ?? false;
}

/**
 * Gets the next available business hour slot from a given date
 */
export function getNextBusinessHourSlot(
  currentDate: Date,
  settings: BusinessHoursSettings
): Date {
  // If business hours not enforced, return current date
  if (!settings.automationBusinessHoursOnly) {
    return currentDate;
  }

  // eslint-disable-next-line prefer-const
  let checkDate = new Date(currentDate);
  let iterations = 0;
  const maxIterations = 14; // Check up to 2 weeks ahead

  while (iterations < maxIterations) {
    // Convert to company timezone
    const dateInTz = new Date(
      checkDate.toLocaleString('en-US', { timeZone: settings.timezone })
    );

    const dayName = dateInTz
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    const dayHours = settings.businessHoursByDay[dayName];

    // If this day has business hours
    if (dayHours?.enabled) {
      const currentTime = dateInTz.toTimeString().slice(0, 5);

      // If we're before business hours, move to start time
      if (currentTime < dayHours.start) {
        const [startHour, startMin] = dayHours.start.split(':').map(Number);
        dateInTz.setHours(startHour, startMin, 0, 0);
        return new Date(dateInTz.toLocaleString('en-US', { timeZone: 'UTC' }));
      }

      // If we're within business hours, return current time
      if (currentTime >= dayHours.start && currentTime <= dayHours.end) {
        return checkDate;
      }

      // If we're after business hours, move to next day's start
    }

    // Move to next day at start of business hours
    checkDate.setDate(checkDate.getDate() + 1);
    checkDate.setHours(0, 0, 0, 0);
    iterations++;
  }

  // Fallback: return current date if we couldn't find a slot
  return currentDate;
}

/**
 * Calculates number of working days between two dates
 */
export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  settings: BusinessHoursSettings
): number {
  let workingDays = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isWorkingDay(current, settings)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

/**
 * Gets business hours for a specific date
 */
export function getBusinessHoursForDate(
  date: Date,
  settings: BusinessHoursSettings
): { enabled: boolean; start: string; end: string } | null {
  const dateInTz = new Date(
    date.toLocaleString('en-US', { timeZone: settings.timezone })
  );

  const dayName = dateInTz
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  return settings.businessHoursByDay[dayName] || null;
}

/**
 * Calculates estimated days needed for a campaign based on business hours
 */
export async function calculateCampaignEstimatedDays(
  companyId: string,
  totalContacts: number,
  dailyLimit: number,
  respectBusinessHours: boolean
): Promise<number> {
  if (!respectBusinessHours) {
    // Simple calculation if not respecting business hours
    return Math.ceil(totalContacts / dailyLimit);
  }

  const settings = await fetchCompanyBusinessHours(companyId);

  // Count working days per week
  const workingDaysPerWeek = Object.values(settings.businessHoursByDay).filter(
    (day) => day.enabled
  ).length;

  if (workingDaysPerWeek === 0) {
    // Fallback if no working days configured
    return Math.ceil(totalContacts / dailyLimit);
  }

  // Calculate total days needed
  const totalWorkDaysNeeded = Math.ceil(totalContacts / dailyLimit);

  // Convert to calendar days accounting for non-working days
  const weeksNeeded = Math.ceil(totalWorkDaysNeeded / workingDaysPerWeek);
  const calendarDays = weeksNeeded * 7;

  return Math.min(calendarDays, totalWorkDaysNeeded); // Return the more conservative estimate
}
