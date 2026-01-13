import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';

// GET /api/companies/[id]/features - Get all features for a company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is admin OR if the requested company is in their user_companies
    const isAdmin = await isAuthorizedAdmin(user);

    if (!isAdmin) {
      // Check if user has access to this company
      const { data: userCompany, error: accessError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', id)
        .single();

      if (accessError || !userCompany) {
        return NextResponse.json(
          { error: 'You do not have access to this company' },
          { status: 403 }
        );
      }
    }

    // Get all features for the company
    const { data: features, error: featuresError } = await supabase
      .from('company_features')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: true });

    if (featuresError) {
      console.error('Error fetching company features:', featuresError);
      return NextResponse.json(
        { error: 'Failed to fetch company features' },
        { status: 500 }
      );
    }

    return NextResponse.json({ features: features || [] });
  } catch (error) {
    console.error('Error in GET /api/companies/[id]/features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/companies/[id]/features - Enable a feature for a company
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication and admin status
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();
    const { feature } = body;

    if (!feature) {
      return NextResponse.json(
        { error: 'Feature name is required' },
        { status: 400 }
      );
    }

    // Check if feature already exists
    const { data: existingFeature } = await supabase
      .from('company_features')
      .select('*')
      .eq('company_id', id)
      .eq('feature', feature)
      .single();

    if (existingFeature) {
      // Update enabled status if it exists
      const { data: updatedFeature, error: updateError } = await supabase
        .from('company_features')
        .update({
          enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', id)
        .eq('feature', feature)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating company feature:', updateError);
        return NextResponse.json(
          { error: 'Failed to update feature' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        feature: updatedFeature,
      });
    }

    // Create new feature record
    const { data: newFeature, error: insertError } = await supabase
      .from('company_features')
      .insert({
        company_id: id,
        feature,
        enabled: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating company feature:', insertError);
      return NextResponse.json(
        { error: 'Failed to create feature' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feature: newFeature,
    });
  } catch (error) {
    console.error('Error in POST /api/companies/[id]/features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
