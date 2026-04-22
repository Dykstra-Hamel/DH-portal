import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/routing/availability
// Query params: companyId, date, userId
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const date = searchParams.get('date');
    const userId = searchParams.get('userId');

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
      .from('technician_schedules')
      .select('*')
      .eq('company_id', companyId)
      .order('schedule_date', { ascending: true });

    if (date) query = query.eq('schedule_date', date);
    if (userId) query = query.eq('user_id', userId);

    const { data: availability, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }

    return NextResponse.json({ availability: availability ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/routing/availability
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
      user_id,
      schedule_type = 'availability',
      schedule_date,
      start_time,
      end_time,
      is_all_day = false,
      is_available = true,
      is_default_pattern = false,
      day_of_week,
      reason,
      notes,
    } = body;

    if (!company_id || !schedule_date) {
      return NextResponse.json(
        { error: 'company_id and schedule_date are required' },
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

    const targetUserId = user_id ?? user.id;

    const { data: record, error } = await supabase
      .from('technician_schedules')
      .insert({
        company_id,
        user_id: targetUserId,
        schedule_type,
        schedule_date,
        start_time,
        end_time,
        is_all_day,
        is_available,
        is_default_pattern,
        day_of_week,
        reason,
        notes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create availability record' }, { status: 500 });
    }

    return NextResponse.json({ availability: record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
