export interface ColorInfo {
  hex: string;
  cmyk: string;
  pantone: string;
  name?: string;
}

export interface LogoInfo {
  name: string;
  url: string;
  description?: string;
}

export interface BrandData {
  id?: string;
  company_id: string;
  brand_guidelines?: string;
  brand_strategy?: string;
  personality?: string;
  logo_url?: string;
  logo_description?: string;
  icon_logo_url?: string;
  icon_logo_description?: string;
  alternate_logos?: LogoInfo[];
  primary_color_hex?: string;
  primary_color_cmyk?: string;
  primary_color_pantone?: string;
  secondary_color_hex?: string;
  secondary_color_cmyk?: string;
  secondary_color_pantone?: string;
  alternative_colors?: ColorInfo[];
  font_primary_name?: string;
  font_primary_example?: string;
  font_primary_url?: string;
  font_primary_google_url?: string;
  font_secondary_name?: string;
  font_secondary_example?: string;
  font_secondary_url?: string;
  font_secondary_google_url?: string;
  font_tertiary_name?: string;
  font_tertiary_example?: string;
  font_tertiary_url?: string;
  font_tertiary_google_url?: string;
  photography_description?: string;
  photography_images?: string[];
  photography_google_drive_link?: string;
  signature_url?: string;
  signature_description?: string;
  created_at?: string;
  updated_at?: string;
}