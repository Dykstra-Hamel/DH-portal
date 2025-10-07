import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch quote with all related data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        line_items:quote_line_items(*)
      `)
      .eq('id', id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Fetch lead with customer data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        customer:customers(*),
        primary_service_address:service_addresses(*)
      `)
      .eq('id', quote.lead_id)
      .single();

    if (leadError || !lead || !lead.customer) {
      return NextResponse.json(
        { error: 'Lead or customer not found' },
        { status: 404 }
      );
    }

    // Check if customer has email
    if (!lead.customer.email) {
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      );
    }

    // Get company information
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, email, phone, website')
      .eq('id', lead.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Fetch active quote email template for the company
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('company_id', company.id)
      .eq('template_type', 'quote')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'No active quote email template found. Please create one in Settings → Automation → Templates' },
        { status: 404 }
      );
    }

    // Format quote data for template variables
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    // Format line items as HTML list
    const quoteLineItems = quote.line_items && quote.line_items.length > 0
      ? '<ul style="list-style: none; padding: 0; margin: 0;">' +
        quote.line_items.map((item: any) =>
          `<li style="margin-bottom: 12px; padding: 12px; background: #f9fafb; border-radius: 6px;">
            <strong>${item.plan_name}</strong> - ${item.service_frequency?.charAt(0).toUpperCase()}${item.service_frequency?.slice(1)}<br>
            <span style="color: #6b7280; font-size: 14px;">
              ${formatCurrency(item.final_initial_price || item.initial_price || 0)} initial,
              ${formatCurrency(item.final_recurring_price || item.recurring_price || 0)}/mo recurring
            </span>
          </li>`
        ).join('') +
        '</ul>'
      : 'No services selected';

    // Format pest concerns
    const pestConcerns: string[] = [];
    if (quote.primary_pest) {
      pestConcerns.push(quote.primary_pest);
    }
    if (quote.additional_pests && Array.isArray(quote.additional_pests)) {
      pestConcerns.push(...quote.additional_pests);
    }

    // Replace template variables
    const variables: Record<string, string> = {
      // Customer variables
      customerName: `${lead.customer.first_name} ${lead.customer.last_name}`,
      firstName: lead.customer.first_name || '',
      lastName: lead.customer.last_name || '',
      customerEmail: lead.customer.email || '',
      customerPhone: lead.customer.phone || '',

      // Company variables
      companyName: company.name || '',
      companyEmail: company.email || '',
      companyPhone: company.phone || '',
      companyWebsite: company.website || '',

      // Quote variables
      quoteId: quote.id || '',
      quoteTotalInitialPrice: formatCurrency(quote.total_initial_price || 0),
      quoteTotalRecurringPrice: formatCurrency(quote.total_recurring_price || 0),
      quoteLineItems: quoteLineItems,
      quotePestConcerns: pestConcerns.join(', ') || 'Not specified',
      quoteHomeSize: quote.home_size_range || 'Not specified',
      quoteYardSize: quote.yard_size_range || 'Not specified',

      // Service address variables
      address: lead.primary_service_address
        ? `${lead.primary_service_address.street_address}, ${lead.primary_service_address.city}, ${lead.primary_service_address.state} ${lead.primary_service_address.zip_code}`
        : 'Not provided',
      streetAddress: lead.primary_service_address?.street_address || '',
      city: lead.primary_service_address?.city || '',
      state: lead.primary_service_address?.state || '',
      zipCode: lead.primary_service_address?.zip_code || '',

      // Scheduling info
      requestedDate: lead.requested_date ? new Date(lead.requested_date).toLocaleDateString() : 'Not specified',
      requestedTime: lead.requested_time || 'Not specified',
    };

    // Replace variables in template
    let htmlContent = template.html_content;
    let textContent = template.text_content || '';
    let subjectLine = template.subject_line;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      htmlContent = htmlContent.replace(regex, value);
      textContent = textContent.replace(regex, value);
      subjectLine = subjectLine.replace(regex, value);
    });

    // Send email via email API
    const emailResponse = await fetch(
      `${request.nextUrl.origin}/api/email/send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: lead.customer.email,
          subject: subjectLine,
          html: htmlContent,
          text: textContent,
          companyId: company.id,
          templateId: template.id,
          leadId: lead.id,
          source: 'quote_email',
        }),
      }
    );

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Failed to send email:', errorData);
      return NextResponse.json(
        { error: 'Failed to send email', details: errorData },
        { status: 500 }
      );
    }

    const emailResult = await emailResponse.json();

    return NextResponse.json({
      success: true,
      message: `Quote emailed to ${lead.customer.email}`,
      emailResult,
    });
  } catch (error) {
    console.error('Error in quote email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
