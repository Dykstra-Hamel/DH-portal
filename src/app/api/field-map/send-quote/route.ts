import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendEmailWithFallback } from '@/lib/aws-ses/send-email';
import { getCompanyFromEmail, getCompanyName, getCompanyTenantName } from '@/lib/email';
import { generateFieldMapQuoteEmailTemplate } from '@/lib/email/templates/field-map-quote';

const QUOTE_RECIPIENT = 'jason@dykstrahamel.com';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientName,
      clientEmail: _clientEmail,
      address,
      pestTypes,
      plan,
      pricing,
      notes,
      inspectorName,
      companyName: bodyCompanyName,
    } = body;

    if (!clientName || !address) {
      return NextResponse.json({ error: 'Client name and address are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: userCompany } = await adminClient
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!userCompany?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    const companyId = userCompany.company_id;

    const [fromEmail, fromName, tenantName] = await Promise.all([
      getCompanyFromEmail(companyId),
      getCompanyName(companyId),
      getCompanyTenantName(companyId),
    ]);

    const html = generateFieldMapQuoteEmailTemplate({
      inspectorName: inspectorName ?? 'Inspector',
      clientName,
      clientAddress: address,
      planName: plan?.plan_name ?? 'No plan selected',
      initialPrice: pricing?.initialPrice ?? plan?.initial_price ?? null,
      recurringPrice: pricing?.recurringPrice ?? plan?.recurring_price ?? null,
      billingFrequency: pricing?.billingFrequency ?? plan?.billing_frequency ?? null,
      pestTypes: Array.isArray(pestTypes) ? pestTypes : [],
      notes: notes ?? '',
      companyName: fromName ?? bodyCompanyName ?? 'Your Company',
    });

    await sendEmailWithFallback({
      tenantName,
      from: fromEmail,
      fromName: fromName ?? bodyCompanyName ?? 'FieldMap',
      to: QUOTE_RECIPIENT,
      subject: `Field Inspection Quote \u2014 ${clientName} | ${address}`,
      html,
      companyId,
      source: 'field_map',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
