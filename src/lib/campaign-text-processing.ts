/**
 * Campaign Text Processing Utility
 *
 * Provides functions for processing campaign landing page text:
 * - Variable replacement (customer, pricing, service variables)
 * - Markdown link conversion
 * - HTML sanitization for security
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Variable context interface containing all available variables
 */
export interface VariableContext {
  customer: {
    first_name: string;
    last_name: string;
    email?: string;
    phone_number?: string;
    service_address?: {
      street_address: string;
      city: string;
      state: string;
      zip_code: string;
    } | null;
  };
  pricing: {
    displayPrice: string;
    originalPrice: string | null;
    savings: string | null;
  };
  company: {
    name: string;
  };
  branding?: {
    phoneNumber: string | null;
  };
  serviceName?: string;
  signature?: string;
  signatureClassName?: string;
}

/**
 * Process markdown links and convert to HTML anchor tags
 * Converts [text](url) to <a href="url" target="_blank" rel="noopener noreferrer">text</a>
 */
export function processMarkdownLinks(text: string): string {
  const markdownLinkPattern = /\[([^\]]+)\]\(([^\)]+)\)/g;
  return text.replace(
    markdownLinkPattern,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

/**
 * Parse pricing variables from displayPrice string
 * Example: "$44/mo" → { amount: "$44", frequency: "/mo" }
 */
function parsePricing(displayPrice: string): { amount: string; frequency: string } {
  const match = displayPrice.match(/^(\$?\d+)(\/mo|\/month|\/year)?$/);
  if (match) {
    return {
      amount: match[1].startsWith('$') ? match[1] : `$${match[1]}`,
      frequency: match[2] || '',
    };
  }
  return { amount: displayPrice, frequency: '' };
}

/**
 * Replace all variables in text with actual values from context
 * Supports both new format ({first_name}) and old format ({customer_first_name})
 */
export function replaceVariables(text: string, context: VariableContext): string {
  if (!text) return '';

  let processed = text;

  // Parse pricing data
  const pricingData = parsePricing(context.pricing.displayPrice);

  // Create variable map (supports both old and new formats)
  const variables: Record<string, string> = {
    // Customer variables (new format)
    '{first_name}': context.customer.first_name || '',
    '{last_name}': context.customer.last_name || '',
    '{email}': context.customer.email || '',
    '{phone_number}': context.customer.phone_number || '',
    '{service_address}': context.customer.service_address?.street_address || '',
    '{city}': context.customer.service_address?.city || '',
    '{state}': context.customer.service_address?.state || '',
    '{zip_code}': context.customer.service_address?.zip_code || '',

    // Customer variables (old format for backward compatibility)
    '{customer_first_name}': context.customer.first_name || '',
    '{customer_last_name}': context.customer.last_name || '',

    // Pricing variables
    '{display_price}': context.pricing.displayPrice || '',
    '{price_amount}': pricingData.amount,
    '{price_frequency}': pricingData.frequency,
    '{original_price}': context.pricing.originalPrice || '',
    '{savings}': context.pricing.savings || '',

    // Service variables
    '{company_name}': context.company.name || '',
    '{service_name}': context.serviceName || '',
    '{company_phone}': context.branding?.phoneNumber || '',
  };

  // Replace all standard variables
  Object.entries(variables).forEach(([key, value]) => {
    processed = processed.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  });

  // Handle signature separately with special styling (using scoped CSS class name)
  if (context.signature) {
    const className = context.signatureClassName || 'letterSignature';
    processed = processed.replace(
      /\{signature\}/g,
      `<span class="${className}">${context.signature}</span>`
    );
  } else {
    processed = processed.replace(/\{signature\}/g, '');
  }

  return processed;
}

/**
 * Sanitize HTML content using DOMPurify
 * Removes dangerous tags and attributes while keeping safe formatting
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'div',
      'span',
      'a',
      'strong',
      'em',
      'b',
      'i',
      'u',
      'ul',
      'ol',
      'li',
      'br',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

/**
 * Main processing function that combines all text processing steps:
 * 1. Convert markdown links to HTML
 * 2. Replace variables with actual values
 * 3. Sanitize HTML for security
 */
export function processTextWithVariables(text: string, context: VariableContext): string {
  if (!text) return '';

  // Step 1: Process markdown links
  let processed = processMarkdownLinks(text);

  // Step 2: Replace variables
  processed = replaceVariables(processed, context);

  // Step 3: Sanitize HTML
  processed = sanitizeHtml(processed);

  return processed;
}
