import { createClient } from '@/lib/supabase/server'

interface CallData {
  leadId: string
  customerId: string
  customer: {
    first_name?: string
    last_name?: string
    email?: string
    phone: string
    address?: string
    city?: string
    state?: string
    zip_code?: string
  }
  company?: {
    name?: string
    website?: string
  }
  leadStatus?: string
  comments?: string
}

export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  
  // If it's a 10-digit number, assume it's US and add +1
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`
  }
  
  // If it's 11 digits and starts with 1, add +
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`
  }
  
  // If it already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone
  }
  
  // Otherwise, assume US and add +1
  return `+1${digitsOnly}`
}

export async function initiateLeadCall(callData: CallData): Promise<{ success: boolean; callId?: string; error?: string }> {
  try {
    if (!callData.customer.phone) {
      throw new Error('No phone number available for this customer')
    }

    const normalizedPhone = normalizePhoneNumber(callData.customer.phone)
    const isFollowUp = callData.leadStatus !== 'new'

    const payload = {
      from_number: process.env.NEXT_PUBLIC_RETELL_FROM_NUMBER || "+12074197718",
      to_number: normalizedPhone,
      agent_id: process.env.NEXT_PUBLIC_RETELL_AGENT_ID || "agent_4d2bb226685183e59b205d6fd3",
      retell_llm_dynamic_variables: {
        customer_first_name: callData.customer.first_name || 'Customer',
        customer_last_name: callData.customer.last_name || '',
        customer_name: `${callData.customer.first_name || ''} ${callData.customer.last_name || ''}`.trim() || 'Customer',
        customer_email: callData.customer.email || '',
        customer_street_address: callData.customer.address || '',
        customer_city: callData.customer.city || '',
        customer_state: callData.customer.state || '',
        customer_zip_code: callData.customer.zip_code || '',
        customer_comments: callData.comments || '',
        company_name: callData.company?.name || "Dykstra-Hamel",
        company_url: callData.company?.website || "https://www.dykstrahamel.com/",
        knowledge_base_url: "https://www.dykstrahamel.com/services",
        is_follow_up: isFollowUp ? "true" : "false",
        lead_id: callData.leadId
      }
    }

    const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RETELL_API_KEY}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Retell API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    
    return {
      success: true,
      callId: result.call_id
    }
  } catch (error) {
    console.error('Error creating phone call:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Check if auto-calling is enabled for a company
export async function shouldAutoCall(companyId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: setting, error } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'auto_call_enabled')
      .maybeSingle() // Use maybeSingle() to handle 0 rows gracefully
    
    if (error) {
      console.error('Failed to fetch auto-call setting:', error)
      return false // Default to false if we can't check settings
    }
    
    // If no setting found, default to true (enabled)
    if (!setting) {
      console.log(`No auto_call_enabled setting found for company ${companyId}, defaulting to enabled`)
      return true
    }
    
    return setting.setting_value === 'true'
  } catch (error) {
    console.error('Error checking auto-call setting:', error)
    return false // Default to false on error
  }
}

// Simple check - always allow calls (no business hours restrictions)
export async function isCallingAllowed(_companyId: string): Promise<boolean> {
  // Always allow calls - only check if auto-calling is enabled in shouldAutoCall()
  return true
}

// Main function to handle automated lead calling
export async function handleAutoLeadCall(
  leadId: string,
  companyId: string,
  customer: CallData['customer'],
  company?: CallData['company'],
  leadStatus?: string,
  comments?: string
): Promise<{ success: boolean; callId?: string; error?: string; skipped?: boolean; reason?: string }> {
  
  // Check if auto-calling is enabled
  const autoCallEnabled = await shouldAutoCall(companyId)
  if (!autoCallEnabled) {
    return {
      success: true,
      skipped: true,
      reason: 'Auto-calling is disabled for this company'
    }
  }
  
  // Check if calling is allowed (business hours, weekends, etc.)
  const callingAllowed = await isCallingAllowed(companyId)
  if (!callingAllowed) {
    return {
      success: true,
      skipped: true,
      reason: 'Calling not allowed due to business hours or weekend restrictions'
    }
  }
  
  // Validate phone number
  if (!customer.phone) {
    return {
      success: false,
      error: 'No phone number provided for customer'
    }
  }
  
  // Attempt the call
  const callData: CallData = {
    leadId,
    customerId: '', // We don't always need this for the API call
    customer,
    company,
    leadStatus,
    comments
  }
  
  return await initiateLeadCall(callData)
}