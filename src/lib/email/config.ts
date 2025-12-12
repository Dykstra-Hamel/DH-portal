/**
 * Email Configuration
 *
 * Centralized configuration for email sending, including
 * unsubscribe footer settings and system email exclusions.
 */

/**
 * Email sources that should NOT include unsubscribe links
 * These are transactional/system emails required for account functionality
 */
export const SYSTEM_EMAIL_SOURCES: readonly string[] = [
  'password_reset',
  'email_verification',
  'security_alert',
  'system_notification',
] as const;

/**
 * Checks if an email source should skip the unsubscribe footer
 *
 * @param source - The email source identifier
 * @returns true if the unsubscribe footer should be skipped
 */
export function shouldSkipUnsubscribeFooter(source?: string): boolean {
  if (!source) {
    return false; // Default to including footer if no source provided
  }

  return SYSTEM_EMAIL_SOURCES.includes(source);
}

/**
 * Footer style configuration
 * All styles use inline CSS for email client compatibility
 */
export const FOOTER_STYLES = {
  backgroundColor: '#f4f4f4',
  textColor: '#666666',
  linkColor: '#0066cc',
  fontSize: '12px',
  borderColor: '#dddddd',
} as const;

/**
 * Compliance text templates
 */
export const COMPLIANCE_TEXT = {
  default: (companyName: string) =>
    `You’re receiving this email because you opted in or have done business with ${companyName}. You may unsubscribe at any time.`,
  marketing: (companyName: string) =>
    `You’re receiving this email because you opted in or have done business with ${companyName}. You may unsubscribe at any time.`,
} as const;

/**
 * Unsubscribe token configuration
 */
export const TOKEN_CONFIG = {
  /**
   * How long tokens remain valid (in days)
   */
  expirationDays: 90,

  /**
   * Cache duration for generated tokens (in minutes)
   * Prevents duplicate token generation for the same recipient
   */
  cacheDurationMinutes: 5,
} as const;
