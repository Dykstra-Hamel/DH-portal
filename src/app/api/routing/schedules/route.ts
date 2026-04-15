import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/routing/schedules
// Query params: companyId, customerId, assignedTechId, status, frequency
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const customerId = searchParams.get('customerId');
    const assignedTechId = searchParams.get('assignedTechId');
    const status = searchParams.get('status');
    const frequency = searchParams.get('frequency');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (!userCompany) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let query = supabase
      .from('recurring_schedules')
      .select(`
        *,
        customers(id, first_name, last_name, email, phone),
        service_addresses(id, street_address, city, state, zip_code)
      `)
      .eq('company_id', companyId)
      .order('next_service_date', { ascending: true });

    if (customerId) query = query.eq('customer_id', customerId);
    if (assignedTechId) query = query.eq('assigned_tech_id', assignedTechId);
    if (status) query = query.eq('status', status);
    if (frequency) query = query.eq('frequency', frequency);

    const { data: schedules, error } = await query;

    if (error) {
      // Table doesn't exist yet (migration pending) — return empty list
      if ((error as any).code === '42P01') {
        return NextResponse.json({ schedules: [] });
      }
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    return NextResponse.json({ schedules: schedules ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/routing/schedules
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      company_id,
      customer_id,
      service_address_id,
      lead_id,
      service_type,
      service_description,
      estimated_duration = 30,
      assigned_tech_id,
      frequency,
      interval_weeks,
      preferred_days,
      preferred_time_window = 'anytime',
      preferred_time_start,
      preferred_time_end,
      start_date,
      next_service_date,
      end_date,
      notes,
      access_instructions,
      pestpac_service_setup_id,
    } = body;

    if (!company_id || !service_type || !frequency || !start_date) {
      return NextResponse.json(
        { error: 'company_id, service_type, frequency, and start_date are required' },
        { status: 400 }
      );
    }

    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .single();

    if (!userCompany || !['owner', 'admin', 'manager'].includes(userCompany.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: schedule, error } = await supabase
      .from('recurring_schedules')
      .insert({
        company_id,
        customer_id,
        service_address_id,
        lead_id,
        service_type,
        service_description,
        estimated_duration,
        assigned_tech_id,
        frequency,
        interval_weeks,
        preferred_days,
        preferred_time_window,
        preferred_time_start,
        preferred_time_end,
        start_date,
        next_service_date: next_service_date ?? start_date,
        end_date,
        notes,
        access_instructions,
        pestpac_service_setup_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
    }

    return NextResponse.json({ schedule }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
