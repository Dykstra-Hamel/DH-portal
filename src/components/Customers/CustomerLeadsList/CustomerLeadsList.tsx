'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lead } from '@/types/lead';
import { DataTable } from '@/components/Common/DataTable';
import { getCustomerLeadColumns } from './CustomerLeadsListConfig';
import styles from '../CustomerLists.module.scss';

interface CustomerLeadsListProps {
  leads: Lead[];
  loading?: boolean;
  onLeadUpdated?: () => void;
}

export function CustomerLeadsList({
  leads,
  loading = false,
  onLeadUpdated,
}: CustomerLeadsListProps) {
  const router = useRouter();

  // Handle item actions (mainly navigation to lead detail)
  const handleItemAction = (action: string, lead: Lead) => {
    if (action === 'navigate' || !action) {
      router.push(`/connections/leads/${lead.id}`);
    }
  };

  const columns = getCustomerLeadColumns();

  return (
    <DataTable<Lead>
      data={leads}
      loading={loading}
      title=""
      columns={columns}
      tabs={[]}
      onItemAction={handleItemAction}
      onDataUpdated={onLeadUpdated}
      searchEnabled={false}
      searchPlaceholder="Search leads..."
      tableType="leads"
      emptyStateMessage="No leads found for this customer."
      defaultSort={{ key: 'created_at', direction: 'desc' }}
      className={styles.noBorder}
      customColumnWidths="150px 150px 180px 180px 150px 150px 80px"
    />
  );
}
