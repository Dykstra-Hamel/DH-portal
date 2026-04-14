import { Suspense } from 'react';
import { NewOpportunityWizard } from '@/components/TechLeads/NewOpportunityWizard/NewOpportunityWizard';

export default function NewOpportunityPage() {
  return (
    <Suspense>
      <NewOpportunityWizard />
    </Suspense>
  );
}
