# DH Portal - Claude Code Instructions

## Project Overview

This is a Next.js application with Supabase authentication supporting Google OAuth, Facebook OAuth, and magic links.

## Authentication Setup

- Using Supabase v2.50.4
- Auth component: `src/components/Auth.tsx`
- Supabase client: `src/lib/supabase.ts`
- Supported auth methods: Google OAuth, Facebook OAuth, Magic Links
- Auth callback route: `/auth/callback`

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Code Conventions

- Use TypeScript for all files
- Follow existing component and file patterns in `src/components/`
- The SCSS files should live in a folder with the component it is intended to style. for example, for a hero component, there should be a Hero folder in the components folder, with both a hero.tsx, and a hero.modules.scss file within it.
- Prefer functional components with hooks
- Use absolute imports with `@/` prefix
- when we ask for you to get our code ready for production, look specifically at the code that has been changed on the current branch and look for improvements in: Security Vulnerabilities, ineffeciencies or redundencies, and unnecessary console logging.

## Local Testing

- If you need to check something on a local dev server, check for an existing server running on port 3000 before attempting to open a new one.
- Check for an existing server at port 3000 first before spinning up any new dev servers

- **JSX Entity Escaping**: Always escape special characters in JSX text:
  - Apostrophes: `don&apos;t` instead of `don't`
  - Quotes: `&quot;` instead of `"`
  - Less than: `&lt;` instead of `<`
  - Greater than: `&gt;` instead of `>`
  - This prevents Vercel build errors with `react/no-unescaped-entities`

## Next.js API Route Rules

- **IMPORTANT**: All API routes with dynamic segments must use `Promise<{ param: string }>` type for params
- Always await params before using them: `const { id } = await params;`
- **Example**:
  ```typescript
  export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
    // Use id here
  }
  ```
- This prevents Vercel build errors with Next.js 15+

## Styling Convetions

- Do not use tailwind for styling. We will only use Scss Modules.

## Supabase Configuration

- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Auth providers configured: Google, Facebook
- Email templates configured for magic links

## Supabase Migration Files

When creating a new migration file, ALWAYS use the following naming convention:

- The file MUST be named in the format `YYYYMMDDHHmmss_short_description.sql` with proper casing for months, minutes, and seconds in UTC time:

1. `YYYY` - Four digits for the year (e.g., `2024`).
2. `MM` - Two digits for the month (01 to 12).
3. `DD` - Two digits for the day of the month (01 to 31).
4. `HH` - Two digits for the hour in 24-hour format (00 to 23).
5. `mm` - Two digits for the minute (00 to 59).
6. `ss` - Two digits for the second (00 to 59).
7. Add an appropriate description for the migration.

- **Example**

```
20240906123045_create_profiles.sql
```

- The current time should be used to generate the timestamp to prevent duplicated filenames from different users.

## Supabase RLS Performance Conventions

When creating or editing RLS policies in a migration, follow these rules. They prevent the `auth_rls_initplan` and `multiple_permissive_policies` lints flagged by the Supabase performance advisor.

### 1. Always wrap auth.<fn>() in (SELECT ...)

Wrong (re-evaluated for every row):

```sql
USING (auth.uid() = user_id)
USING (auth.role() = 'authenticated')
USING (auth.jwt() ->> 'role' = 'admin')
```

Right (evaluated once per statement):

```sql
USING ((SELECT auth.uid()) = user_id)
USING ((SELECT auth.role()) = 'authenticated')
USING ((SELECT auth.jwt()) ->> 'role' = 'admin')
```

This applies to `auth.uid()`, `auth.role()`, `auth.jwt()`, `auth.email()`.

### 2. Always specify TO <role> on every policy

Without `TO`, a policy applies to every Postgres role (anon, authenticated, authenticator, dashboard_user, service_role) and the linter flags overlaps on each. Default to:

```sql
CREATE POLICY ... ON <table>
  FOR <action>
  TO authenticated     -- or anon, or service_role -- be explicit
  USING (...);
```

### 3. One permissive policy per (role, action) pair

If two policies both apply to the same role+action, Postgres evaluates BOTH on every matching row. Consolidate by OR'ing their conditions into a single policy.

Wrong:

