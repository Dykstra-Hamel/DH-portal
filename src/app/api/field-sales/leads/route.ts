import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedUser();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const userId = searchParams.get('userId');
  const type = searchParams.get('type') as 'new' | 'my' | 'closed' | null;

  if (!companyId || !type) {
    return NextResponse.json({ error: 'companyId and type are required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    if (type === 'new') {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id, company_id, lead_status, lead_source, lead_type, service_type,
          assigned_to, created_at, updated_at,
          customer:customers(
            id, first_name, last_name, email, phone, city, state,
            customer_service_addresses(
              is_primary_address,
              service_address:service_addresses(street_address, apartment_unit, city, state, zip_code)
            )
          ),
          service_plan:service_plans(id, plan_name, requires_quote)
        `)
        .eq('company_id', companyId)
        .eq('lead_status', 'new')
        .is('assigned_to', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter to only leads where service_plan requires_quote = true
      const filtered = (data ?? []).filter(
        (lead: any) => lead.service_plan?.requires_quote === true
      );

      return NextResponse.json({ leads: filtered });
    }

    if (type === 'my') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required for type=my' }, { status: 400 });
      }

      const [companyRoleResult, deptResult] = await Promise.all([
        supabase
          .from('user_companies')
          .select('role')
          .eq('user_id', authResult.user.id)
          .eq('company_id', companyId)
          .maybeSingle(),
        supabase
          .from('user_departments')
          .select('department')
          .eq('user_id', authResult.user.id)
          .eq('company_id', companyId)
          .eq('department', 'scheduling')
          .maybeSingle(),
      ]);

      const isCompanyAdmin = companyRoleResult.data
        ? ['admin', 'manager', 'owner'].includes(companyRoleResult.data.role)
        : false;

      const hasSchedulingDept = !!deptResult.data;
      const canSeeScheduling = authResult.isGlobalAdmin || isCompanyAdmin || hasSchedulingDept;

      let leadsQuery = supabase
        .from('leads')
        .select(`
          id, company_id, lead_status, lead_source, lead_type, service_type,
          assigned_to, created_at, updated_at,
          customer:customers(
            id, first_name, last_name, email, phone, city, state,
            customer_service_addresses(
              is_primary_address,
              service_address:service_addresses(street_address, apartment_unit, city, state, zip_code)
            )
          ),
          service_plan:service_plans(id, plan_name, requires_quote)
        `)
        .eq('company_id', companyId)
        .eq('assigned_to', userId)
        .not('lead_status', 'in', '("won","lost","closed")');

      if (!canSeeScheduling) {
        leadsQuery = leadsQuery.neq('lead_status', 'scheduling');
      }

      const { data, error } = await leadsQuery.order('created_at', { ascending: true });

      if (error) throw error;

      return NextResponse.json({ leads: data ?? [] });
    }

    if (type === 'closed') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required for type=closed' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('leads')
        .select(`
          id, company_id, lead_status, lead_source, lead_type, service_type,
          assigned_to, created_at, updated_at,
          customer:customers(
            id, first_name, last_name, email, phone, city, state,
            customer_service_addresses(
              is_primary_address,
              service_address:service_addresses(street_address, apartment_unit, city, state, zip_code)
            )
          ),
          service_plan:service_plans(id, plan_name, requires_quote)
        `)
        .eq('company_id', companyId)
        .eq('assigned_to', userId)
        .in('lead_status', ['won', 'lost', 'closed'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ leads: data ?? [] });
    }

    return NextResponse.json({ error: 'Invalid type. Must be new, my, or closed' }, { status: 400 });
  } catch (err) {
    console.error('Error fetching field ops leads:', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
