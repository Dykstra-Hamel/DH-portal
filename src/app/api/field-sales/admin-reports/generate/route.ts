import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  getBroadAdminDataset,
  verifyCompanyAdminAccess,
} from '@/lib/field-sales/admin-reports';
import { getGeminiClient } from '@/lib/ai/gemini-client';

interface GenerateBody {
  companyId: string;
  prompt: string;
}

const SYSTEM_INSTRUCTION = `You are a field-sales operations analyst answering on-the-fly questions for a company admin/manager.
You receive a JSON "dataset" containing pre-aggregated company-wide numbers and a natural-language request. The dataset covers ALL of the company's field-sales activity — it is not pre-filtered.

Structure of the dataset:
- company: total company members, plus counts of users in the "inspector" and "technician" departments.
- allTime: aggregates across every lead ever created for this company, including leadsByStatus, leadsBySource, a leadsBySourceAndStatus matrix, wonRevenue, pipelineValue, annualizedLeadValue, annualizedWonValue, leadsWithQuoteCount, and route-stop totals. The allTime.fieldSales* fields are restricted to lead_source in {technician, field_map}, which is how "Field Sales" leads are defined.
- last12Months: the same measures restricted to the rolling 12-month window (windowFrom..windowTo), plus a 12-bucket monthly series.
- perUser: per-person stats for every company member. Each entry includes companyRole, departments (array — "inspector" and/or "technician" indicate Field Sales roles), lead/route counts, and dollar aggregates for every submitter: leadsSubmittedAllTime, leadsWonAllTime, leadsLostAllTime, leadsInProcessAllTime, wonRevenueAllTime (sum of estimated_value on won leads only — one-time charge only), totalEstimatedValueAllTime (sum of estimated_value across ALL leads the user submitted regardless of status — one-time charge only), pipelineValueAllTime (sum of estimated_value across open/pipeline statuses: new, in_process, quoted, scheduling), annualizedLeadValueAllTime (RECOMMENDED for "total value of leads per user" — sum across every lead the user submitted of the quote's full annualized value: initial + recurring × annual multiplier based on billing_frequency; falls back to estimated_value for leads without a quote), annualizedWonValueAllTime (same annualized calculation but restricted to won leads), leadsWithQuoteAllTime (how many of that user's leads actually have a quote attached — use to explain coverage).
- When the user asks "how much revenue / value did X produce", PREFER the annualized* fields over wonRevenue / totalEstimatedValue, because those only count the one-time initial charge and undersell recurring-revenue leads.
- notes.fieldSalesSourceValues, notes.inspectorDepartmentValue, notes.technicianDepartmentValue are the canonical values you should match against.

Respond ONLY with a single valid JSON object matching this schema — no markdown fences, no prose outside the JSON:

{
  "title": string,                // short title (<= 80 chars)
  "summary": string,              // 1-3 plain sentences answering the request using ONLY the dataset numbers
  "chart": {                      // OPTIONAL — include only if a chart clearly helps
    "type": "bar" | "line" | "pie" | "area",
    "xKey": string,
    "series": [{ "key": string, "label": string }],
    "data": [ { "<xKey>": string | number, ...numericKeys } ]
  },
  "table": {                      // OPTIONAL — include only if a tabular breakdown helps
    "columns": string[],
    "rows": string[][]
  }
}

Hard rules:
- Every number you cite MUST come directly from the dataset. Do NOT compute across categories the dataset doesn't already aggregate; do NOT estimate or round up.
- If the question requires a metric that isn't pre-computed (e.g., "inspections" when the dataset only has route stops), say so plainly in the summary and use the closest available measure, naming it exactly.
- When the user says "inspectors" or "technicians", filter perUser by departments containing "inspector" / "technician". When they say "Field Sales", use allTime.fieldSales* OR filter leads where lead_source in notes.fieldSalesSourceValues.
- Chart data points must be copied verbatim from the dataset. Keep <= 30 points. For pies, use one series with {"<xKey>": string, value: number}.
- Prefer a table when the user asks for "broken down by user" or similar per-person lists.
- Never echo the request verbatim in the title.
- If the dataset is empty or the answer is zero, say so — do not fabricate activity.
`;

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user, isGlobalAdmin } = authResult;

    const body = (await request.json()) as GenerateBody;
    const { companyId, prompt } = body ?? {};

    if (!companyId || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: 'companyId and a prompt are required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const access = await verifyCompanyAdminAccess(
      admin,
      user.id,
      companyId,
      isGlobalAdmin
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: access.status });
    }

    const dataset = await getBroadAdminDataset(admin, companyId);

    let generated: unknown;
    try {
      const gemini = getGeminiClient();
      const result = await gemini.generate<unknown>(
        `Dataset:\n${JSON.stringify(dataset)}\n\nRequest: ${prompt.trim()}`,
        {
          systemInstruction: SYSTEM_INSTRUCTION,
          jsonMode: true,
          temperature: 0,
          maxOutputTokens: 2048,
        }
      );
      generated = result.data;
    } catch (err) {
      console.error('Admin report Gemini error:', err);
      return NextResponse.json(
        { error: 'AI service unavailable. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ result: generated, dataset });
  } catch (error) {
    console.error('Admin report generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