```sql
CREATE POLICY "admin can do anything" ON t FOR ALL USING (is_admin());
CREATE POLICY "user can read own" ON t FOR SELECT USING (user_id = (SELECT auth.uid()));
-- Overlap on SELECT for authenticated role.
```

Right:

```sql
CREATE POLICY "t_select" ON t FOR SELECT TO authenticated
  USING (is_admin() OR user_id = (SELECT auth.uid()));
CREATE POLICY "t_insert" ON t FOR INSERT TO authenticated
  WITH CHECK (is_admin());
-- and so on for UPDATE, DELETE
```

### 4. Don't write "service_role can manage" policies

The `service_role` Postgres role has `bypassrls = true` in Supabase. RLS is never evaluated for it. Policies of the form `USING (auth.jwt() ->> 'role' = 'service_role')` or `TO service_role` are no-ops -- drop them. Server-side code that uses the service-role key already bypasses every policy.

### 5. Don't create UNIQUE indexes alongside UNIQUE constraints

A `UNIQUE` constraint already creates an index named `<table>_<col>_key`. Don't add a separate `CREATE UNIQUE INDEX idx_<table>_<col>` -- it's a duplicate. If you need a non-default index name, drop the UNIQUE constraint and create the index manually (rare).

### 6. New table checklist

When adding a table with RLS, the policy block should look like:

```sql
ALTER TABLE public.<t> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<t>_select" ON public.<t>
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin')
    OR company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "<t>_insert" ON public.<t> FOR INSERT TO authenticated WITH CHECK (...);
CREATE POLICY "<t>_update" ON public.<t> FOR UPDATE TO authenticated USING (...) WITH CHECK (...);
CREATE POLICY "<t>_delete" ON public.<t> FOR DELETE TO authenticated USING (...);
```

Avoid `FOR ALL` policies when there is also any per-action policy on the same table for the same role -- that combination always trips the multiple_permissive lint.

### 7. Re-run the linter after schema work

Before merging a PR that touches any migration, run the Supabase performance advisor (Dashboard -> Advisors -> Performance) and confirm no new `auth_rls_initplan`, `multiple_permissive_policies`, or `duplicate_index` warnings were introduced.

### 8. Realtime: prefer broadcast over postgres_changes

When wiring a UI to live data updates, default to broadcast (the `/src/lib/realtime/*-channel.ts` pattern + a `SECURITY DEFINER` trigger that calls `realtime.send`) instead of `postgres_changes`. `postgres_changes` requires the table to be in the `supabase_realtime` publication, and every additional table in that publication makes every Realtime client's `realtime.list_changes` call slower (it processes more WAL per tick). Broadcast channels do not use the publication and bypass WAL entirely.

If you must use `postgres_changes`:

- Add the table to the publication explicitly: `ALTER PUBLICATION supabase_realtime ADD TABLE public.<t>`. Subscriptions to tables not in the publication silently receive no events.
- Always include a row-level filter on a column with an index, e.g. `filter: 'project_id=eq.<id>'`.
- When the subscription is later migrated to broadcast, remove the table from the publication in the same PR.

## Widget Configuration

- **Address Autocomplete**: Uses Google Places API for address suggestions
- Environment variable required: `GOOGLE_PLACES_API_KEY`
- Configure in widget settings to enable/disable address autocomplete

## Form Submission Webhook

- **Universal Form Endpoint**: `/api/webhooks/form-submit`
- **Security**: Uses widget domain whitelisting (only domains in `widget_domains` table can submit)
- **Supported Content Types**:
  - `application/json` (modern JavaScript forms)
  - `application/x-www-form-urlencoded` (traditional HTML forms)
