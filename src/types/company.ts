// Company feature types for access control
export type CompanyFeature = 'project_management';

export interface CompanyFeatureRecord {
  id: string;
  company_id: string;
  feature: CompanyFeature;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Extended Company interface with additional fields
export interface Company {
  id: string;
  name: string;
  domain?: string;
  logo_url?: string;
  is_active: boolean;
  settings?: Record<string, any>;
  short_code?: string; // 3-4 character code for project shortcodes (e.g., "BZB")
  // ... other fields
}
