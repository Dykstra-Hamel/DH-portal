import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    // Verify authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [companyResult, brandResult, settingsResult] = await Promise.all([
      supabase
        .from('companies')
        .select('id, name, phone, email')
        .eq('id', id)
        .single(),
      supabase
        .from('brands')
        .select('logo_url, primary_color_hex, secondary_color_hex, font_color_hex, alternative_colors, font_primary_name, font_primary_url, font_secondary_name, font_secondary_url')
        .eq('company_id', id)
        .single(),
      supabase
        .from('company_settings')
        .select('setting_key, setting_value')
        .eq('company_id', id)
        .in('setting_key', ['quote_accent_color_preference', 'quote_terms']),
    ]);

    if (companyResult.error || !companyResult.data) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = companyResult.data;
    const brand = brandResult.data;
    const settingsMap: Record<string, string> = {};
    (settingsResult.data ?? []).forEach(s => { settingsMap[s.setting_key] = s.setting_value; });
    const accentPref = settingsMap['quote_accent_color_preference'] ?? null;
    const quoteTerms = settingsMap['quote_terms'] ?? null;

    return NextResponse.json({
      logo_url: brand?.logo_url ?? null,
      primary_color: brand?.primary_color_hex ?? null,
      secondary_color: brand?.secondary_color_hex ?? null,
      alternative_color_1: Array.isArray(brand?.alternative_colors) && brand.alternative_colors.length > 0
        ? (brand.alternative_colors[0] as { hex?: string })?.hex ?? null
        : null,
      font_color: brand?.font_color_hex ?? null,
      font_primary_name: brand?.font_primary_name ?? null,
      font_primary_url: brand?.font_primary_url ?? null,
      font_secondary_name: brand?.font_secondary_name ?? null,
      font_secondary_url: brand?.font_secondary_url ?? null,
      company_name: company.name,
      company_phone: company.phone ?? null,
      company_email: company.email ?? null,
      quote_terms: quoteTerms,
      quote_accent_color_preference: accentPref,
    });
  } catch (error) {
    console.error('Error fetching field-map branding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