- **AI Processing**: Uses Google Gemini AI to normalize flexible form field names into standardized schema
- **Auto-Creation**: Automatically creates customer records and tickets from form submissions
- **Environment variable required**: `GEMINI_API_KEY` (get from https://aistudio.google.com/app/apikey)
- **Expected Schema** (flexible field names normalized by AI):
  - `first_name`, `last_name`, `email`, `phone_number`
  - `street_address`, `city`, `state`, `zip`
  - `pest_issue`, `own_or_rent`, `additional_comments`
- **Database**: All submissions stored in `form_submissions` table with raw + normalized data

## AWS SES Email Service

- **Email Provider**: Uses AWS SES (Simple Email Service) for all transactional emails
- **Tenant Architecture**: One SES tenant per company for isolated reputation management
- **Event Tracking**: SNS webhook at `/api/webhooks/ses-events` for bounce/complaint/delivery tracking
- **Suppression List**: Automatic communication suppression for bounces, complaints, and unsubscribes in `suppression_list` table
  - Supports multiple channels: email, phone calls, SMS
  - Tracks unsubscribe requests and communication preferences

### Required Environment Variables

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
```

### Setup for New Companies

1. **Provision SES Tenant**:
   - POST to `/api/admin/companies/[id]/provision-ses`
   - Body: `{ "domain": "example.com", "snsTopicArn": "optional" }`
   - Creates tenant, configuration set, and email identity (if domain provided)

2. **Configure DNS Records**:
   - Add DKIM CNAME records returned from provisioning
   - Typically 3 CNAME records: `{token}._domainkey.{domain}` → `{token}.dkim.amazonses.com`
   - DNS verification can take up to 72 hours

3. **Verify Domain**:
   - PUT to `/api/admin/companies/[id]/domain` to check verification status
   - Once verified, emails can be sent from that domain

### Bulk Migration

Use the migration script to provision SES tenants for existing companies:

```bash
# Dry run (preview changes)
npm run migrate-to-ses -- --dry-run

# Migrate all companies
npm run migrate-to-ses

# Migrate specific company
npm run migrate-to-ses -- --company-id=<uuid>
```

### Email Sending

All email sending goes through:

- **API Route**: `/api/email/send` - Main email sending endpoint
- **Direct Import**: `import { sendEmail } from '@/lib/aws-ses/send-email'` - For server-side code
- **Features**: Automatic suppression list checking, tenant routing, delivery tracking

### Event Tracking

- **SNS Topics**: Bounces, complaints, deliveries, opens, clicks
- **Database**: Events logged to `email_logs` table with full delivery status
- **Suppression**: Hard bounces and complaints automatically added to suppression list

## Database Changes

- Create migration: `npx supabase migration new <name>`
- Test locally: `npx supabase db push --local`
- Deploy to production: `npx supabase db push --linked`
- CLAUDE - do not run any supabase migration commands either locally or to the remote linked database.

## Notes for Developers

- Always test auth flows after making changes
- Check Supabase dashboard for auth logs and user management
- Use `auth.sessions` table via SQL Editor to debug sessions
- Redirect URL for OAuth: `${window.location.origin}/auth/callback`
- CLAUDE should not run Git commands in order to avoid mistakes.

## WorkWave PestPac API Integration

Full documentation lives in `Agents.md`. Snapshot from your WorkWave portal captures (`2026-03-16`) is copied here so both files stay in sync.

### Authentication

The docs and this codebase use a combined auth pattern:

```
Authorization: Bearer {oauth_access_token}   # used in this app
ApiKey: {your_api_key}
tenant-id: {your_tenant_id}
Content-Type: application/json
```

- WorkWave docs examples commonly show `ApiKey` + `tenant-id`.
- In DH Portal, PestPac calls are authenticated with OAuth token + `ApiKey` + `tenant-id`.
- OAuth token endpoint used by this app: `https://is.workwave.com/oauth2/token?scope=openid`
- Company credentials are stored in `company_settings` with keys:
  - `pestpac_api_key`
  - `pestpac_tenant_id`
  - `pestpac_oauth_client_id`
  - `pestpac_oauth_client_secret`
  - `pestpac_wwid_username`
  - `pestpac_wwid_password`

### Base URL

`https://api.workwave.com/pestpac/v1/`

### Resource groups shown in docs

`ActivityLog`, `AdjustmentReason`, `Areas`, `AreaTypes`, `AutoComplete`, `Automation`, `BillTos`, `Branches`, `Builders`, `Bundles`, `Calls`, `CancelReasons`, `CompanySetup`, `Conditions`, `ConditionsLookups`, `Contacts`, `Corporations`, `Counties`, `CreditCardBilling`, `Devices`, `DeviceTypes`, `Diagrams`, `DiscountCodes`, `Divisions`, `Documents`, `Email`, `Employees`, `FinancedInvoices`, `FormComments`, `Frequencies`, `GainLoss`, `GLCode`, `Invoices`, `Jobs`, `Leads`, `ListManagement`, `LocationAreaTypes`, `LocationBundles`, `Locations`, `NoteCodes`, `Notes`, `NotificationMessage`, `Notifications`, `NotServicedReasons`, `PaymentAccounts`, `Payments`, `PayOverTime`, `ProgramTypes`, `Routes`, `SalesEvents`, `Schedules`, `Scheduling`, `ServiceClasses`, `ServiceOrderAttributeCategories`, `ServiceOrderAttributes`, `ServiceOrderBatches`, `ServiceOrders`, `Services`, `ServiceSetups`, `Skills`, `SourceClasses`, `Sources`, `States`, `TargetEvidenceTypes`, `TargetPests`, `Tasks`, `TaskTypes`, `TaxCodes`, `TechnicianRegions`, `Thresholds`, `TimeBlocks`, `Types`, `UserDefChoice`, `UserDefFields`, `WebHooks`.

### High-use endpoint patterns in this codebase

#### Customers and locations
```
GET    /Locations
GET    /Locations/{locationID}
GET    /Clients/{clientID}
GET    /Contacts
```

#### Service orders (important for FieldMap)
```
GET    /ServiceOrders
GET    /ServiceOrders/{id}
POST   /ServiceOrders
PATCH  /ServiceOrders/{id}
DELETE /ServiceOrders/{id}
GET    /ServiceOrders/{id}/documents
GET    /ServiceOrders/{id}/conditions
POST   /ServiceOrders/{id}/notes
GET    /ServiceOrders/{id}/inspectionReport
POST   /ServiceOrders/{orderId}/lineItems
PUT    /ServiceOrders/{orderId}/lineItems/{lineItemId}
DELETE /ServiceOrders/{orderId}/lineItems/{lineItemId}
POST   /ServiceOrders/{orderId}/materials
PUT    /ServiceOrders/{orderId}/materials/{materialLineId}
DELETE /ServiceOrders/{orderId}/materials/{materialLineId}
POST   /ServiceOrders/{orderId}/targets
DELETE /ServiceOrders/{orderId}/targets/{targetCode}
GET    /ServiceOrders/{orderId}/attributes
POST   /ServiceOrders/{orderId}/attributes
DELETE /ServiceOrders/{orderId}/attributes/{attributeId}
```

#### Routes and schedule lookups
```
GET    /Routes
GET    /Routes/{routeID}
GET    /Routes/{routeID}/Stops     # supported for some tenants
GET    /lookups/Routes
GET    /lookups/Schedules
POST   /Scheduling/availableTimeWindows
```

#### Service setup and service catalog
```
GET    /ServiceSetups/{id}
PATCH  /ServiceSetups/{id}
POST   /ServiceSetups
GET    /lookups/Services
GET    /lookups/ServiceClasses
GET    /lookups/ServiceOrderAttributes
GET    /lookups/ServiceOrderAttributeCategories
```

#### Billing and payments
```
GET    /BillTos
GET    /Invoices
GET    /Payments
POST   /Payments
GET    /PaymentAccounts
POST   /PaymentAccounts/{cardId}/charge
POST   /PaymentAccounts/{cardId}/authorize
POST   /PaymentAccounts/return
POST   /PaymentAccounts/capture
```

#### Webhooks and activity
```
POST   /ActivityLog
GET    /WebHooks
POST   /WebHooks
PUT    /WebHooks/{id}
DELETE /WebHooks/{id}
```

#### Tasks and operational lookups
```
GET    /Tasks
POST   /Tasks
PUT    /Tasks/{id}
DELETE /Tasks/{id}
GET    /lookups/TaskTypes
GET    /lookups/TargetPests
GET    /lookups/TaxCodes
GET    /lookups/TechnicianRegions
GET    /TimeBlocks
```

### Webhook entity/action support shown in docs

- `Bill-To`: create, update, delete
- `Branch`: create, update, delete
- `Card On File`: create, update, delete
- `Condition`: create, update, delete
- `Contacts`: create, update, delete
- `CreditMemo`: create, update, apply
- `Employee`: create, update, delete
- `Invoice`: create, update, void
- `Lead`: create, update, delete
- `Location`: create, update, delete
- `Notes`: create, update, delete
- `Payment`: create, update, apply
- `Service Order`: create, update, post, delete
- `Service Setup`: create, update, delete
