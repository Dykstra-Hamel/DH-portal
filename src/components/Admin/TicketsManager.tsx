'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api-client';
import TicketsTable from '@/components/Tickets/TicketsTable/TicketsTable';
import CompanyDropdown from '@/components/Common/CompanyDropdown/CompanyDropdown';
import { Ticket } from '@/types/ticket';
import { createClient } from '@/lib/supabase/client';
import {
  createTicketChannel,
  subscribeToTicketUpdates,
  TicketUpdatePayload,
} from '@/lib/realtime/ticket-channel';
import styles from './AdminDashboard.module.scss';

export default function TicketsManager() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
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
    if (selectedCompanyId) {
      fetchTickets(selectedCompanyId, false);
      fetchTickets(selectedCompanyId, true);
    }
  }, [selectedCompanyId, fetchTickets]);

  // Supabase Realtime broadcast subscription for live updates
  useEffect(() => {
    if (!selectedCompanyId) return;

    const channel = createTicketChannel(selectedCompanyId);

    subscribeToTicketUpdates(channel, async (payload: TicketUpdatePayload) => {
      const { company_id } = payload;

      // Verify this is for our selected company
      if (company_id !== selectedCompanyId) return;

      // Refresh both active and archived tickets when any change occurs
      // This ensures we always have the latest data
      fetchTickets(selectedCompanyId, false);
      fetchTickets(selectedCompanyId, true);
    });

    return () => {
      createClient().removeChannel(channel);
    };
  }, [selectedCompanyId, fetchTickets]);

  const handleArchiveTicket = async (ticketId: string) => {
    try {
      await adminAPI.tickets.archive(ticketId);
      if (selectedCompanyId) {
        fetchTickets(selectedCompanyId, false);
        fetchTickets(selectedCompanyId, true);
      }
    } catch (error) {
      console.error('Error archiving ticket:', error);
    }
  };

  const handleUnarchiveTicket = async (ticketId: string) => {
    try {
      await adminAPI.tickets.update(ticketId, { archived: false });
      if (selectedCompanyId) {
        fetchTickets(selectedCompanyId, false);
        fetchTickets(selectedCompanyId, true);
      }
    } catch (error) {
      console.error('Error unarchiving ticket:', error);
    }
  };

  const handleTicketUpdated = () => {
    if (selectedCompanyId) {
      fetchTickets(selectedCompanyId, false);
      fetchTickets(selectedCompanyId, true);
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
        <p>View and manage tickets across companies</p>
      </div>

      <div className={styles.controls}>
        <CompanyDropdown
          selectedCompanyId={selectedCompanyId}
          onCompanyChange={setSelectedCompanyId}
          placeholder="Select a company to view tickets"
        />
      </div>

      {selectedCompanyId && (
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