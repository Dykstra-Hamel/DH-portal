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
      .select('logo_url, icon_logo_url, primary_color_hex, secondary_color_hex')
      .eq('company_id', company.id)
      .single();

    // Get login page settings from company_settings
    const { data: settings } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value')
      .eq('company_id', company.id)
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

    // Combine all data including branding and login settings
    const responseData = {
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        description: company.description,
        email: company.email,
        phone: company.phone,
        website: company.website
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

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching company by slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}