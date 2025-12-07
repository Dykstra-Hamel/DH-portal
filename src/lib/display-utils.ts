/**
 * Utility functions for displaying customer and call data in the UI
 * Handles cases where data might be missing, "none", or placeholder values
 */

/**
 * Format a phone number for display
 * Handles 10-digit and 11-digit (with country code) formats
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Get display-friendly customer name
 * Returns "Unknown" if customer is null or has invalid/placeholder names
 */
export function getCustomerDisplayName(
  customer: { first_name?: string | null; last_name?: string | null } | null | undefined
): string {
  if (!customer) return 'Unknown';

  const firstName = customer.first_name?.trim() || '';
  const lastName = customer.last_name?.trim() || '';

  // Check for "none" values (case-insensitive)
  const hasValidFirstName = firstName && firstName.toLowerCase() !== 'none';
  const hasValidLastName = lastName && lastName.toLowerCase() !== 'none';

  // Check for placeholder values from webhook
  const isInboundPlaceholder = firstName === 'Inbound' && lastName === 'Caller';
  const isOutboundPlaceholder = firstName === 'Outbound' && lastName === 'Call';

  // If it's a placeholder, return "Unknown"
  if (isInboundPlaceholder || isOutboundPlaceholder) {
    return 'Unknown';
  }

  // Build name from valid parts
  if (hasValidFirstName && hasValidLastName) {
    return `${firstName} ${lastName}`;
  } else if (hasValidFirstName) {
    return firstName;
  } else if (hasValidLastName) {
    return lastName;
  }

  return 'Unknown';
}

/**
 * Get display-friendly service address
 * Filters out "none" values and returns "Unknown" if no valid components
 */
export function getServiceAddressDisplay(address: string | null | undefined): string {
  if (!address || address.trim() === '') return 'Unknown';

  // Split by comma and filter out "none" values and empty strings
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part.toLowerCase() !== 'none');

  if (parts.length === 0) return 'Unknown';

  return parts.join(', ');
}

/**
 * Get display-friendly phone number
 * Returns "Unknown" for missing/invalid phones, formatted number otherwise
 */
export function getPhoneDisplay(phone: string | null | undefined): string {
  if (!phone || phone.trim() === '') return 'Unknown';

  // Check for "none" value
  if (phone.toLowerCase() === 'none') return 'Unknown';

  return formatPhoneNumber(phone);
}
