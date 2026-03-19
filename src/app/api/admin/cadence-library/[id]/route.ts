import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || !isAuthorizedAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: cadence, error } = await adminSupabase
      .from('system_sales_cadences')
      .select('*, steps:system_sales_cadence_steps(*)')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Cadence not found' }, { status: 404 });
    }

    const sortedCadence = {
      ...cadence,
      steps: (cadence.steps || []).sort(
        (a: { display_order: number }, b: { display_order: number }) =>
          a.display_order - b.display_order
      ),
    };

    return NextResponse.json({ data: sortedCadence });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || !isAuthorizedAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, is_active, is_featured, steps } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Cadence name is required' }, { status: 400 });
    }

    const { data: cadence, error: cadenceError } = await adminSupabase
      .from('system_sales_cadences')
      .update({
        name: name.trim(),
        description: description || null,
        is_active: is_active !== false,
        is_featured: is_featured || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (cadenceError) {
      if (cadenceError.code === '23505') {
        return NextResponse.json({ error: 'A cadence with this name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update cadence' }, { status: 500 });
    }

    // Delete old steps and insert new ones
    await adminSupabase
      .from('system_sales_cadence_steps')
      .delete()
      .eq('cadence_id', id);

    let updatedSteps: unknown[] = [];
    if (steps && steps.length > 0) {
      const stepsToInsert = steps.map((step: Record<string, unknown>, index: number) => ({
        cadence_id: id,
        day_number: null,
        time_of_day: (step.time_of_day as string) ?? 'morning',
        action_type: step.action_type,
        priority: step.priority,
        display_order: index,
        description: step.description || null,
        workflow_id: step.workflow_id || null,
      }));

      const { data: insertedSteps, error: stepsError } = await adminSupabase
        .from('system_sales_cadence_steps')
        .insert(stepsToInsert)
        .select();

      if (stepsError) {
        return NextResponse.json({ error: 'Failed to update cadence steps' }, { status: 500 });
      }
      updatedSteps = insertedSteps || [];
    }

    return NextResponse.json({ data: { ...cadence, steps: updatedSteps } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || !isAuthorizedAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Steps cascade delete via FK
    const { error } = await adminSupabase
      .from('system_sales_cadences')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete cadence' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
