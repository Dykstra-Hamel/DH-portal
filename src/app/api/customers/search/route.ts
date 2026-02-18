import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';

/**
 * Escape special characters that have meaning in PostgREST filter syntax
 * Characters: ( ) , . are used in filter expressions and need to be escaped
 */
function escapePostgrestFilter(value: string): string {
  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/\(/g, '\\(')   // Escape opening parenthesis
    .replace(/\)/g, '\\)')   // Escape closing parenthesis
    .replace(/,/g, '\\,')    // Escape commas
    .replace(/\./g, '\\.');  // Escape dots
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = isAuthorizedAdminSync(profile);
    
    // Get search query and company filter from URL parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const companyId = searchParams.get('companyId');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ customers: [] });
    }

    const searchTerm = query.trim();
    
    let customersQuery = supabase
      .from('customers')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        state,
        zip_code,
        company:companies!customers_company_id_fkey (
          id,
          name
        ),
        primary_service_address:customer_service_addresses!customer_service_addresses_customer_id_fkey(
          service_address:service_addresses(
            id,
            street_address,
            city,
            state,
            zip_code,
            apartment_unit,
            address_line_2,
            address_type,
            property_notes,
            home_size_range,
            yard_size_range
          )
        )
      `)
      .eq('customer_status', 'active')
      .limit(20);

    // Handle different search patterns
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);

    // Escape special PostgREST characters in search terms
    const escapedSearchTerm = escapePostgrestFilter(searchTerm);
    const escapedSearchWords = searchWords.map(word => escapePostgrestFilter(word));

    if (escapedSearchWords.length > 1) {
      // Multi-word search - likely a full name
      // Try to match combinations of words against first_name and last_name
      const nameSearchConditions = [];

      // Try different combinations for first and last name
      for (let i = 0; i < escapedSearchWords.length; i++) {
        for (let j = i + 1; j <= escapedSearchWords.length; j++) {
          const firstPart = escapedSearchWords.slice(0, j).join(' ');
          const lastPart = escapedSearchWords.slice(j).join(' ');

          if (firstPart && lastPart) {
            nameSearchConditions.push(
              `and(first_name.ilike.%${firstPart}%,last_name.ilike.%${lastPart}%)`
            );
          }
        }
      }

      // Also try each word individually against any field
      const individualWordConditions = escapedSearchWords.map(word =>
        `first_name.ilike.%${word}%,` +
        `last_name.ilike.%${word}%,` +
        `email.ilike.%${word}%,` +
        `phone.ilike.%${word}%,` +
        `address.ilike.%${word}%,` +
        `city.ilike.%${word}%,` +
        `zip_code.ilike.%${word}%`
      ).join(',');

      // Try the full search term as well
      const fullTermConditions =
        `first_name.ilike.%${escapedSearchTerm}%,` +
        `last_name.ilike.%${escapedSearchTerm}%,` +
        `email.ilike.%${escapedSearchTerm}%,` +
        `phone.ilike.%${escapedSearchTerm}%,` +
        `address.ilike.%${escapedSearchTerm}%,` +
        `city.ilike.%${escapedSearchTerm}%,` +
        `zip_code.ilike.%${escapedSearchTerm}%`;

      // Combine all conditions with OR
      const allConditions = [
        ...nameSearchConditions,
        individualWordConditions,
        fullTermConditions
      ].filter(Boolean).join(',');

      customersQuery = customersQuery.or(allConditions);
    } else {
      // Single word search - use original logic
      customersQuery = customersQuery.or(
        `first_name.ilike.%${escapedSearchTerm}%,` +
        `last_name.ilike.%${escapedSearchTerm}%,` +
        `email.ilike.%${escapedSearchTerm}%,` +
        `phone.ilike.%${escapedSearchTerm}%,` +
        `address.ilike.%${escapedSearchTerm}%,` +
        `city.ilike.%${escapedSearchTerm}%,` +
        `zip_code.ilike.%${escapedSearchTerm}%`
      );
    }

    // Filter for primary service addresses only
    customersQuery = customersQuery.eq('customer_service_addresses.is_primary_address', true);

    // Handle company filtering
    if (companyId) {
      // Filter by specific company ID (from global company selector)
      customersQuery = customersQuery.eq('company_id', companyId);
    } else if (!isGlobalAdmin) {
      // For non-admin users without specific company filter, filter by companies they have access to
      const { data: userCompanies } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (!userCompanies || userCompanies.length === 0) {
        return NextResponse.json({ customers: [] });
      }

      const companyIds = userCompanies.map(uc => uc.company_id);
      customersQuery = customersQuery.in('company_id', companyIds);
    }
    // For global admins without companyId parameter, search all companies (no additional filter)

    // Execute the search
    const { data: customers, error: searchError } = await customersQuery;

    if (searchError) {
      console.error('Customer search error:', searchError);
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      );
    }

    // Sort results by relevance (exact matches first, then partial matches)
    const sortedCustomers = (customers || []).sort((a, b) => {
      const aFullName = `${a.first_name} ${a.last_name}`.toLowerCase();
      const bFullName = `${b.first_name} ${b.last_name}`.toLowerCase();
      const queryLower = searchTerm.toLowerCase();

      // Exact name match gets highest priority
      if (aFullName === queryLower) return -1;
      if (bFullName === queryLower) return 1;

      // Name starts with query gets next priority
      if (aFullName.startsWith(queryLower) && !bFullName.startsWith(queryLower)) return -1;
      if (bFullName.startsWith(queryLower) && !aFullName.startsWith(queryLower)) return 1;

      // Email exact match
      if (a.email?.toLowerCase() === queryLower) return -1;
      if (b.email?.toLowerCase() === queryLower) return 1;

      // Phone exact match (compare without formatting)
      const aPhone = a.phone?.replace(/\D/g, '');
      const bPhone = b.phone?.replace(/\D/g, '');
      const queryPhone = searchTerm.replace(/\D/g, '');
      if (aPhone === queryPhone) return -1;
      if (bPhone === queryPhone) return 1;

      // Alphabetical by name for remaining results
      return aFullName.localeCompare(bFullName);
    });

    return NextResponse.json({
      customers: sortedCustomers
    });

  } catch (error) {
    console.error('Customer search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}