import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  verifyCompanyAccess,
} from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';

// GET: Fetch pest pressure summary for a company + pest slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    const accessResult = await verifyCompanyAccess(
      supabase,
      user.id,
      companyId,
      isGlobalAdmin
    );
    if (accessResult instanceof NextResponse) {
      return accessResult;
    }

    const { searchParams } = new URL(request.url);
    const pestSlug = searchParams.get('pestSlug');

    if (!pestSlug) {
      return NextResponse.json(
        { error: 'pestSlug query parameter is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Fetch pest type details
    const { data: pestType, error: pestTypeError } = await adminClient
      .from('pest_types')
      .select('id, name, slug, description')
      .eq('slug', pestSlug)
      .single();

    if (pestTypeError || !pestType) {
      return NextResponse.json(
        { error: 'Pest type not found' },
        { status: 404 }
      );
    }

    // Count pest pressure data points for this company + pest
    const { count, error: countError } = await adminClient
      .from('pest_pressure_data_points')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('pest_type', pestSlug)
      .in('source_type', ['call', 'form', 'manual']);

    if (countError) {
      console.error('Error counting pest pressure data points:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch pest pressure data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        pest_slug: pestSlug,
        pest_name: pestType.name,
        description: pestType.description,
        observation_count: count ?? 0,
      },
    });
  } catch (error) {
    console.error('Error in pest-summary GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
