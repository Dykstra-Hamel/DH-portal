import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';

export const leadFollowUpSequence = inngest.createFunction(
  {
    id: 'lead-followup-sequence',
    name: 'Lead Follow-up Sequence',
    retries: 2,
  },
  { event: 'automation/followup-sequence' },
  async ({ event, step }) => {
    const { companyId, leadId, customerId, sequenceType = 'standard' } = event.data;
    
    console.log(`Starting follow-up sequence for lead: ${leadId}, sequence: ${sequenceType}`);

    // Step 1: Get company automation settings
    const companySettings = await step.run('get-company-settings', async () => {
      const supabase = createAdminClient();
      
      const { data: settings } = await supabase
        .from('company_settings')
        .select('setting_key, setting_value')
        .eq('company_id', companyId)
        .in('setting_key', [
          'automation_enabled',
          'automation_business_hours_only',
          'automation_max_emails_per_day'
        ]);

      const settingsMap = new Map(settings?.map(s => [s.setting_key, s.setting_value]) || []);
      
      return {
        automationEnabled: settingsMap.get('automation_enabled') === 'true',
        businessHoursOnly: settingsMap.get('automation_business_hours_only') === 'true',
        maxEmailsPerDay: parseInt(settingsMap.get('automation_max_emails_per_day') || '10'),
      };
    });

    if (!companySettings.automationEnabled) {
      console.log(`Automation disabled for company ${companyId}`);
      return { success: true, message: 'Automation disabled' };
    }

    // Step 2: Get lead and customer data
    const leadData = await step.run('get-lead-data', async () => {
      const supabase = createAdminClient();
      
      const { data: lead } = await supabase
        .from('leads')
        .select(`
          *,
          customer:customers (
            id,
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            state,
            zip_code
          )
        `)
        .eq('id', leadId)
        .single();

      if (!lead) {
        throw new Error(`Lead ${leadId} not found`);
      }

      return lead;
    });

    // Step 3: Check if lead is still eligible for follow-up
    const isEligible = await step.run('check-followup-eligibility', async () => {
      // Don't follow up on won, lost, or unqualified leads
      if (['won', 'lost', 'unqualified'].includes(leadData.lead_status)) {
        return { eligible: false, reason: `Lead status is ${leadData.lead_status}` };
      }

      // Check if we've already sent too many emails today
      const supabase = createAdminClient();
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todayEmails, error } = await supabase
        .from('email_automation_log')
        .select('id')
        .eq('company_id', companyId)
        .eq('recipient_email', leadData.customer.email)
        .gte('sent_at', `${today}T00:00:00.000Z`)
        .lt('sent_at', `${today}T23:59:59.999Z`);

      if (error) {
        console.warn('Error checking daily email count:', error);
      }

      const emailCount = todayEmails?.length || 0;
      if (emailCount >= companySettings.maxEmailsPerDay) {
        return { 
          eligible: false, 
          reason: `Daily email limit reached (${emailCount}/${companySettings.maxEmailsPerDay})` 
        };
      }

      return { eligible: true };
    });

    if (!isEligible.eligible) {
      const reason = 'reason' in isEligible ? isEligible.reason : 'Not eligible';
      console.log(`Follow-up not eligible: ${reason}`);
      return { success: true, message: reason };
    }

    // Step 4: Get available email templates
    const templates = await step.run('get-email-templates', async () => {
      const supabase = createAdminClient();
      
      const { data: emailTemplates } = await supabase
        .from('email_templates')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .eq('template_type', 'followup')
        .order('name');

      return emailTemplates || [];
    });

    if (templates.length === 0) {
      console.log(`No follow-up email templates found for company ${companyId}`);
      return { success: true, message: 'No follow-up templates available' };
    }

    // Step 5: Execute follow-up sequence based on type
    let sequenceSteps: any[] = [];

    switch (sequenceType) {
      case 'standard':
        sequenceSteps = [
          { delay: '1h', templateName: 'Follow-up - 1 Hour' },
          { delay: '24h', templateName: 'Follow-up - 24 Hours' },
          { delay: '72h', templateName: 'Follow-up - 3 Days' },
          { delay: '168h', templateName: 'Follow-up - 7 Days' },
        ];
        break;
      case 'urgent':
        sequenceSteps = [
          { delay: '30m', templateName: 'Follow-up - 1 Hour' },
          { delay: '4h', templateName: 'Follow-up - 24 Hours' },
          { delay: '24h', templateName: 'Follow-up - 3 Days' },
        ];
        break;
      case 'nurture':
        sequenceSteps = [
          { delay: '2h', templateName: 'Follow-up - 1 Hour' },
          { delay: '48h', templateName: 'Follow-up - 24 Hours' },
          { delay: '120h', templateName: 'Follow-up - 3 Days' },
          { delay: '336h', templateName: 'Follow-up - 7 Days' },
        ];
        break;
      default:
        sequenceSteps = [{ delay: '1h', templateName: 'Follow-up - 1 Hour' }];
    }

    // Step 6: Schedule each email in the sequence
    const scheduledEmails: any[] = [];

    for (let i = 0; i < sequenceSteps.length; i++) {
      const sequenceStep = sequenceSteps[i];
      
      const scheduledEmail = await step.run(`schedule-email-${i}`, async () => {
        // Find the template
        const template = templates.find(t => t.name === sequenceStep.templateName);
        
        if (!template) {
          console.warn(`Template not found: ${sequenceStep.templateName}`);
          return { skipped: true, reason: `Template not found: ${sequenceStep.templateName}` };
        }

        // Calculate send time
        const sendTime = new Date();
        const delayMatch = sequenceStep.delay.match(/^(\d+)([mhd])$/);
        
        if (delayMatch) {
          const [, amount, unit] = delayMatch;
          const delayAmount = parseInt(amount);
          
          switch (unit) {
            case 'm':
              sendTime.setMinutes(sendTime.getMinutes() + delayAmount);
              break;
            case 'h':
              sendTime.setHours(sendTime.getHours() + delayAmount);
              break;
            case 'd':
              sendTime.setDate(sendTime.getDate() + delayAmount);
              break;
          }
        }

        // Schedule the email
        await inngest.send({
          name: 'email/scheduled',
          data: {
            companyId,
            templateId: template.id,
            recipientEmail: leadData.customer.email,
            recipientName: `${leadData.customer.first_name} ${leadData.customer.last_name}`.trim(),
            leadId,
            customerId,
            variables: {
              customerName: `${leadData.customer.first_name} ${leadData.customer.last_name}`.trim(),
              customerEmail: leadData.customer.email,
              customerPhone: leadData.customer.phone,
              pestType: extractPestTypeFromComments(leadData.comments),
              urgency: extractUrgencyFromComments(leadData.comments),
              address: leadData.customer.address || '',
              homeSize: extractHomeSizeFromComments(leadData.comments),
              estimatedPrice: leadData.estimated_value ? {
                min: Math.round(leadData.estimated_value * 0.8),
                max: Math.round(leadData.estimated_value * 1.2),
                service_type: 'Professional pest control service',
              } : null,
              leadCreatedAt: leadData.created_at,
            },
            scheduledFor: sendTime.toISOString(),
            workflowId: `followup-${sequenceType}`,
            stepId: `step-${i}`,
          },
        });

        return {
          templateId: template.id,
          templateName: template.name,
          scheduledFor: sendTime.toISOString(),
          delay: sequenceStep.delay,
        };
      });

      scheduledEmails.push(scheduledEmail);

      // Add delay between scheduling to avoid overwhelming the system
      if (i < sequenceSteps.length - 1) {
        await step.sleep(`delay-between-schedules-${i}`, '1s');
      }
    }

    return {
      success: true,
      leadId,
      customerId,
      sequenceType,
      scheduledEmails,
      totalEmailsScheduled: scheduledEmails.filter(e => !e.skipped).length,
    };
  }
);

