'use client';

import { use } from 'react';
import { LeadDetailView } from '@/components/Leads/LeadDetailView/LeadDetailView';

export default function FieldSalesLeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = use(params);
  return <LeadDetailView leadId={leadId} baseRoute="/field-sales/leads" />;
}
