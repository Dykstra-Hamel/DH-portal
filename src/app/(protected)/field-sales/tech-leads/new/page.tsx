import { Suspense } from 'react';
import { NewOpportunityWizard } from '@/components/TechLeads/NewOpportunityWizard/NewOpportunityWizard';

export default function FieldSalesNewOpportunityPage() {
  return (
    <Suspense>
      <NewOpportunityWizard />
    </Suspense>
  );
}
