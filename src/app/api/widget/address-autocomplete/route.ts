import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// Helper function to add CORS headers
const addCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}

interface AddressAutocompleteRequest {
  query: string
  companyId: string
}

interface GeoapifyResult {
  formatted: string
  address_line1?: string
  address_line2?: string
  street?: string
  city?: string
  state?: string
  postcode?: string
  country?: string
  country_code?: string
  lat: number
  lon: number
}

interface GeoapifyResponse {
  results: GeoapifyResult[]
}

interface AddressSuggestion {
  formatted: string
  street?: string
  city?: string
  state?: string
  postcode?: string
  country?: string
  lat: number
  lon: number
}

export async function POST(request: NextRequest) {
  try {
    const { query, companyId }: AddressAutocompleteRequest = await request.json()

    // Validate input
    if (!query || !companyId) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Query and companyId are required' },
        { status: 400 }
      ))
    }

    // Minimum query length to prevent excessive API calls
    if (query.trim().length < 3) {
      return addCorsHeaders(NextResponse.json({
        success: true,
        suggestions: []
      }))
    }

    // Check if company exists and has address API enabled
    const supabase = createAdminClient()
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, widget_config')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      ))
    }

    // Check if address API is enabled for this company
    const widgetConfig = company.widget_config || {}
    const addressApiConfig = widgetConfig.addressApi || { enabled: false }

    if (!addressApiConfig.enabled) {
      // Return empty suggestions if API is disabled
      return addCorsHeaders(NextResponse.json({
        success: true,
        suggestions: []
      }))
    }

    // Get Geoapify API key
    const apiKey = process.env.GEOAPIFY_API_KEY
    if (!apiKey) {
      console.error('GEOAPIFY_API_KEY not configured')
      return addCorsHeaders(NextResponse.json(
        { error: 'Address API not configured' },
        { status: 500 }
      ))
    }

    // Call Geoapify API
    const geoapifyUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${apiKey}&limit=5&format=json`
    
    const response = await fetch(geoapifyUrl)
    
    if (!response.ok) {
      console.error('Geoapify API error:', response.status, response.statusText)
      return addCorsHeaders(NextResponse.json(
        { error: 'Address lookup service unavailable' },
        { status: 503 }
      ))
    }

    const data: GeoapifyResponse = await response.json()
    
    // Transform Geoapify results to our format
    const suggestions: AddressSuggestion[] = (data.results || []).map(result => ({
      formatted: result.formatted,
      street: result.address_line1 || result.street,
      city: result.city,
      state: result.state,
      postcode: result.postcode,
      country: result.country,
      lat: result.lat,
      lon: result.lon
    }))

    return addCorsHeaders(NextResponse.json({
      success: true,
      suggestions
    }))

  } catch (error) {
    console.error('Error in address autocomplete:', error)
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ))
  }
}