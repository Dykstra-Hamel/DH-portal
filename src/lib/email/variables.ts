/**
 * Email Template Variables
 *
 * Centralized definition of all variables available for email templates.
 * These variables match exactly what the workflow system provides.
 *
 * Used by:
 * - EmailTemplateEditor.tsx
 * - TemplateLibraryManager.tsx
 * - TemplateLibraryBrowser.tsx
 */

export interface EmailVariables {
  // Customer/Lead variables
  customerName: string;
  firstName: string;
  lastName: string;
  customerEmail: string;
  customerPhone: string;

  // Company variables
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  companyLogo: string;
  companySignature: string;

  // Google Reviews variables
  googleRating: string;
  googleReviewCount: string;

  // Brand colors
  brandPrimaryColor: string;
  brandSecondaryColor: string;

  // Service/Lead details
  pestType: string;
  urgency: string;
  address: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  homeSize: string;
  leadSource: string;
  createdDate: string;

  // Scheduling information
  requestedDate: string;
  requestedTime: string;

  // Selected Plan Details (when available)
  selectedPlanName: string;
  selectedPlanDescription: string;
  selectedPlanCategory: string;
  selectedPlanInitialPrice: string;
  selectedPlanNormalInitialPrice: string;
  selectedPlanRecurringPrice: string;
  selectedPlanBillingFrequency: string;
  selectedPlanFeatures: string;
  selectedPlanFaqs: string;
  selectedPlanImageUrl: string;
  selectedPlanHighlightBadge: string;
  selectedPlanTreatmentFrequency: string;
  selectedPlanDisclaimer: string;

  // Recommended Plan
  recommendedPlanName: string;

  // Session and Attribution Variables
  partialLeadSessionId: string;
  pageUrl: string;

  // Quote Variables
  quoteUrl: string;
  quoteId: string;
  quoteTotalInitialPrice: string;
  quoteTotalRecurringPrice: string;
  quoteLineItems: string;
  quotePestConcerns: string;
  quoteHomeSize: string;
  quoteYardSize: string;

  // Campaign Variables
  campaignLandingUrl: string;
  campaignId: string;
  campaignName: string;
  campaignDiscountText: string;
  campaignHeroImage: string;
  createLeadLink: string;
  // Unsubscribe Variables
  unsubscribeUrl: string;
  unsubscribeLink: string;
}

/**
 * Creates sample variable values for template previews
 * @param companyData - Real company data from database
 * @param brandData - Real brand data from database
 * @param reviewsData - Real Google reviews data from database
 * @returns Sample variables object with realistic values
 */
