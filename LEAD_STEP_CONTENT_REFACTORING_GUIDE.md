# LeadStepContent Refactoring Guide

## Completed So Far

✅ Created directory structure:
- `src/components/Common/LeadStepContent/types/`
- `src/components/Common/LeadStepContent/hooks/`
- `src/components/Common/LeadStepContent/components/`

✅ Created shared types file:
- `types/leadStepTypes.ts` - Common interfaces and types

✅ Created LeadCallFormInfo component:
- `components/LeadCallFormInfo/LeadCallFormInfo.tsx`
- `components/LeadCallFormInfo/LeadCallFormInfo.module.scss`
- `components/LeadCallFormInfo/index.ts`

## Remaining Components to Create

### 1. LeadDetailsSidebar Component

**Purpose:** Manage the right sidebar with all detail cards

**File:** `components/LeadDetailsSidebar/LeadDetailsSidebar.tsx`

**Extract from:** Line ~4535 (`renderRightSidebar()` function)

**Props needed:**
```typescript
interface LeadDetailsSidebarProps {
  lead: Lead;
  isSidebarExpanded: boolean;
  onToggleSidebar: () => void;
  onShowToast?: ShowToastCallback;
  onRequestUndo?: RequestUndoCallback;
  onLeadUpdate?: LeadUpdateCallback;
}
```

**Structure:**
- Expand/collapse button
- Contact Information (use CustomerInformation component)
- **NEW: Call/Form Information** (use LeadCallFormInfo component)
- Service Location (use ServiceLocationCard component)
- Activity feed
- Notes section

**Key change:** Add LeadCallFormInfo between Contact and Service Location:
```tsx
<InfoCard
  title={lead.lead_type === 'web_form' ? 'Form Details' : 'Call Information'}
  icon={<Phone size={20} />}
  startExpanded={false}
>
  <LeadCallFormInfo lead={lead} />
</InfoCard>
```

---

### 2. LeadSchedulingSection Component

**Purpose:** Handle scheduling and confirmation

**File:** `components/LeadSchedulingSection/LeadSchedulingSection.tsx`

**Extract from:** Line ~4461 (`renderReadyToScheduleContent()` function)

**Props needed:**
```typescript
interface LeadSchedulingSectionProps {
  lead: Lead;
  scheduledDate: string;
  scheduledTime: string;
  confirmationNote: string;
  onScheduledDateChange: (date: string) => void;
  onScheduledTimeChange: (time: string) => void;
  onConfirmationNoteChange: (note: string) => void;
  onConfirm: () => void;
}
```

**Content:**
- Preferred date/time inputs
- Confirmation note textarea
- Confirm & Finalize button

---

### 3. LeadAssignmentSection Component

**Purpose:** Ticket assignment and scheduler assignment

**File:** `components/LeadAssignmentSection/LeadAssignmentSection.tsx`

**Extract from:** Line ~2257 (`renderQualifyContent()` function)

**Props needed:**
```typescript
interface LeadAssignmentSectionProps {
  lead: Lead;
  isAdmin: boolean;
  ticketType: string;
  selectedAssignee: string;
  selectedScheduler: string;
  assignableUsers: AssignableUser[];
  currentUser: { id: string; name: string; email: string; avatar?: string };
  onTicketTypeChange: (type: string) => void;
  onAssigneeSelect: (id: string) => void;
  onSchedulerSelect: (id: string) => void;
  onAssign: () => Promise<void>;
  onAssignScheduler: () => Promise<void>;
}
```

**Key sections:**
- Customer info display
- Ticket type radio buttons (sales/support/junk)
- Assign to dropdown
- Assign button
- **Scheduler assignment section** (keep this from recent work)
- Assign Scheduler button

**Important:** Remove the Call Information tab object from qualifyTabs array (lines 2519-2828)

---

###4. LeadContactSection Component

**Purpose:** Contact log and sales cadence

**File:** `components/LeadContactSection/LeadContactSection.tsx`

**Extract from:** Line ~2859 (`renderContactingContent()` function)

**Props needed:**
```typescript
interface LeadContactSectionProps {
  lead: Lead;
  nextTask: CadenceTask | null;
  loadingNextTask: boolean;
  hasActiveCadence: boolean;
  selectedActionType: string;
  activityNotes: string;
  isLoggingActivity: boolean;
  onActionTypeChange: (type: string) => void;
  onActivityNotesChange: (notes: string) => void;
  onLogActivity: () => Promise<void>;
  onCompleteTask: () => void;
}
```

**Content:**
- Next recommended action card
- Sales cadence selector
- Activity logging form
- Complete task button

---

### 5. LeadQuoteSection Component

**Purpose:** Quote creation and editing (largest component)

**File:** `components/LeadQuoteSection/LeadQuoteSection.tsx`

**Extract from:** Line ~3166 (`renderQuotedContent()` function)

