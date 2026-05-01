'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  FileText,
  TrendingUp,
  Target,
  DollarSign,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  BookmarkPlus,
  Folder,
  Send,
  RefreshCw,
  SlidersHorizontal,
  Check,
  Search,
  X,
} from 'lucide-react';
import { AdminChart, type ChartSpec } from './AdminChart';
import {
  SavedReportsDrawer,
  type SavedReport,
} from './SavedReportsDrawer';
import { TeamMemberCard } from './TeamMemberCard';
import { useBranches } from '@/hooks/useBranches';
import { authenticatedFetch } from '@/lib/api-client';
import styles from './FieldSalesAdminDashboard.module.scss';

// ── Types ─────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  fullName: string;
  email: string | null;
  avatarUrl?: string | null;
  uploadedAvatarUrl?: string | null;
  departments?: string[];
  roles?: string[];
}

interface TeamBreakdownRow {
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

interface AdminRecentLead {
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

interface CompareDailyPoint {
  date: string;
  submitted: number;
  won: number;
  pipelineValue: number;
  salesDollars: number;
  stops: number;
}

interface CompareSeries {
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

interface AdminReportData {
  filters: {
    from: string;
    to: string;
    userIds: string[] | null;
    leadSource: string[] | null;
    leadStatus: string[] | null;
    branchId: string | null;
    compare: 'users' | 'branches' | null;
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

interface GeneratedReport {
  title: string;
  summary: string;
  chart?: ChartSpec;
  table?: { columns: string[]; rows: string[][] };
}

interface FieldSalesAdminDashboardProps {
  companyId: string;
  greetingName?: string;
  scopeRole?: 'admin' | 'manager';
  managerUserId?: string;
  defaultBranchId?: string | null;
}

const COMPARE_METRICS = [
  { key: 'submitted', label: 'Submitted Leads' },
  { key: 'won', label: 'Won Leads' },
  { key: 'salesDollars', label: 'Won Revenue ($)' },
  { key: 'pipelineValue', label: 'Pipeline ($)' },
  { key: 'stops', label: 'Stops Done' },
] as const;

type CompareMetricKey = typeof COMPARE_METRICS[number]['key'];

type CompareKind = 'branches' | 'inspectors' | 'technicians' | 'managers';

const COMPARE_KIND_LABELS: Record<CompareKind, string> = {
  branches: 'Branches',
  inspectors: 'Inspectors',
  technicians: 'Technicians',
  managers: 'Teams',
};

// ── Constants ─────────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'mtd', label: 'This month' },
  { value: 'ytd', label: 'Year to date' },
] as const;

type DatePreset = typeof DATE_PRESETS[number]['value'];

const LEAD_SOURCE_OPTIONS = [
  { value: 'technician', label: 'Tech Leads' },
  { value: 'field_map', label: 'Field Map' },
  { value: 'widget', label: 'Widget' },
  { value: 'call', label: 'Calls' },
  { value: 'manual', label: 'Manual' },
];

const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in_process', label: 'In Process' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'scheduling', label: 'Scheduling' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function presetToDates(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const to = toIsoDate(now);
  if (preset === 'today') {
    return { from: to, to };
  }
  if (preset === 'mtd') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toIsoDate(d), to };
  }
  if (preset === 'ytd') {
    const d = new Date(now.getFullYear(), 0, 1);
    return { from: toIsoDate(d), to };
  }
  const days = parseInt(preset, 10);
  const from = new Date(now);
  from.setDate(from.getDate() - (days - 1));
  return { from: toIsoDate(from), to };
}

function formatCurrency(value: number): string {
  if (value >= 10000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function statusChipClass(status: string): string {
  switch (status) {
    case 'won':
      return styles.chipWon;
    case 'lost':
      return styles.chipLost;
    case 'scheduling':
    case 'quoted':
      return styles.chipScheduled;
    case 'new':
    case 'in_process':
      return styles.chipInProcess;
    default:
      return styles.chipNeutral;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'in_process':
      return 'In Process';
    case 'won':
      return 'Won';
    case 'lost':
      return 'Lost';
    case 'scheduling':
      return 'Scheduling';
    case 'quoted':
      return 'Quoted';
    case 'new':
      return 'New';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

// ── Component ─────────────────────────────────────────────────────────────

type MetricKey =
  | 'submitted'
  | 'won'
  | 'won_revenue'
  | 'pipeline'
  | 'tech_discussed'
  | 'leads_from_techs';

const METRIC_TITLES: Record<MetricKey, string> = {
  submitted: 'Submitted Leads',
  won: 'Won Leads',
  won_revenue: 'Won Leads (by Revenue)',
  pipeline: 'Pipeline Leads',
  tech_discussed: 'Tech Discussed Leads',
  leads_from_techs: 'Leads From Techs',
};

export function FieldSalesAdminDashboard({
  companyId,
  greetingName,
  scopeRole = 'admin',
  managerUserId,
  defaultBranchId = null,
}: FieldSalesAdminDashboardProps) {
  const [preset, setPreset] = useState<DatePreset>('30');
  const [dates, setDates] = useState(() => presetToDates('30'));
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [compareKind, setCompareKind] = useState<CompareKind>(
    scopeRole === 'admin' ? 'branches' : 'inspectors'
  );
  const [compareEntityIds, setCompareEntityIds] = useState<string[]>(
    defaultBranchId && scopeRole === 'admin' ? [defaultBranchId] : []
  );
  const [compareMetric, setCompareMetric] = useState<CompareMetricKey>(
    'submitted'
  );
  const [managerTeam, setManagerTeam] = useState<TeamMember[] | null>(null);
  const [companyUsers, setCompanyUsers] = useState<TeamMember[] | null>(null);
  const { branches: availableBranches } = useBranches(companyId);

  // mode is derived: 0-1 entities = single view, 2+ entities = compare view
  const mode: 'single' | 'compare' =
    compareEntityIds.length >= 2 ? 'compare' : 'single';

  // Wire-level compare value: inspectors/technicians both map to 'users';
  // managers/branches map to themselves.
  const wireCompareKind: 'users' | 'branches' | 'managers' =
    compareKind === 'branches'
      ? 'branches'
      : compareKind === 'managers'
        ? 'managers'
        : 'users';

  const router = useRouter();

  const [data, setData] = useState<AdminReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Metric drill-down modal (KPI card click → list of leads contributing
  // to that metric). Lead clicks inside the modal navigate via router.
  const [activeMetric, setActiveMetric] = useState<MetricKey | null>(null);
  const [metricLeads, setMetricLeads] = useState<AdminRecentLead[] | null>(
    null
  );
  const [metricLoading, setMetricLoading] = useState(false);

  const goToLead = useCallback(
    (leadId: string) => {
      router.push(`/field-sales/leads/${leadId}`);
    },
    [router]
  );

  // Custom prompt / Gemini state
  const [promptText, setPromptText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Saved reports state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Filter popover state
  const [filterOpen, setFilterOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(e.target as Node)
      ) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [filterOpen]);

  // ── Fetch full company roster (used by Compare-by lists for both scopes) ──
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}/users`);
        if (!res.ok) {
          if (!cancelled) setCompanyUsers([]);
          return;
        }
        const json = await res.json();
        const list: TeamMember[] = (json.users ?? []).map((u: any) => {
          const first = u.profile?.first_name ?? u.first_name ?? '';
          const last = u.profile?.last_name ?? u.last_name ?? '';
          const fullName =
            `${first} ${last}`.trim() ||
            u.profile?.email ||
            u.email ||
            'Unknown';
          return {
            id: u.id ?? u.user_id,
            fullName,
            email: u.profile?.email ?? u.email ?? null,
            avatarUrl: u.profile?.avatar_url ?? u.avatar_url ?? null,
            uploadedAvatarUrl:
              u.profile?.uploaded_avatar_url ?? u.uploaded_avatar_url ?? null,
            departments: Array.isArray(u.departments) ? u.departments : [],
            roles: Array.isArray(u.roles) ? u.roles : [],
          } as TeamMember;
        });
        if (!cancelled) setCompanyUsers(list);
      } catch {
        if (!cancelled) setCompanyUsers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  // ── Fetch manager's team (when in manager scope) ─────────────────────
  // /api/users/[id]/reports requires a Bearer token (verifyAuth) — use
  // authenticatedFetch so the Supabase session token is attached. A plain
  // fetch() returns 401 here, which would silently set managerTeam=[] and
  // make the Compare-By popover claim "No direct reports yet."
  useEffect(() => {
    if (scopeRole !== 'manager' || !managerUserId || !companyId) return;
    let cancelled = false;
    (async () => {
      try {
        const json = await authenticatedFetch(
          `/api/users/${managerUserId}/reports?companyId=${companyId}`
        );
        const list: TeamMember[] = (json.reports ?? []).map((r: any) => ({
          id: r.user_id,
          fullName:
            r.profile?.display_name ||
            `${r.profile?.first_name || ''} ${r.profile?.last_name || ''}`.trim() ||
            r.profile?.email ||
            'Unknown',
          email: r.profile?.email ?? null,
        }));
        if (!cancelled) setManagerTeam(list);
      } catch {
        if (!cancelled) setManagerTeam([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scopeRole, managerUserId, companyId]);

  // ── Fetch reports ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!companyId) return;
    // In manager scope: when no team is loaded yet, defer the request to
    // avoid querying for "all users" before the report list arrives.
    if (scopeRole === 'manager' && managerTeam === null) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('companyId', companyId);
      params.set('from', dates.from);
      params.set('to', dates.to);

      if (mode === 'compare') {
        params.set('compare', wireCompareKind);
        params.set('entityIds', compareEntityIds.join(','));
      } else if (compareEntityIds.length === 1) {
        // 1 entity selected = single-mode filter to that entity
        if (compareKind === 'branches') {
          params.set('branchId', compareEntityIds[0]);
        } else if (compareKind === 'managers') {
          // Pick a single manager → scope global metrics to their team
          // (their direct reports). Server expands managerId on its side.
          params.set('managerId', compareEntityIds[0]);
        } else {
          params.set('userIds', compareEntityIds[0]);
        }
      } else if (
        scopeRole === 'manager' &&
        managerTeam &&
        managerTeam.length > 0
      ) {
        // No selection in manager scope: scope to the manager's full team
        params.set('userIds', managerTeam.map(m => m.id).join(','));
      }

      if (selectedSources.length > 0)
        params.set('leadSource', selectedSources.join(','));
      if (selectedStatuses.length > 0)
        params.set('leadStatus', selectedStatuses.join(','));

      const res = await fetch(`/api/field-sales/admin-reports?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to load dashboard');
      }
      const json = (await res.json()) as AdminReportData;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    companyId,
    dates.from,
    dates.to,
    selectedSources,
    selectedStatuses,
    mode,
    wireCompareKind,
    compareKind,
    compareEntityIds,
    scopeRole,
    managerTeam,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Fetch saved reports ─────────────────────────────────────────────
  const fetchSaved = useCallback(async () => {
    if (!companyId) return;
    setSavedLoading(true);
    try {
      const res = await fetch(
        `/api/field-sales/admin-reports/saved?companyId=${companyId}`
      );
      if (!res.ok) return;
      const json = (await res.json()) as { reports: SavedReport[] };
      setSavedReports(json.reports ?? []);
    } finally {
      setSavedLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  // ── KPI drill-down: fetch the leads contributing to a single metric ──
  // Mirrors fetchData's filter shape so the modal stays consistent with
  // whatever the dashboard is currently filtered to. We only send filters
  // that are actually in effect — single-mode (1 entity selected) sets the
  // narrowed scope (branchId / managerId / userIds); manager-default scope
  // sends userIds for the manager's full team.
  const openMetric = useCallback(
    async (metric: MetricKey) => {
      if (!companyId) return;
      setActiveMetric(metric);
      setMetricLeads(null);
      setMetricLoading(true);

      const params = new URLSearchParams();
      params.set('companyId', companyId);
      params.set('from', dates.from);
      params.set('to', dates.to);
      params.set('metric', metric);

      if (mode !== 'compare' && compareEntityIds.length === 1) {
        if (compareKind === 'branches') {
          params.set('branchId', compareEntityIds[0]);
        } else if (compareKind === 'managers') {
          params.set('managerId', compareEntityIds[0]);
        } else {
          params.set('userIds', compareEntityIds[0]);
        }
      } else if (
        mode !== 'compare' &&
        scopeRole === 'manager' &&
        managerTeam &&
        managerTeam.length > 0
      ) {
        params.set('userIds', managerTeam.map(m => m.id).join(','));
      }
      if (selectedSources.length > 0) {
        params.set('leadSource', selectedSources.join(','));
      }
      if (selectedStatuses.length > 0) {
        params.set('leadStatus', selectedStatuses.join(','));
      }

      try {
        const res = await fetch(
          `/api/field-sales/admin-reports/leads?${params.toString()}`
        );
        if (!res.ok) {
          setMetricLeads([]);
          return;
        }
        const json = (await res.json()) as { leads: AdminRecentLead[] };
        setMetricLeads(json.leads ?? []);
      } catch {
        setMetricLeads([]);
      } finally {
        setMetricLoading(false);
      }
    },
    [
      companyId,
      dates.from,
      dates.to,
      mode,
      compareEntityIds,
      compareKind,
      scopeRole,
      managerTeam,
      selectedSources,
      selectedStatuses,
    ]
  );

  const closeMetricModal = useCallback(() => {
    setActiveMetric(null);
    setMetricLeads(null);
  }, []);

  // ── Filter handlers ──────────────────────────────────────────────────
  const handlePreset = (p: DatePreset) => {
    setPreset(p);
    setDates(presetToDates(p));
  };

  const toggleSource = (value: string) => {
    setSelectedSources(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleStatus = (value: string) => {
    setSelectedStatuses(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const clearAllFilters = () => {
    setSelectedSources([]);
    setSelectedStatuses([]);
    setCompareEntityIds([]);
    handlePreset('30');
  };

  // Available kinds the user can compare by. Managers and admins share the
  // same set — defaults differ (manager defaults to their own team) but
  // there are no access restrictions.
  const availableCompareKinds = useMemo<CompareKind[]>(
    () => ['branches', 'inspectors', 'technicians', 'managers'],
    []
  );

  // Full company roster — both admins and managers can compare against
  // anyone in the company. (managerTeam is still used for the default view
  // and the "My Team Overview" header, but no longer restricts the picker.)
  const scopedRoster = useMemo<TeamMember[]>(() => {
    if (!companyUsers) return [];
    return companyUsers;
  }, [companyUsers]);

  // Choices in the popover entity picker, swapping on compareKind
  const compareEntityChoices = useMemo<
    Array<{ id: string; label: string; subtitle?: string | null }>
  >(() => {
    if (compareKind === 'branches') {
      return availableBranches.map(b => ({
        id: b.id,
        label: b.name,
        subtitle: b.is_primary ? 'Primary' : null,
      }));
    }
    if (compareKind === 'managers') {
      return scopedRoster
        .filter(u => (u.roles ?? []).includes('manager'))
        .map(u => ({ id: u.id, label: u.fullName, subtitle: u.email }));
    }
    const dept = compareKind === 'inspectors' ? 'inspector' : 'technician';
    return scopedRoster
      .filter(u => (u.departments ?? []).includes(dept))
      .map(u => ({ id: u.id, label: u.fullName, subtitle: u.email }));
  }, [compareKind, availableBranches, scopedRoster]);

  const filteredCompareChoices = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return compareEntityChoices;
    return compareEntityChoices.filter(c =>
      `${c.label} ${c.subtitle ?? ''}`.toLowerCase().includes(q)
    );
  }, [compareEntityChoices, teamSearch]);

  // Reset selection whenever compareKind changes (entities aren't comparable
  // across kinds). Skipped when the caller is intentionally changing both
  // kind + ids in the same gesture (e.g. clicking a Team member card sets
  // kind='inspectors' AND entityIds=[member.id] together — without the skip
  // this effect would wipe the freshly-set selection on the next render).
  const skipNextKindResetRef = useRef(false);
  useEffect(() => {
    if (skipNextKindResetRef.current) {
      skipNextKindResetRef.current = false;
      return;
    }
    setCompareEntityIds([]);
  }, [compareKind]);

  const activeFilterCount =
    (compareEntityIds.length > 0 ? 1 : 0) +
    (selectedSources.length > 0 ? 1 : 0) +
    (selectedStatuses.length > 0 ? 1 : 0);

  const toggleCompareEntity = (id: string) => {
    setCompareEntityIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };


  // ── Prompt / Generate ────────────────────────────────────────────────
  const handleGenerate = async () => {
    const text = promptText.trim();
    if (!text || generating) return;
    setGenerating(true);
    setGenerateError(null);
    setGeneratedReport(null);
    try {
      const res = await fetch('/api/field-sales/admin-reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          prompt: text,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to generate report');
      }
      const json = await res.json();
      setGeneratedReport(json.result as GeneratedReport);
      setReportModalOpen(true);
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : 'Failed to generate report'
      );
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!reportModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReportModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reportModalOpen]);

  // ── Save current generated report ────────────────────────────────────
  const handleSave = async () => {
    if (!generatedReport || saving) return;
    const name = window.prompt(
      'Save this report as:',
      generatedReport.title ?? 'Untitled report'
    );
    if (!name || !name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/field-sales/admin-reports/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          name: name.trim(),
          prompt: promptText.trim(),
          filters: {
            preset,
            from: dates.from,
            to: dates.to,
            compareKind,
            compareEntityIds,
            leadSource: selectedSources,
            leadStatus: selectedStatuses,
          },
          lastResult: generatedReport,
        }),
      });
      if (res.ok) {
        setSaveToast('Saved to reports library');
        window.setTimeout(() => setSaveToast(null), 2500);
        await fetchSaved();
      } else {
        setSaveToast('Could not save. Please try again.');
        window.setTimeout(() => setSaveToast(null), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Saved report actions ─────────────────────────────────────────────
  const loadSaved = async (report: SavedReport) => {
    setDrawerOpen(false);
    setPromptText(report.prompt);
    const f = report.filters as {
      preset?: DatePreset;
      from?: string;
      to?: string;
      compareKind?: CompareKind;
      compareEntityIds?: string[];
      // Legacy fields from pre-Compare-by saved reports
      userIds?: string[] | null;
      branchId?: string | null;
      leadSource?: string[] | null;
      leadStatus?: string[] | null;
    };
    if (f?.preset) setPreset(f.preset);
    if (f?.from && f?.to) setDates({ from: f.from, to: f.to });

    if (f?.compareKind && Array.isArray(f.compareEntityIds)) {
      setCompareKind(f.compareKind);
      setCompareEntityIds(f.compareEntityIds);
    } else if (f?.branchId) {
      setCompareKind('branches');
      setCompareEntityIds([f.branchId]);
    } else if (Array.isArray(f?.userIds) && f.userIds.length > 0) {
      // Legacy: assume inspector unless we know otherwise (department info
      // arrives async with the company roster, so default to inspectors)
      setCompareKind('inspectors');
      setCompareEntityIds(f.userIds);
    } else {
      setCompareEntityIds([]);
    }

    setSelectedSources(Array.isArray(f?.leadSource) ? f.leadSource : []);
    setSelectedStatuses(Array.isArray(f?.leadStatus) ? f.leadStatus : []);

    if (report.lastResult) {
      setGeneratedReport(report.lastResult as GeneratedReport);
      setReportModalOpen(true);
    } else {
      setGeneratedReport(null);
    }
    setGenerateError(null);

    // Kick off a fresh generation in the background
    setGenerating(true);
    try {
      const res = await fetch('/api/field-sales/admin-reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          prompt: report.prompt,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setGeneratedReport(json.result as GeneratedReport);
        setReportModalOpen(true);
      }
    } finally {
      setGenerating(false);
    }
  };

  const renameSaved = async (id: string, name: string) => {
    const res = await fetch(`/api/field-sales/admin-reports/saved/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      await fetchSaved();
    }
  };

  const deleteSaved = async (id: string) => {
    const res = await fetch(`/api/field-sales/admin-reports/saved/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await fetchSaved();
    }
  };

  // ── Derived charts ───────────────────────────────────────────────────
  const sparklineChart: ChartSpec | null = useMemo(() => {
    if (!data || data.sparkline.length === 0) return null;
    return {
      type: 'area',
      xKey: 'date',
      series: [{ key: 'count', label: 'Leads' }],
      data: data.sparkline.map(p => ({
        date: p.date.slice(5),
        count: p.count,
      })),
    };
  }, [data]);

  const teamChart: ChartSpec | null = useMemo(() => {
    if (!data || data.teamBreakdown.length === 0) return null;
    return {
      type: 'bar',
      xKey: 'name',
      series: [
        { key: 'submitted', label: 'Submitted' },
        { key: 'won', label: 'Won' },
      ],
      data: data.teamBreakdown.slice(0, 8).map(t => ({
        name:
          t.fullName.length > 16
            ? `${t.fullName.slice(0, 14)}…`
            : t.fullName,
        submitted: t.submitted,
        won: t.won,
      })),
    };
  }, [data]);

  // ── Render ───────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{today}</p>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>
              {greetingName
                ? `${greetingName}'s Team Dashboard`
                : 'Team Dashboard'}
            </h1>
            <p className={styles.subtitle}>
              Aggregated field-sales activity across your inspectors &amp; technicians.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.savedBtn} ${styles.savedBtnDisabled ?? ''}`}
              disabled
              aria-disabled="true"
              title="Coming soon"
            >
              <Folder size={14} />
              <span>Saved Reports</span>
              <span className={styles.savedComingSoon}>(coming soon)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.presetRow}>
          {DATE_PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              className={`${styles.presetChip} ${preset === p.value ? styles.presetChipActive : ''}`}
              onClick={() => handlePreset(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className={styles.filterControls}>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={clearAllFilters}
            disabled={
              compareEntityIds.length === 0 &&
              selectedSources.length === 0 &&
              selectedStatuses.length === 0 &&
              preset === '30'
            }
          >
            Clear all
          </button>
          <div className={styles.filterPopoverWrap} ref={filterPopoverRef}>
            <button
              type="button"
              className={`${styles.filterTriggerBtn} ${filterOpen ? styles.filterTriggerBtnOpen : ''}`}
              onClick={() => setFilterOpen(o => !o)}
              aria-label="Filters"
              aria-expanded={filterOpen}
            >
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && (
                <span className={styles.filterBadge}>{activeFilterCount}</span>
              )}
            </button>

            {filterOpen && (
              <div className={styles.filterPopover} role="dialog">
                <div className={styles.popoverSection}>
                  <div className={styles.popoverSectionHeader}>
                    <span className={styles.popoverSectionLabel}>
                      Compare by
                    </span>
                    {compareEntityIds.length > 0 && (
                      <button
                        type="button"
                        className={styles.popoverSectionClear}
                        onClick={() => setCompareEntityIds([])}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className={styles.popoverChipRow}>
                    {availableCompareKinds.map(k => (
                      <button
                        key={k}
                        type="button"
                        className={`${styles.filterChip} ${compareKind === k ? styles.filterChipActive : ''}`}
                        onClick={() => setCompareKind(k)}
                      >
                        {COMPARE_KIND_LABELS[k]}
                      </button>
                    ))}
                  </div>
                  <p className={styles.popoverHelp}>
                    Pick 1 to filter the dashboard. Pick 2+ to compare them
                    side-by-side.
                  </p>
                  <div className={styles.popoverSearch}>
                    <Search size={14} className={styles.popoverSearchIcon} />
                    <input
                      type="text"
                      className={styles.popoverSearchInput}
                      placeholder={`Search ${COMPARE_KIND_LABELS[compareKind].toLowerCase()}`}
                      value={teamSearch}
                      onChange={e => setTeamSearch(e.target.value)}
                    />
                  </div>
                  <div className={styles.popoverMemberList}>
                    {filteredCompareChoices.map(c => {
                      const isSelected = compareEntityIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`${styles.popoverMemberRow} ${isSelected ? styles.popoverMemberRowSelected : ''}`}
                          onClick={() => toggleCompareEntity(c.id)}
                        >
                          <span className={styles.popoverMemberRowLabel}>
                            <span>{c.label}</span>
                            {c.subtitle && (
                              <span className={styles.popoverMemberRowSubtitle}>
                                {c.subtitle}
                              </span>
                            )}
                          </span>
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                    {filteredCompareChoices.length === 0 && (
                      <div className={styles.popoverEmpty}>
                        {`No ${COMPARE_KIND_LABELS[compareKind].toLowerCase()} match.`}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.popoverSection}>
                  <div className={styles.popoverSectionHeader}>
                    <span className={styles.popoverSectionLabel}>Source</span>
                    {selectedSources.length > 0 && (
                      <button
                        type="button"
                        className={styles.popoverSectionClear}
                        onClick={() => setSelectedSources([])}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className={styles.popoverChipRow}>
                    {LEAD_SOURCE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.filterChip} ${selectedSources.includes(opt.value) ? styles.filterChipActive : ''}`}
                        onClick={() => toggleSource(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.popoverSection}>
                  <div className={styles.popoverSectionHeader}>
                    <span className={styles.popoverSectionLabel}>Status</span>
                    {selectedStatuses.length > 0 && (
                      <button
                        type="button"
                        className={styles.popoverSectionClear}
                        onClick={() => setSelectedStatuses([])}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className={styles.popoverChipRow}>
                    {LEAD_STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.filterChip} ${selectedStatuses.includes(opt.value) ? styles.filterChipActive : ''}`}
                        onClick={() => toggleStatus(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {compareEntityIds.length > 0 && (
          <div className={styles.compareStrip}>
            <span className={styles.compareStripLabel}>
              {mode === 'compare' ? 'Comparing' : 'Filtered to'}:
            </span>
            <span className={styles.compareStripKind}>
              {COMPARE_KIND_LABELS[compareKind]}
            </span>
            <span className={styles.compareStripCount}>
              {compareEntityIds.length} selected
            </span>
            <button
              type="button"
              className={styles.compareStripClear}
              onClick={() => setCompareEntityIds([])}
              aria-label="Clear comparison"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {loading && <DashboardSkeleton />}
      {error && <div className={styles.error}>{error}</div>}

      {data && !loading && mode === 'compare' && (
        <CompareView
          data={data}
          compareKind={compareKind}
          compareEntityIds={compareEntityIds}
          choices={compareEntityChoices}
          metric={compareMetric}
          onMetricChange={setCompareMetric}
          onToggleEntity={toggleCompareEntity}
        />
      )}

      {data && !loading && mode === 'single' && (
        <>
          <section className={styles.section}>
            <header className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <Users size={18} />
              </div>
              <div className={styles.sectionHeaderText}>
                <h2 className={styles.sectionTitle}>
                  {scopeRole === 'manager' ? 'My Team Overview' : 'Team Overview'}
                </h2>
                <p className={styles.sectionSubtitle}>
                  {data.filters.from} – {data.filters.to}
                </p>
              </div>
            </header>

            <div className={styles.kpiGrid}>
              <KpiCard
                icon={<FileText size={18} />}
                label="Submitted"
                value={data.totals.submitted}
                variant="primary"
                onClick={() => openMetric('submitted')}
              />
              <KpiCard
                icon={<TrendingUp size={18} />}
                label="Won"
                value={data.totals.won}
                variant="success"
                onClick={() => openMetric('won')}
              />
              <KpiCard
                icon={<Target size={18} />}
                label="Win Rate"
                value={`${data.totals.winRate}%`}
                variant="accent"
              />
              <KpiCard
                icon={<DollarSign size={18} />}
                label="Won Revenue"
                value={formatCurrency(data.totals.wonRevenue)}
                variant="success"
                onClick={() => openMetric('won_revenue')}
              />
              <KpiCard
                icon={<DollarSign size={18} />}
                label="Pipeline"
                value={formatCurrency(data.totals.pipelineValue)}
                onClick={() => openMetric('pipeline')}
              />
              <KpiCard
                icon={<CheckCircle2 size={18} />}
                label="Stops Done"
                value={data.totals.stopsCompleted}
              />
              <KpiCard
                icon={<ArrowUpRight size={18} />}
                label="Leads From Techs"
                value={data.totals.leadsFromTechs}
                variant="accent"
                onClick={() => openMetric('leads_from_techs')}
              />
              <KpiCard
                icon={<Sparkles size={18} />}
                label="Tech Discussed"
                value={data.totals.techDiscussedCount}
                onClick={() => openMetric('tech_discussed')}
              />
            </div>
          </section>

          {sparklineChart && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Submissions Over Time</h3>
                <span className={styles.cardMeta}>
                  {data.totals.submitted} leads
                </span>
              </div>
              <AdminChart spec={sparklineChart} height={200} />
            </div>
          )}

          {teamChart && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Top Team Members</h3>
                <span className={styles.cardMeta}>
                  {data.teamBreakdown.length} active
                </span>
              </div>
              <AdminChart spec={teamChart} height={240} />
            </div>
          )}

          {data.teamBreakdown.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Team</h3>
                <span className={styles.cardMeta}>
                  {data.teamBreakdown.length}
                </span>
              </div>
              <div className={styles.teamGrid}>
                {data.teamBreakdown.slice(0, 60).map(member => {
                  const isActive =
                    compareKind !== 'branches' &&
                    compareEntityIds.length === 1 &&
                    compareEntityIds[0] === member.userId;
                  return (
                    <TeamMemberCard
                      key={member.userId}
                      member={member}
                      isActive={isActive}
                      onToggle={id => {
                        const depts = member.departments ?? [];
                        const targetKind: CompareKind = depts.includes(
                          'technician'
                        )
                          ? 'technicians'
                          : 'inspectors';
                        const isClearingSelf =
                          compareEntityIds.length === 1 &&
                          compareEntityIds[0] === id;
                        if (isClearingSelf) {
                          setCompareEntityIds([]);
                        } else {
                          // Tell the kind-change reset effect to skip its
                          // next firing — we're setting kind + ids atomically.
                          // Only set the ref when the kind is actually
                          // changing; otherwise it would stay armed and
                          // suppress the next legitimate kind change.
                          if (compareKind !== targetKind) {
                            skipNextKindResetRef.current = true;
                          }
                          setCompareKind(targetKind);
                          setCompareEntityIds([id]);
                        }
                        // Scroll back to the top so the user sees the
                        // "Filtered to:" pill and the KPI/chart updates —
                        // the team cards live at the bottom of the page.
                        if (typeof window !== 'undefined') {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {data.recentLeads.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Recent Leads</h3>
                <span className={styles.cardMeta}>
                  {data.recentLeads.length}
                </span>
              </div>
              <ul className={styles.list}>
                {data.recentLeads.map(lead => (
                  <li key={lead.id} className={styles.listItem}>
                    <button
                      type="button"
                      onClick={() => goToLead(lead.id)}
                      className={styles.listItemLink}
                    >
                      <div className={styles.listItemBody}>
                        <div className={styles.listItemTitle}>
                          {lead.customerName}
                        </div>
                        <div className={styles.listItemMeta}>
                          <span
                            className={`${styles.statusChip} ${statusChipClass(lead.status)}`}
                          >
                            {statusLabel(lead.status)}
                          </span>
                          {lead.submittedByName && (
                            <span className={styles.metaPill}>
                              {lead.submittedByName}
                            </span>
                          )}
                          {lead.serviceType && (
                            <span className={styles.metaPill}>
                              {lead.serviceType}
                            </span>
                          )}
                          {(lead.city || lead.state) && (
                            <span className={styles.metaText}>
                              {[lead.city, lead.state].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.listItemTrailing}>
                        {lead.estimatedValue ? (
                          <span className={styles.money}>
                            {formatCurrency(Number(lead.estimatedValue))}
                          </span>
                        ) : null}
                        <span className={styles.relativeTime}>
                          {formatRelative(lead.createdAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Custom prompt box — temporarily hidden while we rework the AI flow */}
      {false && (
      <section className={styles.promptSection}>
        <header className={styles.sectionHeader}>
          <div className={styles.sectionIcon} data-variant="ai">
            <Sparkles size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h2 className={styles.sectionTitle}>Ask the Data</h2>
            <p className={styles.sectionSubtitle}>
              Describe a report — this ignores the filters above and looks at every lead, route, and team member for your company.
            </p>
          </div>
        </header>

        <div
          className={`${styles.promptBox} ${generating ? styles.promptBoxGenerating : ''}`}
        >
          <textarea
            className={styles.promptInput}
            placeholder="e.g., Show me daily new leads this month as a line chart broken down by source."
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            rows={3}
            disabled={generating}
          />

          {generating && (
            <div className={styles.promptLoading}>
              <div className={styles.promptLoadingBar}>
                <span className={styles.promptLoadingFill} />
              </div>
              <div className={styles.promptLoadingText}>
                <Sparkles size={14} className={styles.promptLoadingIcon} />
                <span>Analyzing your data and building the report…</span>
              </div>
            </div>
          )}

          <div className={styles.promptActions}>
            {generatedReport && !generating && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setReportModalOpen(true)}
              >
                View last report
              </button>
            )}
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleGenerate}
              disabled={generating || promptText.trim().length < 3}
            >
              {generating ? (
                <>
                  <RefreshCw size={14} className={styles.spin} />
                  Generating…
                </>
              ) : (
                <>
                  <Send size={14} />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {generateError && <div className={styles.error}>{generateError}</div>}

        {saveToast && <div className={styles.toast}>{saveToast}</div>}
      </section>
      )}

      {reportModalOpen && generatedReport && (
        <div
          className={styles.reportModalOverlay}
          onClick={() => setReportModalOpen(false)}
        >
          <div
            className={styles.reportModal}
            role="dialog"
            aria-modal="true"
            aria-label={generatedReport.title}
            onClick={e => e.stopPropagation()}
          >
            <header className={styles.reportModalHeader}>
              <div className={styles.reportModalTitleWrap}>
                <div className={styles.reportModalEyebrow}>
                  <Sparkles size={12} />
                  <span>AI Report</span>
                </div>
                <h2 className={styles.reportModalTitle}>
                  {generatedReport.title}
                </h2>
              </div>
              <button
                type="button"
                className={styles.reportModalClose}
                onClick={() => setReportModalOpen(false)}
                aria-label="Close report"
              >
                <X size={18} />
              </button>
            </header>

            <div className={styles.reportModalBody}>
              {generatedReport.summary && (
                <p className={styles.generatedSummary}>
                  {generatedReport.summary}
                </p>
              )}
              {generatedReport.chart && (
                <div className={styles.generatedChart}>
                  <AdminChart spec={generatedReport.chart} height={320} />
                </div>
              )}
              {generatedReport.table &&
                generatedReport.table.rows.length > 0 && (
                  <div className={styles.tableWrap}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          {generatedReport.table.columns.map(col => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {generatedReport.table.rows.map((row, idx) => (
                          <tr key={idx}>
                            {row.map((cell, cidx) => (
                              <td key={cidx}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>

            <footer className={styles.reportModalFooter}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setReportModalOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSave}
                disabled={saving}
              >
                <BookmarkPlus size={14} />
                {saving ? 'Saving…' : 'Save Report'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {activeMetric && (
        <MetricLeadsModal
          title={METRIC_TITLES[activeMetric]}
          loading={metricLoading}
          leads={metricLeads ?? []}
          onClose={closeMetricModal}
          onLeadClick={leadId => {
            closeMetricModal();
            goToLead(leadId);
          }}
        />
      )}

      <SavedReportsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        reports={savedReports}
        loading={savedLoading}
        onLoad={loadSaved}
        onRename={renameSaved}
        onDelete={deleteSaved}
      />
    </div>
  );
}

interface CompareViewProps {
  data: AdminReportData;
  compareKind: CompareKind;
  compareEntityIds: string[];
  choices: Array<{ id: string; label: string; subtitle?: string | null }>;
  metric: CompareMetricKey;
  onMetricChange: (m: CompareMetricKey) => void;
  onToggleEntity: (id: string) => void;
}

function CompareView({
  data,
  compareKind,
  compareEntityIds,
  choices,
  metric,
  onMetricChange,
  onToggleEntity,
}: CompareViewProps) {
  const series = useMemo(() => data.compareSeries ?? [], [data.compareSeries]);

  const chartSpec: ChartSpec | null = useMemo(() => {
    if (series.length === 0) return null;
    const dayKeys = series[0]?.daily.map(p => p.date) ?? [];
    // Key chart columns/series by entityId, not entityLabel — two compared
    // entities can legitimately share a display name (e.g. test users), and
    // a name collision would overwrite the data row and collapse both lines
    // onto one. entityLabel stays as the user-visible legend text.
    const rows = dayKeys.map(date => {
      const row: Record<string, string | number> = { date: date.slice(5) };
      for (const s of series) {
        const point = s.daily.find(p => p.date === date);
        row[s.entityId] = point ? (point as any)[metric] : 0;
      }
      return row;
    });
    return {
      type: 'line',
      xKey: 'date',
      series: series.map(s => ({ key: s.entityId, label: s.entityLabel })),
      data: rows,
    };
  }, [series, metric]);

  const totalsTable = useMemo(() => {
    return series.map(s => ({
      entity: s.entityLabel,
      submitted: s.totals.submitted,
      won: s.totals.won,
      pipeline: s.totals.pipelineValue,
      sales: s.totals.salesDollars,
      stops: s.totals.stops,
    }));
  }, [series]);

  const compareLabel = COMPARE_KIND_LABELS[compareKind].toLowerCase();
  const selectedChoices = useMemo(
    () => choices.filter(c => compareEntityIds.includes(c.id)),
    [choices, compareEntityIds]
  );

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>
          <Users size={18} />
        </div>
        <div className={styles.sectionHeaderText}>
          <h2 className={styles.sectionTitle}>
            Comparing {COMPARE_KIND_LABELS[compareKind]}
          </h2>
          <p className={styles.sectionSubtitle}>
            Use the filter to add or remove {compareLabel}. Switch metrics to
            view different dimensions.
          </p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Selection</h3>
          <span className={styles.cardMeta}>
            {compareEntityIds.length} selected
          </span>
        </div>
        <div className={styles.compareSelectionChips}>
          {selectedChoices.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggleEntity(c.id)}
              className={`${styles.filterChip} ${styles.filterChipActive}`}
            >
              {c.label}
              <X size={12} />
            </button>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Metric</h3>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            padding: '8px 16px 16px',
          }}
        >
          {COMPARE_METRICS.map(m => (
            <button
              key={m.key}
              type="button"
              onClick={() => onMetricChange(m.key)}
              className={`${styles.filterChip} ${metric === m.key ? styles.filterChipActive : ''}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {chartSpec && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              {COMPARE_METRICS.find(m => m.key === metric)?.label}
            </h3>
          </div>
          <AdminChart spec={chartSpec} height={280} />
        </div>
      )}

      {totalsTable.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Totals</h3>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>
                    {compareKind === 'branches' ? 'Branch' : 'Team Member'}
                  </th>
                  <th>Submitted</th>
                  <th>Won</th>
                  <th>Pipeline</th>
                  <th>Sales $</th>
                  <th>Stops</th>
                </tr>
              </thead>
              <tbody>
                {totalsTable.map(r => (
                  <tr key={r.entity}>
                    <td>{r.entity}</td>
                    <td>{r.submitted}</td>
                    <td>{r.won}</td>
                    <td>{r.pipeline.toLocaleString()}</td>
                    <td>{r.sales.toLocaleString()}</td>
                    <td>{r.stops}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  variant?: 'primary' | 'success' | 'accent' | 'default';
  onClick?: () => void;
}

function KpiCard({
  icon,
  label,
  value,
  variant = 'default',
  onClick,
}: KpiCardProps) {
  const className = `${styles.kpi} ${styles[`kpi-${variant}`]} ${
    onClick ? styles.kpiClickable ?? '' : ''
  }`;
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        <div className={styles.kpiIcon}>{icon}</div>
        <div className={styles.kpiValue}>{value}</div>
        <div className={styles.kpiLabel}>{label}</div>
      </button>
    );
  }
  return (
    <div className={className}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiLabel}>{label}</div>
    </div>
  );
}

interface MetricLeadsModalProps {
  title: string;
  loading: boolean;
  leads: AdminRecentLead[];
  onClose: () => void;
  onLeadClick: (leadId: string) => void;
}

function MetricLeadsModal({
  title,
  loading,
  leads,
  onClose,
  onLeadClick,
}: MetricLeadsModalProps) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className={styles.metricModalBackdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.metricModalCard}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.metricModalHeader}>
          <h3 className={styles.metricModalTitle}>{title}</h3>
          <div className={styles.metricModalHeaderRight}>
            {!loading && (
              <span className={styles.cardMeta}>{leads.length}</span>
            )}
            <button
              type="button"
              onClick={onClose}
              className={styles.metricModalClose}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className={styles.metricModalBody}>
          {loading && (
            <div className={styles.metricModalEmpty}>Loading…</div>
          )}
          {!loading && leads.length === 0 && (
            <div className={styles.metricModalEmpty}>
              No leads match this metric for the current filters.
            </div>
          )}
          {!loading && leads.length > 0 && (
            <ul className={styles.list}>
              {leads.map(lead => (
                <li key={lead.id} className={styles.listItem}>
                  <button
                    type="button"
                    onClick={() => onLeadClick(lead.id)}
                    className={styles.listItemLink}
                  >
                    <div className={styles.listItemBody}>
                      <div className={styles.listItemTitle}>
                        {lead.customerName}
                      </div>
                      <div className={styles.listItemMeta}>
                        <span
                          className={`${styles.statusChip} ${statusChipClass(lead.status)}`}
                        >
                          {statusLabel(lead.status)}
                        </span>
                        {lead.serviceType && (
                          <span className={styles.metaPill}>
                            {lead.serviceType}
                          </span>
                        )}
                        {(lead.city || lead.state) && (
                          <span className={styles.metaText}>
                            {[lead.city, lead.state]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.listItemTrailing}>
                      {lead.estimatedValue ? (
                        <span className={styles.money}>
                          {formatCurrency(Number(lead.estimatedValue))}
                        </span>
                      ) : null}
                      <span className={styles.relativeTime}>
                        {formatRelative(lead.createdAt)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  const kpiSlots = Array.from({ length: 8 });
  const leaderboardRows = Array.from({ length: 5 });
  const recentRows = Array.from({ length: 6 });

  return (
    <>
      <section className={styles.section} aria-busy="true" aria-live="polite">
        <header className={styles.sectionHeader}>
          <div className={styles.skeletonCircle} style={{ width: 40, height: 40 }} />
          <div className={styles.sectionHeaderText}>
            <span className={styles.skeletonLine} style={{ width: 160, height: 14 }} />
            <span
              className={`${styles.skeletonLine} ${styles.skeletonSectionSubtitle}`}
              style={{ width: 220, height: 10 }}
            />
          </div>
        </header>

        <div className={styles.kpiGrid}>
          {kpiSlots.map((_, i) => (
            <div
              key={i}
              className={`${styles.kpi} ${styles['kpi-default']} ${styles.skeletonKpi}`}
            >
              <div className={styles.skeletonKpiIconRow}>
                <span
                  className={styles.skeletonCircle}
                  style={{ width: 28, height: 28 }}
                />
              </div>
              <span
                className={styles.skeletonLine}
                style={{ width: '60%', height: 22 }}
              />
              <span
                className={styles.skeletonLine}
                style={{ width: '45%', height: 10 }}
              />
            </div>
          ))}
        </div>
      </section>

      <div className={styles.card} aria-busy="true">
        <div className={styles.cardHeader}>
          <span
            className={styles.skeletonLine}
            style={{ width: 180, height: 14 }}
          />
          <span
            className={styles.skeletonLine}
            style={{ width: 70, height: 10 }}
          />
        </div>
        <span
          className={styles.skeletonBlock}
          style={{ height: 200 }}
        />
      </div>

      <div className={styles.card} aria-busy="true">
        <div className={styles.cardHeader}>
          <span
            className={styles.skeletonLine}
            style={{ width: 160, height: 14 }}
          />
          <span
            className={styles.skeletonLine}
            style={{ width: 70, height: 10 }}
          />
        </div>
        <span
          className={styles.skeletonBlock}
          style={{ height: 240 }}
        />
      </div>

      <div className={styles.card} aria-busy="true">
        <div className={styles.cardHeader}>
          <span
            className={styles.skeletonLine}
            style={{ width: 140, height: 14 }}
          />
        </div>
        <div>
          {leaderboardRows.map((_, i) => (
            <div key={i} className={styles.skeletonListRow}>
              <span className={styles.skeletonCircle} />
              <div className={styles.skeletonListBody}>
                <span
                  className={styles.skeletonLine}
                  style={{ width: '45%', height: 12 }}
                />
                <span
                  className={styles.skeletonLine}
                  style={{ width: '70%', height: 10 }}
                />
              </div>
              <div className={styles.skeletonListTrailing}>
                <span
                  className={styles.skeletonLine}
                  style={{ width: 80, height: 12 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card} aria-busy="true">
        <div className={styles.cardHeader}>
          <span
            className={styles.skeletonLine}
            style={{ width: 120, height: 14 }}
          />
          <span
            className={styles.skeletonLine}
            style={{ width: 32, height: 10 }}
          />
        </div>
        <div>
          {recentRows.map((_, i) => (
            <div key={i} className={styles.skeletonListRow}>
              <div className={styles.skeletonListBody}>
                <span
                  className={styles.skeletonLine}
                  style={{ width: '55%', height: 12 }}
                />
                <span
                  className={styles.skeletonLine}
                  style={{ width: '80%', height: 10 }}
                />
              </div>
              <div className={styles.skeletonListTrailing}>
                <span
                  className={styles.skeletonLine}
                  style={{ width: 60, height: 12 }}
                />
                <span
                  className={styles.skeletonLine}
                  style={{ width: 40, height: 8 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
