import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendEmailRouted } from '@/lib/email/router';
import { getCompanyFromEmail, getCompanyTenantName } from '@/lib/email';
import { getFullQuoteUrl } from '@/lib/quote-utils';
import { formatHomeSizeRange, formatYardSizeRange } from '@/lib/pricing-calculations';
import { generateFieldMapQuoteEmailTemplate } from '@/lib/email/templates/field-map-quote';

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
      sendEmail,
      clientEmail,
      clientName,
      inspectorName,
      companyName: bodyCompanyName,
    } = body;

    console.log('[send-quote] body', {
      leadId,
      quoteId,
      companyId: bodyCompanyId,
      sendEmail,
      clientEmail,
      clientName,
      inspectorName,
    });

    if (!leadId || !quoteId) {
      console.warn('[send-quote] missing leadId or quoteId');
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

    // Update lead status to 'quoted'
    await adminClient.from('leads').update({ lead_status: 'quoted' }).eq('id', leadId);

    // Mark any linked route stops as completed so reports reflect the inspector's work
    await adminClient
      .from('route_stops')
      .update({
        status: 'completed',
        actual_departure: new Date().toISOString(),
      })
      .eq('lead_id', leadId)
      .neq('status', 'completed');

    // Update quote status to 'sent' (or 'draft' if not emailing)
    const quoteStatus = sendEmail && clientEmail ? 'sent' : 'draft';
    await adminClient.from('quotes').update({ quote_status: quoteStatus }).eq('id', quoteId);

    // ── Email ──────────────────────────────────────────────────────────────
    let emailSent = false;

    console.log('[send-quote] email gate', { sendEmail, clientEmail });

    if (sendEmail && clientEmail) {
      const [templateSetting, company, fromEmail, tenantName, quoteRecord] = await Promise.all([
        adminClient
          .from('company_settings')
          .select('setting_value')
          .eq('company_id', companyId)
          .eq('setting_key', 'field_map_quote_template_id')
          .maybeSingle()
          .then(r => r.data),
        adminClient
          .from('companies')
          .select('id, name, slug, email, phone, website')
          .eq('id', companyId)
          .single()
          .then(r => r.data),
        getCompanyFromEmail(companyId),
        getCompanyTenantName(companyId),
        adminClient
          .from('quotes')
          .select('*, line_items:quote_line_items(*)')
          .eq('id', quoteId)
          .single()
          .then(r => r.data),
      ]);

      console.log('[send-quote] prefetch', {
        hasTemplateSetting: !!templateSetting?.setting_value,
        templateId: templateSetting?.setting_value ?? null,
        hasCompany: !!company,
        fromEmail,
        tenantName,
        hasQuoteRecord: !!quoteRecord,
        quoteLineItemCount: quoteRecord?.line_items?.length ?? 0,
      });

      let htmlContent: string | null = null;
      let subjectLine = `Field Inspection Quote \u2014 ${clientName || 'Customer'}`;

      // ── Path A: custom company email template ──────────────────────────────
      if (templateSetting?.setting_value && quoteRecord) {
        const [emailTemplate, customer, brandData, logoOverrideSetting, reviewsSetting] =
          await Promise.all([
            adminClient
              .from('email_templates')
              .select('subject_line, html_content, text_content')
              .eq('id', templateSetting.setting_value)
              .maybeSingle()
              .then(r => r.data),
            adminClient
              .from('customers')
              .select('first_name, last_name, email, phone')
              .eq('id', quoteRecord.customer_id)
              .single()
              .then(r => r.data),
            adminClient
              .from('brands')
              .select('logo_url, primary_color_hex, secondary_color_hex')
              .eq('company_id', companyId)
              .single()
              .then(r => r.data),
            adminClient
              .from('company_settings')
              .select('setting_value')
              .eq('company_id', companyId)
              .eq('setting_key', 'logo_override_url')
              .single()
              .then(r => r.data),
            adminClient
              .from('company_settings')
              .select('setting_value')
              .eq('company_id', companyId)
              .eq('setting_key', 'google_reviews_data')
              .single()
              .then(r => r.data),
          ]);

        if (emailTemplate?.html_content && customer) {
          const formatCurrency = (amount: number) =>
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(amount);

          const companyLogoUrl = logoOverrideSetting?.setting_value || brandData?.logo_url || '';

          let reviewsData: { rating?: number; reviewCount?: number } | null = null;
          try {
            if (reviewsSetting?.setting_value && reviewsSetting.setting_value !== '{}') {
              reviewsData = JSON.parse(reviewsSetting.setting_value);
            }
          } catch { /* ignore */ }

          const quoteUrlPath = quoteRecord?.quote_url ?? '';
          const quoteRecordToken = quoteRecord?.quote_token ?? '';
          const fullQuoteUrl =
            quoteUrlPath && quoteRecordToken
              ? `${getFullQuoteUrl(quoteUrlPath)}${quoteUrlPath.includes('?') ? '&' : '?'}token=${quoteRecordToken}`
              : '';

          const lineItemsHtml =
            quoteRecord?.line_items?.length > 0
              ? '<ul style="list-style: none; padding: 0; margin: 0;">' +
                quoteRecord.line_items
                  .map((item: any) => {
                    const freq = item.service_frequency
                      ? ` - ${item.service_frequency.charAt(0).toUpperCase()}${item.service_frequency.slice(1)}`
                      : '';
                    return `<li style="margin-bottom:12px;padding:12px;background:#f9fafb;border-radius:8px;">
                    <strong>${item.plan_name}</strong>${freq}<br>
                    <span style="color:#6b7280;font-size:14px;">
                      ${formatCurrency(item.final_initial_price || item.initial_price || 0)} initial,
                      ${formatCurrency(item.final_recurring_price || item.recurring_price || 0)}/mo recurring
                    </span>
                  </li>`;
                  })
                  .join('') +
                '</ul>'
              : 'No services selected';

          const variables: Record<string, string> = {
            customerName: `${customer.first_name} ${customer.last_name}`,
            firstName: customer.first_name || '',
            lastName: customer.last_name || '',
            customerEmail: customer.email || '',
            customerPhone: customer.phone || '',
            companyName: company?.name || '',
            companyEmail: company?.email || '',
            companyPhone: company?.phone || '',
            companyWebsite: company?.website || '',
            companyLogo: companyLogoUrl,
            quoteId: quoteRecord?.id || '',
            quoteUrl: fullQuoteUrl,
            quoteTotalInitialPrice: formatCurrency(quoteRecord?.total_initial_price || 0),
            quoteTotalRecurringPrice: formatCurrency(quoteRecord?.total_recurring_price || 0),
            quoteLineItems: lineItemsHtml,
            quotePestConcerns: quoteRecord?.primary_pest || '',
            quoteHomeSize: quoteRecord?.home_size_range
              ? formatHomeSizeRange(quoteRecord.home_size_range)
              : 'Not specified',
            quoteYardSize: quoteRecord?.yard_size_range
              ? formatYardSizeRange(quoteRecord.yard_size_range)
              : 'Not specified',
            address: clientName || '',
            streetAddress: clientName || '',
            city: '',
            state: '',
            zipCode: '',
            requestedDate: 'Not specified',
            requestedTime: 'Not specified',
            brandPrimaryColor: brandData?.primary_color_hex || '',
            brandSecondaryColor: brandData?.secondary_color_hex || '',
            googleRating: reviewsData?.rating?.toString() || '',
            googleReviewCount: reviewsData?.reviewCount?.toString() || '',
            inspectorName: inspectorName ?? 'Inspector',
            pestTypes: quoteRecord?.primary_pest || '',
            notes: '',
          };

          htmlContent = emailTemplate.html_content;
          subjectLine = emailTemplate.subject_line || subjectLine;

          Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            htmlContent = htmlContent!.replace(regex, value);
            subjectLine = subjectLine.replace(regex, value);
          });
        }
      }

      // ── Path B: built-in fallback template ─────────────────────────────────
      if (!htmlContent && quoteRecord) {
        const lineItems = (quoteRecord.line_items ?? []).map((item: any) => ({
          type: 'plan-addon' as const,
          catalogItemName: item.plan_name,
          coveredPestLabels: [] as string[],
          initialCost: item.final_initial_price ?? item.initial_price ?? null,
          recurringCost: item.final_recurring_price ?? item.recurring_price ?? null,
          frequency: item.billing_frequency ?? null,
        }));
        htmlContent = generateFieldMapQuoteEmailTemplate({
          inspectorName: inspectorName ?? 'Inspector',
          clientName: clientName || 'Customer',
          clientAddress: '',
          quoteLineItems: lineItems,
          totalInitial: quoteRecord.total_initial_price ?? 0,
          totalRecurring: quoteRecord.total_recurring_price ?? 0,
          billingFrequency: null,
          pestTypes: quoteRecord.primary_pest ? [quoteRecord.primary_pest] : [],
          notes: '',
          companyName: company?.name || bodyCompanyName || 'FieldMap',
        });
      }

      if (htmlContent) {
        // TODO: switch to clientEmail when ready for production
        const recipient = user.email!;
        console.log('[send-quote] dispatching', {
          to: recipient,
          from: fromEmail,
          fromName: company?.name || bodyCompanyName || 'FieldMap',
          subject: subjectLine,
          companyId,
          tenantName,
          htmlLength: htmlContent.length,
        });
        try {
          const result = await sendEmailRouted({
            tenantName,
            from: fromEmail,
            fromName: company?.name || bodyCompanyName || 'FieldMap',
            to: recipient,
            subject: subjectLine,
            html: htmlContent,
            companyId,
            source: 'field_map',
          });
          console.log('[send-quote] sendEmailRouted result', result);
          emailSent = true;
        } catch (sendErr) {
          console.error('[send-quote] sendEmailRouted threw', sendErr);
        }
      } else {
        console.warn('[send-quote] no htmlContent built — skipping send');
      }
    }

    return NextResponse.json({ success: true, leadId, quoteId, emailSent });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
