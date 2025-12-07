'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SupportCase } from '@/types/support-case';
import { DataTable } from '@/components/Common/DataTable';
import {
  getSupportCaseColumns,
  getSupportCaseTabs,
} from './SupportCasesListConfig';
import { Toast } from '@/components/Common/Toast';

interface SupportCasesListProps {
  supportCases: SupportCase[];
  loading?: boolean;
  onSupportCaseUpdated?: () => void;
}

export default function SupportCasesList({
  supportCases,
  loading = false,
  onSupportCaseUpdated,
}: SupportCasesListProps) {
  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();

  // Handle item actions
  const handleItemAction = (action: string, supportCase: SupportCase) => {
    // Handle any support case specific actions here
    if (action === 'view') {
      // Navigate to the support case detail page
      router.push(`/connections/customer-service/${supportCase.id}`);
    }
  };

  // Handle toast
  const handleShowToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleToastClose = () => {
    setShowToast(false);
    setToastMessage('');
  };

  return (
    <>
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={handleToastClose}
      />

      {/* DataTable Component */}
      <DataTable
        data={supportCases}
        loading={loading}
        title="Support Cases"
        columns={getSupportCaseColumns()}
        tabs={getSupportCaseTabs()}
        tableType="supportCases"
        onItemAction={handleItemAction}
        onDataUpdated={onSupportCaseUpdated}
        customComponents={{}}
        emptyStateMessage="No support cases found for this category."
        onShowToast={handleShowToast}
      />
    </>
  );
}
