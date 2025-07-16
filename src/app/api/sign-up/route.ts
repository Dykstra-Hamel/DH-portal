import { NextRequest, NextResponse } from 'next/server'

interface ValidationError {
  field: string
  message: string
}

function validateField(field: string, value: any): ValidationError | null {
  switch (field) {
    case 'firstName':
      if (!value || typeof value !== 'string') {
        return { field, message: 'First name is required' }
      }
      const trimmedFirstName = value.trim()
      if (trimmedFirstName.length < 2) {
        return { field, message: 'First name must be at least 2 characters' }
      }
      if (trimmedFirstName.length > 25) {
        return { field, message: 'First name cannot exceed 25 characters' }
      }
      if (!/^[a-zA-Z\s'-]+$/.test(trimmedFirstName)) {
        return { field, message: 'First name can only contain letters, spaces, hyphens, and apostrophes' }
      }
      break

    case 'lastName':
      if (!value || typeof value !== 'string') {
        return { field, message: 'Last name is required' }
      }
      const trimmedLastName = value.trim()
      if (trimmedLastName.length < 2) {
        return { field, message: 'Last name must be at least 2 characters' }
      }
      if (trimmedLastName.length > 25) {
        return { field, message: 'Last name cannot exceed 25 characters' }
      }
      if (!/^[a-zA-Z\s'-]+$/.test(trimmedLastName)) {
        return { field, message: 'Last name can only contain letters, spaces, hyphens, and apostrophes' }
      }
      break

    case 'email':
      if (!value || typeof value !== 'string') {
        return { field, message: 'Email is required' }
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value.trim())) {
        return { field, message: 'Please enter a valid email address' }
      }
      break

    case 'phone':
      if (!value || typeof value !== 'string') {
        return { field, message: 'Phone number is required' }
      }
      const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '')
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(cleanPhone)) {
        return { field, message: 'Please enter a valid phone number' }
      }
      if (cleanPhone.length < 10) {
        return { field, message: 'Phone number must be at least 10 digits' }
      }
      break

    case 'message':
      if (!value || typeof value !== 'string') {
        return { field, message: 'Message is required' }
      }
      const trimmedMessage = value.trim()
      if (trimmedMessage.length < 10) {
        return { field, message: 'Message must be at least 10 characters' }
      }
      if (trimmedMessage.length > 1000) {
        return { field, message: 'Message cannot exceed 1000 characters' }
      }
      break

    default:
      return { field, message: 'Invalid field' }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, phone, message } = body

    // Validate all fields
    const fields = { firstName, lastName, email, phone, message }
    const errors: ValidationError[] = []

    Object.entries(fields).forEach(([fieldName, fieldValue]) => {
      const error = validateField(fieldName, fieldValue)
      if (error) {
        errors.push(error)
      }
    })

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errors.map(e => `${e.field}: ${e.message}`).join(', ')
        },
        { status: 400 }
      )
    }

    // Slack API call disabled
    // const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
    // if (!slackWebhookUrl) {
    //   console.error('SLACK_WEBHOOK_URL environment variable is not set')
    //   return NextResponse.json(
    //     { error: 'Configuration error' },
    //     { status: 500 }
    //   )
    // }

    // // Sanitize data before sending to Slack
    // const payload = {
    //   first_name: firstName.trim(),
    //   last_name: lastName.trim(),
    //   email: email.trim().toLowerCase(),
    //   phone: phone.trim(),
    //   message: message.trim()
    // }

    // const response = await fetch(slackWebhookUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(payload),
    // })

    // if (!response.ok) {
    //   const errorText = await response.text()
    //   console.error(`Slack webhook failed: ${response.status} - ${errorText}`)
    //   return NextResponse.json(
    //     { error: 'Failed to send message. Please try again later.' },
    //     { status: 500 }
    //   )
    // }

    return NextResponse.json({ 
      success: true,
      message: 'Form submitted successfully' 
    })
  } catch (error) {
    console.error('Error submitting to Slack:', error)
    
    // Log more details for debugging
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      webhookConfigured: process.env.SLACK_WEBHOOK_URL ? 'Set' : 'Not set'
    })
    
    // Don't expose internal errors to client
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Network error. Please check your connection and try again.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}