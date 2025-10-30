'use client';

import React, { useState } from 'react';
import { DataTable } from '@/components/Common/DataTable';
import { getCallRecordColumns, getCallRecordTabs, CallRecordWithDirection } from './CallRecordsListConfig';
import styles from '@/components/Admin/AdminManager.module.scss';

interface CallRecordsListProps {
  calls: CallRecordWithDirection[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onCallUpdated?: () => void;
  onViewDetails?: (call: CallRecordWithDirection) => void;
  tabCounts?: { all: number; inbound: number; outbound: number };
}

function CallRecordsList({
  calls,
  loading = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  onCallUpdated,
  onViewDetails,
  tabCounts,
}: CallRecordsListProps) {

  // Handle item actions
  const handleItemAction = (action: string, call: CallRecordWithDirection) => {
    if (action === 'view_details') {
      onViewDetails?.(call);
    }
  };


  return (
    <DataTable
      data={calls}
      loading={loading}
      title="Call Records"
      columns={getCallRecordColumns()}
      tabs={getCallRecordTabs(tabCounts)}
      tableType="calls"
      onItemAction={handleItemAction}
      onDataUpdated={onCallUpdated}
      emptyStateMessage="No call records found for this category."
      infiniteScrollEnabled={true}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      loadingMore={loadingMore}
    />
  );
}

export default CallRecordsList;