import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api-utils';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const now = new Date();
    const todayIso = toIsoDate(now);
    const weekStartIso = toIsoDate(startOfWeek(now));
    const monthStartIso = toIsoDate(startOfMonth(now));
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysAgoIso = toIsoDate(sevenDaysAgo);

    // ── Inspector / Field Map metrics ────────────────────────────────────
    // Count completed route stops by joining routes on assigned_to = user.
    const { data: routeIdsRows } = await supabase
      .from('routes')
      .select('id, name, route_date, status, actual_start_time, actual_end_time')
      .eq('company_id', companyId)
      .eq('assigned_to', user.id)
      .order('route_date', { ascending: false })
      .limit(500);

    const routeIds = (routeIdsRows ?? []).map(r => r.id);

    let stopsTotal = 0;
    let stopsToday = 0;
    let stopsThisWeek = 0;
    let stopsThisMonth = 0;
    let referredToSales = 0;
    const stopsByDay: Record<string, number> = {};
    let recentStops: Array<{
      id: string;
      clientName: string;
      address: string;
      serviceType: string | null;
      completedAt: string | null;
    }> = [];
    let completedRoutesList: Array<{
      id: string;
      name: string | null;
      routeDate: string;
      stopsCompleted: number;
      stopsTotal: number;
      referredCount: number;
      durationMinutes: number | null;
    }> = [];

    if (routeIds.length > 0) {
      const { data: stopsData } = await supabase
        .from('route_stops')
        .select(
          `
          id,
          route_id,
          status,
          service_type,
          scheduled_arrival,
          actual_arrival,
          actual_departure,
          referred_to_sales,
          address_display,
          customers ( first_name, last_name ),
          service_addresses ( street_address, city, state, zip_code )
        `
        )
        .in('route_id', routeIds);

      const stops = stopsData ?? [];

      const completed = stops.filter(s => s.status === 'completed');
      stopsTotal = completed.length;
      referredToSales = stops.filter(s => s.referred_to_sales).length;

      const routesById = new Map(
        (routeIdsRows ?? []).map(r => [r.id, r.route_date])
      );

      const perRouteTotals = new Map<
        string,
        { completed: number; total: number; referred: number }
      >();
      for (const s of stops) {
        const rid = s.route_id as string;
        const entry = perRouteTotals.get(rid) ?? {
          completed: 0,
          total: 0,
          referred: 0,
        };
        entry.total += 1;
        if (s.status === 'completed') entry.completed += 1;
        if (s.referred_to_sales) entry.referred += 1;
        perRouteTotals.set(rid, entry);
      }

      completedRoutesList = (routeIdsRows ?? [])
        .filter(r => r.status === 'completed')
        .slice(0, 10)
        .map(r => {
          const totals = perRouteTotals.get(r.id) ?? {
            completed: 0,
            total: 0,
            referred: 0,
          };
          let durationMinutes: number | null = null;
          if (r.actual_start_time && r.actual_end_time) {
            const start = new Date(r.actual_start_time).getTime();
            const end = new Date(r.actual_end_time).getTime();
            if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
              durationMinutes = Math.round((end - start) / 60000);
            }
          }
          return {
            id: r.id as string,
            name: (r.name as string | null) ?? null,
            routeDate: r.route_date as string,
            stopsCompleted: totals.completed,
            stopsTotal: totals.total,
            referredCount: totals.referred,
            durationMinutes,
          };
        });

      for (const stop of completed) {
        const routeDate: string | undefined = routesById.get(stop.route_id);
        const when =
          (stop.actual_departure as string | null) ||
          (stop.actual_arrival as string | null) ||
          (routeDate ? `${routeDate}T00:00:00.000Z` : null);

        if (!when) continue;
        const day = when.slice(0, 10);

        if (day === todayIso) stopsToday += 1;
        if (day >= weekStartIso) stopsThisWeek += 1;
        if (day >= monthStartIso) stopsThisMonth += 1;

        if (day >= sevenDaysAgoIso) {
          stopsByDay[day] = (stopsByDay[day] ?? 0) + 1;
        }
      }

      recentStops = completed
        .map(stop => {
          const customer = Array.isArray(stop.customers)
            ? stop.customers[0]
            : stop.customers;
          const addr = Array.isArray(stop.service_addresses)
            ? stop.service_addresses[0]
            : stop.service_addresses;
          const clientName =
            [customer?.first_name, customer?.last_name]
              .filter(Boolean)
              .join(' ') || 'Unknown';
          const address =
            [addr?.street_address, addr?.city, addr?.state]
              .filter(Boolean)
              .join(', ') ||
            (stop.address_display as string | null) ||
            '';
          const routeDate: string | undefined = routesById.get(stop.route_id);
          const completedAt =
            (stop.actual_departure as string | null) ||
            (stop.actual_arrival as string | null) ||
            (routeDate ? `${routeDate}T00:00:00.000Z` : null);
          return {
            id: stop.id as string,
            clientName,
            address,
            serviceType: (stop.service_type as string | null) ?? null,
            completedAt,
          };
        })
        .sort((a, b) => {
          if (!a.completedAt) return 1;
          if (!b.completedAt) return -1;
          return b.completedAt.localeCompare(a.completedAt);
        })
        .slice(0, 8);
    }

    // Build 7-day sparkline array (oldest → newest)
    const sparkline: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const iso = toIsoDate(d);
      sparkline.push({ date: iso, count: stopsByDay[iso] ?? 0 });
    }

    const completedRoutesCount = (routeIdsRows ?? []).filter(
      r => r.status === 'completed'
    ).length;

    // ── Tech Leads metrics (personal, source = technician) ───────────────
    const { data: leadsData } = await supabase
      .from('leads')
      .select(
        `
        id,
        lead_status,
        created_at,
        estimated_value,
        service_type,
        pest_type,
        customers ( first_name, last_name, city, state )
      `
      )
      .eq('company_id', companyId)
      .eq('submitted_by', user.id)
      .eq('lead_source', 'technician')
      .order('created_at', { ascending: false })
      .limit(500);

    const leads = leadsData ?? [];

    const submitted = leads.length;
    const won = leads.filter(l => l.lead_status === 'won').length;
    const lost = leads.filter(l => l.lead_status === 'lost').length;
    const scheduling = leads.filter(l => l.lead_status === 'scheduling').length;
    const quoted = leads.filter(l => l.lead_status === 'quoted').length;
    const inProcess = leads.filter(
      l => l.lead_status === 'new' || l.lead_status === 'in_process'
    ).length;

    const decided = won + lost;
    const winRate = decided > 0 ? Math.round((won / decided) * 100) : 0;

    const wonRevenue = leads
      .filter(l => l.lead_status === 'won')
      .reduce((sum, l) => sum + Number(l.estimated_value ?? 0), 0);

    const submittedThisMonth = leads.filter(
      l => (l.created_at as string).slice(0, 10) >= monthStartIso
    ).length;

    const wonThisMonth = leads.filter(
      l =>
        l.lead_status === 'won' &&
        (l.created_at as string).slice(0, 10) >= monthStartIso
    ).length;

    const recentLeads = leads.slice(0, 8).map(l => {
      const customer = Array.isArray(l.customers) ? l.customers[0] : l.customers;
      const customerName =
        [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') ||
        'Unknown';
      return {
        id: l.id,
        status: l.lead_status,
        customerName,
        city: customer?.city ?? null,
        state: customer?.state ?? null,
        serviceType: l.service_type ?? null,
        pestType: l.pest_type ?? null,
        estimatedValue: l.estimated_value ?? null,
        createdAt: l.created_at,
      };
    });

    return NextResponse.json({
      inspector: {
        stopsTotal,
        stopsToday,
        stopsThisWeek,
        stopsThisMonth,
        referredToSales,
        completedRoutes: completedRoutesCount,
        sparkline,
        recentStops,
        completedRoutesList,
      },
      techLeads: {
        submitted,
        won,
        lost,
        scheduling,
        quoted,
        inProcess,
        winRate,
        wonRevenue,
        submittedThisMonth,
        wonThisMonth,
        recentLeads,
      },
    });
  } catch (error) {
    console.error('Field Sales reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
