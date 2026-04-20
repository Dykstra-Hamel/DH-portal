import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';

type LeadRow = {
  assigned_to: string | null;
  assigned_user?: unknown;
};

type LeadWithId = { id: string };

// Attaches `is_viewed` onto each lead by querying lead_views for the given
// user. Used by the New Leads tab to drive the "unread" highlight — other
// tabs don't need it because those leads are always treated as engaged-with.
async function hydrateViewedFlags<T extends LeadWithId>(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  leads: T[]
): Promise<(T & { is_viewed: boolean })[]> {
  if (leads.length === 0) return [];

  const leadIds = leads.map(l => l.id);
  const { data: views } = await supabase
    .from('lead_views')
    .select('lead_id')
    .eq('user_id', userId)
    .in('lead_id', leadIds);

  const viewed = new Set((views ?? []).map(v => v.lead_id));
  return leads.map(l => ({ ...l, is_viewed: viewed.has(l.id) }));
}

// Attaches `assigned_user` (profile row) onto each lead using a single
// profiles lookup. `leads.assigned_to` FKs to auth.users, not profiles, so the
// embedded `profiles!leads_assigned_to_fkey(...)` join doesn't work — we join
// manually via profiles.id.
async function hydrateAssignedUsers<T extends LeadRow>(
  supabase: ReturnType<typeof createAdminClient>,
  leads: T[]
): Promise<T[]> {
  const userIds = Array.from(
    new Set(
      leads
        .map(l => l.assigned_to)
        .filter((id): id is string => !!id)
    )
  );

  if (userIds.length === 0) return leads;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url, uploaded_avatar_url')
    .in('id', userIds);

  const byId = new Map((profiles ?? []).map(p => [p.id, p]));
  return leads.map(l => ({
    ...l,
    assigned_user: l.assigned_to ? byId.get(l.assigned_to) ?? null : null,
  }));
}

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
          comments, assigned_to, created_at, updated_at,
          customer:customers(
            id, first_name, last_name, email, phone, city, state,
            customer_service_addresses(
              is_primary_address,
              service_address:service_addresses(street_address, apartment_unit, city, state, zip_code)
            )
          ),
          service_plan:service_plans(id, plan_name, requires_quote),
          quotes(
            id,
            quote_line_items(
              service_plan:service_plans(requires_quote)
            )
          )
        `)
        .eq('company_id', companyId)
        .eq('lead_status', 'new')
        .is('assigned_to', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Keep the lead if its directly-selected plan requires a quote, OR any
      // plan on any of its quotes' line items requires a quote. The latter
      // covers leads where a rep built the quote and chose the custom-quote
      // plan there rather than on the lead itself.
      const filtered = (data ?? []).filter((lead: any) => {
        if (lead.service_plan?.requires_quote === true) return true;
        const quotes = Array.isArray(lead.quotes) ? lead.quotes : [];
        return quotes.some((q: any) =>
          (q.quote_line_items ?? []).some(
            (li: any) => li.service_plan?.requires_quote === true
          )
        );
      });

      const hydrated = await hydrateAssignedUsers(supabase, filtered as any[]);
      const withViewed = await hydrateViewedFlags(
        supabase,
        authResult.user.id,
        hydrated as any[]
      );
      return NextResponse.json({ leads: withViewed });
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
          comments, assigned_to, created_at, updated_at,
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

      const hydrated = await hydrateAssignedUsers(supabase, (data ?? []) as any[]);
      return NextResponse.json({ leads: hydrated });
    }

    if (type === 'closed') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required for type=closed' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('leads')
        .select(`
          id, company_id, lead_status, lead_source, lead_type, service_type,
          comments, assigned_to, created_at, updated_at,
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

      const hydrated = await hydrateAssignedUsers(supabase, (data ?? []) as any[]);
      return NextResponse.json({ leads: hydrated });
    }

    return NextResponse.json({ error: 'Invalid type. Must be new, my, or closed' }, { status: 400 });
  } catch (err) {
    console.error('Error fetching field ops leads:', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
