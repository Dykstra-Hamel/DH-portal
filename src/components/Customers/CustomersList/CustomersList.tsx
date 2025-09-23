'use client';

import React from 'react';
import { Customer } from '@/types/customer';
import { DataTable } from '@/components/Common/DataTable';
import { getCustomerColumns, getCustomerTabs } from './CustomersListConfig';

interface CustomersListProps {
  customers: Customer[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onCustomerClick?: (customer: Customer) => void;
  showCompanyColumn?: boolean;
}

function CustomersList({
  customers,
  loading = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  onCustomerClick,
  showCompanyColumn = false,
}: CustomersListProps) {
  // Handle item actions
  const handleItemAction = (action: string, customer: Customer) => {
    if (action === 'view') {
      onCustomerClick?.(customer);
    }
  };

  return (
    <DataTable
      data={customers}
      loading={loading}
      title="Customers Overview"
      columns={getCustomerColumns(showCompanyColumn)}
      tabs={getCustomerTabs()}
      tableType={showCompanyColumn ? "customersWithCompany" : "customers"}
      onItemAction={handleItemAction}
      emptyStateMessage="No customers found for this category."
      infiniteScrollEnabled={true}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      loadingMore={loadingMore}
    />
  );
}

export default CustomersList;