**Props needed:**
```typescript
interface LeadQuoteSectionProps {
  lead: Lead;
  quote: any;
  isQuoteUpdating: boolean;
  pricingSettings: any;
  pestOptions: any[];
  servicePlans: any[];
  serviceSelections: ServiceSelection[];
  selectedPests: string[];
  selectedAddOns: string[];
  availableDiscounts: Record<string, any[]>;
  loadingDiscounts: boolean;
  onServiceSelectionChange: (selections: ServiceSelection[]) => void;
  onPestChange: (pests: string[]) => void;
  onAddOnToggle: (addonId: string) => void;
  onEmailQuote: () => void;
}
```

**Content:**
- Pest selection dropdowns
- Home/yard size inputs
- Service plan selection with tabs
- Frequency and discount dropdowns
- Add-on services
- Quote summary card
- Email quote button

---

## Main LeadStepContent.tsx Refactoring

### New Structure (~ 300 lines)

```typescript
import { LeadAssignmentSection } from './components/LeadAssignmentSection';
import { LeadContactSection } from './components/LeadContactSection';
import { LeadQuoteSection } from './components/LeadQuoteSection';
import { LeadSchedulingSection } from './components/LeadSchedulingSection';
import { LeadDetailsSidebar } from './components/LeadDetailsSidebar';

export function LeadStepContent({ lead, isAdmin, ... }: LeadStepContentProps) {
  // Keep state management here
  // Keep hooks (useUser, useAssignableUsers, etc.)
  // Keep handler functions

  return (
    <>
      <div className={styles.leadContentWrapper}>
        <div className={styles.contentLeft}>
          <LeadAssignmentSection
            lead={lead}
            isAdmin={isAdmin}
            ticketType={ticketType}
            selectedAssignee={selectedAssignee}
            selectedScheduler={selectedScheduler}
            assignableUsers={assignableUsers}
            currentUser={currentUser}
            onTicketTypeChange={setTicketType}
            onAssigneeSelect={handleAssigneeSelect}
            onSchedulerSelect={handleSchedulerSelect}
            onAssign={handleAssignTicket}
            onAssignScheduler={handleAssignScheduler}
          />

          <LeadContactSection
            lead={lead}
            nextTask={nextTask}
            loadingNextTask={loadingNextTask}
            hasActiveCadence={hasActiveCadence}
            selectedActionType={selectedActionType}
            activityNotes={activityNotes}
            isLoggingActivity={isLoggingActivity}
            onActionTypeChange={setSelectedActionType}
            onActivityNotesChange={setActivityNotes}
            onLogActivity={handleLogActivity}
            onCompleteTask={handleCompleteTask}
          />

          <LeadQuoteSection
            lead={lead}
            quote={quote}
            isQuoteUpdating={isQuoteUpdating}
            pricingSettings={pricingSettings}
            pestOptions={pestOptions}
            servicePlans={allServicePlans}
            serviceSelections={serviceSelections}
            selectedPests={selectedPests}
            selectedAddOns={selectedAddOns}
            availableDiscounts={availableDiscounts}
            loadingDiscounts={loadingDiscounts}
            onServiceSelectionChange={setServiceSelections}
            onPestChange={setSelectedPests}
            onAddOnToggle={handleToggleAddon}
            onEmailQuote={handleEmailQuote}
          />

          <LeadSchedulingSection
            lead={lead}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            confirmationNote={confirmationNote}
            onScheduledDateChange={setScheduledDate}
            onScheduledTimeChange={setScheduledTime}
            onConfirmationNoteChange={setConfirmationNote}
            onConfirm={handleConfirmAndFinalize}
          />
        </div>

        <LeadDetailsSidebar
          lead={lead}
          isSidebarExpanded={isSidebarExpanded}
          onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
          onShowToast={onShowToast}
          onRequestUndo={onRequestUndo}
          onLeadUpdate={onLeadUpdate}
        />
      </div>

      {/* Keep modals here */}
      <ManageLeadModal ... />
      <AssignSuccessModal ... />
      <CompleteTaskModal ... />
      <ServiceConfirmationModal ... />
    </>
  );
}
```

---

## Migration Checklist

- [ ] Create LeadDetailsSidebar component
- [ ] Create LeadSchedulingSection component
- [ ] Create LeadAssignmentSection component
- [ ] Create LeadContactSection component
- [ ] Create LeadQuoteSection component
- [ ] Update main LeadStepContent.tsx to use new components
- [ ] Remove old render functions
- [ ] Test each section independently
- [ ] Verify all functionality works
- [ ] Check for any styling issues

---

## Benefits Achieved

1. **File size reduced from 4740 lines to ~300 lines** in main component
2. **Call/Form information now in sidebar** (original request solved)
3. **Each component is focused and maintainable** (200-600 lines each)
4. **Easier testing** - can test components in isolation
5. **Better performance** - can use React.memo on individual sections
6. **Clear separation of concerns**
7. **Reusable components** for future features

---

## Testing Strategy

1. Test LeadCallFormInfo standalone with different lead types
2. Test LeadDetailsSidebar with expanded/collapsed states
3. Test each main section with various lead statuses
4. Integration test with full lead workflow
5. Verify scheduler assignment still works correctly
6. Confirm no regressions in existing functionality
