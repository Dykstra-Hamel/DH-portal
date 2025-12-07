import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/companies/[id]/sales-cadences/[cadenceId] - Get a single cadence with steps
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cadenceId: string }> }
) {
  try {
    const { id: companyId, cadenceId } = await params;
    const supabase = await createClient();

    const { data: cadence, error } = await supabase
      .from('sales_cadences')
      .select(`
        *,
        steps:sales_cadence_steps(*)
      `)
      .eq('id', cadenceId)
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('Error fetching sales cadence:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sales cadence' },
        { status: 500 }
      );
    }

    if (!cadence) {
      return NextResponse.json(
        { error: 'Sales cadence not found' },
        { status: 404 }
      );
    }

    // Sort steps by display_order
    const cadenceWithSortedSteps = {
      ...cadence,
      steps: (cadence.steps || []).sort((a: any, b: any) => a.display_order - b.display_order)
    };

    return NextResponse.json({ data: cadenceWithSortedSteps });
  } catch (error) {
    console.error('Error in GET /api/companies/[id]/sales-cadences/[cadenceId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id]/sales-cadences/[cadenceId] - Update a cadence
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cadenceId: string }> }
) {
  try {
    const { id: companyId, cadenceId } = await params;
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
        .eq('is_default', true)
        .neq('id', cadenceId);
    }

    // Update the cadence
    const { data: updatedCadence, error: updateError } = await supabase
      .from('sales_cadences')
      .update({
        name,
        description: description || null,
        is_active: is_active !== undefined ? is_active : true,
        is_default: is_default || false,
      })
      .eq('id', cadenceId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating sales cadence:', updateError);
      return NextResponse.json(
        { error: 'Failed to update sales cadence' },
        { status: 500 }
      );
    }

    if (!updatedCadence) {
      return NextResponse.json(
        { error: 'Sales cadence not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedCadence });
  } catch (error) {
    console.error('Error in PUT /api/companies/[id]/sales-cadences/[cadenceId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id]/sales-cadences/[cadenceId] - Delete a cadence
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cadenceId: string }> }
) {
  try {
    const { id: companyId, cadenceId } = await params;
    const supabase = await createClient();

    // Check if cadence has any active lead assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('lead_cadence_assignments')
      .select('id')
      .eq('cadence_id', cadenceId)
      .limit(1);

    if (assignmentsError) {
      console.error('Error checking cadence assignments:', assignmentsError);
      return NextResponse.json(
        { error: 'Failed to check cadence assignments' },
        { status: 500 }
      );
    }

    if (assignments && assignments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete cadence that is assigned to leads. Please unassign or archive it instead.' },
        { status: 400 }
      );
    }

    // Delete the cadence (steps will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('sales_cadences')
      .delete()
      .eq('id', cadenceId)
      .eq('company_id', companyId);

    if (deleteError) {
      console.error('Error deleting sales cadence:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete sales cadence' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/companies/[id]/sales-cadences/[cadenceId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
