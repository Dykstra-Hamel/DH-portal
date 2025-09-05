import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { handleCorsPrelight, createCorsResponse, createCorsErrorResponse, validateOrigin } from '@/lib/cors';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return await handleCorsPrelight(request, 'widget');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    // Validate origin first
    const { isValid, origin, response } = await validateOrigin(request, 'widget');
    if (!isValid && response) {
      return response;
    }

    const { companyId } = await params;

    if (!companyId) {
      return createCorsErrorResponse(
        'Company ID is required',
        origin,
        'widget',
        400
      );
    }

    const supabase = createAdminClient();
    
    // Fetch company, brand, and captcha settings in parallel
    const [companyResult, brandResult, captchaSettings] = await Promise.all([
      supabase
        .from('companies')
        .select('id, name, widget_config')
        .eq('id', companyId)
        .single(),
      supabase
        .from('brands')
        .select('primary_color_hex, secondary_color_hex, logo_url, font_primary_name, font_primary_url')
        .eq('company_id', companyId)
        .single(),
      // Company settings for captcha (public-safe subset)
      supabase
        .from('company_settings')
        .select('setting_key, setting_value')
        .eq('company_id', companyId)
        .in('setting_key', [
          'captcha_provider',
          'captcha_enabled',
          'captcha_required',
        ])
    ]);

    const { data: company, error: companyError } = companyResult;
    const { data: brandData } = brandResult; // Brand data is optional

    if (companyError || !company) {
      console.error('Error fetching company:', companyError);
      return createCorsErrorResponse('Company not found', origin, 'widget', 404);
    }

    // Default color values
    const defaultColors = {
      primary: '#3b82f6',
      secondary: '#1e293b',
      background: '#ffffff',
      text: '#374151',
    };

    // Color resolution function (same as in WidgetConfig component)
    const resolveColors = (
      brandColors: { primary?: string; secondary?: string },
      overrides?: { primary?: string; secondary?: string; background?: string; text?: string }
    ) => {
      return {
        primary: overrides?.primary || brandColors.primary || defaultColors.primary,
        secondary: overrides?.secondary || brandColors.secondary || defaultColors.secondary,
        background: overrides?.background || defaultColors.background,
        text: overrides?.text || defaultColors.text,
      };
    };

    // Extract brand colors
    const brandColors = {
      primary: brandData?.primary_color_hex,
      secondary: brandData?.secondary_color_hex,
    };

    // Get widget config with defaults
    const widgetConfig = company.widget_config || {};
    
    // Resolve final colors using hierarchy: overrides → brand → default
    const resolvedColors = resolveColors(brandColors, widgetConfig.colorOverrides);

    // Default widget configuration
    const defaultConfig = {
      branding: {
        companyName: widgetConfig.branding?.companyName || company.name,
        hero_image_url: widgetConfig.branding?.hero_image_url || null,
        logo_url: brandData?.logo_url || null,
        pestSelectBackgroundImage: widgetConfig.branding?.pestSelectBackgroundImage || null,
        locationNotServedBackgroundImage: widgetConfig.branding?.locationNotServedBackgroundImage || null,
        howWeDoItInteriorImage: widgetConfig.branding?.howWeDoItInteriorImage || null,
        almostDoneBackgroundImage: widgetConfig.branding?.almostDoneBackgroundImage || null,
        detailedQuoteInteriorImage: widgetConfig.branding?.detailedQuoteInteriorImage || null,
      },
      headers: {
        headerText: widgetConfig.headers?.headerText || '',
        subHeaderText: widgetConfig.headers?.subHeaderText || '',
      },
      colors: resolvedColors,
      fonts: {
        primary: {
          name: brandData?.font_primary_name || 'Outfit',
          url: brandData?.font_primary_url || 'https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap'
        }
      },
      ai_knowledge: widgetConfig.ai_knowledge || `You are a professional customer service representative for ${company.name}. Provide helpful, accurate information about our services. Be conversational and friendly while gathering information to help customers.`,
      service_areas: widgetConfig.service_areas || [],
      messaging: {
        welcome: widgetConfig.messaging?.welcome || `Hi! I&apos;m here to help you with your service needs. How can I assist you today?`,
        fallback: widgetConfig.messaging?.fallback || 'Let me connect you with one of our specialists who can help you right away.',
      },
      submitButtonText: widgetConfig.submitButtonText || 'Get My Quote',
      welcomeButtonText: widgetConfig.welcomeButtonText || 'Start My Free Estimate',
      successMessage: widgetConfig.successMessage || 'Thank you! Your information has been submitted successfully. We will contact you soon.',
      welcomeBenefits: widgetConfig.messaging?.welcomeBenefits || [],
      stepHeadings: {
        address: widgetConfig.stepHeadings?.address || 'Yuck, {pest}! We hate those. No worries, we got you!',
        howWeDoIt: widgetConfig.stepHeadings?.howWeDoIt || 'How We Do It'
      },
    };

    // Fetch company's pest options
    const { data: pestOptions } = await supabase
      .from('company_pest_options')
      .select(`
        pest_id,
        custom_label,
        display_order,
        how_we_do_it_text,
        subspecies,
        plan_comparison_header_text,
        pest_types (
          name,
          slug,
          icon_svg,
          widget_background_image,
          pest_categories (
            name,
            slug
          )
        )
      `)
      .eq('company_id', company.id)
      .eq('is_active', true)
      .order('display_order');

    // Transform pest options for widget consumption
    const widgetPestOptions = (pestOptions || []).map((option: any) => ({
      id: option.pest_types.slug,
      label: option.custom_label || option.pest_types.name,
      value: option.pest_types.slug,
      icon: option.pest_types.icon_svg,
      widget_background_image: option.pest_types.widget_background_image,
      category: option.pest_types.pest_categories?.name || 'Unknown',
      how_we_do_it_text: option.how_we_do_it_text,
      subspecies: option.subspecies || [],
    }));

    // Fetch company's service plans count for widget config
    const { data: servicePlansData } = await supabase
      .from('service_plans')
      .select('id, is_active')
      .eq('company_id', company.id);

    const servicePlansInfo = {
      enabled: (servicePlansData || []).length > 0,
      count: (servicePlansData || []).length,
      activeCount: (servicePlansData || []).filter(plan => plan.is_active).length,
      hasCustomPlans: (servicePlansData || []).length > 0,
    };

    // Derive public captcha configuration (no secrets)
    const captchaMap = new Map((captchaSettings.data || []).map((s: any) => [s.setting_key, s.setting_value]));
    const provider = (captchaMap.get('captcha_provider') || 'turnstile') as 'turnstile';
    // Use global site key for all companies
    const siteKey = process.env.TURNSTILE_GLOBAL_SITE_KEY || null;
    const captchaEnabled = (captchaMap.get('captcha_enabled') ?? 'true') === 'true';
    const captchaRequired = (captchaMap.get('captcha_required') ?? (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true';

    // Only return safe, public configuration data
    const publicConfig = {
      companyId: company.id,
      companyName: company.name,
      branding: defaultConfig.branding,
      headers: defaultConfig.headers,
      colors: defaultConfig.colors,
      fonts: defaultConfig.fonts,
      messaging: defaultConfig.messaging,
      submitButtonText: defaultConfig.submitButtonText,
      welcomeButtonText: defaultConfig.welcomeButtonText,
      successMessage: defaultConfig.successMessage,
      welcomeBenefits: defaultConfig.welcomeBenefits,
      stepHeadings: defaultConfig.stepHeadings,
      addressApi: widgetConfig.addressApi || {
        enabled: false,
        maxSuggestions: 5,
      },
      pestOptions: widgetPestOptions,
      servicePlans: servicePlansInfo,
      hasConfiguration: Boolean(
        company.widget_config && company.widget_config.ai_knowledge
      ),
      captcha: siteKey && captchaEnabled ? {
        provider,
        siteKey,
        required: captchaRequired,
      } : null,
    };

    return createCorsResponse({
      success: true,
      config: publicConfig,
    }, origin, 'widget');
  } catch (error) {
    console.error('Error in widget config:', error);
    return createCorsErrorResponse(
      'Internal server error',
      null,
      'widget',
      500
    );
  }
}
