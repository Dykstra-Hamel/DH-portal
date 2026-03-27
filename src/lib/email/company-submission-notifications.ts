import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendEmailRouted } from '@/lib/email/router';
import { getCompanyFromEmail, getCompanyName, getCompanyTenantName } from '@/lib/email/index';
import {
  generateQuoteSubmittedNotificationTemplate,
  type QuoteSubmittedNotificationData,
} from '@/lib/email/templates/quote-submitted-notification';
import {
  generateCampaignSubmittedNotificationTemplate,
  type CampaignSubmittedNotificationData,
} from '@/lib/email/templates/campaign-submitted-notification';
import {
  generateTicketCreatedNotificationTemplate,
  type TicketCreatedNotificationData,
} from '@/lib/email/templates/ticket-created-notification';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';

async function getCompanyNotificationSettings(
  companyId: string,
  enabledKey: string,
  emailsKey: string
): Promise<{ enabled: boolean; emails: string[] }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('company_settings')
    .select('setting_key, setting_value')
    .eq('company_id', companyId)
    .in('setting_key', [enabledKey, emailsKey]);

  if (error || !data) {
    return { enabled: false, emails: [] };
  }

  const map: Record<string, string> = {};
  data.forEach((row: { setting_key: string; setting_value: string }) => {
    map[row.setting_key] = row.setting_value;
  });

  const enabled = map[enabledKey] === 'true';
  const rawEmails = map[emailsKey] || '';
  const emails = rawEmails
    .split(',')
    .map((e: string) => e.trim())
    .filter((e: string) => e.includes('@'));

  return { enabled, emails };
}

