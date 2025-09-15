/**
 * Format date to YYYY-MM-DD string for API calls
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
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