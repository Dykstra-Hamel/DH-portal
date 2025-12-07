# Campaign Batching & Rate Limiting - Testing Plan

**Date Created:** 2025-11-24
**Feature:** Campaign batching system with business hours respect and concurrency management

---

## Testing Overview

**Changes Made:**
- Database schema (new tables and columns)
- Backend scheduling logic
- Business hours enforcement
- Concurrency management (max 10 calls)
- API routes
- UI components

---

## Phase 1: Database & Migration Verification

### 1.1 Verify Migration Applied Successfully

**Check via Supabase Dashboard or SQL Editor:**

```sql
-- Verify new columns on campaigns table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'campaigns'
AND column_name IN (
  'batch_size', 'batch_interval_minutes', 'daily_limit',
  'respect_business_hours', 'exclude_weekends', 'estimated_days',
  'current_batch', 'last_batch_sent_at', 'contacts_sent_today', 'current_day_date'
);

-- Verify new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('campaign_batch_schedule', 'campaign_concurrency_tracker');

-- Verify RLS enabled on new tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('campaign_batch_schedule', 'campaign_concurrency_tracker');

-- Verify functions created
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN (
  'reset_campaign_daily_counters',
  'get_active_calls_count',
  'cleanup_stale_call_tracking'
);

-- Check indexes created
SELECT indexname FROM pg_indexes
WHERE tablename IN ('campaign_batch_schedule', 'campaign_concurrency_tracker');
```

**Verify Checklist:**
- [ ] 10 new columns exist on campaigns table
- [ ] campaign_batch_schedule table exists
- [ ] campaign_concurrency_tracker table exists
- [ ] RLS enabled on both new tables
- [ ] 3 helper functions created
- [ ] Indexes created for performance

### 1.2 Database Function Testing

```sql
-- Test 1: Daily reset function (should execute without error)
SELECT reset_campaign_daily_counters();

-- Test 2: Active calls count (should return 0 initially)
SELECT get_active_calls_count();

-- Test 3: Insert test call tracking
INSERT INTO campaign_concurrency_tracker (retell_call_id, call_started_at)
VALUES ('test-call-123', NOW());

-- Test 4: Verify count increased to 1
SELECT get_active_calls_count();

-- Test 5: Mark as complete and verify cleanup
UPDATE campaign_concurrency_tracker
SET call_completed_at = NOW()
WHERE retell_call_id = 'test-call-123';

SELECT get_active_calls_count(); -- Should be 0 again

-- Test 6: Test stale call cleanup (insert call older than 1 hour)
INSERT INTO campaign_concurrency_tracker (retell_call_id, call_started_at)
VALUES ('stale-call', NOW() - INTERVAL '90 minutes');

SELECT cleanup_stale_call_tracking(); -- Should clean up the stale record

-- Verify the stale call was marked as completed
SELECT retell_call_id, call_completed_at IS NOT NULL as was_completed
FROM campaign_concurrency_tracker
WHERE retell_call_id = 'stale-call';

-- Cleanup
DELETE FROM campaign_concurrency_tracker;
```

**Verify:**
- [ ] Functions execute without errors
- [ ] Active call count updates correctly
- [ ] Cleanup function removes old records

---

## Phase 2: Build & Type Check

### 2.1 TypeScript Build Verification

```bash
# Run full build to check for type errors
npm run build
```

**Verify:**
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No missing imports
- [ ] All new files included in build

### 2.2 ESLint Check

```bash
npm run lint
```

**Verify:**
- [ ] No lint errors in new files
- [ ] No unused imports
- [ ] Consistent code style

---

## Phase 3: Backend Logic Testing (Manual)

### 3.1 Start Development Environment

```bash
# Start Next.js with Inngest for backend testing
npm run dev-full
```

This starts:
- Next.js dev server on http://localhost:3000
- Inngest dev server on http://localhost:8288

**Verify:**
- [ ] Next.js started successfully
- [ ] Inngest dashboard accessible at http://localhost:8288

### 3.2 Test Campaign Creation API

**Note:** API routes require browser authentication. Test using browser DevTools Console instead of curl.

**Test 1: Create campaign with batch settings**

Open browser DevTools Console (F12) and run:

