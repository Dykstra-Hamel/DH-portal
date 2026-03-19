import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const active = searchParams.get('active');

    let query = adminSupabase
      .from('system_sales_cadences')
      .select('*, steps:system_sales_cadence_steps(*)')
      .order('created_at', { ascending: false });

    if (active === 'true') {
      query = query.eq('is_active', true);
    } else if (active === 'false') {
      query = query.eq('is_active', false);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch cadences' }, { status: 500 });
    }

    // Sort steps by display_order within each cadence
    const cadences = (data || []).map((cadence) => ({
      ...cadence,
      steps: (cadence.steps || []).sort(
        (a: { display_order: number }, b: { display_order: number }) =>
          a.display_order - b.display_order
      ),
    }));

    return NextResponse.json({ data: cadences });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
      .insert({
        name: name.trim(),
        description: description || null,
        is_active: is_active !== false,
        is_featured: is_featured || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (cadenceError) {
      if (cadenceError.code === '23505') {
        return NextResponse.json({ error: 'A cadence with this name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create cadence' }, { status: 500 });
    }

    let createdSteps: unknown[] = [];
    if (steps && steps.length > 0) {
      const stepsToInsert = steps.map((step: Record<string, unknown>, index: number) => ({
        cadence_id: cadence.id,
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
        return NextResponse.json({ error: 'Failed to create cadence steps' }, { status: 500 });
      }
      createdSteps = insertedSteps || [];
    }

    return NextResponse.json({
      data: { ...cadence, steps: createdSteps },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
