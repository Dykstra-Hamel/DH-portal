'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { adminAPI } from '@/lib/api-client';
import TicketsTable from '@/components/Tickets/TicketsTable/TicketsTable';
import { Ticket } from '@/types/ticket';
import { createClient } from '@/lib/supabase/client';
import {
  createTicketChannel,
  subscribeToTicketUpdates,
  TicketUpdatePayload,
} from '@/lib/realtime/ticket-channel';
import styles from './AdminDashboard.module.scss';

export default function TicketsManager() {
  // Use global company context
  const { selectedCompany, isLoading: contextLoading } = useCompany();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const fetchTickets = useCallback(async (companyId: string, includeArchived: boolean = false) => {
    if (!companyId) return;

    setLoading(true);
    try {
      const ticketsData = await adminAPI.tickets.list({
        companyId,
        includeArchived
      });

      if (includeArchived) {
        setArchivedTickets(ticketsData);
      } else {
        setTickets(ticketsData);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!contextLoading && selectedCompany) {
      fetchTickets(selectedCompany.id, false);
      fetchTickets(selectedCompany.id, true);
    }
  }, [contextLoading, selectedCompany, fetchTickets]);

  // Supabase Realtime broadcast subscription for live updates
  useEffect(() => {
    if (!selectedCompany) return;

    const channel = createTicketChannel(selectedCompany.id);

    subscribeToTicketUpdates(channel, async (payload: TicketUpdatePayload) => {
      const { company_id } = payload;

      // Verify this is for our selected company
      if (company_id !== selectedCompany.id) return;

      // Refresh both active and archived tickets when any change occurs
      // This ensures we always have the latest data
      fetchTickets(selectedCompany.id, false);
      fetchTickets(selectedCompany.id, true);
    });

    return () => {
      createClient().removeChannel(channel);
    };
  }, [selectedCompany, fetchTickets]);

  const handleArchiveTicket = async (ticketId: string) => {
    try {
      await adminAPI.tickets.archive(ticketId);
      if (selectedCompany) {
        fetchTickets(selectedCompany.id, false);
        fetchTickets(selectedCompany.id, true);
      }
    } catch (error) {
      console.error('Error archiving ticket:', error);
    }
  };

  const handleUnarchiveTicket = async (ticketId: string) => {
    try {
      await adminAPI.tickets.update(ticketId, { archived: false });
      if (selectedCompany) {
        fetchTickets(selectedCompany.id, false);
        fetchTickets(selectedCompany.id, true);
      }
    } catch (error) {
      console.error('Error unarchiving ticket:', error);
    }
  };

  const handleTicketUpdated = () => {
    if (selectedCompany) {
      fetchTickets(selectedCompany.id, false);
      fetchTickets(selectedCompany.id, true);
    }
  };

  const getCurrentTickets = () => {
    return activeTab === 'archived' ? archivedTickets : tickets;
  };

  const getTabCount = (tab: 'active' | 'archived') => {
    return tab === 'archived' ? archivedTickets.length : tickets.length;
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Tickets Manager</h2>
        {selectedCompany ? (
          <>
            <p>Managing tickets for {selectedCompany.name}</p>
            <small>Use the company dropdown in the header to switch companies.</small>
          </>
        ) : (
          <p>Select a company from the header dropdown to view tickets</p>
        )}
      </div>

      {selectedCompany && (
        <>
          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tab} ${activeTab === 'active' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active Tickets ({getTabCount('active')})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'archived' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('archived')}
            >
              Archived Tickets ({getTabCount('archived')})
            </button>
          </div>

          {/* Tickets Table */}
          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loading}>Loading tickets...</div>
            ) : (
              <TicketsTable
                tickets={getCurrentTickets()}
                onArchive={activeTab === 'active' ? handleArchiveTicket : undefined}
                onUnarchive={activeTab === 'archived' ? handleUnarchiveTicket : undefined}
                onTicketUpdated={handleTicketUpdated}
                showActions={true}
                showCompanyColumn={false}
                showArchived={activeTab === 'archived'}
                userProfile={{ role: 'admin' }}
              />
            )}
          </div>

          {/* Summary Statistics */}
          {!loading && (
            <div className={styles.summaryStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Active Tickets:</span>
                <span className={styles.statValue}>{tickets.length}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Archived Tickets:</span>
                <span className={styles.statValue}>{archivedTickets.length}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>New Tickets:</span>
                <span className={styles.statValue}>
                  {tickets.filter(ticket => ticket.status === 'new').length}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>In Progress Tickets:</span>
                <span className={styles.statValue}>
                  {tickets.filter(ticket => ticket.status === 'in_progress').length}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Resolved Tickets:</span>
                <span className={styles.statValue}>
                  {tickets.filter(ticket => ticket.status === 'resolved').length}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Converted to Leads:</span>
                <span className={styles.statValue}>
                  {tickets.filter(ticket => ticket.converted_to_lead_id).length}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}