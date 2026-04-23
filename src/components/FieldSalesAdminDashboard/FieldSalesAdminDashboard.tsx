'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  TechLeadDetailModal,
  type TechLead,
} from '@/components/TechLeads/TechLeadDetailModal/TechLeadDetailModal';
import { AdminChart, type ChartSpec } from './AdminChart';
import {
  SavedReportsDrawer,
  type SavedReport,
} from './SavedReportsDrawer';
import styles from './FieldSalesAdminDashboard.module.scss';

// ── Types ─────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  fullName: string;
  email: string | null;
}

interface TeamBreakdownRow {
  userId: string;
  fullName: string;
  submitted: number;
  won: number;
  lost: number;
  inProcess: number;
  wonRevenue: number;
  techDiscussedCount: number;
  stopsCompleted: number;
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

interface AdminReportData {
  filters: {
    from: string;
    to: string;
    userIds: string[] | null;
    leadSource: string[] | null;
    leadStatus: string[] | null;
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
  };
  sparkline: { date: string; count: number }[];
  leadsByStatus: { status: string; count: number }[];
  leadsBySource: { source: string; count: number }[];
  teamBreakdown: TeamBreakdownRow[];
  recentLeads: AdminRecentLead[];
  teamMembers: TeamMember[];
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
}

// ── Constants ─────────────────────────────────────────────────────────────

const DATE_PRESETS = [
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

export function FieldSalesAdminDashboard({
  companyId,
  greetingName,
}: FieldSalesAdminDashboardProps) {
  const [preset, setPreset] = useState<DatePreset>('30');
  const [dates, setDates] = useState(() => presetToDates('30'));
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const [data, setData] = useState<AdminReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLead, setSelectedLead] = useState<TechLead | null>(null);
  const [leadLoadingId, setLeadLoadingId] = useState<string | null>(null);

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

  // ── Fetch reports ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('companyId', companyId);
      params.set('from', dates.from);
      params.set('to', dates.to);
      if (selectedUser) params.set('userIds', selectedUser);
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
  }, [companyId, dates.from, dates.to, selectedUser, selectedSources, selectedStatuses]);

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

  // ── Lead drill-down ──────────────────────────────────────────────────
  const openLead = async (leadId: string) => {
    if (leadLoadingId) return;
    setLeadLoadingId(leadId);
    try {
      const res = await fetch(
        `/api/tech-leads/leads?companyId=${companyId}&leadId=${leadId}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.lead) setSelectedLead(json.lead);
      }
    } finally {
      setLeadLoadingId(null);
    }
  };

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
    setSelectedUser(null);
    setSelectedSources([]);
    setSelectedStatuses([]);
    handlePreset('30');
  };

  const filteredTeamMembers = useMemo(() => {
    const members = data?.teamMembers ?? [];
    const q = teamSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m => m.fullName.toLowerCase().includes(q));
  }, [data?.teamMembers, teamSearch]);

  const selectedTeamMemberName = useMemo(() => {
    if (!selectedUser) return null;
    return (
      data?.teamMembers.find(m => m.id === selectedUser)?.fullName ?? null
    );
  }, [data?.teamMembers, selectedUser]);

  const activeFilterCount =
    (selectedUser ? 1 : 0) +
    (selectedSources.length > 0 ? 1 : 0) +
    (selectedStatuses.length > 0 ? 1 : 0);

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
            userIds: selectedUser ? [selectedUser] : null,
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
      userIds?: string[] | null;
      leadSource?: string[] | null;
      leadStatus?: string[] | null;
    };
    if (f?.preset) setPreset(f.preset);
    if (f?.from && f?.to) setDates({ from: f.from, to: f.to });
    setSelectedUser(
      Array.isArray(f?.userIds) && f.userIds.length > 0 ? f.userIds[0] : null
    );
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
              className={styles.savedBtn}
              onClick={() => setDrawerOpen(true)}
            >
              <Folder size={14} />
              <span>Saved Reports</span>
              {savedReports.length > 0 && (
                <span className={styles.savedBadge}>{savedReports.length}</span>
              )}
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
              !selectedUser &&
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
                    <span className={styles.popoverSectionLabel}>Team Member</span>
                    {selectedUser && (
                      <button
                        type="button"
                        className={styles.popoverSectionClear}
                        onClick={() => setSelectedUser(null)}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {selectedTeamMemberName && (
                    <div className={styles.popoverSelectedHint}>
                      {selectedTeamMemberName}
                    </div>
                  )}
                  <div className={styles.popoverSearch}>
                    <Search size={14} className={styles.popoverSearchIcon} />
                    <input
                      type="text"
                      className={styles.popoverSearchInput}
                      placeholder="Search team members"
                      value={teamSearch}
                      onChange={e => setTeamSearch(e.target.value)}
                    />
                  </div>
                  <div className={styles.popoverMemberList}>
                    <button
                      type="button"
                      className={`${styles.popoverMemberRow} ${selectedUser === null ? styles.popoverMemberRowSelected : ''}`}
                      onClick={() => setSelectedUser(null)}
                    >
                      <span>All team members</span>
                      {selectedUser === null && <Check size={14} />}
                    </button>
                    {filteredTeamMembers.map(m => {
                      const isSelected = selectedUser === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`${styles.popoverMemberRow} ${isSelected ? styles.popoverMemberRowSelected : ''}`}
                          onClick={() => setSelectedUser(isSelected ? null : m.id)}
                        >
                          <span>{m.fullName}</span>
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                    {filteredTeamMembers.length === 0 && (
                      <div className={styles.popoverEmpty}>
                        No team members match &quot;{teamSearch}&quot;
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
      </div>

      {loading && <DashboardSkeleton />}
      {error && <div className={styles.error}>{error}</div>}

      {data && !loading && (
        <>
          <section className={styles.section}>
            <header className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <Users size={18} />
              </div>
              <div className={styles.sectionHeaderText}>
                <h2 className={styles.sectionTitle}>Team Overview</h2>
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
              />
              <KpiCard
                icon={<TrendingUp size={18} />}
                label="Won"
                value={data.totals.won}
                variant="success"
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
              />
              <KpiCard
                icon={<DollarSign size={18} />}
                label="Pipeline"
                value={formatCurrency(data.totals.pipelineValue)}
              />
              <KpiCard
                icon={<CheckCircle2 size={18} />}
                label="Stops Done"
                value={data.totals.stopsCompleted}
              />
              <KpiCard
                icon={<ArrowUpRight size={18} />}
                label="Referred"
                value={data.totals.referredToSales}
                variant="accent"
              />
              <KpiCard
                icon={<Sparkles size={18} />}
                label="Tech Discussed"
                value={data.totals.techDiscussedCount}
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
                <h3 className={styles.cardTitle}>Team Leaderboard</h3>
              </div>
              <ul className={styles.list}>
                {data.teamBreakdown.map(member => (
                  <li key={member.userId} className={styles.listItem}>
                    <button
                      type="button"
                      className={styles.listItemLink}
                      onClick={() =>
                        setSelectedUser(current =>
                          current === member.userId ? null : member.userId
                        )
                      }
                    >
                      <div className={styles.avatarCircle}>
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.listItemBody}>
                        <div className={styles.listItemTitle}>
                          {member.fullName}
                        </div>
                        <div className={styles.listItemMeta}>
                          <span className={styles.metaPill}>
                            {member.submitted} submitted
                          </span>
                          {member.won > 0 && (
                            <span className={styles.metaPill}>
                              {member.won} won
                            </span>
                          )}
                          {member.stopsCompleted > 0 && (
                            <span className={styles.metaPill}>
                              {member.stopsCompleted} stops
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.listItemTrailing}>
                        {member.wonRevenue > 0 && (
                          <span className={styles.money}>
                            {formatCurrency(member.wonRevenue)}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
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
                      onClick={() => openLead(lead.id)}
                      className={styles.listItemLink}
                      disabled={leadLoadingId === lead.id}
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

      {/* Custom prompt box */}
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

      {selectedLead && (
        <TechLeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
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

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  variant?: 'primary' | 'success' | 'accent' | 'default';
}

function KpiCard({ icon, label, value, variant = 'default' }: KpiCardProps) {
  return (
    <div className={`${styles.kpi} ${styles[`kpi-${variant}`]}`}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiLabel}>{label}</div>
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
