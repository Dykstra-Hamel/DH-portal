'use client';

import React, { useMemo } from 'react';
import { DataTable } from '@/components/Common/DataTable';
import { formSubmissionsColumns, getFormSubmissionTabs, FormSubmissionWithCustomer } from './FormSubmissionsListConfig';

interface FormSubmissionsListProps {
  submissions: FormSubmissionWithCustomer[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onSubmissionUpdated?: () => void;
  onViewDetails?: (submission: FormSubmissionWithCustomer) => void;
  tabCounts?: { all: number; processed: number; pending: number; failed: number };
}

function FormSubmissionsList({
  submissions,
  loading = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  onSubmissionUpdated,
  onViewDetails,
  tabCounts,
}: FormSubmissionsListProps) {

  // Build grid template columns from column widths
  const customColumnWidths = useMemo(() => {
    return formSubmissionsColumns.map(col => col.width).join(' ');
  }, []);

  // Handle item actions
  const handleItemAction = (action: string, submission: FormSubmissionWithCustomer) => {
    if (action === 'view_details') {
      onViewDetails?.(submission);
    }
  };

  return (
    <DataTable
      data={submissions}
      loading={loading}
      title="Form Submissions"
      columns={formSubmissionsColumns}
      tabs={getFormSubmissionTabs(tabCounts)}
      tableType="form_submissions"
      customColumnWidths={customColumnWidths}
      onItemAction={handleItemAction}
      onDataUpdated={onSubmissionUpdated}
      emptyStateMessage="No form submissions found."
      infiniteScrollEnabled={true}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      loadingMore={loadingMore}
    />
  );
}

export default FormSubmissionsList;
