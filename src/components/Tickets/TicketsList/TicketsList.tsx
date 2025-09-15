'use client';

import React, { useState, useMemo } from 'react';
import { Ticket } from '@/types/ticket';
import { CallRecord } from '@/types/call-record';
import LiveCallBar from '@/components/Common/LiveCallBar/LiveCallBar';
import SortableColumnHeader from '@/components/Common/SortableColumnHeader/SortableColumnHeader';
import TicketRow from '@/components/Tickets/TicketRow/TicketRow';
import { TicketReviewModal } from '@/components/Tickets/TicketReviewModal';
import styles from './TicketsList.module.scss';

interface TicketsListProps {
  tickets: Ticket[];
  callRecords?: any[]; // For hang-up calls filtering
  loading?: boolean;
  onTicketUpdated?: () => void;
}

type TabType = 'all' | 'completed_calls' | 'hangup_calls' | 'completed_forms';

interface TabConfig {
  key: TabType;
  label: string;
  count: number;
}

export default function TicketsList({
  tickets,
  callRecords = [],
  loading = false,
  onTicketUpdated,
}: TicketsListProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  // Qualify modal state
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [qualifyingTicket, setQualifyingTicket] = useState<Ticket | null>(null);
  const [isQualifying, setIsQualifying] = useState(false);

  // Filter tickets based on active tab - exclude 'live' status tickets
  const filteredTickets = useMemo(() => {
    // Only exclude live status tickets - webhook handles status transitions
    const completedTickets = tickets.filter(ticket => ticket.status !== 'live');

    switch (activeTab) {
      case 'all':
        return completedTickets;

      case 'completed_calls':
        // Phone calls that are completed (no live calls)
        return completedTickets.filter(ticket => ticket.type === 'phone_call');

      case 'hangup_calls':
        // Get tickets that have unsuccessful call records from Retell AI
        // Uses call_analysis.call_successful === false per Retell AI docs
        const unsuccessfulCalls = callRecords.filter(
          record => record.call_analysis?.call_successful === false
        );
        return completedTickets.filter(ticket => {
          // Check if ticket has a call record that was unsuccessful
          return unsuccessfulCalls.some(
            record =>
              record.lead_id === ticket.id ||
              record.customer_id === ticket.customer_id
          );
        });

      case 'completed_forms':
        return completedTickets.filter(ticket => ticket.type === 'web_form');

      default:
        return completedTickets;
    }
  }, [tickets, callRecords, activeTab]);

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(prevSort => {
      if (!prevSort || prevSort.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prevSort.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null; // Clear sort
    });
  };

  // Handle qualify modal
  const handleQualifyClick = (ticket: Ticket) => {
    setQualifyingTicket(ticket);
    setShowQualifyModal(true);
  };

  const handleQualify = async (
    qualification: 'sales' | 'customer_service' | 'junk',
    assignedTo?: string
  ) => {
    if (!qualifyingTicket) return;

    setIsQualifying(true);
    try {
      const response = await fetch(
        `/api/tickets/${qualifyingTicket.id}/qualify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            qualification,
            assignedTo,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to qualify ticket');
      }

      // Refresh the tickets list
      onTicketUpdated?.();
      
      setShowQualifyModal(false);
      setQualifyingTicket(null);
    } catch (error) {
      console.error('Error qualifying ticket:', error);
      alert('Failed to qualify ticket. Please try again.');
    } finally {
      setIsQualifying(false);
    }
  };

  // Sort tickets based on current sort configuration
  const sortedTickets = useMemo(() => {
    if (!sortConfig) return filteredTickets;
    
    return [...filteredTickets].sort((a, b) => {
      const modifier = sortConfig.direction === 'asc' ? 1 : -1;
      
      switch (sortConfig.key) {
        case 'created_at':
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * modifier;
        
        case 'format':
          return a.type.localeCompare(b.type) * modifier;
        
        case 'source':
          return a.source.localeCompare(b.source) * modifier;
        
        case 'ticket_type':
          const typeA = a.service_type || '';
          const typeB = b.service_type || '';
          return typeA.localeCompare(typeB) * modifier;
        
        default:
          return 0;
      }
    });
  }, [filteredTickets, sortConfig]);

  // Calculate counts for each tab - exclude 'live' status tickets
  const tabs: TabConfig[] = useMemo(() => {
    // Only exclude live status tickets - webhook handles status transitions
    const completedTickets = tickets.filter(ticket => ticket.status !== 'live');

    const allCount = completedTickets.length;
    const completedCallsCount = completedTickets.filter(
      t => t.type === 'phone_call'
    ).length;

    // Count tickets that have unsuccessful call records from Retell AI
    const unsuccessfulCalls = callRecords.filter(
      record => record.call_analysis?.call_successful === false
    );
    const hangupCallsCount = completedTickets.filter(ticket => {
      return unsuccessfulCalls.some(
        record =>
          record.lead_id === ticket.id ||
          record.customer_id === ticket.customer_id
      );
    }).length;

    const completedFormsCount = completedTickets.filter(
      t => t.type === 'web_form'
    ).length;

    return [
      { key: 'all', label: 'All Incoming', count: allCount },
      {
        key: 'completed_calls',
        label: 'Completed Calls',
        count: completedCallsCount,
      },
      { key: 'hangup_calls', label: 'Hang-up Calls', count: hangupCallsCount },
      {
        key: 'completed_forms',
        label: 'Completed Forms',
        count: completedFormsCount,
      },
    ];
  }, [tickets, callRecords]);

  return (
    <div className={styles.container}>
      <div className={styles.topContent}>
        <h1 className={styles.pageTitle}>Review & Qualify Your Leads</h1>

        {/* Tab Navigation */}
        <div className={styles.tabsContainer}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className={styles.tabText}>{tab.label}</span>
              <span className={styles.tabCount}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Call Bar */}

      {/* Content Area */}
      <div className={styles.contentArea}>
        <LiveCallBar tickets={tickets} />
        
        {loading ? (
          <div className={styles.loading}>Loading tickets...</div>
        ) : sortedTickets.length === 0 ? (
          <div className={styles.emptyState}>
            No tickets found for this category.
          </div>
        ) : (
          <div className={styles.ticketsContainer}>
            {/* Header Row */}
            <div className={styles.headerRow}>
              <SortableColumnHeader
                title="In Queue"
                sortKey="created_at"
                currentSort={sortConfig}
                onSort={handleSort}
                width="120px"
                sortable={true}
              />
              <SortableColumnHeader
                title="Name"
                sortKey="name"
                currentSort={sortConfig}
                onSort={handleSort}
                width="180px"
                sortable={false}
              />
              <SortableColumnHeader
                title="Phone"
                sortKey="phone"
                currentSort={sortConfig}
                onSort={handleSort}
                width="140px"
                sortable={false}
              />
              <SortableColumnHeader
                title="Address"
                sortKey="address"
                currentSort={sortConfig}
                onSort={handleSort}
                width="250px"
                sortable={false}
              />
              <SortableColumnHeader
                title="Format"
                sortKey="format"
                currentSort={sortConfig}
                onSort={handleSort}
                width="100px"
                sortable={true}
              />
              <SortableColumnHeader
                title="Source"
                sortKey="source"
                currentSort={sortConfig}
                onSort={handleSort}
                width="120px"
                sortable={true}
              />
              <SortableColumnHeader
                title="Ticket Type"
                sortKey="ticket_type"
                currentSort={sortConfig}
                onSort={handleSort}
                width="150px"
                sortable={true}
              />
            </div>

            {/* Data Rows */}
            <div className={styles.dataRows}>
              {sortedTickets.map(ticket => (
                <TicketRow 
                  key={ticket.id} 
                  ticket={ticket} 
                  onQualify={handleQualifyClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Ticket Modal */}
      {qualifyingTicket && (
        <TicketReviewModal
          ticket={qualifyingTicket}
          isOpen={showQualifyModal}
          onClose={() => {
            setShowQualifyModal(false);
            setQualifyingTicket(null);
          }}
          onQualify={handleQualify}
          isQualifying={isQualifying}
        />
      )}
    </div>
  );
}
