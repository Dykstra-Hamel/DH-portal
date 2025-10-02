import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/companies/[id]/sales-cadences - Get all cadences for a company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();

    // Get cadences with their steps
    const { data: cadences, error: cadencesError } = await supabase
      .from('sales_cadences')
      .select(`
        *,
        steps:sales_cadence_steps(*)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (cadencesError) {
      console.error('Error fetching sales cadences:', cadencesError);
      return NextResponse.json(
        { error: 'Failed to fetch sales cadences' },
        { status: 500 }
      );
    }

    // Sort steps by display_order for each cadence
    const cadencesWithSortedSteps = cadences?.map(cadence => ({
      ...cadence,
      steps: (cadence.steps || []).sort((a: any, b: any) => a.display_order - b.display_order)
    }));

    return NextResponse.json({ data: cadencesWithSortedSteps || [] });
  } catch (error) {
    console.error('Error in GET /api/companies/[id]/sales-cadences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/companies/[id]/sales-cadences - Create a new cadence
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { name, description, is_active, is_default } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Cadence name is required' },
        { status: 400 }
      );
    }

    // If this is set as default, unset any existing default cadences
    if (is_default) {
      await supabase
        .from('sales_cadences')
        .update({ is_default: false })
        .eq('company_id', companyId)
        .eq('is_default', true);
    }

    // Create the new cadence
    const { data: newCadence, error: insertError } = await supabase
      .from('sales_cadences')
      .insert({
        company_id: companyId,
        name,
        description: description || null,
        is_active: is_active !== undefined ? is_active : true,
        is_default: is_default || false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating sales cadence:', insertError);
      return NextResponse.json(
        { error: 'Failed to create sales cadence' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newCadence }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/companies/[id]/sales-cadences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
