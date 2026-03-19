import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// POST /api/companies/[id]/sales-cadences/import/[cadenceId]
// Copy a system cadence + steps into a company's cadences
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cadenceId: string }> }
) {
  try {
    const { id: companyId, cadenceId } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin or company user
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isAdmin = isAuthorizedAdmin(profile);

    if (!isAdmin) {
      // Check if user belongs to this company
      const { data: companyUser } = await adminSupabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (!companyUser) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Parse optional custom name from body
    let customName: string | undefined;
    try {
      const body = await request.json();
      customName = body?.custom_name;
    } catch {
      // Body is optional
    }

    // Fetch the system cadence with steps
    const { data: systemCadence, error: fetchError } = await adminSupabase
      .from('system_sales_cadences')
      .select('*, steps:system_sales_cadence_steps(*)')
      .eq('id', cadenceId)
      .eq('is_active', true)
      .single();

    if (fetchError || !systemCadence) {
      return NextResponse.json({ error: 'System cadence not found or inactive' }, { status: 404 });
    }

    // Insert the cadence into the company's sales_cadences
    const cadenceName = customName?.trim() || systemCadence.name;
    const { data: newCadence, error: insertError } = await adminSupabase
      .from('sales_cadences')
      .insert({
        company_id: companyId,
        name: cadenceName,
        description: systemCadence.description,
        is_active: true,
        is_default: false,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create company cadence' }, { status: 500 });
    }

    // Insert the steps
    const steps = systemCadence.steps || [];
    if (steps.length > 0) {
      const stepsToInsert = steps
        .sort(
          (a: { display_order: number }, b: { display_order: number }) =>
            a.display_order - b.display_order
        )
        .map((step: {
          day_number: number;
          time_of_day: string;
          action_type: string;
          priority: string;
          display_order: number;
          description: string | null;
        }, index: number) => ({
          cadence_id: newCadence.id,
          day_number: step.day_number,
          time_of_day: step.time_of_day,
          action_type: step.action_type,
          priority: step.priority,
          display_order: index,
          description: step.description,
        }));

      const { error: stepsError } = await adminSupabase
        .from('sales_cadence_steps')
        .insert(stepsToInsert);

      if (stepsError) {
        // Rollback the cadence insert
        await adminSupabase.from('sales_cadences').delete().eq('id', newCadence.id);
        return NextResponse.json({ error: 'Failed to create cadence steps' }, { status: 500 });
      }
    }

    // Record usage in cadence_library_usage
    await adminSupabase.from('cadence_library_usage').insert({
      library_cadence_id: cadenceId,
      company_id: companyId,
      company_cadence_id: newCadence.id,
    });

    // Increment usage_count on the system cadence
    await adminSupabase
      .from('system_sales_cadences')
      .update({ usage_count: (systemCadence.usage_count || 0) + 1 })
      .eq('id', cadenceId);

    return NextResponse.json({ data: newCadence }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
