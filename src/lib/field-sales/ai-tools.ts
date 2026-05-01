import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getBroadAdminDataset,
  type BroadAdminDataset,
  type BroadDatasetUser,
} from './admin-reports';

// ── Context ───────────────────────────────────────────────────────────────

export interface AiToolContext {
  admin: SupabaseClient;
  companyId: string;
  // Lazy-init: fetched on first tool call that needs it, shared across the
  // remaining tool calls for the same request. The dataset is expensive
  // (multiple Supabase round-trips) so we only pay for it once per request.
  _dataset: BroadAdminDataset | null;
}

async function getDataset(ctx: AiToolContext): Promise<BroadAdminDataset> {
  if (!ctx._dataset) {
    ctx._dataset = await getBroadAdminDataset(ctx.admin, ctx.companyId);
  }
  return ctx._dataset;
}

// ── Tool definitions (Anthropic schema) ──────────────────────────────────

// We freeze the tool list module-side so the same array reference can be
// cached by Anthropic's prompt cache. cache_control is added on the last
// tool to mark the boundary — see the generate route for the cache strategy.

const TOP_N_METRICS = [
  'leadsSubmittedAllTime',
  'leadsSubmittedLast12Months',
  'leadsWonAllTime',
  'wonRevenueAllTime',
  'annualizedLeadValueAllTime',
  'annualizedWonValueAllTime',
  'stopsCompletedAllTime',
  'stopsCompletedLast12Months',
  'referredToSalesAllTime',
  'techDiscussedCountAllTime',
] as const;

type TopNMetric = (typeof TOP_N_METRICS)[number];

const MONTHLY_METRICS = [
  'leadsSubmitted',
  'leadsWon',
  'leadsLost',
  'wonRevenue',
] as const;

type MonthlyMetric = (typeof MONTHLY_METRICS)[number];

export const AI_TOOLS = [
  {
    name: 'get_company_overview',
    description:
      'Returns the company-wide aggregates: roster size, all-time and last-12-month lead counts by status/source, won revenue, pipeline value, route stops completed, and quote coverage. Start here when the question is broad ("how is the team doing", "give me a summary").',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'list_users',
    description:
      'List users in the company, optionally filtered by department or role. Returns a compact list (no per-user metrics). Use this to find userIds, then call get_user_metrics on the ones you care about.',
    input_schema: {
      type: 'object' as const,
      properties: {
        department: {
          type: 'string',
          enum: ['inspector', 'technician', 'any'],
          description:
            'Filter by department. "inspector" = users whose departments include "inspector"; "technician" = same for technicians; "any" = no filter.',
        },
        role: {
          type: 'string',
          enum: ['owner', 'admin', 'manager', 'member', 'any'],
          description: 'Optional filter on company role.',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          description:
            'Max users to return. Defaults to 50. Capped at 100 server-side.',
        },
      },
      required: ['department'],
    },
  },
  {
    name: 'get_user_metrics',
    description:
      'Returns the full per-user metrics row for one or more users. Use this AFTER list_users to get details on the people you want to talk about. Cap is 25 user IDs per call.',
    input_schema: {
      type: 'object' as const,
      properties: {
        userIds: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 25,
          description: 'User IDs to fetch metrics for.',
        },
      },
      required: ['userIds'],
    },
  },
  {
    name: 'get_metric_by_dimension',
    description:
      'Project a pre-aggregated metric across a dimension. Combinations supported: count|wonRevenue|totalEstimatedValue × source|status|source_and_status|user × all_time|last_12_months. The function will return {unsupported: true, note: "..."} for combinations the dataset does not pre-aggregate (rare).',
    input_schema: {
      type: 'object' as const,
      properties: {
        metric: {
          type: 'string',
          enum: ['count', 'wonRevenue', 'totalEstimatedValue'],
        },
        dimension: {
          type: 'string',
          enum: ['source', 'status', 'source_and_status', 'user'],
        },
        window: {
          type: 'string',
          enum: ['all_time', 'last_12_months'],
          description: 'Defaults to all_time.',
        },
      },
      required: ['metric', 'dimension'],
    },
  },
  {
    name: 'get_top_n',
    description:
      'Top N users by a metric, optionally restricted to a department. Use for "top inspectors", "best technicians", "rank by stops" type questions.',
    input_schema: {
      type: 'object' as const,
      properties: {
        metric: { type: 'string', enum: TOP_N_METRICS as unknown as string[] },
        n: { type: 'integer', minimum: 1, maximum: 50 },
        department: {
          type: 'string',
          enum: ['inspector', 'technician', 'any'],
        },
      },
      required: ['metric', 'n', 'department'],
    },
  },
  {
    name: 'get_monthly_series',
    description:
      'Returns a 12-bucket monthly series (oldest first) for a single metric over the last 12 months. Use this for time-trend questions.',
    input_schema: {
      type: 'object' as const,
      properties: {
        metric: {
          type: 'string',
          enum: MONTHLY_METRICS as unknown as string[],
        },
      },
      required: ['metric'],
    },
  },
  {
    name: 'submit_report',
    description:
      'TERMINAL TOOL — call this exactly once when you are ready to deliver the final answer. The shape mirrors the saved-report structure, so the title/summary/chart/table you provide is what the user will see.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', maxLength: 80 },
        summary: { type: 'string' },
        chart: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['bar', 'line', 'pie', 'area'] },
            xKey: { type: 'string' },
            series: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  label: { type: 'string' },
                },
                required: ['key', 'label'],
              },
            },
            data: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
          },
          required: ['type', 'xKey', 'series', 'data'],
        },
        table: {
          type: 'object',
          properties: {
            columns: { type: 'array', items: { type: 'string' } },
            rows: {
              type: 'array',
              items: { type: 'array', items: { type: 'string' } },
            },
          },
          required: ['columns', 'rows'],
        },
      },
      required: ['title', 'summary'],
    },
  },
] as const;

