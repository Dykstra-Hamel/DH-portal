import { SupabaseClient } from '@supabase/supabase-js';

export interface AdminReportFilters {
  companyId: string;
  from?: string | null;
  to?: string | null;
  userIds?: string[] | null;
  leadSource?: string[] | null;
  leadStatus?: string[] | null;
  branchId?: string | null;
  // Single-mode "scope to a manager's team": filters the global leads/totals
  // query to users with user_companies.manager_user_id = managerId. The
  // manager themselves is NOT included (matches My-Team-Overview semantics).
  managerId?: string | null;
  compare?: 'users' | 'branches' | 'managers' | null;
  entityIds?: string[] | null;
}

export interface CompareDailyPoint {
  date: string;
  submitted: number;
  won: number;
  pipelineValue: number;
  salesDollars: number;
  stops: number;
}

export interface CompareSeries {
  entityId: string;
  entityLabel: string;
  totals: {
    submitted: number;
    won: number;
    pipelineValue: number;
    salesDollars: number;
    stops: number;
  };
  daily: CompareDailyPoint[];
}

export interface TeamMember {
  id: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  uploadedAvatarUrl: string | null;
  departments: string[];
}

export interface TeamBreakdownRow {
  userId: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  uploadedAvatarUrl: string | null;
  departments: string[];
  submitted: number;
  won: number;
  lost: number;
  inProcess: number;
  wonRevenue: number;
  techDiscussedCount: number;
  stopsCompleted: number;
  leadsFromStops: number;
  winRate: number;
  pipelineValue: number;
}

export interface AdminRecentLead {
  id: string;
  status: string;
  customerName: string;
  city: string | null;
  state: string | null;
  serviceType: string | null;
  pestType: string | null;
  estimatedValue: number | null;
  createdAt: string;
  submittedBy: string | null;
  submittedByName: string | null;
  leadSource: string | null;
}

export interface AdminReportData {
  filters: {
    from: string;
    to: string;
    userIds: string[] | null;
    leadSource: string[] | null;
    leadStatus: string[] | null;
    branchId: string | null;
    managerId: string | null;
    compare: 'users' | 'branches' | 'managers' | null;
    entityIds: string[] | null;
  };
  totals: {
    submitted: number;
    won: number;
    lost: number;
    scheduling: number;
    quoted: number;
    inProcess: number;
    winRate: number;
    wonRevenue: number;
    pipelineValue: number;
    techDiscussedCount: number;
    stopsCompleted: number;
    routesCompleted: number;
    referredToSales: number;
    leadsFromTechs: number;
  };
  sparkline: { date: string; count: number }[];
  leadsByStatus: { status: string; count: number }[];
  leadsBySource: { source: string; count: number }[];
  teamBreakdown: TeamBreakdownRow[];
  recentLeads: AdminRecentLead[];
  teamMembers: TeamMember[];
  compareSeries: CompareSeries[] | null;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultFromDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  d.setHours(0, 0, 0, 0);
  return d;
}

