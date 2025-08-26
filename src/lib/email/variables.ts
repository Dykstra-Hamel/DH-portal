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
  customerEmail: string;
  customerPhone: string;
  
  // Company variables
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  companyLogo: string;
  
  // Service/Lead details
  pestType: string;
  urgency: string;
  address: string;
  homeSize: string;
  leadSource: string;
  createdDate: string;
}

/**
 * Creates sample variable values for template previews
 * @param companyData - Real company data from database
 * @param brandData - Real brand data from database  
 * @returns Sample variables object with realistic values
 */
export function createSampleVariables(
  companyData?: { name?: string; email?: string; phone?: string; website?: string } | null,
  brandData?: { logo_url?: string } | null
): EmailVariables {
  return {
    // Customer/Lead variables (always use sample data)
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com', 
    customerPhone: '(555) 123-4567',
    
    // Company variables (use real data when available)
    companyName: companyData?.name || 'Your Company',
    companyEmail: companyData?.email || 'info@yourcompany.com',
    companyPhone: companyData?.phone || '(555) 000-0000',
    companyWebsite: companyData?.website || 'https://yourcompany.com',
    companyLogo: brandData?.logo_url || '/pcocentral-logo.png',
    
    // Service/Lead details (always use sample data)
    pestType: 'ants',
    urgency: 'high', 
    address: '123 Main St, Anytown ST 12345',
    homeSize: '2000',
    leadSource: 'website',
    createdDate: '2024-01-15',
  };
}

/**
 * Replaces template variables with sample values for preview
 * @param content - Template content with {{variable}} placeholders
 * @param variables - Sample variables object
 * @returns Content with variables replaced
 */
export function replaceVariablesWithSample(content: string, variables: EmailVariables): string {
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