import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params

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
      )
    }

    const supabase = createAdminClient()
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, widget_config')
      .eq('id', companyId)
      .single()

    if (error || !company) {
      console.error('Error fetching company:', error)
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
      )
    }

    // Default widget configuration if not set
    const defaultConfig = {
      branding: {
        primaryColor: '#007bff',
        companyName: company.name
      },
      headers: {
        headerText: '',
        subHeaderText: ''
      },
      ai_knowledge: `You are a professional customer service representative for ${company.name}. Provide helpful, accurate information about our services. Be conversational and friendly while gathering information to help customers.`,
      service_areas: [],
      messaging: {
        welcome: `Hi! I&apos;m here to help you with your service needs. How can I assist you today?`,
        fallback: 'Let me connect you with one of our specialists who can help you right away.'
      }
    }

    const widgetConfig = {
      ...defaultConfig,
      ...(company.widget_config || {})
    }

    // Only return safe, public configuration data
    const publicConfig = {
      companyId: company.id,
      companyName: company.name,
      branding: widgetConfig.branding,
      headers: widgetConfig.headers,
      messaging: widgetConfig.messaging,
      addressApi: widgetConfig.addressApi || { enabled: false, provider: 'geoapify', maxSuggestions: 5 },
      hasConfiguration: Boolean(company.widget_config && company.widget_config.ai_knowledge)
    }

    return NextResponse.json({
      success: true,
      config: publicConfig
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error in widget config:', error)
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
    )
  }
}