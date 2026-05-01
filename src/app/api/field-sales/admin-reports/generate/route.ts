import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyCompanyAdminAccess } from '@/lib/field-sales/admin-reports';
import {
  Anthropic,
  getAnthropicClient,
} from '@/lib/ai/anthropic-client';
import { ASK_THE_DATA_SYSTEM_PROMPT } from '@/lib/field-sales/ai-system-prompt';
import {
  AI_TOOLS,
  executeTool,
  type AiToolContext,
  type GeneratedReport,
} from '@/lib/field-sales/ai-tools';

interface GenerateBody {
  companyId: string;
  prompt: string;
}

const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 4096;
const MAX_TOOL_ITERATIONS = 12;

// Build the messages.create payload with cache_control on the last tool
// definition AND on the system prompt — this places one cache breakpoint
// after each, so subsequent calls can read the cached prefix instead of
// re-tokenizing the full system+tools block.
function buildCachedSystem(): Anthropic.MessageParam['content'] extends infer _
  ? Array<{
      type: 'text';
      text: string;
      cache_control?: { type: 'ephemeral' };
    }>
  : never {
  return [
    {
      type: 'text',
      text: ASK_THE_DATA_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
  ] as never;
}

function buildCachedTools() {
  // Anthropic SDK accepts the tools array directly. We tag the last tool
  // (submit_report) with cache_control so the prompt cache spans through
  // all tool definitions.
  return AI_TOOLS.map((tool, idx) => {
    if (idx === AI_TOOLS.length - 1) {
      return {
        ...tool,
        cache_control: { type: 'ephemeral' as const },
      };
    }
    return tool;
  });
}

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
      return NextResponse.json(
        { error: access.reason },
        { status: access.status }
      );
    }

    let client: Anthropic;
    try {
      client = getAnthropicClient();
    } catch (err) {
      console.error('Anthropic config error:', err);
      return NextResponse.json(
        { error: 'AI service is not configured.' },
        { status: 502 }
      );
    }

    const ctx: AiToolContext = {
      admin,
      companyId,
      _dataset: null,
    };

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: prompt.trim(),
      },
    ];

    let finalReport: GeneratedReport | null = null;

    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      let response: Anthropic.Message;
      try {
        response = await client.messages.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: buildCachedSystem(),
          // Cast: SDK type allows cache_control on tools but the strict
          // typedef in older SDK builds may not include it on every tool —
          // the runtime accepts it as documented.
          tools: buildCachedTools() as unknown as Anthropic.Tool[],
          messages,
        });
      } catch (err) {
        if (err instanceof Anthropic.RateLimitError) {
          return NextResponse.json(
            { error: 'AI service is rate-limited. Try again shortly.' },
            { status: 429 }
          );
        }
        if (err instanceof Anthropic.AuthenticationError) {
          console.error('Anthropic auth error:', err);
          return NextResponse.json(
            { error: 'AI service is not configured.' },
            { status: 502 }
          );
        }
        if (err instanceof Anthropic.APIError) {
          console.error('Anthropic API error:', err);
          return NextResponse.json(
            { error: 'AI service unavailable. Please try again.' },
            { status: 502 }
          );
        }
        throw err;
      }

      // Append the assistant's full response (text + tool_use blocks) to
      // the running transcript so the next turn has correct context.
      messages.push({ role: 'assistant', content: response.content });

      // Find any tool_use blocks; the model may emit multiple per turn.
      const toolUses = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (toolUses.length === 0) {
        // The model ended its turn without calling submit_report. Nudge it.
        if (response.stop_reason === 'end_turn') {
          messages.push({
            role: 'user',
            content:
              'You must finish by calling the submit_report tool with the final answer.',
          });
          continue;
        }
        // Some other stop reason with no tool calls — bail.
        break;
      }

      // Check for the terminal tool first — if the model called it we are
      // done, regardless of any other tool calls in the same turn.
      const submission = toolUses.find(t => t.name === 'submit_report');
      if (submission) {
        finalReport = submission.input as GeneratedReport;
        break;
      }

      // Otherwise execute every tool_use block and feed the results back.
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        try {
          const out = await executeTool(
            ctx,
            tu.name,
            (tu.input ?? {}) as Record<string, unknown>
          );
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: JSON.stringify(out),
          });
        } catch (err) {
          console.error(`Tool ${tu.name} threw:`, err);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: JSON.stringify({
              error: err instanceof Error ? err.message : 'tool failed',
            }),
            is_error: true,
          });
        }
      }
      messages.push({ role: 'user', content: toolResults });
    }

    if (!finalReport) {
      return NextResponse.json(
        {
          error:
            'Could not generate a report after several rounds of analysis. Try a more specific prompt.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ result: finalReport });
  } catch (error) {
    console.error('Admin report generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
