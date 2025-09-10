'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api-client';
import TicketsTable from '@/components/Tickets/TicketsTable/TicketsTable';
import { Ticket } from '@/types/ticket';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useDateFilter } from '@/contexts/DateFilterContext';

export default function CallsAndFormsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  
  // Use global company context and date filter
  const { selectedCompany } = useCompany();
  const { getApiDateParams } = useDateFilter();

  const fetchTickets = useCallback(async (companyId: string, includeArchived: boolean = false) => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const dateParams = getApiDateParams();
      const ticketsData = await adminAPI.tickets.list({ 
        companyId, 
        includeArchived,
        ...dateParams
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
  }, [getApiDateParams]);

  useEffect(() => {
    if (selectedCompany?.id) {
      fetchTickets(selectedCompany.id, false);
      fetchTickets(selectedCompany.id, true);
    }
  }, [selectedCompany?.id, fetchTickets]);

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    if (!selectedCompany?.id) return;

    const supabase = createClient();
    
    const channel = supabase
      .channel('tickets')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets',
          filter: `company_id=eq.${selectedCompany.id}`
        },
        (payload) => {
          console.log('Ticket change received:', payload);
          
          // Refetch tickets when changes occur
          fetchTickets(selectedCompany.id, false);
          fetchTickets(selectedCompany.id, true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCompany?.id, fetchTickets]);

  const currentTickets = activeTab === 'active' ? tickets : archivedTickets;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: '10px' }}>Calls & Forms</h1>
      </div>

      {selectedCompany && (
        <div>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setActiveTab('active')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'active' ? '#0284c7' : '#f3f4f6',
                color: activeTab === 'active' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Active Tickets ({tickets.length})
            </button>
            <button 
              onClick={() => setActiveTab('archived')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'archived' ? '#0284c7' : '#f3f4f6',
                color: activeTab === 'archived' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Archived Tickets ({archivedTickets.length})
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '20px' }}>
              Loading tickets...
            </div>
          ) : (
            <TicketsTable
              tickets={currentTickets}
              onTicketUpdated={() => {
                fetchTickets(selectedCompany.id, false);
                fetchTickets(selectedCompany.id, true);
              }}
            />
          )}
        </div>
      )}

      {!selectedCompany && (
        <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
          Please select a company to view tickets.
        </div>
      )}
    </div>
  );
}