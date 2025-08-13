import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is global admin
    const isAdmin = await isAuthorizedAdmin(user);

    if (isAdmin) {
      // Global admin: return all companies
      const { data: allCompanies, error: allCompaniesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (allCompaniesError) {
        console.error('Error fetching all companies:', allCompaniesError);
        return NextResponse.json(
          { error: 'Unable to retrieve data' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        isAdmin: true,
        companies: allCompanies || []
      });
    } else {
      // Regular user: return only their associated companies
      const { data: userCompanies, error: companiesError } = await supabase
        .from('user_companies')
        .select(`
          company_id,
          companies (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

      if (companiesError) {
        console.error('Error fetching user companies:', companiesError);
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Transform the data to match expected format
      const companies = userCompanies?.map(uc => ({
        id: (uc.companies as any)?.id || uc.company_id,
        name: (uc.companies as any)?.name || 'Unknown Company'
      })).filter(company => company.id) || [];

      return NextResponse.json({
        isAdmin: false,
        companies: companies
      });
    }
  } catch (error) {
    console.error('Error in user-companies API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}