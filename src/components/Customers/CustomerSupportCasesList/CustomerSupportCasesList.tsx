'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SupportCase } from '@/types/support-case';
import { DataTable } from '@/components/Common/DataTable';
import { getCustomerSupportCaseColumns } from './CustomerSupportCasesListConfig';
import styles from '../CustomerLists.module.scss';

interface CustomerSupportCasesListProps {
  supportCases: SupportCase[];
  loading?: boolean;
  onSupportCaseUpdated?: () => void;
}

export function CustomerSupportCasesList({
  supportCases,
  loading = false,
  onSupportCaseUpdated,
}: CustomerSupportCasesListProps) {
  const router = useRouter();

  // Handle item actions (mainly navigation to support case detail)
  const handleItemAction = (action: string, supportCase: SupportCase) => {
    if (action === 'navigate' || !action) {
      router.push(`/connections/customer-service/${supportCase.id}`);
    }
  };

  const columns = getCustomerSupportCaseColumns();

  return (
    <DataTable<SupportCase>
      data={supportCases}
      loading={loading}
      title=""
      columns={columns}
      tabs={[]}
      onItemAction={handleItemAction}
      onDataUpdated={onSupportCaseUpdated}
      searchEnabled={false}
      searchPlaceholder="Search support cases..."
      tableType="supportCases"
      emptyStateMessage="No support cases found for this customer."
      defaultSort={{ key: 'created_at', direction: 'desc' }}
      className={styles.noBorder}
      customColumnWidths="150px 250px 200px 180px 150px 150px 80px"
    />
  );
}