// ── Final report shape (matches saved-report DB column) ──────────────────

export interface GeneratedReport {
  title: string;
  summary: string;
  chart?: {
    type: 'bar' | 'line' | 'pie' | 'area';
    xKey: string;
    series: Array<{ key: string; label: string }>;
    data: Array<Record<string, string | number>>;
  };
  table?: {
    columns: string[];
    rows: string[][];
  };
}

// ── Tool execution ───────────────────────────────────────────────────────

const FIELD_SALES_SOURCES = new Set(['technician', 'field_map']);

function projectUser(user: BroadDatasetUser, fields?: (keyof BroadDatasetUser)[]) {
  if (!fields) return user;
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f as string] = user[f];
  return out;
}

export async function executeTool(
  ctx: AiToolContext,
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case 'get_company_overview': {
      const ds = await getDataset(ctx);
      return {
        company: ds.company,
        allTime: ds.allTime,
        last12Months: ds.last12Months,
        notes: ds.notes,
      };
    }

    case 'list_users': {
      const ds = await getDataset(ctx);
      const department = String(input.department ?? 'any');
      const role = String(input.role ?? 'any');
      const requestedLimit = Number(input.limit ?? 50);
      const limit = Math.min(100, Math.max(1, requestedLimit));

      const filtered = ds.perUser.filter(u => {
        if (department !== 'any' && !u.departments.includes(department)) {
          return false;
        }
        if (role !== 'any' && u.companyRole !== role) return false;
        return true;
      });

      return {
        totalMatching: filtered.length,
        users: filtered.slice(0, limit).map(u =>
          projectUser(u, [
            'userId',
            'fullName',
            'email',
            'companyRole',
            'departments',
          ])
        ),
      };
    }

    case 'get_user_metrics': {
      const ds = await getDataset(ctx);
      const ids = Array.isArray(input.userIds) ? input.userIds : [];
      const cappedIds = ids.slice(0, 25).map(String);
      const wanted = new Set(cappedIds);
      const found = ds.perUser.filter(u => wanted.has(u.userId));
      const missing = cappedIds.filter(
        id => !found.find(u => u.userId === id)
      );
      return { users: found, missing };
    }

    case 'get_metric_by_dimension': {
      const ds = await getDataset(ctx);
      const metric = String(input.metric);
      const dimension = String(input.dimension);
      const windowName = String(input.window ?? 'all_time');

      // status × all_time → leadsByStatus (count only)
      // source × all_time → leadsBySource (count only)
      if (
        windowName === 'all_time' &&
        dimension === 'status' &&
        metric === 'count'
      ) {
        return {
          metric,
          dimension,
          window: windowName,
          rows: Object.entries(ds.allTime.leadsByStatus).map(
            ([label, value]) => ({ label, value })
          ),
        };
      }
      if (
        windowName === 'all_time' &&
        dimension === 'source' &&
        metric === 'count'
      ) {
        return {
          metric,
          dimension,
          window: windowName,
          rows: Object.entries(ds.allTime.leadsBySource).map(
            ([label, value]) => ({ label, value })
          ),
        };
      }
      if (
        windowName === 'last_12_months' &&
        dimension === 'status' &&
        metric === 'count'
      ) {
        return {
          metric,
          dimension,
          window: windowName,
          rows: Object.entries(ds.last12Months.leadsByStatus).map(
            ([label, value]) => ({ label, value })
          ),
        };
      }
      if (
        windowName === 'last_12_months' &&
        dimension === 'source' &&
        metric === 'count'
      ) {
        return {
          metric,
          dimension,
          window: windowName,
          rows: Object.entries(ds.last12Months.leadsBySource).map(
            ([label, value]) => ({ label, value })
          ),
        };
      }
      if (windowName === 'all_time' && dimension === 'source_and_status') {
        return {
          metric,
          dimension,
          window: windowName,
          rows: ds.allTime.leadsBySourceAndStatus.map(r => ({
            source: r.source,
            status: r.status,
            value:
              metric === 'count'
                ? r.count
                : metric === 'totalEstimatedValue'
                  ? r.totalEstimatedValue
                  : 0,
          })),
        };
      }
      if (dimension === 'user') {
        const map: Record<string, keyof BroadDatasetUser> =
          windowName === 'last_12_months'
            ? {
                count: 'leadsSubmittedLast12Months',
                wonRevenue: 'wonRevenueAllTime',
                totalEstimatedValue: 'totalEstimatedValueAllTime',
              }
            : {
                count: 'leadsSubmittedAllTime',
                wonRevenue: 'wonRevenueAllTime',
                totalEstimatedValue: 'totalEstimatedValueAllTime',
              };
        const field = map[metric];
        if (!field) {
          return {
            unsupported: true,
            note: `metric=${metric} is not pre-aggregated for the user dimension; try wonRevenue or count.`,
          };
        }
        return {
          metric,
          dimension,
          window: windowName,
          rows: ds.perUser.map(u => ({
            userId: u.userId,
            fullName: u.fullName,
            departments: u.departments,
            value: u[field] as number,
          })),
        };
      }

      return {
        unsupported: true,
        note: `combination metric=${metric} dimension=${dimension} window=${windowName} is not pre-aggregated. Try a different combination — see the tool description for supported pairs.`,
      };
    }

    case 'get_top_n': {
      const ds = await getDataset(ctx);
      const metric = String(input.metric) as TopNMetric;
      if (!(TOP_N_METRICS as readonly string[]).includes(metric)) {
        return { error: `metric ${metric} is not allowed for get_top_n` };
      }
      const n = Math.min(50, Math.max(1, Number(input.n ?? 10)));
      const department = String(input.department ?? 'any');

      const pool = ds.perUser.filter(u => {
        if (department === 'any') return true;
        return u.departments.includes(department);
      });
      const ranked = pool
        .map(u => ({ user: u, value: (u[metric] ?? 0) as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, n);

      return {
        metric,
        department,
        rows: ranked.map((r, i) => ({
          rank: i + 1,
          userId: r.user.userId,
          fullName: r.user.fullName,
          departments: r.user.departments,
          value: r.value,
        })),
      };
    }

    case 'get_monthly_series': {
      const ds = await getDataset(ctx);
      const metric = String(input.metric) as MonthlyMetric;
      if (!(MONTHLY_METRICS as readonly string[]).includes(metric)) {
        return { error: `metric ${metric} is not allowed for get_monthly_series` };
      }
      return {
        metric,
        windowFrom: ds.last12Months.windowFrom,
        windowTo: ds.last12Months.windowTo,
        monthly: ds.last12Months.monthly.map(m => ({
          month: m.month,
          value: (m[metric] ?? 0) as number,
        })),
      };
    }

    case 'submit_report': {
      // Sentinel: the route reads this case as "we have the final answer"
      // and breaks out of the loop. Returning {ok: true} is ignored because
      // we never feed it back to the model.
      return { ok: true };
    }

    default:
      return { error: `unknown tool: ${name}` };
  }
}

// Re-export so route.ts only needs this module
export const FIELD_SALES_SOURCES_SET = FIELD_SALES_SOURCES;
