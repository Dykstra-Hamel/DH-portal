import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/companies/[id]/sales-cadences/[cadenceId]/steps - Create a new step
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cadenceId: string }> }
) {
  try {
    const { id: companyId, cadenceId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { day_number, time_of_day, action_type, priority, description, display_order } = body;

    // Validate required fields
    if (!day_number || !time_of_day || !action_type || display_order === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify cadence belongs to company
    const { data: cadence, error: cadenceError } = await supabase
      .from('sales_cadences')
      .select('id')
      .eq('id', cadenceId)
      .eq('company_id', companyId)
      .single();

    if (cadenceError || !cadence) {
      return NextResponse.json(
        { error: 'Sales cadence not found' },
        { status: 404 }
      );
    }

    // Create the step
    const { data: newStep, error: insertError } = await supabase
      .from('sales_cadence_steps')
      .insert({
        cadence_id: cadenceId,
        day_number,
        time_of_day,
        action_type,
        priority: priority || 'medium',
        description: description || null,
        display_order,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating cadence step:', insertError);
      return NextResponse.json(
        { error: 'Failed to create cadence step' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newStep }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/companies/[id]/sales-cadences/[cadenceId]/steps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id]/sales-cadences/[cadenceId]/steps - Update a step
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cadenceId: string }> }
) {
  try {
    const { id: companyId, cadenceId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { step_id, day_number, time_of_day, action_type, priority, description, display_order } = body;

    // Validate required fields
    if (!step_id) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      );
    }

    // Verify cadence belongs to company
    const { data: cadence, error: cadenceError } = await supabase
      .from('sales_cadences')
      .select('id')
      .eq('id', cadenceId)
      .eq('company_id', companyId)
      .single();

    if (cadenceError || !cadence) {
      return NextResponse.json(
        { error: 'Sales cadence not found' },
        { status: 404 }
      );
    }

    // Update the step
    const updateData: any = {};
    if (day_number !== undefined) updateData.day_number = day_number;
    if (time_of_day) updateData.time_of_day = time_of_day;
    if (action_type) updateData.action_type = action_type;
    if (priority) updateData.priority = priority;
    if (description !== undefined) updateData.description = description || null;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data: updatedStep, error: updateError } = await supabase
      .from('sales_cadence_steps')
      .update(updateData)
      .eq('id', step_id)
      .eq('cadence_id', cadenceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating cadence step:', updateError);
      return NextResponse.json(
        { error: 'Failed to update cadence step' },
        { status: 500 }
      );
    }

    if (!updatedStep) {
      return NextResponse.json(
        { error: 'Cadence step not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedStep });
  } catch (error) {
    console.error('Error in PUT /api/companies/[id]/sales-cadences/[cadenceId]/steps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id]/sales-cadences/[cadenceId]/steps - Delete a step
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cadenceId: string }> }
) {
  try {
    const { id: companyId, cadenceId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const stepId = searchParams.get('step_id');

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      );
    }

    // Verify cadence belongs to company
    const { data: cadence, error: cadenceError } = await supabase
      .from('sales_cadences')
      .select('id')
      .eq('id', cadenceId)
      .eq('company_id', companyId)
      .single();

    if (cadenceError || !cadence) {
      return NextResponse.json(
        { error: 'Sales cadence not found' },
        { status: 404 }
      );
    }

    // Delete the step
    const { error: deleteError } = await supabase
      .from('sales_cadence_steps')
      .delete()
      .eq('id', stepId)
      .eq('cadence_id', cadenceId);

    if (deleteError) {
      console.error('Error deleting cadence step:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete cadence step' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/companies/[id]/sales-cadences/[cadenceId]/steps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
