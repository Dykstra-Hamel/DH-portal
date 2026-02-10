import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/admin/monthly-services/[id]/budgets - Update budget for a specific month
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { budget_type, year, month, budgeted_amount, actual_spend } = body;

    // Validate required fields
    if (!budget_type || !year || !month) {
      return NextResponse.json(
        { error: 'budget_type, year, and month are required' },
        { status: 400 }
      );
    }

    if (!['google_ads', 'social_media', 'lsa'].includes(budget_type)) {
      return NextResponse.json(
        { error: 'Invalid budget_type' },
        { status: 400 }
      );
    }

    // Check if budget record exists
    const { data: existing } = await supabase
      .from('monthly_service_budgets')
      .select('id')
      .eq('monthly_service_id', id)
      .eq('budget_type', budget_type)
      .eq('year', year)
      .eq('month', month)
      .single();

    const updateData: any = {
      updated_by: user.id,
    };

    if (budgeted_amount !== undefined) {
      updateData.budgeted_amount = budgeted_amount;
    }

    if (actual_spend !== undefined) {
      updateData.actual_spend = actual_spend;
    }

    if (existing) {
      // Update existing budget
      const { data: budget, error: updateError } = await supabase
        .from('monthly_service_budgets')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating budget:', updateError);
        return NextResponse.json(
          { error: 'Failed to update budget' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, budget });
    } else {
      // Create new budget record
      if (budgeted_amount === undefined) {
        return NextResponse.json(
          { error: 'budgeted_amount is required for new budget' },
          { status: 400 }
        );
      }

      const { data: budget, error: createError } = await supabase
        .from('monthly_service_budgets')
        .insert({
          monthly_service_id: id,
          budget_type,
          year,
          month,
          budgeted_amount,
          actual_spend: actual_spend || null,
          updated_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating budget:', createError);
        return NextResponse.json(
          { error: 'Failed to create budget' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, budget }, { status: 201 });
    }
  } catch (error) {
    console.error('Error in PATCH /api/admin/monthly-services/[id]/budgets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/monthly-services/[id]/budgets - Delete budget for a specific month
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const budget_type = searchParams.get('budget_type');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!budget_type || !year || !month) {
      return NextResponse.json(
        { error: 'budget_type, year, and month query params are required' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('monthly_service_budgets')
      .delete()
      .eq('monthly_service_id', id)
      .eq('budget_type', budget_type)
      .eq('year', parseInt(year))
      .eq('month', parseInt(month));

    if (deleteError) {
      console.error('Error deleting budget:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete budget' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/monthly-services/[id]/budgets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