// Helper functions to extract data from lead comments
function extractPestTypeFromComments(comments: string): string {
  if (!comments) return 'pest control';
  
  const pestTypes = ['ants', 'roaches', 'spiders', 'mice', 'rats', 'termites', 'bed bugs', 'wasps', 'mosquitoes'];
  const lowerComments = comments.toLowerCase();
  
  for (const pest of pestTypes) {
    if (lowerComments.includes(pest)) {
      return pest;
    }
  }
  
  return 'pest control';
}

function extractUrgencyFromComments(comments: string): string {
  if (!comments) return 'medium';
  
  const lowerComments = comments.toLowerCase();
  
  if (lowerComments.includes('urgent') || lowerComments.includes('emergency') || lowerComments.includes('asap')) {
    return 'urgent';
  }
  
  if (lowerComments.includes('high') || lowerComments.includes('serious') || lowerComments.includes('major')) {
    return 'high';
  }
  
  if (lowerComments.includes('low') || lowerComments.includes('minor') || lowerComments.includes('whenever')) {
    return 'low';
  }
  
  return 'medium';
}

function extractHomeSizeFromComments(comments: string): number | null {
  if (!comments) return null;
  
  const sizeMatch = comments.match(/(\d+)\s*(?:sq\s*ft|square\s*feet|sqft)/i);
  
  if (sizeMatch) {
    return parseInt(sizeMatch[1]);
  }
  
  return null;
}