import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

interface WebformPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  company_id?: string;
  service_type?: string;
  lead_source?: string;
  lead_type?: string;
  comments?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  ip_address?: string;
  user_agent?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimated_value?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const payload: WebformPayload = await request.json();

    // Validate required fields
    if (!payload.first_name || !payload.last_name || !payload.email) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, last_name, email' },
        { status: 400 }
      );
    }

    // If company_id provided, verify it exists
    if (payload.company_id) {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('id', payload.company_id)
        .single();

      if (companyError || !company) {
        return NextResponse.json(
          { error: 'Company not found with provided company_id' },
          { status: 400 }
        );
      }
    }

    // Step 1: Look up customer by email or phone
    let existingCustomer = null;
    
    // First try email lookup
    const { data: customerByEmail, error: emailLookupError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', payload.email)
      .single();

    if (emailLookupError && emailLookupError.code !== 'PGRST116') {
      console.error('Customer email lookup error:', emailLookupError);
      return NextResponse.json(
        { error: 'Database error during customer lookup' },
        { status: 500 }
      );
    }

    if (customerByEmail) {
      existingCustomer = customerByEmail;
    } else if (payload.phone) {
      // If no email match and phone provided, try phone lookup
      const { data: customerByPhone, error: phoneLookupError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', payload.phone)
        .single();

      if (phoneLookupError && phoneLookupError.code !== 'PGRST116') {
        console.error('Customer phone lookup error:', phoneLookupError);
        return NextResponse.json(
          { error: 'Database error during customer lookup' },
          { status: 500 }
        );
      }

      if (customerByPhone) {
        existingCustomer = customerByPhone;
      }
    }

    let customer = existingCustomer;

    // Step 2: If customer doesn't exist, create new customer
    if (!existingCustomer) {
      const { data: newCustomer, error: customerCreateError } = await supabase
        .from('customers')
        .insert({
          company_id: payload.company_id || null,
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: payload.email,
          phone: payload.phone,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          zip_code: payload.zip_code,
          customer_status: 'active',
        })
        .select('*')
        .single();

      if (customerCreateError) {
        console.error('Customer creation error:', customerCreateError);
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        );
      }

      customer = newCustomer;
    }

    // Step 3: Create new lead
    const { data: newLead, error: leadCreateError } = await supabase
      .from('leads')
      .insert({
        company_id: payload.company_id || customer.company_id,
        customer_id: customer.id,
        lead_source: payload.lead_source || 'web_form',
        lead_type: payload.lead_type || 'web_form',
        service_type: payload.service_type,
        lead_status: 'new',
        comments: payload.comments,
        estimated_value: payload.estimated_value,
        priority: payload.priority || 'medium',
        utm_source: payload.utm_source,
        utm_medium: payload.utm_medium,
        utm_campaign: payload.utm_campaign,
        utm_term: payload.utm_term,
        utm_content: payload.utm_content,
        referrer_url: payload.referrer_url,
        ip_address: payload.ip_address,
        user_agent: payload.user_agent,
      })
      .select('*')
      .single();

    if (leadCreateError) {
      console.error('Lead creation error:', leadCreateError);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        customer_id: customer.id,
        lead_id: newLead.id,
        customer_existed: !!existingCustomer,
      },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}