```javascript
// Use your actual company_id and workflow_id
fetch('http://localhost:3000/api/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    company_id: "YOUR_COMPANY_ID",
    name: "Test Batch Campaign",
    campaign_id: "TESTBATCH01",
    start_datetime: "2025-11-25T14:00:00Z",
    workflow_id: "YOUR_WORKFLOW_ID",
    daily_limit: 100,
    respect_business_hours: true,
    total_contacts: 250
  })
}).then(r => r.json()).then(console.log);
```

**Verify Response:**
- [ ] Returns `estimated_days: 3` (250 contacts / 100 per day)
- [ ] Campaign created with batch_size=10 (default)
- [ ] Campaign created with batch_interval_minutes=10 (default)

### 3.3 Test Schedule Preview API

**Test 2: Get schedule preview**

Open browser DevTools Console (F12) and run:

```javascript
// Replace CAMPAIGN_ID with actual campaign ID from Test 1
fetch('http://localhost:3000/api/campaigns/CAMPAIGN_ID/schedule-preview')
  .then(r => r.json())
  .then(console.log);
```

**Verify Response:**
- [ ] Returns schedule array with 3 days
- [ ] Each day shows correct contact count
- [ ] Weekends excluded if respect_business_hours=true
- [ ] Summary.totalDays = 3
- [ ] Summary includes business hours timezone

**Alternative: Test via UI**
- Navigate to Campaigns page
- Create or edit a campaign
- View the campaign timeline/schedule preview in the review step

---

## Phase 4: Frontend UI Testing

### 4.1 Campaign Creation Flow

