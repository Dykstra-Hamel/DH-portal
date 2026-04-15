import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      leadId,
      quoteId,
      companyId: bodyCompanyId,
      signatureData,
      signedBy,
      scheduleOption,
      assignedTo,
      preferredDayOfWeek,
      preferredTime,
    } = body;

    if (!leadId || !quoteId) {
      return NextResponse.json({ error: 'leadId and quoteId are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Resolve company
    let companyQuery = adminClient
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id);

    if (bodyCompanyId) {
      companyQuery = companyQuery.eq('company_id', bodyCompanyId);
    } else {
      companyQuery = companyQuery.eq('is_primary', true);
    }

    const { data: userCompany } = await companyQuery.single();
    if (!userCompany?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    const companyId = userCompany.company_id;

    // Normalize schedule option
    const normalizedScheduleOption: 'now' | 'later' | 'someone_else' =
      scheduleOption === 'now' || scheduleOption === 'someone_else' ? scheduleOption : 'later';

    const assignedScheduler =
      normalizedScheduleOption === 'now'
        ? user.id
        : normalizedScheduleOption === 'someone_else'
        ? assignedTo === 'scheduling_team'
          ? null
          : typeof assignedTo === 'string' && assignedTo.trim().length > 0
          ? assignedTo
          : null
        : null;

    // Update lead status to 'scheduling' and scheduling fields
    await adminClient
      .from('leads')
      .update({
        lead_status: 'scheduling',
        requested_date: preferredDayOfWeek ?? null,
        requested_time: preferredTime ?? null,
        assigned_scheduler: assignedScheduler,
      })
      .eq('id', leadId);

    // Record signature on quote
    if (signatureData) {
      await adminClient
        .from('quotes')
        .update({
          quote_status: 'accepted',
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
        })
        .eq('id', quoteId);

      // Log signature activity (mirrors public quote page accept flow)
      await logActivity({
        company_id: companyId,
        entity_type: 'lead',
        entity_id: leadId,
        activity_type: 'status_change',
        field_name: 'quote_status',
        old_value: 'draft',
        new_value: 'accepted',
        user_id: user.id,
        notes: `Quote signed by ${signedBy || 'customer'} during Field Map scheduling`,
        metadata: {
          quote_id: quoteId,
          signed_at: new Date().toISOString(),
          signature_captured: true,
          signed_by: signedBy ?? null,
        },
      });
    } else {
      // No signature — just mark quote as accepted without signature data
      await adminClient
        .from('quotes')
        .update({ quote_status: 'accepted' })
        .eq('id', quoteId);
    }

    return NextResponse.json({
      success: true,
      leadId,
      scheduleOption: normalizedScheduleOption,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
