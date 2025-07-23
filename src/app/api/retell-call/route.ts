import { NextRequest, NextResponse } from 'next/server'

interface RetellCallRequest {
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
  streetAddress?: string
  city?: string
  state?: string
  zipCode?: string
}

interface RetellCallPayload {
  from_number: string
  to_number: string
  override_agent_id: string
  retell_llm_dynamic_variables?: {
    customer_first_name: string
    customer_last_name: string
    customer_email: string
    customer_message: string
    customer_street_address?: string
    customer_city?: string
    customer_state?: string
    customer_zip_code?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RetellCallRequest = await request.json()
    const { firstName, lastName, email, phone, message, streetAddress, city, state, zipCode } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check for required environment variables
    const retellApiKey = process.env.RETELL_API_KEY
    const retellAgentId = process.env.RETELL_AGENT_ID
    const retellFromNumber = process.env.RETELL_FROM_NUMBER

    if (!retellApiKey) {
      console.error('RETELL_API_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!retellAgentId) {
      console.error('RETELL_AGENT_ID environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!retellFromNumber) {
      console.error('RETELL_FROM_NUMBER environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Clean phone number (remove formatting)
    const cleanPhoneNumber = phone.replace(/[\s\-\(\)\.]/g, '')
    
    // Ensure phone number starts with + if not present
    const formattedPhoneNumber = cleanPhoneNumber.startsWith('+') 
      ? cleanPhoneNumber 
      : `+1${cleanPhoneNumber}`

    // Prepare the payload for Retell API
    const payload: RetellCallPayload = {
      from_number: retellFromNumber,
      to_number: formattedPhoneNumber,
      override_agent_id: retellAgentId,
      retell_llm_dynamic_variables: {
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_email: email,
        customer_message: message,
        customer_street_address: streetAddress || '',
        customer_city: city || '',
        customer_state: state || '',
        customer_zip_code: zipCode || ''
      }
    }

    // Make the API call to Retell
    const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Retell API failed: ${response.status} - ${errorText}`)
      console.error('Request payload:', JSON.stringify(payload, null, 2))
      
      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication failed with Retell API', details: errorText },
          { status: 500 }
        )
      } else if (response.status === 400) {
        return NextResponse.json(
          { error: 'Invalid phone number or request data', details: errorText },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'Failed to initiate call. Please try again later.', details: errorText },
          { status: 500 }
        )
      }
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Call initiated successfully',
      callId: result.call_id,
      callStatus: result.call_status
    })

  } catch (error) {
    console.error('Error initiating Retell call:', error)
    
    // Log error details for debugging
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}