async function fetchLeadWithCustomer(leadId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('leads')
    .select(`
      id,
      company_id,
      campaign_id,
      customers:customer_id (
        first_name,
        last_name,
        email,
        phone
      ),
      service_addresses:service_address_id (
        street_address,
        apartment_unit,
        city,
        state,
        zip_code
      )
    `)
    .eq('id', leadId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Send quote submission notification emails to the company's configured email list.
 * Only fires if quote_submission_notification_enabled is true.
 */
export async function sendQuoteSubmissionNotification(
  leadId: string,
  companyId: string
): Promise<void> {
  const { enabled, emails } = await getCompanyNotificationSettings(
    companyId,
    'quote_submission_notification_enabled',
    'quote_submission_notification_emails'
  );

  if (!enabled || emails.length === 0) return;

  const lead = await fetchLeadWithCustomer(leadId);
  if (!lead) {
    console.error(`sendQuoteSubmissionNotification: lead ${leadId} not found`);
    return;
  }

  const customer = lead.customers as any;
  const addr = lead.service_addresses as any;

  const customerName =
    `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() ||
    customer?.email ||
    'Customer';
  const customerEmail = customer?.email || '';
  const customerPhone = customer?.phone || undefined;

  let address: string | undefined;
  if (addr) {
    address = [
      addr.street_address,
      addr.apartment_unit,
      addr.city,
      addr.state,
      addr.zip_code,
    ]
      .filter(Boolean)
      .join(', ') || undefined;
  }

  const leadUrl = `${BASE_URL}/tickets/leads/${leadId}`;

  const templateData: QuoteSubmittedNotificationData = {
    customerName,
    customerEmail,
    customerPhone,
    address,
    leadUrl,
    submittedAt: new Date().toISOString(),
  };

  const [fromEmail, fromName, tenantName] = await Promise.all([
    getCompanyFromEmail(companyId),
    getCompanyName(companyId),
    getCompanyTenantName(companyId),
  ]);

  const html = generateQuoteSubmittedNotificationTemplate(templateData);
  const subject = `Quote Submitted - ${customerName}`;

  await Promise.all(
    emails.map((to) =>
      sendEmailRouted({
        tenantName,
        from: fromEmail,
        fromName,
        to,
        subject,
        html,
        companyId,
        source: 'quote_submission_notification',
        tags: ['quote', 'submission', 'notification'],
      }).catch((err) =>
        console.error(`Quote submission notification failed for ${to}:`, err)
      )
    )
  );
}

/**
 * Send campaign submission notification emails to the company's configured email list.
 * Only fires if campaign_submission_notification_enabled is true.
 */
export async function sendCampaignSubmissionNotification(
  leadId: string,
  companyId: string
): Promise<void> {
  const { enabled, emails } = await getCompanyNotificationSettings(
    companyId,
    'campaign_submission_notification_enabled',
    'campaign_submission_notification_emails'
  );

  if (!enabled || emails.length === 0) return;

  const lead = await fetchLeadWithCustomer(leadId);
  if (!lead) {
    console.error(`sendCampaignSubmissionNotification: lead ${leadId} not found`);
    return;
  }

  const customer = lead.customers as any;
  const addr = lead.service_addresses as any;

  const customerName =
    `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() ||
    customer?.email ||
    'Customer';
  const customerEmail = customer?.email || '';
  const customerPhone = customer?.phone || undefined;

  let address: string | undefined;
  if (addr) {
    address = [
      addr.street_address,
      addr.apartment_unit,
      addr.city,
      addr.state,
      addr.zip_code,
    ]
      .filter(Boolean)
      .join(', ') || undefined;
  }

  // Fetch campaign name if available
  let campaignName: string | undefined;
  if (lead.campaign_id) {
    const supabase = createAdminClient();
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('name')
      .eq('id', lead.campaign_id)
      .single();
    campaignName = campaign?.name || undefined;
  }

  const leadUrl = `${BASE_URL}/tickets/leads/${leadId}`;

  const templateData: CampaignSubmittedNotificationData = {
    customerName,
    customerEmail,
    customerPhone,
    address,
    leadUrl,
    submittedAt: new Date().toISOString(),
    campaignName,
  };

  const [fromEmail, fromName, tenantName] = await Promise.all([
    getCompanyFromEmail(companyId),
    getCompanyName(companyId),
    getCompanyTenantName(companyId),
  ]);

  const html = generateCampaignSubmittedNotificationTemplate(templateData);
  const subject = campaignName
    ? `Campaign Submitted - ${campaignName} - ${customerName}`
    : `Campaign Submitted - ${customerName}`;

  await Promise.all(
    emails.map((to) =>
      sendEmailRouted({
        tenantName,
        from: fromEmail,
        fromName,
        to,
        subject,
        html,
        companyId,
        source: 'campaign_submission_notification',
        tags: ['campaign', 'submission', 'notification'],
      }).catch((err) =>
        console.error(`Campaign submission notification failed for ${to}:`, err)
      )
    )
  );
}

export interface TicketNotificationInput {
  ticketId: string;
  companyId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address?: string;
  ticketType?: string;
}

/**
 * Send ticket created notification emails to the company's configured email list.
 * Only fires if ticket_created_notification_enabled is true.
 */
export async function sendTicketCreatedNotification(
  input: TicketNotificationInput
): Promise<void> {
  const { ticketId, companyId, customerName, customerEmail, customerPhone, address, ticketType } = input;

  const { enabled, emails } = await getCompanyNotificationSettings(
    companyId,
    'ticket_created_notification_enabled',
    'ticket_created_notification_emails'
  );

  if (!enabled || emails.length === 0) return;

  const ticketUrl = `${BASE_URL}/tickets/dashboard?ticketId=${ticketId}`;

  const templateData: TicketCreatedNotificationData = {
    customerName,
    customerEmail,
    customerPhone,
    address,
    ticketUrl,
    submittedAt: new Date().toISOString(),
    ticketType,
  };

  const [fromEmail, fromName, tenantName] = await Promise.all([
    getCompanyFromEmail(companyId),
    getCompanyName(companyId),
    getCompanyTenantName(companyId),
  ]);

  const html = generateTicketCreatedNotificationTemplate(templateData);
  const subject = `New Ticket - ${customerName}`;

  await Promise.all(
    emails.map((to) =>
      sendEmailRouted({
        tenantName,
        from: fromEmail,
        fromName,
        to,
        subject,
        html,
        companyId,
        source: 'ticket_created_notification',
        tags: ['ticket', 'created', 'notification'],
      }).catch((err) =>
        console.error(`Ticket created notification failed for ${to}:`, err)
      )
    )
  );
}
