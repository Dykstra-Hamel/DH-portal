'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Ticket } from '@/types/ticket';
import { DataTable } from '@/components/Common/DataTable';
import { getCustomerTicketColumns } from './CustomerTicketsListConfig';
import styles from '../CustomerLists.module.scss';

interface CustomerTicketsListProps {
  tickets: Ticket[];
  loading?: boolean;
  onTicketUpdated?: () => void;
}

export function CustomerTicketsList({
  tickets,
  loading = false,
  onTicketUpdated,
}: CustomerTicketsListProps) {
  const router = useRouter();

  // Handle item actions (mainly navigation to ticket detail)
  const handleItemAction = (action: string, ticket: Ticket) => {
    if (action === 'navigate' || !action) {
      router.push(`/tickets/incoming?ticketId=${ticket.id}`);
    }
  };

  const columns = getCustomerTicketColumns();

  return (
    <DataTable<Ticket>
      data={tickets}
      loading={loading}
      title=""
      columns={columns}
      tabs={[]}
      onItemAction={handleItemAction}
      onDataUpdated={onTicketUpdated}
      searchEnabled={false}
      searchPlaceholder="Search tickets..."
      tableType="tickets"
      emptyStateMessage="No tickets found for this customer."
      defaultSort={{ key: 'created_at', direction: 'desc' }}
      className={styles.noBorder}
      customColumnWidths="200px 200px 200px 200px 80px"
    />
  );
}
