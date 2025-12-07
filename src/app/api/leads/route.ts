import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Lead } from '@/types/lead';
import {
  getAuthenticatedUser,
  verifyCompanyAccess,
  getSupabaseClient
} from '@/lib/api-utils';
import { linkCustomerToServiceAddress } from '@/lib/service-addresses';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user and admin status (like company users API)
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const unassigned = searchParams.get('unassigned') === 'true';
    const includeArchived = searchParams.get('includeArchived') === 'true';

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Check user profile to determine if they're a global admin (already provided by getAuthenticatedUser)
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user.id)
    //   .single();

    // const isGlobalAdmin = profile?.role === 'admin'; // Already provided by authResult

    // Verify user has access to this company (admins have access to all companies)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this company' },
          { status: 403 }
        );
      }
    }

    // Build query - specify only needed columns to reduce data transfer
    let query = supabase
      .from('leads')
      .select(
        `
        id,
        company_id,
        customer_id,
        service_address_id,
        lead_source,
        lead_type,
        service_type,
        lead_status,
        comments,
        assigned_to,
        last_contacted_at,
        next_follow_up_at,
        estimated_value,
        priority,
        lost_reason,
        lost_stage,
        archived,
        furthest_completed_stage,
        scheduled_date,
        scheduled_time,
        created_at,
        updated_at,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (includeArchived) {
      // If including archived, only show archived leads
      query = query.eq('archived', true);
    } else {
      // Default behavior: show active leads (exclude archived)
      query = query
        .in('lead_status', ['unassigned', 'contacting', 'quoted', 'ready_to_schedule', 'scheduled', 'won', 'lost'])
        .or('archived.is.null,archived.eq.false');
    }

    // Apply additional filters
    if (status) {
      // Handle comma-separated status values (e.g., "unassigned,contacting,quoted")
      const statusArray = status.split(',').map(s => s.trim());
      if (statusArray.length === 1) {
        query = query.eq('lead_status', statusArray[0]);
      } else {
        query = query.in('lead_status', statusArray);
      }
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (unassigned) {
      // Filter for leads assigned to sales team (assigned_to IS NULL)
      query = query.is('assigned_to', null);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json([]);
    }

    // Get all unique user IDs from leads (assigned_to field)
    const userIds = new Set<string>();
    leads.forEach((lead: Lead) => {
      if (lead.assigned_to) {
        userIds.add(lead.assigned_to);
      }
    });

    // Get profiles for assigned users if there are any
    let profiles: any[] = [];
    if (userIds.size > 0) {
      // Always use admin client for profile data so all users can see avatars
      const queryClient = createAdminClient();
      const { data: profilesData, error: profilesError } = await queryClient
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', Array.from(userIds));


      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return NextResponse.json(
          { error: 'Failed to fetch user profiles' },
          { status: 500 }
        );
      }

      profiles = profilesData || [];
    }

    // Create a map of user profiles for quick lookup
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // Enhance leads with profile data
    const enhancedLeads = leads.map((lead: Lead) => ({
      ...lead,
      assigned_user: lead.assigned_to
        ? profileMap.get(lead.assigned_to) || null
        : null,
    }));

    return NextResponse.json(enhancedLeads);
  } catch (error) {
    console.error('Error in leads API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Parse request body
    const body = await request.json();
    const {
      companyId,
      customerId: providedCustomerId, // New: accept existing customer ID
      firstName,
      lastName,
      email,
      phoneNumber,
      streetAddress,
      city,
      state,
      zip,
      pestType,
      comments,
      leadSource,
      priority,
      estimatedValue,
      serviceType,
    } = body;

    // Validate required fields
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // If customerId provided but no customer fields, validate customerId only
    if (providedCustomerId && !firstName && !lastName) {
      // Using existing customer - verify it exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('id', providedCustomerId)
        .eq('company_id', companyId)
        .single();

      if (!existingCustomer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
    } else if (!providedCustomerId && (!firstName || !lastName)) {
      // Creating new customer - require name fields
      return NextResponse.json(
        { error: 'First name and last name are required when creating a new customer' },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (!userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this company' },
          { status: 403 }
        );
      }
    }

    // Determine customer ID
    let customerId: string | null = providedCustomerId || null;

    // If no customerId provided, check for existing customer by email or phone
    if (!customerId && (email || phoneNumber)) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('company_id', companyId)
        .or(email ? `email.eq.${email}` : `phone.eq.${phoneNumber}`)
        .maybeSingle();

      customerId = existingCustomer?.id || null;
    }

    // Create customer if not found and we have customer data
    if (!customerId && firstName && lastName) {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            company_id: companyId,
            first_name: firstName,
            last_name: lastName,
            email,
            phone: phoneNumber,
            address: streetAddress, // Legacy address field on customers table
            city: city,
            state: state,
            zip_code: zip,
          },
        ])
        .select('id')
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        );
      }

      customerId = newCustomer.id;
    }

    // Final validation: must have a customer ID
    if (!customerId) {
      return NextResponse.json(
        { error: 'Failed to determine customer' },
        { status: 400 }
      );
    }

    // Create service address if we have address data
    let serviceAddressId: string | null = null;

    if (streetAddress || city || state || zip) {
      const { data: newAddress, error: addressError } = await supabase
        .from('service_addresses')
        .insert([
          {
            company_id: companyId,
            street_address: streetAddress || '',
            city: city || '',
            state: state || '',
            zip_code: zip || '', // DB uses zip_code, not zip
          },
        ])
        .select('id')
        .single();

      if (addressError) {
        console.error('Error creating address:', addressError);
      } else if (newAddress?.id) {
        serviceAddressId = newAddress.id;

        // Link the service address to the customer
        try {
          await linkCustomerToServiceAddress(
            customerId,
            newAddress.id, // Use newAddress.id directly since we know it exists
            'owner', // Default relationship type
            true // Set as primary address
          );
        } catch (linkError) {
          console.error('Error linking service address to customer:', linkError);
          // Continue with lead creation even if linking fails
        }
      }
    }

    // Create lead
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert([
        {
          company_id: companyId,
          customer_id: customerId,
          service_address_id: serviceAddressId,
          lead_type: 'web_form',
          lead_source: leadSource || 'other',
          lead_status: 'unassigned',
          priority: priority || 'medium',
          pest_type: pestType,
          comments,
          service_type: serviceType,
          estimated_value: estimatedValue,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    // Auto-link service address to quote if customer has one and lead doesn't
    if (!serviceAddressId && customerId) {
      try {
        const { data: customerAddress } = await supabase
          .from('customer_service_addresses')
          .select('service_address_id')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (customerAddress?.service_address_id) {
          // Update lead with service address
          await supabase
            .from('leads')
            .update({ service_address_id: customerAddress.service_address_id })
            .eq('id', newLead.id);

          // Update auto-created quote with service address
          await supabase
            .from('quotes')
            .update({ service_address_id: customerAddress.service_address_id })
            .eq('lead_id', newLead.id);
        }
      } catch (error) {
        console.error('Error auto-linking service address:', error);
        // Don't fail the request if this fails
      }
    }

    return NextResponse.json(
      { success: true, lead: newLead },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST leads API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
