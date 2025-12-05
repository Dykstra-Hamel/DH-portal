import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOrFindServiceAddress, linkCustomerToServiceAddress } from '@/lib/service-addresses';
import { geocodeCustomerAddress } from '@/lib/geocoding';

/**
 * Helper function to get customer counts for all tabs
 */
async function getCustomerTabCounts(
  companyId: string,
  supabase: any
): Promise<{ all: number; active: number; inactive: number; archived: number }> {
  // Use parallel queries to get all counts at once
  const [allCount, activeCount, inactiveCount, archivedCount] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('customer_status', 'active'),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('customer_status', 'inactive'),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('customer_status', 'archived'),
  ]);

  return {
    all: allCount.count || 0,
    active: activeCount.count || 0,
    inactive: inactiveCount.count || 0,
    archived: archivedCount.count || 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startsWith = searchParams.get('startsWith');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Check user profile to determine if they're a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

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

    // Build query with company join and lead data
    let query = supabase
      .from('customers')
      .select(
        `
        *,
        company:companies(
          id,
          name
        ),
        leads(
          id,
          lead_status,
          estimated_value
        ),
        tickets:tickets!tickets_customer_id_fkey(
          id,
          status
        ),
        support_cases:support_cases!support_cases_customer_id_fkey(
          id
        )
      `
      )
      .eq('company_id', companyId);

    // Apply filters
    if (status) {
      query = query.eq('customer_status', status);
    }
    if (search) {
      // Search across name, email, and phone fields
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }
    if (startsWith) {
      // Filter by first letter of last name
      query = query.ilike('last_name', `${startsWith}%`);
    }

    // Apply sorting - validate sortBy field exists on customers table
    const validSortFields = [
      'created_at', 'updated_at', 'first_name', 'last_name', 
      'email', 'phone', 'city', 'state', 'customer_status'
    ];
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';
    query = query.order(safeSortBy, { ascending });

    const { data: customers, error } = await query;

    if (error) {
      console.error('Error fetching customers with details:', {
        error,
        sortBy: safeSortBy,
        sortOrder,
        companyId,
        status,
        search
      });
      return NextResponse.json(
        { error: 'Failed to fetch customers', details: error.message },
        { status: 500 }
      );
    }

    // Get tab counts for all customer statuses
    const counts = await getCustomerTabCounts(companyId, supabase);

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        customers: [],
        counts
      });
    }

    // Calculate lead statistics per customer with better performance
    const enhancedCustomers = customers.map(customer => {
      const leads = customer.leads || [];
      const tickets = customer.tickets || [];
      const supportCases = customer.support_cases || [];

      // Filter tickets to only count "new" status
      const newTickets = tickets.filter((t: any) => t.status === 'new');

      const leadCounts = {
        total: leads.length,
        new: leads.filter((l: any) => l.lead_status === 'new').length,
        in_process: leads.filter((l: any) => l.lead_status === 'in_process').length,
        quoted: leads.filter((l: any) => l.lead_status === 'quoted').length,
        scheduling: leads.filter((l: any) => l.lead_status === 'scheduling').length,
        won: leads.filter((l: any) => l.lead_status === 'won').length,
        lost: leads.filter((l: any) => l.lead_status === 'lost').length,
      };

      // Calculate active leads (unassigned, contacting, quoted)
      const activeLeads = leadCounts.unassigned + leadCounts.contacting + leadCounts.quoted;

      // Calculate total estimated value
      const totalEstimatedValue = leads.reduce(
        (sum: number, lead: any) => sum + (lead.estimated_value || 0),
        0
      );

      // Remove arrays from the response to avoid sending unnecessary data
      const { leads: _, tickets: __, support_cases: ___, ...customerWithoutRelations } = customer;

      return {
        ...customerWithoutRelations,
        lead_counts: leadCounts,
        active_leads: activeLeads,
        total_leads: leadCounts.total,
        total_tickets: newTickets.length,
        total_support_cases: supportCases.length,
        total_estimated_value: totalEstimatedValue,
      };
    });

    return NextResponse.json({
      customers: enhancedCustomers,
      counts
    });
  } catch (error) {
    console.error('Error in customers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerData = await request.json();
    const { company_id, ...customerFields } = customerData;

    if (!company_id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Check user profile to determine if they're a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    // Verify user has access to this company (admins have access to all companies)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Unauthorized access to company' },
          { status: 403 }
        );
      }
    }

    // Insert the new customer
    const { data: customer, error: insertError } = await supabase
      .from('customers')
      .insert([{
        ...customerFields,
        company_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating customer:', insertError);
      return NextResponse.json(
        { error: 'Failed to create customer', details: insertError.message },
        { status: 500 }
      );
    }

    // If any address data is provided, create a primary service address
    const hasAddressData =
      customerFields.address ||
      customerFields.city ||
      customerFields.state ||
      customerFields.zip_code;

    if (hasAddressData && customer?.id) {
      try {
        // Attempt to geocode the address if we have at least city + state
        let latitude = customerFields.latitude;
        let longitude = customerFields.longitude;
        let hasStreetView = false;

        if (customerFields.city && customerFields.state) {
          const geocodeResult = await geocodeCustomerAddress({
            street: customerFields.address,
            city: customerFields.city,
            state: customerFields.state,
            zip: customerFields.zip_code,
          });

          if (geocodeResult.success && geocodeResult.coordinates) {
            latitude = geocodeResult.coordinates.lat;
            longitude = geocodeResult.coordinates.lng;
            hasStreetView = geocodeResult.coordinates.hasStreetView || false;
            console.log(`Geocoded address for customer ${customer.id}: ${latitude}, ${longitude}`);
          } else {
            console.warn(`Geocoding failed for customer ${customer.id}:`, geocodeResult.error);
          }
        }

        // Build service address data from customer fields with geocoded coordinates
        const serviceAddressData = {
          street_address: customerFields.address || '',
          city: customerFields.city || '',
          state: customerFields.state || '',
          zip_code: customerFields.zip_code || '',
          latitude,
          longitude,
          hasStreetView,
          address_type: 'residential' as const,
        };

        // Create service address with whatever data we have
        // (createOrFindServiceAddress will handle validation internally)
        const serviceAddressResult = await createOrFindServiceAddress(
          company_id,
          serviceAddressData
        );

        if (serviceAddressResult.success && serviceAddressResult.serviceAddressId) {
          // Link it as the customer's primary service address
          await linkCustomerToServiceAddress(
            customer.id,
            serviceAddressResult.serviceAddressId,
            'owner',
            true // isPrimary
          );

          console.log(`Created/linked primary service address for customer ${customer.id}`);
        } else {
          console.warn('Failed to create service address:', serviceAddressResult.error);
        }
      } catch (addressError) {
        // Log but don't fail the customer creation if address creation fails
        console.error('Error creating service address for new customer:', addressError);
      }
    }

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error in POST customers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