export function createSampleVariables(
  companyData?: {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
  } | null,
  brandData?: { logo_url?: string; signature_url?: string } | null,
  reviewsData?: { rating?: number; reviewCount?: number } | null
): EmailVariables {
  return {
    // Customer/Lead variables (always use sample data)
    customerName: 'John Smith',
    firstName: 'John',
    lastName: 'Smith',
    customerEmail: 'john.smith@email.com',
    customerPhone: '(555) 123-4567',

    // Company variables (use real data when available)
    companyName: companyData?.name || 'Your Company',
    companyEmail: companyData?.email || 'info@yourcompany.com',
    companyPhone: companyData?.phone || '(555) 000-0000',
    companyWebsite: companyData?.website || 'https://yourcompany.com',
    companyLogo: brandData?.logo_url || '/pcocentral-logo.png',
    companySignature: brandData?.signature_url || 'https://via.placeholder.com/200x80?text=Signature',

    // Google Reviews (use real data when available)
    googleRating: reviewsData?.rating ? reviewsData.rating.toString() : '4.8',
    googleReviewCount: reviewsData?.reviewCount
      ? reviewsData.reviewCount.toString()
      : '127',

    // Brand colors (sample data)
    brandPrimaryColor: '#FF5733',
    brandSecondaryColor: '#33A1FF',

    // Service/Lead details (always use sample data)
    pestType: 'ants',
    urgency: 'high',
    address: '123 Main St, Anytown ST 12345',
    streetAddress: '123 Main St',
    city: 'Anytown',
    state: 'ST',
    zipCode: '12345',
    homeSize: '2000',
    leadSource: 'website',
    createdDate: '2024-01-15',

    // Scheduling information (sample data)
    requestedDate: 'October 15, 2024',
    requestedTime: 'morning',

    // Selected Plan Details (sample data)
    selectedPlanName: 'Basic Pest Plan',
    selectedPlanDescription:
      'We&apos;ll start with a full inspection to provide you with the best possible plan, then complete your service during the same visit.',
    selectedPlanCategory: 'standard',
    selectedPlanInitialPrice: '119',
    selectedPlanNormalInitialPrice: '199',
    selectedPlanRecurringPrice: '79',
    selectedPlanBillingFrequency: 'mo',
    selectedPlanFeatures:
      '<ul><li>Covers Ants, Spiders, Wasps &amp; More</li><li>No Hassle Scheduling</li><li>FREE Re-Treatments</li><li>FREE Web Sweeps</li><li>100% Guaranteed visit</li></ul>',
    selectedPlanFaqs:
      '<div class="faq-section"><div class="faq-item"><h3 class="faq-question">What pests are covered?</h3><p class="faq-answer">This plan covers ants, spiders, wasps, and other common pests.</p></div><div class="faq-item"><h3 class="faq-question">How often do you treat?</h3><p class="faq-answer">We provide monthly treatments for continuous protection.</p></div></div>',
    selectedPlanImageUrl:
      'https://cwmckkfkcjxznkpdxgie.supabase.co/storage/v1/object/public/brand-assets/general/placeholder.jpg',
    selectedPlanHighlightBadge: 'Most Popular',
    selectedPlanTreatmentFrequency: 'monthly',
    selectedPlanDisclaimer:
      'Initial service of $119 to get started. Prices may vary slightly depending on your home layout and service requirements.',

    // Recommended Plan (sample data)
    recommendedPlanName: 'Premium Protection Plan',

    // Session and Attribution Variables (sample data)
    partialLeadSessionId: 'session_abc123def456',
    pageUrl: 'https://example.com/services/pest-control',

    // Quote Variables (sample data)
    quoteUrl: 'https://yourcompany.com/your-company/quote/abc123?token=xyz789',
    quoteId: 'quote_123456',
    quoteTotalInitialPrice: '$238',
    quoteTotalRecurringPrice: '$158',
    quoteLineItems:
      '<ul><li><strong>Defense Plan</strong> - Quarterly - $119 initial, $79/mo recurring</li><li><strong>Premium Protection</strong> - Monthly - $119 initial, $79/mo recurring</li></ul>',
    quotePestConcerns: 'Ants, Spiders, Cockroaches',
    quoteHomeSize: '2000-2500 sq ft',
    quoteYardSize: '1/4 to 1/2 Acre',

    // Campaign Variables (sample data)
    campaignLandingUrl:
      'https://your-company.pmpcentral.io/campaign/PEST26/abc123',
    campaignId: 'PEST26',
    campaignName: 'Spring Special - Save on Pest Control',
    campaignDiscountText: '15% OFF',
    campaignHeroImage:
      'https://cwmckkfkcjxznkpdxgie.supabase.co/storage/v1/object/public/brand-assets/general/placeholder.jpg',
    createLeadLink:
      'ses:tags="generateLead:true;campaignId:PEST26;customerId:abc-123;"',
    // Unsubscribe Variables (sample data - will be replaced with real token at send time)
    unsubscribeUrl:
      'https://yourcompany.com/unsubscribe?token=sample_token_abc123',
    unsubscribeLink:
      '<a href="https://yourcompany.com/unsubscribe?token=sample_token_abc123">Unsubscribe</a>',
  };
}

/**
 * Replaces template variables with sample values for preview
 * @param content - Template content with {{variable}} placeholders
 * @param variables - Sample variables object
 * @returns Content with variables replaced
 */
export function replaceVariablesWithSample(
  content: string,
  variables: EmailVariables
): string {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
}

/**
 * Extracts variable placeholders from template content
 * @param content - Template content to analyze
 * @returns Array of variable names found in content
 */
export function extractVariables(content: string): string[] {
  const variableRegex = /\{\{\s*(\w+)\s*\}\}/g;
  const variables = new Set<string>();
  let match;
  while ((match = variableRegex.exec(content)) !== null) {
    variables.add(match[1]);
  }
  return Array.from(variables);
}

/**
 * Generate SES tracking tags for lead creation from email clicks
 *
 * When a customer clicks a link with these tags, the SES webhook will detect
 * the generateLead:true flag and create a lead in 'quoted' stage.
 *
 * @param campaignId - Campaign identifier (e.g., "PEST26")
 * @param customerId - Customer UUID
 * @param leadId - Optional existing lead UUID (if updating)
 * @param companyId - Optional company UUID (used as a fallback if email log lacks company_id)
 * @returns SES tags attribute string in format: ses:tags="key:value;key:value;"
 */
export function generateLeadTrackingTags(
  campaignId: string | null,
  customerId: string | null,
  leadId?: string | null,
  companyId?: string | null
): string {
  const tags: string[] = ['generateLead:true'];

  if (campaignId) tags.push(`campaignId:${campaignId}`);
  if (customerId) tags.push(`customerId:${customerId}`);
  if (leadId) tags.push(`leadId:${leadId}`);
   if (companyId) tags.push(`companyId:${companyId}`);

  return `ses:tags="${tags.join(';')};"`;
}
