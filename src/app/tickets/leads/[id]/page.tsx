'use client';

import { use } from 'react';
import { LeadDetailView } from '@/components/Leads/LeadDetailView/LeadDetailView';

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <LeadDetailView leadId={id} baseRoute="/tickets/leads" />;
}