**Test in Browser (http://localhost:3000/campaigns):**

**Step 1: Basic Info**
- [ ] Fill in name, campaign ID
- [ ] Set start date/time
- [ ] Click Next

**Step 2: Select Workflow**
- [ ] Choose a workflow
- [ ] Click Next

**Step 3: Add Contacts**
- [ ] Upload CSV with 100 contacts OR create test list
- [ ] Daily limit input shows (default 500)
- [ ] Change daily limit to 50
- [ ] "Respect business hours" checkbox visible (default checked)
- [ ] Estimated duration shows "2 days"
- [ ] Click Next

**Step 4: Review & Launch**

Campaign Details section:
- [ ] Name displayed correctly
- [ ] Description displayed
- [ ] Start time displayed

Workflow section:
- [ ] Workflow name displayed
- [ ] Number of workflow steps shown

Contact Lists section:
- [ ] Total contacts: 100

**NEW: Sending Schedule section:**
- [ ] Daily Limit: 50 contacts/day
- [ ] Batch Size: 10 contacts per batch (system default)
- [ ] Batch Interval: 10 minutes (system default)
- [ ] Business Hours: Respect company business hours
- [ ] Estimated Duration: 2 days

**NEW: Campaign Timeline section:**
- [ ] Calendar preview component displays
- [ ] Shows 2 day cards
- [ ] Day 1: 50 contacts, 5 batches
- [ ] Day 2: 50 contacts, 5 batches
- [ ] Time ranges shown (e.g., 09:00 → 09:50)
- [ ] Summary cards show correct totals

**Final:**
- [ ] Click "Create Campaign"
- [ ] Success message appears
- [ ] Campaign appears in list

### 4.2 Edge Cases in UI

**Test A: Different daily limits**
- [ ] Change daily limit to 200
- [ ] Estimated days changes to "1 day"
- [ ] Calendar shows 1 day card

**Test B: Business hours toggle**
- [ ] Uncheck business hours
- [ ] Calendar shows all 7 days (including weekends)

**Test C: Long campaign warning**
- [ ] Set 1000 contacts, 100/day limit
- [ ] Warning shows "Campaign will take over a week"

### 4.3 Campaign Overview Testing

**Prerequisites:** Need a running campaign with some activity

**Create Test Campaign:**
```sql
-- Manually create test campaign with progress
INSERT INTO campaigns (
  company_id, name, campaign_id, workflow_id, status,
  start_datetime, batch_size, batch_interval_minutes, daily_limit,
  total_contacts, processed_contacts, contacts_sent_today,
  current_batch, last_batch_sent_at, current_day_date
) VALUES (
  'YOUR_COMPANY_ID', 'Test Progress Campaign', 'PROGRESS01',
  'YOUR_WORKFLOW_ID', 'running',
  NOW(), 10, 10, 500,
  1000, 250, 120,
  12, NOW() - INTERVAL '10 minutes', CURRENT_DATE
);
```

**Test in Browser:**
1. Navigate to campaign detail page
2. Go to "Overview" tab

**Verify Batch Progress Section Shows:**
- [ ] "Today's Progress: 120 / 500 contacts"
- [ ] Progress bar at ~24% full
- [ ] "Current Batch: Batch #12"
- [ ] "Batch Size: 10 contacts"
- [ ] "Last Batch: [time 10 minutes ago]"

**Cleanup:**
```sql
DELETE FROM campaigns WHERE campaign_id = 'PROGRESS01';
```

---

## Phase 5: Business Hours & Scheduling Logic

### 5.1 Test Business Hours Detection

**Create campaign to start outside business hours:**

Via UI:
1. Create new campaign
2. Set start time to 8:00 PM (after business hours)
3. Set to start TODAY
4. Upload contacts and complete creation
5. Manually set status to 'scheduled' in database

**Monitor Inngest Dashboard (http://localhost:8288):**
- Navigate to Functions → campaign-scheduler
- Watch for next run (every 5 minutes)

**Expected Behavior:**
- [ ] Scheduler finds the campaign
- [ ] Checks business hours
- [ ] Detects it's outside hours
- [ ] Reschedules start_datetime to next business day 9am
- [ ] Logs: "Campaign respects business hours - waiting for next business hour slot"

### 5.2 Test Daily Limit Enforcement

**Create campaign that hits daily limit:**

Via UI:
1. Create campaign with 100 contacts
2. Set daily limit to 20
3. Start campaign (status='running')

**Monitor in Inngest:**
- Watch "campaign-process-contacts" function

**Expected:**
- [ ] Processes 20 contacts (2 batches of 10)
- [ ] Stops processing
- [ ] Updates contacts_sent_today = 20
- [ ] Schedules remaining 80 for next day
- [ ] Logs: "Campaign reached daily limit (20)"

### 5.3 Test Concurrency Limiting

**Simulate 10 active calls:**
```sql
-- Insert 10 active calls (within the 2-hour window)
INSERT INTO campaign_concurrency_tracker (retell_call_id, call_started_at)
SELECT 'test-call-' || generate_series(1, 10), NOW();

-- Verify count
SELECT get_active_calls_count(); -- Should return 10

-- Note: The get_active_calls_count() function only counts calls that:
-- 1. Have call_completed_at = NULL (still active)
-- 2. Started within the last 2 hours (safety filter)
```

**Try to start campaign with phone calls:**
- Start a campaign that has phone call workflow steps
- Monitor in Inngest

**Expected:**
- [ ] Campaign waits for available slot
- [ ] Doesn't attempt to start 11th call
- [ ] Logs indicate waiting for concurrency

**Cleanup:**
```sql
DELETE FROM campaign_concurrency_tracker WHERE retell_call_id LIKE 'test-call-%';
```

---

## Phase 6: Integration Testing

### 6.1 End-to-End Small Campaign

**Complete Flow Test:**
1. Create campaign with 30 contacts
2. Daily limit: 20
3. Respect business hours: ON
4. Set start time to NOW + 2 minutes (during business hours)
5. Change status to 'scheduled'

**Monitor Throughout:**
- Inngest dashboard for function execution
- Database for record updates
- UI for progress display

**Checkpoints:**
- [ ] T+2min: Campaign status changes to 'running'
- [ ] T+3min: First batch of 10 processed
- [ ] T+13min: Second batch of 10 processed
- [ ] T+14min: Daily limit reached (20/20)
- [ ] T+Next Day 9am: Remaining 10 processed
- [ ] T+Next Day 9:10am: Campaign status = 'completed'

### 6.2 Webhook Integration Test

**Test call completion tracking:**

1. Start a campaign that makes phone calls

2. Check for active calls:
```sql
SELECT * FROM campaign_concurrency_tracker
WHERE call_completed_at IS NULL
ORDER BY call_started_at DESC LIMIT 5;
```

3. Manually trigger call completion webhook:
```bash
curl -X POST http://localhost:3000/api/webhooks/retell-outbound \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_RETELL_WEBHOOK_SECRET" \
  -d '{
    "event": "call_ended",
    "call": {
      "call_id": "ACTUAL_CALL_ID_FROM_ABOVE",
      "duration_ms": 120000
    }
  }'
```

4. Verify call record updated:
```sql
SELECT call_id, call_completed_at, call_duration_seconds
FROM campaign_concurrency_tracker
WHERE call_id = 'ACTUAL_CALL_ID';
```

**Verify:**
- [ ] call_completed_at is set
- [ ] call_duration_seconds = 120
- [ ] Active calls count decreased by 1

---

## Phase 7: Edge Cases

### 7.1 Campaign Spanning Weekend

**Test:**
1. Create campaign with 150 contacts
2. Daily limit: 50
3. Start on Friday
4. Respect business hours: ON

**Expected Schedule:**
- [ ] Friday: 50 contacts
- [ ] Saturday: SKIPPED
- [ ] Sunday: SKIPPED
- [ ] Monday: 50 contacts
- [ ] Tuesday: 50 contacts
- [ ] Status: Completed

**Verify via schedule preview API or calendar component**

### 7.2 Multiple Concurrent Campaigns

**Test:**
1. Create 3 campaigns
2. Each with phone call workflows
3. Start all at same time

**Monitor:**
```sql
-- Should never exceed 10
SELECT get_active_calls_count();
```

**Verify:**
- [ ] Total concurrent calls across all campaigns ≤ 10
- [ ] Campaigns queue and wait for slots
- [ ] All campaigns eventually complete

### 7.3 Very Large Campaign

**Test:**
1. Create campaign with 5000 contacts
2. Daily limit: 500

**Verify:**
- [ ] CSV upload completes successfully
- [ ] Estimated days = 10
- [ ] Schedule preview shows first 14 days
- [ ] Shows "+ X more days" message
- [ ] Campaign creation time < 10 seconds

---

## Phase 8: Performance Checks

### 8.1 Database Query Performance

```sql
-- Test query performance with indexes
EXPLAIN ANALYZE
SELECT * FROM campaign_concurrency_tracker
WHERE call_completed_at IS NULL;

-- Should use index, execution time < 5ms

EXPLAIN ANALYZE
SELECT * FROM campaign_batch_schedule
WHERE campaign_id = 'TEST_CAMPAIGN_ID' AND status = 'pending';

-- Should use index, execution time < 5ms
```

**Verify:**
- [ ] Queries use indexes
- [ ] Execution time < 10ms

### 8.2 API Response Times

**Test with browser DevTools Network tab:**
- [ ] POST /api/campaigns: < 3 seconds
- [ ] GET /api/campaigns/[id]/schedule-preview: < 2 seconds
- [ ] UI calendar component renders: < 1 second

---

## Phase 9: Pre-Production Checklist

### 9.1 Code Quality
- [ ] Run `npm run build` - succeeds
- [ ] Run `npm run lint` - no errors
- [ ] No console.logs in production code
- [ ] All TypeScript types correct

### 9.2 Database Safety
- [ ] Migration tested on development
- [ ] RLS policies prevent unauthorized access
- [ ] Indexes improve performance
- [ ] Functions use proper security settings

### 9.3 Error Handling
- [ ] Try invalid campaign ID in schedule preview - returns 404
- [ ] Try to exceed concurrency - queues properly
- [ ] Try to create campaign with 0 contacts - handled gracefully
- [ ] Try to schedule campaign in past - validation error

---

## Success Criteria

### Must Pass:
- ✅ Migration verified without errors
- ✅ All database functions work correctly
- ✅ Build succeeds with no errors
- ✅ Campaign creation flow works end-to-end
- ✅ Business hours respected
- ✅ Daily limits enforced
- ✅ Concurrency never exceeds 10
- ✅ Calendar preview displays correctly
- ✅ Progress tracking accurate

### Performance Targets:
- Campaign creation: < 5 seconds
- API responses: < 3 seconds
- UI renders: < 2 seconds
- Database queries: < 10ms

---

## Quick Reference Commands

### Start Development
```bash
# Start dev environment
npm run dev-full

# Inngest dashboard
open http://localhost:8288
```

### Build & Lint
```bash
npm run build
npm run lint
```

### Database Checks
```sql
-- Quick status checks
SELECT id, name, status, contacts_sent_today, daily_limit
FROM campaigns WHERE status = 'running';

SELECT get_active_calls_count();

SELECT COUNT(*) FROM campaign_batch_schedule WHERE status = 'pending';
```

---

## Notes & Issues Found

**Date:** _______
**Tester:** _______

### Issues Found:
1.
2.
3.

### Observations:
1.
2.
3.

### Follow-up Items:
1.
2.
3.

---

**Testing Status:** [ ] Not Started | [ ] In Progress | [ ] Completed
**Sign-off:** ________________
**Date:** ________________
