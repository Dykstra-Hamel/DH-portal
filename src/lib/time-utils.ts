/**
 * Utility functions for time calculations and formatting
 */

/**
 * Calculate time ago from a given date string
 * Returns format like "2m ago", "45m ago", "2h ago", "3d ago"
 */
export function getTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown';

  const now = new Date();
  const past = new Date(dateString);
  
  // Handle invalid dates
  if (isNaN(past.getTime())) return 'Unknown';
  
  // Handle future dates (shouldn't happen but be safe)
  if (past > now) return 'Just now';

  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    const remainingMinutes = diffMinutes % 60;
    if (remainingMinutes > 0) {
      return `${diffHours}h ${remainingMinutes}m ago`;
    } else {
      return `${diffHours}h ago`;
    }
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks}w ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  } else {
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears}y ago`;
  }
}

/**
 * Get relative time with more detail for tooltips
 * Returns format like "2 minutes ago", "1 hour ago", "3 days ago"
 */
export function getDetailedTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown time';

  const now = new Date();
  const past = new Date(dateString);
  
  if (isNaN(past.getTime())) return 'Unknown time';
  if (past > now) return 'Just now';

  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    // For older dates, show the actual date
    return past.toLocaleDateString();
  }
}

/**
 * Check if a ticket is considered "old" (more than 24 hours)
 */
export function isOldTicket(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  const now = new Date();
  const past = new Date(dateString);
  
  if (isNaN(past.getTime())) return false;
  
  const diffMs = now.getTime() - past.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return diffHours > 24;
}

/**
 * Check if a ticket is considered "urgent" (more than 2 hours old and unassigned)
 */
export function isUrgentTicket(
  dateString: string | null | undefined, 
  assigned: boolean = false
): boolean {
  if (!dateString || assigned) return false;
  
  const now = new Date();
  const past = new Date(dateString);
  
  if (isNaN(past.getTime())) return false;
  
  const diffMs = now.getTime() - past.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return diffHours > 2;
}

/**
 * Format date for full timestamp display
 */
export function formatFullTimestamp(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleString();
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
    const isInProgress = record.call_status === 'ongoing' || 
                        record.call_status === 'in-progress';
    const hasStartNoEnd = record.start_timestamp && !record.end_timestamp;
    
    return isInProgress || hasStartNoEnd;
  });
  
  return hasLive;
}