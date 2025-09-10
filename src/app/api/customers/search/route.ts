import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';

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
        )
      `)
      .eq('customer_status', 'active')
      .limit(20);

    // Handle different search patterns
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
    
    if (searchWords.length > 1) {
      // Multi-word search - likely a full name
      // Try to match combinations of words against first_name and last_name
      const nameSearchConditions = [];
      
      // Try different combinations for first and last name
      for (let i = 0; i < searchWords.length; i++) {
        for (let j = i + 1; j <= searchWords.length; j++) {
          const firstPart = searchWords.slice(0, j).join(' ');
          const lastPart = searchWords.slice(j).join(' ');
          
          if (firstPart && lastPart) {
            nameSearchConditions.push(
              `and(first_name.ilike.%${firstPart}%,last_name.ilike.%${lastPart}%)`
            );
          }
        }
      }
      
      // Also try each word individually against any field
      const individualWordConditions = searchWords.map(word => 
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
        `first_name.ilike.%${searchTerm}%,` +
        `last_name.ilike.%${searchTerm}%,` +
        `email.ilike.%${searchTerm}%,` +
        `phone.ilike.%${searchTerm}%,` +
        `address.ilike.%${searchTerm}%,` +
        `city.ilike.%${searchTerm}%,` +
        `zip_code.ilike.%${searchTerm}%`;
      
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
        `first_name.ilike.%${searchTerm}%,` +
        `last_name.ilike.%${searchTerm}%,` +
        `email.ilike.%${searchTerm}%,` +
        `phone.ilike.%${searchTerm}%,` +
        `address.ilike.%${searchTerm}%,` +
        `city.ilike.%${searchTerm}%,` +
        `zip_code.ilike.%${searchTerm}%`
      );
    }

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