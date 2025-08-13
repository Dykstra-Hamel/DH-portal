# 🔧 DH Portal Automation System

> **Complete guide to the automated workflow system for pest control companies**

## Table of Contents
- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Production Workflows](#production-workflows)
- [Workflow Types](#workflow-types)
- [Client Usage Examples](#client-usage-examples)
- [Configuration](#configuration)
- [Development & Testing](#development--testing)
- [Security](#security)
- [Deployment](#deployment)
- [Monitoring](#monitoring)

---

## System Overview

The DH Portal Automation System provides pest control companies with intelligent, event-driven workflows that automatically respond to customer actions. Built on **Inngest** + **Supabase** + **Next.js**, it enables 24/7 lead management, personalized communication, and consistent follow-up processes.

### Key Features
- ⚡ **Real-time Triggers**: Instant response to lead creation, status changes
- 📧 **Dynamic Email Templates**: Personalized with customer/company data
- 📞 **Automated Calls**: Retell AI integration for voice responses
- ⏰ **Intelligent Scheduling**: Business hours enforcement, smart delays
- 🔄 **Multi-step Workflows**: Complex sequences with conditions
- 📊 **Analytics & Tracking**: Complete execution monitoring

---

## Architecture

```
Client Action → API Endpoint → Inngest Event → Workflow Functions → Actions
     ↓              ↓              ↓               ↓              ↓
Form Submit → /api/widget/submit → lead/created → Email/Call → Customer
Lead Update → /api/leads/update → status_changed → Follow-up → Automation
```

### Core Technologies
- **Inngest v3.40.1**: Event orchestration and workflow execution
- **Supabase**: Database with Row Level Security (RLS)
- **Next.js 15**: API routes and web application
- **Retell AI**: Automated phone calls
- **Resend**: Email delivery service

### File Structure
```
src/
├── lib/inngest/
│   ├── client.ts                 # Inngest client configuration
│   ├── config.ts                 # Development/production settings
│   └── functions/
│       ├── lead-created.ts       # New lead automation
│       ├── automation-trigger.ts # General workflow trigger
│       ├── email-scheduled.ts    # Email step execution
│       ├── workflow-test.ts      # Testing functions
│       └── call-scheduling-handler.ts # Call automation
├── app/api/
│   ├── widget/submit/route.ts    # Lead creation endpoint
│   ├── companies/[id]/workflows/ # Workflow management
│   └── debug/trigger-event/      # Development testing
└── scripts/
    ├── seed-automation-data.js   # Test data creation
    └── test-automations.js       # Testing utilities
```

---

## Database Schema

### Core Tables

#### `automation_workflows`
```sql
CREATE TABLE automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT, -- 'lead_nurturing', 'immediate_response', etc.
  trigger_type TEXT, -- 'lead_created', 'lead_updated', 'lead_status_changed'
  trigger_conditions JSONB, -- Matching conditions
  workflow_steps JSONB[], -- Array of step configurations
  is_active BOOLEAN DEFAULT true,
  business_hours_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `email_templates`
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT, -- 'welcome', 'followup', 'urgent'
  subject_line TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  variables TEXT[], -- Available template variables
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Workflow Step Structure
```json
{
  "id": "step-1",
  "type": "email|call|wait|update_lead_status",
  "delay_minutes": 0,
  "template_id": "uuid", // For email steps
  "call_type": "immediate|follow_up|urgent", // For call steps
  "new_status": "contacted", // For status update steps
  "conditions": {
    "email_not_opened": true,
    "call_outcome": "no_answer",
    "urgency": "high"
  }
}
```

---

## Production Workflows

### Event Triggers

#### 1. New Lead Created
**File:** `src/app/api/widget/submit/route.ts`
```javascript
// Automatically triggered when customer submits form
await sendEvent({
  name: 'lead/created',
  data: {
    leadId: lead.id,
    companyId: submission.companyId,
    customerId: customerId,
    leadData: {
      customerName: submission.contactInfo.name,
      customerEmail: submission.contactInfo.email,
      customerPhone: submission.contactInfo.phone,
      pestType: submission.pestType,
      urgency: submission.urgency,
      address: submission.address,
      homeSize: submission.homeSize,
      selectedPlan: submission.selectedPlan?.plan_name,
      estimatedPrice: submission.estimatedPrice
    },
    attribution: {
      leadSource: submission.leadSource,
      utmSource: submission.utmSource,
      utmMedium: submission.utmMedium,
      utmCampaign: submission.utmCampaign
    },
    createdAt: new Date().toISOString()
  }
});
```

#### 2. Lead Status Changed
```javascript
// Triggered when lead status updates (won, lost, qualified, etc.)
await sendEvent({
  name: 'lead/status_changed',
  data: {
    leadId: leadId,
    companyId: companyId,
    customerId: customerId,
    oldStatus: 'qualified',
    newStatus: 'won',
    leadData: { /* complete lead information */ },
    changedBy: userId,
    changedAt: new Date().toISOString()
  }
});
```

### Available Trigger Types
- `lead_created` - New lead submitted via form
- `lead_updated` - Lead information modified
- `lead_status_changed` - Status changed (new → contacted → qualified → won/lost)
- `email_opened` - Customer opened email
- `email_clicked` - Customer clicked email link
- `call_completed` - Phone call finished (with outcome data)

---

## Workflow Types

### 1. Email Steps
Send personalized emails using dynamic templates.

```json
{
  "type": "email",
  "delay_minutes": 0,
  "template_id": "welcome-template-uuid",
  "conditions": {
    "email_not_opened": true // Only send if previous email wasn't opened
  }
}
```

**Template Variables:**
- `{{customerName}}` - Customer's full name
- `{{customerEmail}}` - Customer's email address
- `{{customerPhone}}` - Customer's phone number
- `{{companyName}}` - Client company name
- `{{companyPhone}}` - Client phone number
- `{{companyEmail}}` - Client email address
- `{{pestType}}` - Type of pest problem
- `{{urgency}}` - Urgency level (low/medium/high)
- `{{address}}` - Customer's address
- `{{leadSource}}` - How the lead was generated
- `{{createdDate}}` - When the lead was created

### 2. Call Steps
Automated phone calls using Retell AI integration.

```json
{
  "type": "call",
  "delay_minutes": 60,
  "call_type": "follow_up",
  "conditions": {
    "call_outcome": "no_answer" // Only if previous call had no answer
  }
}
```

**Call Types:**
- `immediate` - Call right away (emergency response)
- `follow_up` - Standard follow-up call
- `urgent` - High-priority callback

**Call Outcomes:**
- `successful` - Call completed successfully
- `failed` - Technical failure
- `no_answer` - No one answered
- `busy` - Line was busy
- `voicemail` - Went to voicemail

### 3. Wait Steps
Add delays between workflow actions.

```json
{
  "type": "wait",
  "delay_minutes": 1440 // 24 hours
}
```

**Duration Limits:**
- Minimum: 1 minute
- Maximum: 10,080 minutes (1 week)

### 4. Status Update Steps
Automatically update lead status in CRM.

```json
{
  "type": "update_lead_status",
  "new_status": "contacted"
}
```

**Valid Statuses:**
- `new` - Just created
- `contacted` - Initial contact made
- `qualified` - Qualified as potential customer
- `quoted` - Price quote provided
- `won` - Customer signed up
- `lost` - Customer declined
- `unqualified` - Not a good fit

---

## Client Usage Examples

### Example 1: High-Urgency Emergency Response
For termite infestations, bed bugs, or other urgent pest problems.

```json
{
  "name": "Emergency Pest Response",
  "description": "Immediate response for high-urgency pest emergencies",
  "workflow_type": "immediate_response",
  "trigger_type": "lead_created",
  "trigger_conditions": {
    "urgency": "high",
    "pest_types": ["termites", "bed_bugs", "wasps"]
  },
  "workflow_steps": [
    {
      "id": "step-1",
      "type": "call",
      "delay_minutes": 0,
      "call_type": "immediate",
      "conditions": {}
    },
    {
      "id": "step-2", 
      "type": "email",
      "delay_minutes": 5,
      "template_id": "emergency-followup-email",
      "conditions": {
        "call_outcome": "no_answer"
      }
    },
    {
      "id": "step-3",
      "type": "update_lead_status", 
      "delay_minutes": 0,
      "new_status": "contacted"
    }
  ],
  "is_active": true,
  "business_hours_only": false
}
```

**Business Flow:**
1. Customer reports termite emergency on website
2. **Immediate phone call** attempted
3. If no answer → **Emergency follow-up email** sent in 5 minutes
4. Lead status automatically updated to "contacted"

### Example 2: Customer Won Onboarding
Celebrate new customers and prepare them for service.

```json
{
  "name": "New Customer Onboarding",
  "description": "Welcome sequence for customers who signed up",
  "workflow_type": "customer_onboarding", 
  "trigger_type": "lead_status_changed",
  "trigger_conditions": {
    "new_status": "won"
  },
  "workflow_steps": [
    {
      "id": "step-1",
      "type": "email",
      "delay_minutes": 0,
      "template_id": "welcome-new-customer",
      "conditions": {}
    },
    {
      "id": "step-2",
      "type": "wait", 
      "delay_minutes": 1440
    },
    {
      "id": "step-3",
      "type": "email",
      "delay_minutes": 0,
      "template_id": "service-preparation-guide",
      "conditions": {}
    }
  ],
  "is_active": true,
  "business_hours_only": false
}
```

**Business Flow:**
1. Sales team marks lead as "won" in CRM
2. **Welcome email** sent immediately with next steps
3. **24-hour wait period**
4. **Service preparation email** with what to expect

### Example 3: Standard Lead Nurturing
Multi-touch sequence for regular lead follow-up.

```json
{
  "name": "Standard Lead Nurturing Sequence",
  "description": "5-touch nurturing for standard leads", 
  "workflow_type": "lead_nurturing",
  "trigger_type": "lead_created",
  "trigger_conditions": {
    "urgency": ["low", "medium"],
    "pest_types": ["ants", "roaches", "spiders", "mice"]
  },
  "workflow_steps": [
    {
      "id": "step-1",
      "type": "email",
      "delay_minutes": 0,
      "template_id": "initial-response-template",
      "conditions": {}
    },
    {
      "id": "step-2", 
      "type": "wait",
      "delay_minutes": 180
    },
    {
      "id": "step-3",
      "type": "call",
      "delay_minutes": 0, 
      "call_type": "follow_up",
      "conditions": {
        "email_not_opened": true
      }
    },
    {
      "id": "step-4",
      "type": "wait",
      "delay_minutes": 1440
    },
    {
      "id": "step-5",
      "type": "email",
      "delay_minutes": 0,
      "template_id": "second-followup-template", 
      "conditions": {}
    }
  ],
  "is_active": true,
  "business_hours_only": true
}
```

**Business Flow:**
1. Non-urgent lead submitted (ants, roaches, etc.)
2. **Immediate acknowledgment email**
3. **3-hour wait**
4. **Phone call only if email wasn't opened**
5. **24-hour wait**
6. **Second follow-up email** with special offers

---

## Configuration

### Company Settings
Each pest control company can configure their automation preferences:

```javascript
// Company-specific automation settings
const companySettings = {
  automation_enabled: true,
  
  // Business hours for call scheduling
  business_hours: {
    start: "09:00",
    end: "17:00",
    timezone: "America/New_York", 
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
  },
  
  // Call configuration
  retell_agent_id: "agent_xyz123",
  default_caller_id: "+1234567890",
  call_recording_enabled: true,
  
  // Email settings
  from_email: "info@pestcompany.com",
  from_name: "Pest Company Team",
  reply_to_email: "support@pestcompany.com"
};
```

### Environment Variables

#### Development
```bash
# Inngest Development (no keys needed)
INNGEST_DEV=true

# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=local_service_role_key

# Email Testing (saves to files)
RESEND_API_KEY=development_key
```

#### Production
```bash
# Inngest Production
INNGEST_EVENT_KEY=prod_event_key_here
INNGEST_SIGNING_KEY=prod_signing_key_here

# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=prod_service_role_key

# Email Service
RESEND_API_KEY=prod_resend_api_key
RESEND_FROM_EMAIL=notifications@yourcompany.com

# Call Service
RETELL_API_KEY=prod_retell_api_key
RETELL_AGENT_ID=prod_agent_id
```

---

## Development & Testing

### Local Development Setup

1. **Start Development Servers**
```bash
npm run dev-with-automations
```
This starts:
- Next.js on `http://localhost:3000`
- Inngest dev server on `http://localhost:8288`

2. **Seed Test Data**
```bash
npm run seed-automations
```
Creates:
- 2 Email templates
- 3 Test workflows 
- 2 Test customers
- 2 Test leads

3. **Test Workflows**
```bash
# Test specific workflow (sends actual Inngest events)
npm run inngest:test workflow

# Test lead creation automation
npm run inngest:test lead

# List current test data
npm run inngest:test list
```

### Testing Features

#### Workflow Validation Testing
```bash
npm run inngest:test workflow
```
- Validates workflow configuration
- Sends actual Inngest events when `triggerActualEvents: true`
- Shows step-by-step execution in Inngest dashboard
- Displays email previews with rendered variables

#### Lead Creation Testing  
```bash
npm run inngest:test lead
```
- Creates actual lead in database
- Triggers real `lead/created` events
- Executes matching automation workflows
- Shows full end-to-end automation flow

#### Manual Event Testing
```javascript
// Send custom events via debug endpoint
fetch('http://localhost:3000/api/debug/trigger-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: {
      name: 'lead/status_changed',
      data: {
        leadId: 'test-lead-123',
        companyId: 'company-uuid',
        oldStatus: 'new',
        newStatus: 'won'
      }
    }
  })
});
```

### Development Email Capture
In development, emails are saved as HTML files instead of being sent:
- Location: `/tmp/dev-emails/`
- Format: `email_[timestamp].html`
- View in browser to see rendered templates

---

## Security

### Authentication & Authorization

#### Row Level Security (RLS)
Database policies ensure companies only access their own data:

```sql
-- Workflows policy
CREATE POLICY "Companies can only access their workflows" 
ON automation_workflows FOR ALL 
USING (company_id = get_current_company_id());

-- Templates policy  
CREATE POLICY "Companies can only access their templates"
ON email_templates FOR ALL
USING (company_id = get_current_company_id());
```

#### Service Role Bypass
Inngest functions use service role key for database access:

```javascript
// Bypasses user authentication for automation processes
const supabase = createAdminClient();
// Uses SUPABASE_SERVICE_ROLE_KEY with full database access
```

#### API Route Authentication
Test endpoints include service role authentication for development:

```javascript
// Development-only service role bypass
const isServiceRoleAuth = authHeader?.startsWith('Bearer ') && 
                         authHeader.split(' ')[1] === process.env.SUPABASE_SERVICE_ROLE_KEY &&
                         process.env.NODE_ENV !== 'production';
```

### Data Protection
- All sensitive data encrypted at rest (Supabase)
- Environment variables for API keys
- No secrets logged or exposed in client code
- Rate limiting on API endpoints
- Input validation and sanitization

---

## Deployment

### Production Deployment Checklist

#### 1. Environment Setup
- [ ] Set production Inngest keys (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`)
- [ ] Configure production Supabase URL and service role key
- [ ] Set up production email service (Resend API key)
- [ ] Configure Retell AI for production calls
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)

#### 2. Database Migration
```bash
# Deploy database schema changes
npx supabase db push --linked

# Verify RLS policies are active
npx supabase db-lint
```

#### 3. Inngest Configuration
- Create production Inngest app at [app.inngest.com](https://app.inngest.com)
- Configure webhook endpoint: `https://yourapp.com/api/inngest`
- Set up event key and signing key
- Test connection with sample event

#### 4. Monitoring Setup
- [ ] Inngest dashboard access for workflow monitoring
- [ ] Supabase dashboard for database monitoring  
- [ ] Email delivery tracking via Resend
- [ ] Call analytics via Retell AI
- [ ] Application performance monitoring

### Scaling Considerations

#### Performance Optimization
- **Database Indexing**: Add indexes on frequently queried columns
- **Caching**: Implement Redis for template and workflow caching
- **Queue Management**: Inngest handles automatic scaling and retries
- **Rate Limiting**: Prevent abuse with API rate limits

#### High-Volume Scenarios
- **Batch Processing**: Group similar operations for efficiency
- **Parallel Execution**: Multiple workflows can run simultaneously
- **Retry Strategies**: Exponential backoff for failed operations
- **Circuit Breakers**: Prevent cascade failures in external services

---

## Monitoring

### Inngest Dashboard
Access at [app.inngest.com](https://app.inngest.com) (production) or `http://localhost:8288` (development)

**Key Metrics:**
- Function execution history
- Success/failure rates  
- Average execution time
- Retry attempts and patterns
- Event throughput

**Troubleshooting Views:**
- Failed function executions with error details
- Event flow visualization
- Step-by-step execution logs
- Performance bottlenecks

### Database Analytics
Query workflow execution data:

```sql
-- Workflow execution summary
SELECT 
  w.name,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM workflow_executions we
JOIN automation_workflows w ON w.id = we.workflow_id
WHERE we.created_at >= NOW() - INTERVAL '7 days'
GROUP BY w.name;

-- Email delivery rates
SELECT 
  template_name,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE delivered = true) as delivered,
  COUNT(*) FILTER (WHERE opened = true) as opened,
  COUNT(*) FILTER (WHERE clicked = true) as clicked
FROM email_logs 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY template_name;
```

### Key Performance Indicators (KPIs)

#### Automation Health
- **Function Success Rate**: >95% execution success
- **Average Response Time**: <30 seconds for email steps
- **Retry Rate**: <10% of functions require retries

#### Business Impact  
- **Lead Response Time**: Average time from submission to first contact
- **Email Open Rates**: Percentage of automated emails opened
- **Conversion Rate**: Leads that progress through workflow steps
- **Call Success Rate**: Percentage of automated calls completed

### Alerting & Notifications
Set up alerts for critical issues:

```javascript
// Example: Monitor workflow failures
if (failureRate > 0.05) {
  await sendAlert({
    type: 'workflow_failure',
    message: `Workflow failure rate exceeded 5%: ${failureRate * 100}%`,
    severity: 'high',
    workflow: workflowName
  });
}
```

---

## API Reference

### Core Events

#### `lead/created`
Triggered when a new lead is submitted via the widget form.

```typescript
interface LeadCreatedEvent {
  name: 'lead/created';
  data: {
    leadId: string;
    companyId: string;
    customerId: string;
    leadData: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      pestType: string;
      urgency: 'low' | 'medium' | 'high';
      address: string;
      homeSize?: number;
      selectedPlan?: string;
      estimatedPrice?: {
        min: number;
        max: number;
        service_type: string;
      };
    };
    attribution: {
      leadSource: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    };
    createdAt: string;
  };
}
```

#### `workflow/test`
Used for testing workflow execution in development.

```typescript
interface WorkflowTestEvent {
  name: 'workflow/test';
  data: {
    workflowId: string;
    companyId: string;
    testData: {
      sampleLead: Record<string, any>;
      skipActualExecution?: boolean;
    };
    userId: string;
  };
}
```

### API Endpoints

#### `POST /api/companies/[id]/workflows/[workflowId]/test`
Test a specific workflow with sample data.

**Request:**
```json
{
  "sampleLead": {
    "name": "John Smith",
    "email": "john@example.com", 
    "phone": "(555) 123-4567",
    "pest_type": "ants",
    "urgency": "high"
  },
  "triggerActualEvents": true,
  "skipActualExecution": false
}
```

**Response:**
```json
{
  "success": true,
  "workflow": {
    "id": "workflow-uuid",
    "name": "Standard Lead Nurturing",
    "description": "Multi-step lead nurturing sequence"
  },
  "testResult": {
    "executionId": "test-1234567890",
    "steps": [...],
    "summary": {
      "totalSteps": 3,
      "successfulSteps": 3,
      "emailSteps": 2
    },
    "emailPreviews": [...],
    "inngestEventTriggered": true,
    "inngestEventId": "workflow-test-1234567890"
  }
}
```

---

## Best Practices

### Workflow Design
1. **Keep It Simple**: Start with 2-3 step workflows and add complexity gradually
2. **Use Conditions**: Leverage conditional logic to avoid spam (e.g., only email if previous not opened)
3. **Respect Timing**: Allow reasonable delays between touchpoints
4. **Business Hours**: Use business hour restrictions for calls and important communications
5. **A/B Testing**: Test different email templates and timing strategies

### Template Creation
1. **Personalization**: Always use customer and company variables
2. **Mobile Friendly**: Ensure templates render well on mobile devices
3. **Clear CTAs**: Include obvious next steps for customers
4. **Brand Consistency**: Match company branding and voice
5. **Legal Compliance**: Include unsubscribe links and privacy notices

### Performance Optimization
1. **Template Caching**: Cache frequently used templates in memory
2. **Batch Operations**: Group database operations when possible
3. **Error Handling**: Implement graceful degradation for external service failures
4. **Monitoring**: Set up comprehensive logging and alerting
5. **Testing**: Regularly test workflows in staging environment

### Security Best Practices
1. **Environment Variables**: Never hardcode API keys or secrets
2. **Input Validation**: Sanitize all user inputs to prevent injection
3. **Rate Limiting**: Implement rate limits on public endpoints
4. **Access Control**: Use RLS policies to isolate company data
5. **Audit Logging**: Log all workflow executions and changes

---

## Troubleshooting

### Common Issues

#### Workflow Not Triggering
1. Check if automation is enabled for the company
2. Verify trigger conditions match the lead data
3. Ensure workflow is marked as active
4. Check Inngest dashboard for event delivery
5. Verify database permissions and RLS policies

#### Email Not Sending  
1. Verify email template exists and is active
2. Check template variables are properly formatted
3. Ensure Resend API key is valid
4. Look for delivery errors in email service logs
5. Check for unsubscribe status or bounced emails

#### Call Not Executing
1. Verify Retell AI integration is configured
2. Check business hours restrictions
3. Ensure phone number format is valid
4. Verify Retell agent ID and API key
5. Check for call queue limitations

### Debug Tools

#### Development Console
```bash
# View Inngest function logs
npm run inngest:dev

# Test specific workflow
npm run inngest:test workflow

# View email previews
open /tmp/dev-emails/email_latest.html
```

#### Production Monitoring
```javascript
// Enable debug logging
console.log('Workflow triggered:', {
  workflowId,
  companyId,
  triggerType,
  leadData
});

// Track execution time
const startTime = Date.now();
// ... workflow execution
const executionTime = Date.now() - startTime;
console.log('Workflow completed in:', executionTime, 'ms');
```

### Getting Help

1. **Inngest Documentation**: [inngest.com/docs](https://inngest.com/docs)
2. **Supabase Support**: [supabase.com/support](https://supabase.com/support)  
3. **Project Repository**: Check GitHub issues and discussions
4. **Development Team**: Contact Austin for system-specific questions

---

## Changelog

### Version 1.0.0 (Current)
- Initial automation system implementation
- Inngest integration with workflow orchestration
- Email template system with dynamic variables
- Retell AI call automation
- Development testing tools and scripts
- Production deployment configuration
- Comprehensive monitoring and analytics

### Planned Features
- Visual workflow builder interface
- A/B testing framework for templates
- Advanced analytics dashboard  
- SMS messaging integration
- Calendar scheduling integration
- Advanced conditional logic builder
- Bulk workflow management tools

---

*Last updated: August 12, 2025*
*System Version: 1.0.0*
*Built with ❤️ for pest control companies*