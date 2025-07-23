import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    const supabase = createAdminClient();
    
    // Fetch company and brand data in parallel
    const [companyResult, brandResult] = await Promise.all([
      supabase
        .from('companies')
        .select('id, name, widget_config')
        .eq('id', companyId)
        .single(),
      supabase
        .from('brands')
        .select('primary_color_hex, secondary_color_hex')
        .eq('company_id', companyId)
        .single()
    ]);

    const { data: company, error: companyError } = companyResult;
    const { data: brandData } = brandResult; // Brand data is optional

    if (companyError || !company) {
      console.error('Error fetching company:', companyError);
      return NextResponse.json(
        { error: 'Company not found' },
        {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
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
      },
      headers: {
        headerText: widgetConfig.headers?.headerText || '',
        subHeaderText: widgetConfig.headers?.subHeaderText || '',
      },
      colors: resolvedColors,
      ai_knowledge: widgetConfig.ai_knowledge || `You are a professional customer service representative for ${company.name}. Provide helpful, accurate information about our services. Be conversational and friendly while gathering information to help customers.`,
      service_areas: widgetConfig.service_areas || [],
      messaging: {
        welcome: widgetConfig.messaging?.welcome || `Hi! I&apos;m here to help you with your service needs. How can I assist you today?`,
        fallback: widgetConfig.messaging?.fallback || 'Let me connect you with one of our specialists who can help you right away.',
      },
      submitButtonText: widgetConfig.submitButtonText || 'Get My Quote',
      successMessage: widgetConfig.successMessage || 'Thank you! Your information has been submitted successfully. We will contact you soon.',
    };

    // Only return safe, public configuration data
    const publicConfig = {
      companyId: company.id,
      companyName: company.name,
      branding: defaultConfig.branding,
      headers: defaultConfig.headers,
      colors: defaultConfig.colors,
      messaging: defaultConfig.messaging,
      submitButtonText: defaultConfig.submitButtonText,
      successMessage: defaultConfig.successMessage,
      addressApi: widgetConfig.addressApi || {
        enabled: false,
        maxSuggestions: 5,
      },
      hasConfiguration: Boolean(
        company.widget_config && company.widget_config.ai_knowledge
      ),
    };

    return NextResponse.json(
      {
        success: true,
        config: publicConfig,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Error in widget config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}
