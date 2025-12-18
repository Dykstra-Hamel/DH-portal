/**
 * Universal Lead Notification Helpers
 *
 * Centralized functions for sending lead-related email notifications
 * with department-based routing and user preference checking.
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  sendLeadNotificationsWithDepartmentFiltering,
  LeadNotificationData,
} from '@/lib/email';

/**
 * Send notification when a new lead is created
 *
 * Routes to:
 * - Assigned user (if lead is assigned)
 * - Sales department (if lead is unassigned)
 *
 * @param leadId - Lead UUID
 * @param companyId - Company UUID
 * @param options - Notification options
 * @param options.assignedUserId - If provided, only notify this user
 * @param options.skipNotification - If true, skip sending notification
 */
export async function notifyLeadCreated(
  leadId: string,
  companyId: string,
  options?: {
    assignedUserId?: string;
    skipNotification?: boolean;
  }
): Promise<{
  success: boolean;
  recipientCount?: number;
  error?: string;
}> {
  try {
    // Allow skipping notification
    if (options?.skipNotification) {
      return { success: true, recipientCount: 0 };
    }

    const supabase = createAdminClient();

    // Fetch lead details with customer and company info
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id,
        lead_status,
        priority,
        estimated_value,
        pest_type,
        comments,
        created_at,
        assigned_to,
        companies:company_id (
          name
        ),
        customers:customer_id (
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code
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

    if (leadError || !lead) {
      console.error('Failed to fetch lead for notification:', leadError);
      return {
        success: false,
        error: 'Lead not found',
      };
    }

    // Build customer name
    const customer = lead.customers as any;
    const customerName = customer
      ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email || 'Unknown'
      : 'Unknown';

    // Build address string
    let address = 'Address not provided';
    if (lead.service_addresses) {
      const addr = lead.service_addresses as any;
      const parts = [
        addr.street_address,
        addr.apartment_unit,
        addr.city,
        addr.state,
        addr.zip_code,
      ].filter(Boolean);
      address = parts.join(', ');
    } else if (customer) {
      const parts = [
        customer.address,
        customer.city,
        customer.state,
        customer.zip_code,
      ].filter(Boolean);
      if (parts.length > 0) {
        address = parts.join(', ');
      }
    }

    // Generate lead URL
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const leadUrl = `${appUrl}/connections/leads/${leadId}`;

    // Build notification data
    const leadNotificationData: LeadNotificationData & { leadUrl?: string } = {
      leadId: lead.id,
      companyName: (lead.companies as any)?.name || 'Unknown Company',
      customerName,
      customerEmail: customer?.email || '',
      customerPhone: customer?.phone || '',
      pestType: lead.pest_type || 'Not specified',
      address,
      priority: (lead.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
      autoCallEnabled: false,
      submittedAt: lead.created_at,
      leadUrl,
    };

    // Send notification
    // If lead has assigned user, notify only them
    // Otherwise, notify sales department
    const result = await sendLeadNotificationsWithDepartmentFiltering(
      companyId,
      leadNotificationData,
      {
        assignedUserId: options?.assignedUserId || lead.assigned_to,
        department: 'sales',
        leadStatus: lead.lead_status,
        notificationType: 'lead_created',
      }
    );

    return {
      success: result.success,
      recipientCount: result.successCount,
    };
  } catch (error) {
    console.error('Error in notifyLeadCreated:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send notification when lead status changes to 'scheduling'
 *
 * Routes to:
 * - Assigned user (if lead is assigned)
 * - Scheduling department (if lead is unassigned)
 *
 * @param leadId - Lead UUID
 * @param companyId - Company UUID
 * @param assignedUserId - Optional assigned user ID
 */
export async function notifyLeadStatusChangedToScheduling(
  leadId: string,
  companyId: string,
  assignedUserId?: string
): Promise<{
  success: boolean;
  recipientCount?: number;
  error?: string;
}> {
  try {
    console.log(`[notifyLeadStatusChangedToScheduling] Called for lead ${leadId}, assigned user: ${assignedUserId || 'none'}`);
    const supabase = createAdminClient();

    // Fetch lead details including scheduling fields
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id,
        lead_status,
        priority,
        estimated_value,
        pest_type,
        comments,
        updated_at,
        assigned_to,
        requested_date,
        requested_time,
        companies:company_id (
          name
        ),
        customers:customer_id (
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code
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

    if (leadError || !lead) {
      console.error('Failed to fetch lead for scheduling notification:', leadError);
      return {
        success: false,
        error: 'Lead not found',
      };
    }

    // Build customer name
    const customer = lead.customers as any;
    const customerName = customer
      ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email || 'Unknown'
      : 'Unknown';

    // Build address string
    let address = 'Address not provided';
    if (lead.service_addresses) {
      const addr = lead.service_addresses as any;
      const parts = [
        addr.street_address,
        addr.apartment_unit,
        addr.city,
        addr.state,
        addr.zip_code,
      ].filter(Boolean);
      address = parts.join(', ');
    } else if (customer) {
      const parts = [
        customer.address,
        customer.city,
        customer.state,
        customer.zip_code,
      ].filter(Boolean);
      if (parts.length > 0) {
        address = parts.join(', ');
      }
    }

    // Generate lead URL
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const leadUrl = `${appUrl}/connections/leads/${leadId}`;

    // Build notification data with scheduling context
    const leadNotificationData: LeadNotificationData & {
      leadUrl?: string;
      requestedDate?: string;
      requestedTime?: string;
    } = {
      leadId: lead.id,
      companyName: (lead.companies as any)?.name || 'Unknown Company',
      customerName,
      customerEmail: customer?.email || '',
      customerPhone: customer?.phone || '',
      pestType: lead.pest_type || 'Not specified',
      address,
      priority: (lead.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
      autoCallEnabled: false,
      submittedAt: lead.updated_at,
      leadUrl,
      requestedDate: (lead as any).requested_date,
      requestedTime: (lead as any).requested_time,
    };

    // Send notification
    // If lead has assigned user, notify only them
    // Otherwise, notify scheduling department
    console.log(`[notifyLeadStatusChangedToScheduling] Sending to ${assignedUserId || lead.assigned_to ? 'assigned user' : 'scheduling department'}`);
    const result = await sendLeadNotificationsWithDepartmentFiltering(
      companyId,
      leadNotificationData,
      {
        assignedUserId: assignedUserId || lead.assigned_to,
        department: 'scheduling',
        leadStatus: 'scheduling',
        notificationType: 'lead_status_changed_scheduling',
      }
    );

    console.log(`[notifyLeadStatusChangedToScheduling] Result - Success: ${result.success}, Recipients: ${result.successCount}, Failures: ${result.failureCount}`);

    return {
      success: result.success,
      recipientCount: result.successCount,
    };
  } catch (error) {
    console.error('Error in notifyLeadStatusChangedToScheduling:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
