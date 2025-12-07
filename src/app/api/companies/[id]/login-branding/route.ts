import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid company ID parameter' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get company basic info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, slug')
      .eq('id', id)
      .single();

    if (companyError) {
      if (companyError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }
      throw companyError;
    }

    // Get brand data (logo, colors, etc.)
    const { data: brandData } = await supabase
      .from('brands')
      .select('logo_url, icon_logo_url, primary_color_hex, secondary_color_hex')
      .eq('company_id', id)
      .single();

    // Get login page settings from company_settings
    const { data: settings } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value')
      .eq('company_id', id)
      .in('setting_key', ['login_slogan_line_1', 'login_slogan_line_2', 'login_slogan_line_3', 'login_page_images']);

    // Parse settings into usable format
    const loginSettings: Record<string, any> = {};
    if (settings) {
      settings.forEach(setting => {
        if (setting.setting_key === 'login_page_images') {
          try {
            loginSettings.loginImages = JSON.parse(setting.setting_value || '[]');
          } catch {
            loginSettings.loginImages = [];
          }
        } else {
          loginSettings[setting.setting_key] = setting.setting_value || '';
        }
      });
    }

    // Combine all branding data
    const brandingData = {
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug
      },
      branding: {
        logo_url: brandData?.logo_url || null,
        icon_logo_url: brandData?.icon_logo_url || null,
        primary_color: brandData?.primary_color_hex || null,
        secondary_color: brandData?.secondary_color_hex || null,
        slogans: {
          line1: loginSettings.login_slogan_line_1 || '',
          line2: loginSettings.login_slogan_line_2 || '',
          line3: loginSettings.login_slogan_line_3 || ''
        },
        login_images: loginSettings.loginImages || []
      }
    };

    return NextResponse.json(brandingData);
  } catch (error) {
    console.error('Error fetching company login branding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}