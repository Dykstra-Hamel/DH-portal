import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';

async function getParams(params: Promise<{ id: string }>) {
  return await params;
}

async function getCompanySettings(companyId: string, keys: string[]) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('company_settings')
    .select('setting_key, setting_value')
    .eq('company_id', companyId)
    .in('setting_key', keys);

  if (error) {
    throw new Error(`Failed to fetch company settings: ${error.message}`);
  }

  const settings: Record<string, string> = {};
  data?.forEach(s => {
    settings[s.setting_key] = s.setting_value;
  });
  return settings;
}

async function upsertCompanySettings(companyId: string, updates: Record<string, string>) {
  const supabase = createAdminClient();

  const rows = Object.entries(updates).map(([key, value]) => ({
    company_id: companyId,
    setting_key: key,
    setting_value: value,
  }));

  const { error } = await supabase
    .from('company_settings')
    .upsert(rows, { onConflict: 'company_id,setting_key' });

  if (error) {
    throw new Error(`Failed to update company settings: ${error.message}`);
  }
}

/**
 * GET /api/admin/companies/[id]/mailersend
 * Returns current MailerSend settings for the company.
 * Never exposes the raw API key — only hasApiKey boolean.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: companyId } = await getParams(params);

    const settings = await getCompanySettings(companyId, [
      'email_provider',
      'mailersend_api_key',
      'mailersend_from_email',
      'mailersend_from_name',
    ]);

    return NextResponse.json({
      success: true,
      provider: settings['email_provider'] || 'aws-ses',
      hasApiKey: !!settings['mailersend_api_key'],
      fromEmail: settings['mailersend_from_email'] || null,
      fromName: settings['mailersend_from_name'] || null,
    });
  } catch (error) {
    console.error('Error fetching MailerSend settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/companies/[id]/mailersend
 * Save MailerSend settings for the company.
 *
 * Body:
 *   { provider: 'mailersend', apiKey: '...', fromEmail: '...', fromName?: '...' }
 *   or
 *   { provider: 'aws-ses' }  — switches back to SES without clearing credentials
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: companyId } = await getParams(params);

    const body = await request.json();
    const { provider, apiKey, fromEmail, fromName } = body as {
      provider: 'aws-ses' | 'mailersend';
      apiKey?: string;
      fromEmail?: string;
      fromName?: string;
    };

    if (!provider || !['aws-ses', 'mailersend'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "aws-ses" or "mailersend".' },
        { status: 400 }
      );
    }

    if (provider === 'mailersend') {
      // If no API key supplied, verify one is already stored before allowing activation
      if (!apiKey) {
        const existing = await getCompanySettings(companyId, ['mailersend_api_key']);
        if (!existing['mailersend_api_key']) {
          return NextResponse.json(
            { error: 'apiKey is required when no key is already saved.' },
            { status: 400 }
          );
        }
      }

      if (!fromEmail) {
        return NextResponse.json(
          { error: 'fromEmail is required when provider is mailersend.' },
          { status: 400 }
        );
      }

      const updates: Record<string, string> = {
        email_provider: 'mailersend',
        mailersend_from_email: fromEmail,
      };

      if (apiKey) {
        updates['mailersend_api_key'] = apiKey;
      }

      if (fromName) {
        updates['mailersend_from_name'] = fromName;
      }

      await upsertCompanySettings(companyId, updates);
    } else {
      // Switch back to AWS SES — just update the provider key; keep MailerSend creds stored
      await upsertCompanySettings(companyId, { email_provider: 'aws-ses' });
    }

    return NextResponse.json({ success: true, provider });
  } catch (error) {
    console.error('Error saving MailerSend settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
