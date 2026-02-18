import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { CompanyFeature } from '@/types/company';

// GET /api/admin/company-features - Get overview of all companies and their features
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin status
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get all companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name', { ascending: true });

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      );
    }

    // Get all company features
    const { data: features, error: featuresError } = await supabase
      .from('company_features')
      .select('company_id, feature, enabled')
      .eq('enabled', true);

    if (featuresError) {
      console.error('Error fetching company features:', featuresError);
      return NextResponse.json(
        { error: 'Failed to fetch company features' },
        { status: 500 }
      );
    }

    // Map features to companies
    const companiesWithFeatures = (companies || []).map(company => {
      const companyFeatures = (features || [])
        .filter(f => f.company_id === company.id)
        .map(f => f.feature as CompanyFeature);

      return {
        id: company.id,
        name: company.name,
        features: companyFeatures,
      };
    });

    return NextResponse.json({
      companies: companiesWithFeatures,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/company-features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
