import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendEmailRouted } from '@/lib/email/router';
import { getCompanyFromEmail, getCompanyTenantName } from '@/lib/email';
import { logActivity } from '@/lib/activity-logger';

function formatScheduledDate(value?: string | null): string {
  if (!value) return '';
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = ymd
    ? new Date(Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: ymd ? 'UTC' : undefined,
  });
}

function formatScheduledTime(value?: string | null): string {
  if (!value) return '';
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const display = hours % 12 || 12;
  return `${display}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const userSupabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await userSupabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { quoteId } = body as { quoteId?: string };

    const supabase = createAdminClient();

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(
        `*,
        customer:customers(*),
        primary_service_address:service_addresses(*)`
      )
      .eq('id', id)
      .single();

    if (leadError || !lead || !lead.customer) {
      return NextResponse.json(
        { error: 'Lead or customer not found' },
        { status: 404 }
      );
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, slug, email, phone, website')
      .eq('id', lead.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    let quoteRecord:
      | {
          id: string;
          total_initial_price: number | null;
          total_recurring_price: number | null;
        }
      | null = null;

    if (quoteId) {
      const { data: q } = await supabase
        .from('quotes')
        .select('id, total_initial_price, total_recurring_price')
        .eq('id', quoteId)
        .single();
      quoteRecord = q ?? null;
    }

    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('company_id', company.id)
      .eq('template_type', 'service_confirmation')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        {
          error:
            'No active service confirmation email template found. Please create one in Settings → Automation → Templates',
        },
        { status: 404 }
      );
    }

    const [logoOverrideSetting, brandData, fromEmail, tenantName] =
      await Promise.all([
        supabase
          .from('company_settings')
          .select('setting_value')
          .eq('company_id', company.id)
          .eq('setting_key', 'logo_override_url')
          .maybeSingle()
          .then(r => r.data),
        supabase
          .from('brands')
          .select('logo_url, primary_color_hex, secondary_color_hex')
          .eq('company_id', company.id)
          .single()
          .then(r => r.data),
        getCompanyFromEmail(company.id),
        getCompanyTenantName(company.id),
      ]);

    const companyLogoUrl =
      logoOverrideSetting?.setting_value ||
      brandData?.logo_url ||
      '/pcocentral-logo.png';

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);

    const variables: Record<string, string> = {
      customerName: `${lead.customer.first_name ?? ''} ${
        lead.customer.last_name ?? ''
      }`.trim(),
      firstName: lead.customer.first_name || '',
      lastName: lead.customer.last_name || '',
      customerEmail: lead.customer.email || '',
      customerPhone: lead.customer.phone || '',

      companyName: company.name || '',
      companyEmail: company.email || '',
      companyPhone: company.phone || '',
      companyWebsite: company.website || '',
      companyLogo: companyLogoUrl,

      brandPrimaryColor: brandData?.primary_color_hex || '',
      brandSecondaryColor: brandData?.secondary_color_hex || '',

      scheduledDate: formatScheduledDate(lead.scheduled_date),
      scheduledTime: formatScheduledTime(lead.scheduled_time),

      streetAddress: lead.primary_service_address?.street_address || '',
      city: lead.primary_service_address?.city || '',
      state: lead.primary_service_address?.state || '',
      zipCode: lead.primary_service_address?.zip_code || '',

      quoteTotalInitialPrice: formatCurrency(
        quoteRecord?.total_initial_price || 0
      ),
      quoteTotalRecurringPrice: formatCurrency(
        quoteRecord?.total_recurring_price || 0
      ),
    };

    let htmlContent: string = template.html_content || '';
    let textContent: string = template.text_content || '';
    let subjectLine: string = template.subject_line || '';

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      htmlContent = htmlContent.replace(regex, value);
      textContent = textContent.replace(regex, value);
      subjectLine = subjectLine.replace(regex, value);
    });

    let emailSent = false;
    try {
      await sendEmailRouted({
        tenantName,
        from: fromEmail,
        fromName: company.name || 'Service Team',
        to: user.email, // TODO: switch to lead.customer.email when ready for production
        subject: subjectLine,
        html: htmlContent,
        text: textContent || undefined,
        companyId: company.id,
        leadId: lead.id,
        templateId: template.id,
        source: 'service_confirmation',
      });
      emailSent = true;
    } catch (sendErr) {
      console.error('[service-confirmation] sendEmailRouted threw', sendErr);
    }

    if (emailSent) {
      try {
        await logActivity({
          company_id: lead.company_id,
          entity_type: 'lead',
          entity_id: lead.id,
          activity_type: 'contact_made',
          user_id: user.id,
          notes: `Service confirmation emailed (test recipient: ${user.email})`,
          metadata: {
            contact_type: 'email',
            email_template_id: template.id,
            recipient_email: user.email,
            quote_id: quoteRecord?.id ?? null,
          },
        });
      } catch (activityError) {
        console.error(
          '[service-confirmation] activity log failed',
          activityError
        );
      }
    }

    return NextResponse.json({ success: true, emailSent });
  } catch (error) {
    console.error('[service-confirmation] error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
