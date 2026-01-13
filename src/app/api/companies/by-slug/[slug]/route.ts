import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Invalid slug parameter' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get company by slug
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, slug, description, email, phone, website')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Get brand data (logo, colors, etc.)
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select(
        'logo_url, icon_logo_url, primary_color_hex, secondary_color_hex, alternative_colors, font_primary_name, font_primary_url, font_secondary_name, font_secondary_url, primary_hero_image_url'
      )
      .eq('company_id', company.id)
      .single();

    // Get settings from company_settings
    const { data: settings } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value')
      .eq('company_id', company.id)
      .in('setting_key', [
        'login_slogan_line_1',
        'login_slogan_line_2',
        'login_slogan_line_3',
        'login_page_images',
        'privacy_policy_url',
        'terms_conditions_url',
        'quote_terms',
        'quote_thanks_content',
      ]);

    // Parse settings into usable format
    const companySettings: Record<string, any> = {};
    if (settings) {
      settings.forEach(setting => {
        if (setting.setting_key === 'login_page_images') {
          try {
            companySettings.loginImages = JSON.parse(
              setting.setting_value || '[]'
            );
          } catch {
            companySettings.loginImages = [];
          }
        } else {
          companySettings[setting.setting_key] = setting.setting_value || '';
        }
      });
    }

    // Combine all data including branding and company settings
    const responseData = {
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        description: company.description,
        email: company.email,
        phone: company.phone,
        website: company.website[0],
        privacy_policy_url: companySettings.privacy_policy_url,
        terms_conditions_url: companySettings.terms_conditions_url,
        quote_terms: companySettings.quote_terms,
        quote_thanks_content: companySettings.quote_thanks_content,
      },
      branding: {
        logo_url: brandData?.logo_url || null,
        icon_logo_url: brandData?.icon_logo_url || null,
        primary_color: brandData?.primary_color_hex || null,
        secondary_color: brandData?.secondary_color_hex || null,
        alternative_colors: brandData?.alternative_colors || null,
        font_primary_name: brandData?.font_primary_name || null,
        font_primary_url: brandData?.font_primary_url || null,
        font_secondary_name: brandData?.font_secondary_name || null,
        font_secondary_url: brandData?.font_secondary_url || null,
        primary_hero_image_url: brandData?.primary_hero_image_url || null,
        slogans: {
          line1: companySettings.login_slogan_line_1 || '',
          line2: companySettings.login_slogan_line_2 || '',
          line3: companySettings.login_slogan_line_3 || '',
        },
        login_images: companySettings.loginImages || [],
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching company by slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