function defaultToDate(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function endOfDayIso(iso: string): string {
  return `${iso}T23:59:59.999Z`;
}

function startOfDayIso(iso: string): string {
  return `${iso}T00:00:00.000Z`;
}

function formatName(first: string | null, last: string | null, email: string | null): string {
  const parts = [first, last].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return email ?? 'Unknown';
}

/**
 * Aggregated report for all field-sales activity within a company.
 * Caller must verify the user has admin/manager/owner role for `filters.companyId`
 * before invoking; this function assumes authorization has already been checked.
 */
export async function getAdminFieldSalesReport(
  admin: SupabaseClient,
  filters: AdminReportFilters
): Promise<AdminReportData> {
  const {
    companyId,
    userIds,
    leadSource,
    leadStatus,
    branchId,
    managerId,
    compare,
    entityIds,
  } = filters;

  // ── Manager → direct-reports lookup ────────────────────────────────────
  // Used in two places: single-mode `managerId` filter (scope global leads
  // to that manager's team) and `compare='managers'` (group leads per
  // manager's team). One query covers both. Returns Map<managerId, userIds[]>.
  const managerIdsToResolve = new Set<string>();
  if (managerId) managerIdsToResolve.add(managerId);
  if (compare === 'managers' && entityIds) {
    for (const eid of entityIds) managerIdsToResolve.add(eid);
  }
  const reportsByManager = new Map<string, string[]>();
  if (managerIdsToResolve.size > 0) {
    const { data: reportRows } = await admin
      .from('user_companies')
      .select('user_id, manager_user_id')
      .eq('company_id', companyId)
      .in('manager_user_id', Array.from(managerIdsToResolve));
    for (const r of reportRows ?? []) {
      const mid = r.manager_user_id as string;
      const uid = r.user_id as string;
      if (!reportsByManager.has(mid)) reportsByManager.set(mid, []);
      reportsByManager.get(mid)!.push(uid);
    }
  }

  const fromDate = filters.from ? new Date(filters.from) : defaultFromDate();
  const toDate = filters.to ? new Date(filters.to) : defaultToDate();
  const fromIso = toIsoDate(fromDate);
  const toIso = toIsoDate(toDate);

  // ── Pull team members (for filter options + display) ────────────────────
  const [teamRowsResult, deptRowsResult] = await Promise.all([
    admin
      .from('user_companies')
      .select(
        `
      user_id,
      profiles:profiles!user_companies_user_id_fkey (
        id,
        first_name,
        last_name,
        email,
        avatar_url,
        uploaded_avatar_url
      )
      `
      )
      .eq('company_id', companyId),
    admin
      .from('user_departments')
      .select('user_id, department')
      .eq('company_id', companyId),
  ]);

  const deptByUser = new Map<string, string[]>();
  for (const row of deptRowsResult.data ?? []) {
    const uid = row.user_id as string;
    const dept = row.department as string;
    if (!deptByUser.has(uid)) deptByUser.set(uid, []);
    deptByUser.get(uid)!.push(dept);
  }

  const teamMembers: TeamMember[] = (teamRowsResult.data ?? [])
    .map(row => {
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (!p?.id) return null;
      return {
        id: p.id as string,
        fullName: formatName(
          p.first_name as string | null,
          p.last_name as string | null,
          p.email as string | null
        ),
        email: (p.email as string | null) ?? null,
        avatarUrl: (p.avatar_url as string | null) ?? null,
        uploadedAvatarUrl: (p.uploaded_avatar_url as string | null) ?? null,
        departments: deptByUser.get(p.id as string) ?? [],
      } satisfies TeamMember;
    })
    .filter((m): m is TeamMember => m !== null)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const memberById = new Map(teamMembers.map(m => [m.id, m]));

  // ── Leads query (date + filters applied) ────────────────────────────────
  let leadsQuery = admin
    .from('leads')
    .select(
      `
      id,
      lead_status,
      lead_source,
      service_type,
      pest_type,
      estimated_value,
      created_at,
      submitted_by,
      tech_discussed,
      branch_id,
      customers ( first_name, last_name, city, state )
      `
    )
    .eq('company_id', companyId)
    .gte('created_at', startOfDayIso(fromIso))
    .lte('created_at', endOfDayIso(toIso))
    .order('created_at', { ascending: false })
    .limit(2000);

  if (userIds && userIds.length > 0) {
    leadsQuery = leadsQuery.in('submitted_by', userIds);
  }
  if (leadSource && leadSource.length > 0) {
    leadsQuery = leadsQuery.in('lead_source', leadSource);
  }
  if (leadStatus && leadStatus.length > 0) {
    leadsQuery = leadsQuery.in('lead_status', leadStatus);
  }
  if (branchId) {
    leadsQuery = leadsQuery.eq('branch_id', branchId);
  }
  // Single-mode "scope to manager's team" — narrow submitted_by to that
  // manager's direct reports. If the manager has zero reports, force an
  // empty result (in() with [] returns nothing).
  if (managerId) {
    const teamUserIds = reportsByManager.get(managerId) ?? [];
    leadsQuery = leadsQuery.in(
      'submitted_by',
      teamUserIds.length > 0 ? teamUserIds : ['__no_reports__']
    );
  }

  const { data: leadsData } = await leadsQuery;
  const leads = leadsData ?? [];

  // ── Quote-derived annualized value per lead ──────────────────────────────
  // For pipeline (and any other forward-looking value), sum each selected
  // line item as initial + recurring × annual multiplier. Leads without a
  // quote fall back to lead.estimated_value.
  const leadAnnualizedValue = new Map<string, number>();
  const filteredLeadIds = leads.map(l => l.id as string);
  if (filteredLeadIds.length > 0) {
    const { data: quoteRows } = await admin
      .from('quotes')
      .select('id, lead_id')
      .in('lead_id', filteredLeadIds);
    const quotes = quoteRows ?? [];
    const quoteIdToLead = new Map<string, string>();
    for (const q of quotes) {
      quoteIdToLead.set(q.id as string, q.lead_id as string);
    }
    const quoteIds = quotes.map(q => q.id as string);
    if (quoteIds.length > 0) {
      const { data: lineRows } = await admin
        .from('quote_line_items')
        .select(
          'quote_id, final_initial_price, final_recurring_price, billing_frequency, is_selected'
        )
        .in('quote_id', quoteIds);
      for (const item of lineRows ?? []) {
        if (item.is_selected === false) continue;
        const leadId = quoteIdToLead.get(item.quote_id as string);
        if (!leadId) continue;
        const initial = Number(item.final_initial_price ?? 0);
        const recurring = Number(item.final_recurring_price ?? 0);
        const annual =
          initial +
          recurring * annualMultiplier(item.billing_frequency as string | null);
        leadAnnualizedValue.set(
          leadId,
          (leadAnnualizedValue.get(leadId) ?? 0) + annual
        );
      }
    }
  }
  const leadValue = (l: { id: unknown; estimated_value: unknown }): number => {
    const quoted = leadAnnualizedValue.get(l.id as string);
    return quoted !== undefined ? quoted : Number(l.estimated_value ?? 0);
  };

  // ── Totals ───────────────────────────────────────────────────────────────
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

  const pipelineValue = leads
    .filter(l =>
      ['new', 'in_process', 'quoted', 'scheduling'].includes(l.lead_status as string)
    )
    .reduce((sum, l) => sum + leadValue(l), 0);

  const techDiscussedCount = leads.filter(l => l.tech_discussed === true).length;
  const leadsFromTechs = leads.filter(l => l.lead_source === 'technician').length;

  // ── Sparkline (daily count across filter window, capped to 30 days) ─────
  const rangeDays = Math.min(
    30,
    Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000) + 1)
  );
  const sparkline: { date: string; count: number }[] = [];
  const leadsByDay: Record<string, number> = {};
  for (const l of leads) {
    const day = (l.created_at as string).slice(0, 10);
    leadsByDay[day] = (leadsByDay[day] ?? 0) + 1;
  }
  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const d = new Date(toDate);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const iso = toIsoDate(d);
    sparkline.push({ date: iso, count: leadsByDay[iso] ?? 0 });
  }

  // ── Breakdowns by status / source (for chart data) ──────────────────────
  const statusCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  for (const l of leads) {
    const s = (l.lead_status as string) ?? 'unknown';
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    const src = (l.lead_source as string) ?? 'unknown';
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
  }
  const leadsByStatus = Object.entries(statusCounts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
  const leadsBySource = Object.entries(sourceCounts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  // ── Team breakdown (per-user aggregates) ─────────────────────────────────
  const perUser = new Map<string, TeamBreakdownRow>();
  const blankPerUserRow = (uid: string): TeamBreakdownRow => {
    const member = memberById.get(uid);
    return {
      userId: uid,
      fullName: member?.fullName ?? 'Unknown',
      email: member?.email ?? null,
      avatarUrl: member?.avatarUrl ?? null,
      uploadedAvatarUrl: member?.uploadedAvatarUrl ?? null,
      departments: member?.departments ?? [],
      submitted: 0,
      won: 0,
      lost: 0,
      inProcess: 0,
      wonRevenue: 0,
      techDiscussedCount: 0,
      stopsCompleted: 0,
      leadsFromStops: 0,
      winRate: 0,
      pipelineValue: 0,
    };
  };
  for (const l of leads) {
    const uid = (l.submitted_by as string | null) ?? null;
    if (!uid) continue;
    const row = perUser.get(uid) ?? blankPerUserRow(uid);
    row.submitted += 1;
    if (l.lead_source === 'technician') row.leadsFromStops += 1;
    if (l.lead_status === 'won') {
      row.won += 1;
      row.wonRevenue += Number(l.estimated_value ?? 0);
    }
    if (l.lead_status === 'lost') row.lost += 1;
    if (l.lead_status === 'new' || l.lead_status === 'in_process') {
      row.inProcess += 1;
    }
    if (
      ['new', 'in_process', 'quoted', 'scheduling'].includes(
        l.lead_status as string
      )
    ) {
      row.pipelineValue += leadValue(l);
    }
    if (l.tech_discussed === true) row.techDiscussedCount += 1;
    perUser.set(uid, row);
  }

  // ── Route stops (company routes within the date range) ───────────────────
  let routesQuery = admin
    .from('routes')
    .select('id, assigned_to, status, route_date, actual_start_time, actual_end_time')
    .eq('company_id', companyId)
    .gte('route_date', fromIso)
    .lte('route_date', toIso);

  if (userIds && userIds.length > 0) {
    routesQuery = routesQuery.in('assigned_to', userIds);
  }
  // Single-mode "scope to manager's team" — match the leads query so stops
  // totals/sparkline reflect only that team's routes.
  if (managerId) {
    const teamUserIds = reportsByManager.get(managerId) ?? [];
    routesQuery = routesQuery.in(
      'assigned_to',
      teamUserIds.length > 0 ? teamUserIds : ['__no_reports__']
    );
  }

  const { data: routeRows } = await routesQuery;
  const routes = routeRows ?? [];
  const routeIdToUser = new Map<string, string | null>();
  for (const r of routes) {
    routeIdToUser.set(r.id as string, (r.assigned_to as string | null) ?? null);
  }
  const routeIds = routes.map(r => r.id as string);

  let stopsCompleted = 0;
  let referredToSales = 0;
  if (routeIds.length > 0) {
    const { data: stopsData } = await admin
      .from('route_stops')
      .select('id, route_id, status, referred_to_sales, actual_departure')
      .in('route_id', routeIds);
    const stops = stopsData ?? [];
    for (const s of stops) {
      if (s.status === 'completed') {
        stopsCompleted += 1;
        const uid = routeIdToUser.get(s.route_id as string);
        if (uid) {
          const row = perUser.get(uid) ?? blankPerUserRow(uid);
          row.stopsCompleted += 1;
          perUser.set(uid, row);
        }
      }
      if (s.referred_to_sales) referredToSales += 1;
    }
  }

  const routesCompleted = routes.filter(r => r.status === 'completed').length;

  for (const row of perUser.values()) {
    const decided = row.won + row.lost;
    row.winRate = decided > 0 ? Math.round((row.won / decided) * 100) : 0;
    row.pipelineValue = Math.round(row.pipelineValue);
  }

  const teamBreakdown = Array.from(perUser.values()).sort(
    (a, b) => b.submitted - a.submitted || b.stopsCompleted - a.stopsCompleted
  );

  // ── Recent leads (top 15 for the list) ───────────────────────────────────
  const recentLeads: AdminRecentLead[] = leads.slice(0, 15).map(l => {
    const customer = Array.isArray(l.customers) ? l.customers[0] : l.customers;
    const customerName = formatName(
      (customer?.first_name as string | null) ?? null,
      (customer?.last_name as string | null) ?? null,
      null
    );
    const submittedBy = (l.submitted_by as string | null) ?? null;
    return {
      id: l.id as string,
      status: (l.lead_status as string) ?? 'unknown',
      customerName: customerName || 'Unknown',
      city: (customer?.city as string | null) ?? null,
      state: (customer?.state as string | null) ?? null,
      serviceType: (l.service_type as string | null) ?? null,
      pestType: (l.pest_type as string | null) ?? null,
      estimatedValue:
        l.estimated_value == null ? null : Number(l.estimated_value),
      createdAt: l.created_at as string,
      submittedBy,
      submittedByName: submittedBy
        ? memberById.get(submittedBy)?.fullName ?? null
        : null,
      leadSource: (l.lead_source as string | null) ?? null,
    };
  });

  // ── Compare series (multi-entity per-day breakdown) ─────────────────────
  // When `compare` is set, build one series per requested entity:
  //   compare='users':    attribute leads via submitted_by, stops via routes.assigned_to.
  //   compare='branches': attribute leads via leads.branch_id; stops not branch-tagged today.
  //   compare='managers': attribute leads via submitted_by → manager (reportsByManager
  //                       reverse lookup); stops summed across each report's routes.
  let compareSeries: CompareSeries[] | null = null;
  if (compare && entityIds && entityIds.length > 0) {
    const labels = new Map<string, string>();
    if (compare === 'users' || compare === 'managers') {
      for (const eid of entityIds) {
        labels.set(eid, memberById.get(eid)?.fullName ?? 'Unknown');
      }
    } else {
      const { data: branchRows } = await admin
        .from('branches')
        .select('id, name')
        .in('id', entityIds);
      for (const b of branchRows ?? []) {
        labels.set(b.id as string, (b.name as string) ?? 'Branch');
      }
      for (const eid of entityIds) {
        if (!labels.has(eid)) labels.set(eid, 'Branch');
      }
    }

    // For compare='managers' we need a submitter → manager_id reverse lookup
    // so each lead can be attributed to the correct team.
    const submitterToManager = new Map<string, string>();
    if (compare === 'managers') {
      for (const [mid, uids] of reportsByManager.entries()) {
        for (const uid of uids) submitterToManager.set(uid, mid);
      }
    }

    // Initialize buckets per entity per day
    const dayKeys: string[] = sparkline.map(p => p.date);
    type Bucket = {
      submitted: number;
      won: number;
      pipelineValue: number;
      salesDollars: number;
      stops: number;
    };
    const blankBucket = (): Bucket => ({
      submitted: 0,
      won: 0,
      pipelineValue: 0,
      salesDollars: 0,
      stops: 0,
    });
    const perEntity = new Map<string, Map<string, Bucket>>();
    for (const eid of entityIds) {
      const days = new Map<string, Bucket>();
      for (const dk of dayKeys) days.set(dk, blankBucket());
      perEntity.set(eid, days);
    }

    for (const l of leads) {
      const day = (l.created_at as string).slice(0, 10);
      const status = (l.lead_status as string) ?? '';
      const value = leadValue(l);
      const submittedBy = (l.submitted_by as string | null) ?? null;
      const eid =
        compare === 'users'
          ? submittedBy
          : compare === 'managers'
            ? submittedBy
              ? submitterToManager.get(submittedBy) ?? null
              : null
            : ((l.branch_id as string | null) ?? null);
      if (!eid) continue;
      const days = perEntity.get(eid);
      if (!days) continue;
      const bucket = days.get(day);
      if (!bucket) continue;
      bucket.submitted += 1;
      if (status === 'won') {
        bucket.won += 1;
        bucket.salesDollars += Number(l.estimated_value ?? 0);
      }
      if (['new', 'in_process', 'quoted', 'scheduling'].includes(status)) {
        bucket.pipelineValue += value;
      }
    }

    if (compare === 'users' || compare === 'managers') {
      // For users: route.assigned_to is the entity. For managers: route.assigned_to
      // is one of the manager's direct reports — bucket those stops to the manager.
      const routeOwnerToBucket = new Map<string, string>();
      if (compare === 'users') {
        for (const eid of entityIds) routeOwnerToBucket.set(eid, eid);
      } else {
        for (const [mid, uids] of reportsByManager.entries()) {
          for (const uid of uids) routeOwnerToBucket.set(uid, mid);
        }
      }
      const relevantRoutes = routes.filter(r => {
        const assignedTo = r.assigned_to as string | null;
        return assignedTo ? routeOwnerToBucket.has(assignedTo) : false;
      });
      const relevantRouteIds = relevantRoutes.map(r => r.id as string);
      if (relevantRouteIds.length > 0) {
        const { data: stopsForCompare } = await admin
          .from('route_stops')
          .select('route_id, status, actual_departure')
          .in('route_id', relevantRouteIds);
        const routeIdToBucket = new Map<string, string>();
        const routeIdToDate = new Map<string, string>();
        for (const r of relevantRoutes) {
          const owner = r.assigned_to as string | null;
          if (owner) {
            const bucketKey = routeOwnerToBucket.get(owner);
            if (bucketKey) routeIdToBucket.set(r.id as string, bucketKey);
          }
          routeIdToDate.set(r.id as string, (r.route_date as string) ?? '');
        }
        for (const s of stopsForCompare ?? []) {
          if (s.status !== 'completed') continue;
          const rid = s.route_id as string;
          const bucketKey = routeIdToBucket.get(rid);
          if (!bucketKey) continue;
          // Attribute the stop to its actual_departure day; fall back to
          // the route's date when the stop has no completion timestamp.
          const dep = (s.actual_departure as string | null) ?? null;
          const day = (dep ?? routeIdToDate.get(rid) ?? '').slice(0, 10);
          const days = perEntity.get(bucketKey);
          const bucket = days?.get(day);
          if (bucket) bucket.stops += 1;
        }
      }
    }

    compareSeries = entityIds.map(eid => {
      const days = perEntity.get(eid) || new Map<string, Bucket>();
      const daily: CompareDailyPoint[] = dayKeys.map(dk => {
        const b = days.get(dk) ?? blankBucket();
        return {
          date: dk,
          submitted: b.submitted,
          won: b.won,
          pipelineValue: Math.round(b.pipelineValue),
          salesDollars: Math.round(b.salesDollars),
          stops: b.stops,
        };
      });
      const totals = daily.reduce(
        (acc, p) => {
          acc.submitted += p.submitted;
          acc.won += p.won;
          acc.pipelineValue += p.pipelineValue;
          acc.salesDollars += p.salesDollars;
          acc.stops += p.stops;
          return acc;
        },
        {
          submitted: 0,
          won: 0,
          pipelineValue: 0,
          salesDollars: 0,
          stops: 0,
        }
      );
      return {
        entityId: eid,
        entityLabel: labels.get(eid) ?? eid,
        totals,
        daily,
      };
    });
  }

  return {
    filters: {
      from: fromIso,
      to: toIso,
      userIds: userIds && userIds.length > 0 ? userIds : null,
      leadSource: leadSource && leadSource.length > 0 ? leadSource : null,
      leadStatus: leadStatus && leadStatus.length > 0 ? leadStatus : null,
      branchId: branchId ?? null,
      managerId: managerId ?? null,
      compare: compare ?? null,
      entityIds: entityIds && entityIds.length > 0 ? entityIds : null,
    },
    totals: {
      submitted,
      won,
      lost,
      scheduling,
      quoted,
      inProcess,
      winRate,
      wonRevenue,
      pipelineValue,
      techDiscussedCount,
      stopsCompleted,
      routesCompleted,
      referredToSales,
      leadsFromTechs,
    },
    sparkline,
    leadsByStatus,
    leadsBySource,
    teamBreakdown,
    recentLeads,
    teamMembers,
    compareSeries,
  };
}

// ── Drill-down: leads contributing to a single dashboard metric ───────────
// Returns an AdminRecentLead[] (same shape the dashboard's Recent Leads list
// already renders) filtered to a specific KPI. Reuses the same filter set as
// `getAdminFieldSalesReport` so the modal stays consistent with whatever the
// user has filtered the dashboard to.
//
// "submitted" returns every lead that matched the dashboard filters in the
// date window. "won_revenue" mirrors "won" — it's the same lead set that
// produced the revenue number, sorted by estimated_value descending.

export type AdminMetricKey =
  | 'submitted'
  | 'won'
  | 'won_revenue'
  | 'pipeline'
  | 'tech_discussed'
  | 'leads_from_techs';

export async function getAdminFieldSalesLeadsForMetric(
  admin: SupabaseClient,
  filters: AdminReportFilters,
  metric: AdminMetricKey
): Promise<AdminRecentLead[]> {
  const {
    companyId,
    userIds,
    leadSource,
    leadStatus,
    branchId,
    managerId,
  } = filters;

  const fromDate = filters.from ? new Date(filters.from) : defaultFromDate();
  const toDate = filters.to ? new Date(filters.to) : defaultToDate();
  const fromIso = toIsoDate(fromDate);
  const toIso = toIsoDate(toDate);

  // If a managerId is set, expand to that manager's direct reports.
  let teamUserIds: string[] | null = null;
  if (managerId) {
    const { data: reportRows } = await admin
      .from('user_companies')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('manager_user_id', managerId);
    teamUserIds = (reportRows ?? []).map(r => r.user_id as string);
    if (teamUserIds.length === 0) return [];
  }

  let leadsQuery = admin
    .from('leads')
    .select(
      `
      id,
      lead_status,
      lead_source,
      service_type,
      pest_type,
      estimated_value,
      created_at,
      submitted_by,
      tech_discussed,
      branch_id,
      customers ( first_name, last_name, city, state )
      `
    )
    .eq('company_id', companyId)
    .gte('created_at', startOfDayIso(fromIso))
    .lte('created_at', endOfDayIso(toIso))
    .limit(500);

  if (teamUserIds) {
    leadsQuery = leadsQuery.in('submitted_by', teamUserIds);
  } else if (userIds && userIds.length > 0) {
    leadsQuery = leadsQuery.in('submitted_by', userIds);
  }
  if (leadSource && leadSource.length > 0) {
    leadsQuery = leadsQuery.in('lead_source', leadSource);
  }
  if (leadStatus && leadStatus.length > 0) {
    leadsQuery = leadsQuery.in('lead_status', leadStatus);
  }
  if (branchId) {
    leadsQuery = leadsQuery.eq('branch_id', branchId);
  }

  // Metric-specific narrowing
  if (metric === 'won' || metric === 'won_revenue') {
    leadsQuery = leadsQuery.eq('lead_status', 'won');
  } else if (metric === 'pipeline') {
    leadsQuery = leadsQuery
      .in('lead_status', [...PIPELINE_STATUSES])
      // Pipeline KPI is a dollar value, so the modal should only show leads
      // that actually contribute value. Drops leads with null/zero
      // estimated_value (gt against null is null → row excluded).
      .gt('estimated_value', 0);
  } else if (metric === 'tech_discussed') {
    leadsQuery = leadsQuery.eq('tech_discussed', true);
  } else if (metric === 'leads_from_techs') {
    leadsQuery = leadsQuery.eq('lead_source', 'technician');
  }

  // Value-driven metrics sort by value descending so the heaviest
  // contributors top the list. Everything else: most recent first.
  if (metric === 'won_revenue' || metric === 'pipeline') {
    leadsQuery = leadsQuery.order('estimated_value', {
      ascending: false,
      nullsFirst: false,
    });
  } else {
    leadsQuery = leadsQuery.order('created_at', { ascending: false });
  }

  const { data: leadsData } = await leadsQuery;
  const leads = leadsData ?? [];

  return leads.map(l => {
    const customer = Array.isArray(l.customers) ? l.customers[0] : l.customers;
    const customerName = formatName(
      (customer?.first_name as string | null) ?? null,
      (customer?.last_name as string | null) ?? null,
      null
    );
    return {
      id: l.id as string,
      status: (l.lead_status as string) ?? 'unknown',
      customerName: customerName || 'Unknown',
      city: (customer?.city as string | null) ?? null,
      state: (customer?.state as string | null) ?? null,
      serviceType: (l.service_type as string | null) ?? null,
      pestType: (l.pest_type as string | null) ?? null,
      estimatedValue:
        l.estimated_value == null ? null : Number(l.estimated_value),
      createdAt: l.created_at as string,
      submittedBy: (l.submitted_by as string | null) ?? null,
      submittedByName: null,
      leadSource: (l.lead_source as string | null) ?? null,
    };
  });
}

// ── Broad dataset for AI reports ──────────────────────────────────────────
// Used by the "Ask the Data" feature so the LLM can reason about the whole
// company's field-sales activity rather than the filtered dashboard slice.
// All numbers are pre-aggregated server-side; Gemini is only responsible for
// picking the right slice to describe and formatting the response.

export interface BroadDatasetUser {
  userId: string;
  fullName: string;
  email: string | null;
  companyRole: string;
  departments: string[];
  leadsSubmittedAllTime: number;
  leadsSubmittedLast12Months: number;
  leadsWonAllTime: number;
  leadsLostAllTime: number;
  leadsInProcessAllTime: number;
  wonRevenueAllTime: number;
  totalEstimatedValueAllTime: number;
  pipelineValueAllTime: number;
  annualizedLeadValueAllTime: number;
  annualizedWonValueAllTime: number;
  leadsWithQuoteAllTime: number;
  techDiscussedCountAllTime: number;
  stopsCompletedAllTime: number;
  stopsCompletedLast12Months: number;
  referredToSalesAllTime: number;
  routesAssignedAllTime: number;
  routesCompletedAllTime: number;
}

export interface BroadAdminDataset {
  generatedAt: string;
  company: {
    id: string;
    totalMembers: number;
    activeInspectors: number;
    activeTechnicians: number;
  };
  allTime: {
    leadsTotal: number;
    leadsByStatus: Record<string, number>;
    leadsBySource: Record<string, number>;
    leadsBySourceAndStatus: Array<{
      source: string;
      status: string;
      count: number;
      totalEstimatedValue: number;
    }>;
    wonRevenue: number;
    pipelineValue: number;
    techDiscussedLeadsCount: number;
    routesTotal: number;
    routesCompleted: number;
    routeStopsCompleted: number;
    routeStopsReferredToSales: number;
    fieldSalesLeadsTotal: number;
    fieldSalesLeadsWon: number;
    fieldSalesWonRevenue: number;
    leadsWithQuoteCount: number;
    annualizedLeadValue: number;
    annualizedWonValue: number;
    fieldSalesAnnualizedLeadValue: number;
    fieldSalesAnnualizedWonValue: number;
  };
  last12Months: {
    windowFrom: string;
    windowTo: string;
    leadsTotal: number;
    leadsByStatus: Record<string, number>;
    leadsBySource: Record<string, number>;
    monthly: Array<{
      month: string;
      leadsSubmitted: number;
      leadsWon: number;
      leadsLost: number;
      wonRevenue: number;
    }>;
    routeStopsCompleted: number;
  };
  perUser: BroadDatasetUser[];
  notes: {
    fieldSalesSourceValues: string[];
    inspectorDepartmentValue: string;
    technicianDepartmentValue: string;
    dataCompleteness: string;
  };
}

const FIELD_SALES_SOURCES = ['technician', 'field_map'] as const;
const IN_PROCESS_STATUSES = ['new', 'in_process'] as const;
const PIPELINE_STATUSES = ['new', 'in_process', 'quoted', 'scheduling'] as const;

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

// Annual multiplier for a recurring billing_frequency — used to turn a
// per-period recurring charge into an annualized lead value.
// Unknown / missing frequencies default to monthly (12) so we err toward the
// more common case rather than under-reporting.
function annualMultiplier(frequency: string | null | undefined): number {
  if (!frequency) return 12;
  switch (frequency.toLowerCase()) {
    case 'monthly':
      return 12;
    case 'bi-monthly':
      return 6;
    case 'quarterly':
      return 4;
    case 'semi-annually':
    case 'semi-annual':
    case 'bi-annually':
      return 2;
    case 'annually':
    case 'annual':
      return 1;
    default:
      return 12;
  }
}

export async function getBroadAdminDataset(
  admin: SupabaseClient,
  companyId: string
): Promise<BroadAdminDataset> {
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const from12IsoDate = toIsoDate(twelveMonthsAgo);

  // ── Roster: user_companies + profiles + user_departments ────────────────
  const [membersResult, departmentsResult] = await Promise.all([
    admin
      .from('user_companies')
      .select(
        `
        user_id,
        role,
        profiles:profiles!user_companies_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
        `
      )
      .eq('company_id', companyId),
    admin
      .from('user_departments')
      .select('user_id, department')
      .eq('company_id', companyId),
  ]);

  const deptByUser = new Map<string, string[]>();
  for (const row of departmentsResult.data ?? []) {
    const uid = row.user_id as string;
    const dept = row.department as string;
    if (!deptByUser.has(uid)) deptByUser.set(uid, []);
    deptByUser.get(uid)!.push(dept);
  }

  interface RosterEntry {
    userId: string;
    fullName: string;
    email: string | null;
    companyRole: string;
    departments: string[];
  }
  const roster: RosterEntry[] = [];
  for (const row of membersResult.data ?? []) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!profile?.id) continue;
    const userId = profile.id as string;
    roster.push({
      userId,
      fullName: formatName(
        profile.first_name as string | null,
        profile.last_name as string | null,
        profile.email as string | null
      ),
      email: (profile.email as string | null) ?? null,
      companyRole: (row.role as string) ?? 'member',
      departments: deptByUser.get(userId) ?? [],
    });
  }
  const rosterById = new Map(roster.map(r => [r.userId, r]));

  // ── All leads for the company (aggregated in memory) ─────────────────────
  const { data: leadsData } = await admin
    .from('leads')
    .select(
      'id, lead_status, lead_source, estimated_value, tech_discussed, submitted_by, created_at'
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(10000);

  const leads = leadsData ?? [];

  // ── Quote-derived annualized value per lead ──────────────────────────────
  // lead.estimated_value tracks only the initial (one-time) charge. For a
  // more realistic "lead value" we sum each selected quote line item's
  // final_initial_price + final_recurring_price × annual-multiplier.
  const leadAnnualizedValue = new Map<string, number>();
  const leadIdList = leads.map(l => l.id as string);
  if (leadIdList.length > 0) {
    const { data: quoteRows } = await admin
      .from('quotes')
      .select('id, lead_id')
      .in('lead_id', leadIdList);
    const quotes = quoteRows ?? [];
    const quoteIdToLead = new Map<string, string>();
    for (const q of quotes) {
      quoteIdToLead.set(q.id as string, q.lead_id as string);
    }
    const quoteIds = quotes.map(q => q.id as string);
    if (quoteIds.length > 0) {
      const { data: lineRows } = await admin
        .from('quote_line_items')
        .select(
          'quote_id, final_initial_price, final_recurring_price, billing_frequency, is_selected'
        )
        .in('quote_id', quoteIds);
      for (const item of lineRows ?? []) {
        if (item.is_selected === false) continue;
        const leadId = quoteIdToLead.get(item.quote_id as string);
        if (!leadId) continue;
        const initial = Number(item.final_initial_price ?? 0);
        const recurring = Number(item.final_recurring_price ?? 0);
        const annual =
          initial +
          recurring * annualMultiplier(item.billing_frequency as string | null);
        leadAnnualizedValue.set(
          leadId,
          (leadAnnualizedValue.get(leadId) ?? 0) + annual
        );
      }
    }
  }

  const allTimeByStatus: Record<string, number> = {};
  const allTimeBySource: Record<string, number> = {};
  const sourceStatusMap = new Map<
    string,
    { count: number; totalEstimatedValue: number }
  >();
  let allWonRevenue = 0;
  let allPipelineValue = 0;
  let allTechDiscussed = 0;
  let fieldSalesLeadsTotal = 0;
  let fieldSalesLeadsWon = 0;
  let fieldSalesWonRevenue = 0;
  let leadsWithQuoteCount = 0;
  let annualizedLeadValueTotal = 0;
  let annualizedWonValueTotal = 0;
  let fieldSalesAnnualizedLeadValue = 0;
  let fieldSalesAnnualizedWonValue = 0;

  const last12ByStatus: Record<string, number> = {};
  const last12BySource: Record<string, number> = {};
  const monthlyMap = new Map<
    string,
    {
      leadsSubmitted: number;
      leadsWon: number;
      leadsLost: number;
      wonRevenue: number;
    }
  >();
  let last12Total = 0;

  const perUserAgg = new Map<
    string,
    {
      submittedAll: number;
      submittedLast12: number;
      wonAll: number;
      lostAll: number;
      inProcessAll: number;
      wonRevenueAll: number;
      totalEstimatedValueAll: number;
      pipelineValueAll: number;
      annualizedLeadValueAll: number;
      annualizedWonValueAll: number;
      leadsWithQuoteAll: number;
      techDiscussedAll: number;
    }
  >();
  const getPerUser = (uid: string) => {
    let row = perUserAgg.get(uid);
    if (!row) {
      row = {
        submittedAll: 0,
        submittedLast12: 0,
        wonAll: 0,
        lostAll: 0,
        inProcessAll: 0,
        wonRevenueAll: 0,
        totalEstimatedValueAll: 0,
        pipelineValueAll: 0,
        annualizedLeadValueAll: 0,
        annualizedWonValueAll: 0,
        leadsWithQuoteAll: 0,
        techDiscussedAll: 0,
      };
      perUserAgg.set(uid, row);
    }
    return row;
  };

  for (const l of leads) {
    const status = (l.lead_status as string) ?? 'unknown';
    const source = (l.lead_source as string) ?? 'unknown';
    const value = Number(l.estimated_value ?? 0);
    const submittedBy = (l.submitted_by as string | null) ?? null;
    const createdAt = (l.created_at as string) ?? '';
    const isWon = status === 'won';
    const isLost = status === 'lost';
    const isInProcess = (IN_PROCESS_STATUSES as readonly string[]).includes(status);
    const isPipeline = (PIPELINE_STATUSES as readonly string[]).includes(status);
    const isFieldSales = (FIELD_SALES_SOURCES as readonly string[]).includes(source);
    const inLast12 = createdAt.slice(0, 10) >= from12IsoDate;

    allTimeByStatus[status] = (allTimeByStatus[status] ?? 0) + 1;
    allTimeBySource[source] = (allTimeBySource[source] ?? 0) + 1;
    const key = `${source}::${status}`;
    const entry = sourceStatusMap.get(key) ?? { count: 0, totalEstimatedValue: 0 };
    entry.count += 1;
    entry.totalEstimatedValue += value;
    sourceStatusMap.set(key, entry);

    if (isWon) allWonRevenue += value;
    if (isPipeline) allPipelineValue += value;
    if (l.tech_discussed === true) allTechDiscussed += 1;

    // Quote-derived annualized value. Falls back to lead.estimated_value when
    // no quote has been built — that matches how sourced-from-widget leads
    // still contribute their widget-estimated one-time price.
    const quotedValue = leadAnnualizedValue.get(l.id as string);
    const hasQuote = quotedValue !== undefined;
    if (hasQuote) leadsWithQuoteCount += 1;
    const annualized = hasQuote ? quotedValue : value;
    annualizedLeadValueTotal += annualized;
    if (isWon) annualizedWonValueTotal += annualized;

    if (isFieldSales) {
      fieldSalesLeadsTotal += 1;
      fieldSalesAnnualizedLeadValue += annualized;
      if (isWon) {
        fieldSalesLeadsWon += 1;
        fieldSalesWonRevenue += value;
        fieldSalesAnnualizedWonValue += annualized;
      }
    }

    if (inLast12) {
      last12Total += 1;
      last12ByStatus[status] = (last12ByStatus[status] ?? 0) + 1;
      last12BySource[source] = (last12BySource[source] ?? 0) + 1;
      const mk = monthKey(createdAt);
      const bucket = monthlyMap.get(mk) ?? {
        leadsSubmitted: 0,
        leadsWon: 0,
        leadsLost: 0,
        wonRevenue: 0,
      };
      bucket.leadsSubmitted += 1;
      if (isWon) {
        bucket.leadsWon += 1;
        bucket.wonRevenue += value;
      }
      if (isLost) bucket.leadsLost += 1;
      monthlyMap.set(mk, bucket);
    }

    if (submittedBy) {
      const u = getPerUser(submittedBy);
      u.submittedAll += 1;
      u.totalEstimatedValueAll += value;
      u.annualizedLeadValueAll += annualized;
      if (hasQuote) u.leadsWithQuoteAll += 1;
      if (isPipeline) u.pipelineValueAll += value;
      if (inLast12) u.submittedLast12 += 1;
      if (isWon) {
        u.wonAll += 1;
        u.wonRevenueAll += value;
        u.annualizedWonValueAll += annualized;
      }
      if (isLost) u.lostAll += 1;
      if (isInProcess) u.inProcessAll += 1;
      if (l.tech_discussed === true) u.techDiscussedAll += 1;
    }
  }

  // ── Routes + stops (all-time) ────────────────────────────────────────────
  const { data: routesData } = await admin
    .from('routes')
    .select('id, assigned_to, status, route_date')
    .eq('company_id', companyId)
    .limit(10000);
  const routes = routesData ?? [];
  const routeIdToUser = new Map<string, string | null>();
  const routeIdToDate = new Map<string, string | null>();
  const perUserRoute = new Map<
    string,
    {
      routesAssigned: number;
      routesCompleted: number;
      stopsCompletedAll: number;
      stopsCompletedLast12: number;
      referredToSalesAll: number;
    }
  >();
  const getPerRoute = (uid: string) => {
    let row = perUserRoute.get(uid);
    if (!row) {
      row = {
        routesAssigned: 0,
        routesCompleted: 0,
        stopsCompletedAll: 0,
        stopsCompletedLast12: 0,
        referredToSalesAll: 0,
      };
      perUserRoute.set(uid, row);
    }
    return row;
  };

  let routesTotal = 0;
  let routesCompleted = 0;
  for (const r of routes) {
    routesTotal += 1;
    const uid = (r.assigned_to as string | null) ?? null;
    routeIdToUser.set(r.id as string, uid);
    routeIdToDate.set(r.id as string, (r.route_date as string | null) ?? null);
    if (uid) {
      const pr = getPerRoute(uid);
      pr.routesAssigned += 1;
      if (r.status === 'completed') pr.routesCompleted += 1;
    }
    if (r.status === 'completed') routesCompleted += 1;
  }

  let stopsCompletedAll = 0;
  let stopsReferredAll = 0;
  let stopsCompletedLast12 = 0;
  if (routes.length > 0) {
    const routeIds = routes.map(r => r.id as string);
    const { data: stopsData } = await admin
      .from('route_stops')
      .select('route_id, status, referred_to_sales')
      .in('route_id', routeIds);
    const stops = stopsData ?? [];
    for (const s of stops) {
      const routeId = s.route_id as string;
      const uid = routeIdToUser.get(routeId) ?? null;
      const rDate = routeIdToDate.get(routeId) ?? null;
      const inLast12 = !!rDate && rDate >= from12IsoDate;
      if (s.status === 'completed') {
        stopsCompletedAll += 1;
        if (inLast12) stopsCompletedLast12 += 1;
        if (uid) {
          const pr = getPerRoute(uid);
          pr.stopsCompletedAll += 1;
          if (inLast12) pr.stopsCompletedLast12 += 1;
        }
      }
      if (s.referred_to_sales) {
        stopsReferredAll += 1;
        if (uid) {
          const pr = getPerRoute(uid);
          pr.referredToSalesAll += 1;
        }
      }
    }
  }

  // ── Compose per-user ────────────────────────────────────────────────────
  const perUser: BroadDatasetUser[] = roster
    .map(r => {
      const agg = perUserAgg.get(r.userId);
      const rt = perUserRoute.get(r.userId);
      return {
        userId: r.userId,
        fullName: r.fullName,
        email: r.email,
        companyRole: r.companyRole,
        departments: r.departments,
        leadsSubmittedAllTime: agg?.submittedAll ?? 0,
        leadsSubmittedLast12Months: agg?.submittedLast12 ?? 0,
        leadsWonAllTime: agg?.wonAll ?? 0,
        leadsLostAllTime: agg?.lostAll ?? 0,
        leadsInProcessAllTime: agg?.inProcessAll ?? 0,
        wonRevenueAllTime: Math.round(agg?.wonRevenueAll ?? 0),
        totalEstimatedValueAllTime: Math.round(agg?.totalEstimatedValueAll ?? 0),
        pipelineValueAllTime: Math.round(agg?.pipelineValueAll ?? 0),
        annualizedLeadValueAllTime: Math.round(agg?.annualizedLeadValueAll ?? 0),
        annualizedWonValueAllTime: Math.round(agg?.annualizedWonValueAll ?? 0),
        leadsWithQuoteAllTime: agg?.leadsWithQuoteAll ?? 0,
        techDiscussedCountAllTime: agg?.techDiscussedAll ?? 0,
        stopsCompletedAllTime: rt?.stopsCompletedAll ?? 0,
        stopsCompletedLast12Months: rt?.stopsCompletedLast12 ?? 0,
        referredToSalesAllTime: rt?.referredToSalesAll ?? 0,
        routesAssignedAllTime: rt?.routesAssigned ?? 0,
        routesCompletedAllTime: rt?.routesCompleted ?? 0,
      };
    })
    .sort((a, b) => b.leadsSubmittedAllTime - a.leadsSubmittedAllTime);

  // ── Monthly series (ensure 12 contiguous months, oldest first) ──────────
  const monthly: BroadAdminDataset['last12Months']['monthly'] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    d.setDate(1);
    const mk = monthKey(toIsoDate(d));
    const bucket = monthlyMap.get(mk) ?? {
      leadsSubmitted: 0,
      leadsWon: 0,
      leadsLost: 0,
      wonRevenue: 0,
    };
    monthly.push({
      month: mk,
      leadsSubmitted: bucket.leadsSubmitted,
      leadsWon: bucket.leadsWon,
      leadsLost: bucket.leadsLost,
      wonRevenue: Math.round(bucket.wonRevenue),
    });
  }

  const activeInspectors = roster.filter(r =>
    r.departments.includes('inspector')
  ).length;
  const activeTechnicians = roster.filter(r =>
    r.departments.includes('technician')
  ).length;

  const leadsBySourceAndStatus = Array.from(sourceStatusMap.entries())
    .map(([key, v]) => {
      const [source, status] = key.split('::');
      return {
        source,
        status,
        count: v.count,
        totalEstimatedValue: Math.round(v.totalEstimatedValue),
      };
    })
    .sort((a, b) => b.count - a.count);

  const truncationNote =
    leads.length >= 10000
      ? 'Leads truncated at 10,000 most recent rows; older history may be omitted.'
      : `All ${leads.length} company leads included.`;

  return {
    generatedAt: new Date().toISOString(),
    company: {
      id: companyId,
      totalMembers: roster.length,
      activeInspectors,
      activeTechnicians,
    },
    allTime: {
      leadsTotal: leads.length,
      leadsByStatus: allTimeByStatus,
      leadsBySource: allTimeBySource,
      leadsBySourceAndStatus,
      wonRevenue: Math.round(allWonRevenue),
      pipelineValue: Math.round(allPipelineValue),
      techDiscussedLeadsCount: allTechDiscussed,
      routesTotal,
      routesCompleted,
      routeStopsCompleted: stopsCompletedAll,
      routeStopsReferredToSales: stopsReferredAll,
      fieldSalesLeadsTotal,
      fieldSalesLeadsWon,
      fieldSalesWonRevenue: Math.round(fieldSalesWonRevenue),
      leadsWithQuoteCount,
      annualizedLeadValue: Math.round(annualizedLeadValueTotal),
      annualizedWonValue: Math.round(annualizedWonValueTotal),
      fieldSalesAnnualizedLeadValue: Math.round(fieldSalesAnnualizedLeadValue),
      fieldSalesAnnualizedWonValue: Math.round(fieldSalesAnnualizedWonValue),
    },
    last12Months: {
      windowFrom: from12IsoDate,
      windowTo: toIsoDate(now),
      leadsTotal: last12Total,
      leadsByStatus: last12ByStatus,
      leadsBySource: last12BySource,
      monthly,
      routeStopsCompleted: stopsCompletedLast12,
    },
    perUser,
    notes: {
      fieldSalesSourceValues: [...FIELD_SALES_SOURCES],
      inspectorDepartmentValue: 'inspector',
      technicianDepartmentValue: 'technician',
      dataCompleteness: truncationNote,
    },
  };
}

/**
 * Verify the current user has admin-equivalent access to a company.
 * Returns `{ ok: true }` when allowed, otherwise `{ ok: false, status, reason }`.
 */
export async function verifyCompanyAdminAccess(
  admin: SupabaseClient,
  userId: string,
  companyId: string,
  isGlobalAdmin = false
): Promise<
  | { ok: true; role: string }
  | { ok: false; status: number; reason: string }
> {
  if (isGlobalAdmin) return { ok: true, role: 'global_admin' };

  const { data, error } = await admin
    .from('user_companies')
    .select('role')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, reason: 'Lookup failed' };
  }
  if (!data) {
    return { ok: false, status: 403, reason: 'Not a member of this company' };
  }
  const allowed = ['owner', 'admin', 'manager'];
  if (!allowed.includes(data.role)) {
    return { ok: false, status: 403, reason: 'Insufficient role' };
  }
  return { ok: true, role: data.role as string };
}
