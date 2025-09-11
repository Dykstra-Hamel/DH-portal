'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import TicketsTable from '@/components/Tickets/TicketsTable/TicketsTable';
import { adminAPI } from '@/lib/api-client';
import { Ticket } from '@/types/ticket';
import { useCompany } from '@/contexts/CompanyContext';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

export default function TicketsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'new' | 'contacted' | 'qualified' | 'quoted' | 'in_progress' | 'resolved' | 'unqualified' | 'all' | 'archived'
  >('all');
  const router = useRouter();

  // Use global company context
  const { selectedCompany, isAdmin, isLoading: contextLoading } = useCompany();

  useEffect(() => {
    const supabase = createClient();

    const getSessionAndData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData);
      }

      setLoading(false);
    };

    getSessionAndData();
  }, [router]);

  const fetchTickets = useCallback(
    async (companyId: string, includeArchived: boolean = false) => {
      setTicketsLoading(true);
      try {
        let fetchedTickets: Ticket[] = [];

        if (isAdmin) {
          // Admin users fetch from admin API
          fetchedTickets = await adminAPI.tickets.list({
            companyId,
            includeArchived,
          });
        } else {
          // Regular users fetch from standard API
          const response = await fetch(
            `/api/tickets?companyId=${companyId}&includeArchived=${includeArchived}`
          );
          if (response.ok) {
            fetchedTickets = await response.json();
          }
        }

        if (includeArchived) {
          setArchivedTickets(fetchedTickets);
        } else {
          setTickets(fetchedTickets);
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setTicketsLoading(false);
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    if (selectedCompany?.id && !contextLoading) {
      fetchTickets(selectedCompany.id, false);
      fetchTickets(selectedCompany.id, true);
    }
  }, [selectedCompany?.id, contextLoading, fetchTickets]);

  // Set up real-time subscriptions for tickets and call_records
  useEffect(() => {
    if (!selectedCompany?.id || contextLoading) return;

    const supabase = createClient();

    // Subscribe to tickets table changes
    const ticketsSubscription = supabase
      .channel('tickets-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `company_id=eq.${selectedCompany.id}`,
        },
        (payload) => {
          console.log('Tickets real-time update:', payload);
          // Refresh tickets when any change occurs
          fetchTickets(selectedCompany.id, false);
          fetchTickets(selectedCompany.id, true);
        }
      )
      .subscribe();

    // Subscribe to call_records table changes
    const callRecordsSubscription = supabase
      .channel('call-records-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_records',
        },
        (payload) => {
          console.log('Call records real-time update:', payload);
          // Refresh tickets when call records change (affects live call status)
          fetchTickets(selectedCompany.id, false);
          fetchTickets(selectedCompany.id, true);
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(ticketsSubscription);
      supabase.removeChannel(callRecordsSubscription);
    };
  }, [selectedCompany?.id, contextLoading, fetchTickets]);

  const handleArchiveTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh tickets
        if (selectedCompany?.id) {
          fetchTickets(selectedCompany.id, false);
          fetchTickets(selectedCompany.id, true);
        }
      }
    } catch (error) {
      console.error('Error archiving ticket:', error);
    }
  };

  const handleUnarchiveTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: false }),
      });

      if (response.ok) {
        // Refresh tickets
        if (selectedCompany?.id) {
          fetchTickets(selectedCompany.id, false);
          fetchTickets(selectedCompany.id, true);
        }
      }
    } catch (error) {
      console.error('Error unarchiving ticket:', error);
    }
  };

  const getFilteredTickets = () => {
    const sourceTickets = activeTab === 'archived' ? archivedTickets : tickets;
    
    if (activeTab === 'all' || activeTab === 'archived') {
      return sourceTickets;
    }
    
    return sourceTickets.filter(ticket => ticket.status === activeTab);
  };

  if (loading || contextLoading) {
    return <div>Loading...</div>;
  }

  if (!selectedCompany) {
    return (
      <div>
        <h1>Tickets</h1>
        <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
          Please select a company to view tickets.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Tickets</h1>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <nav style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[
              { key: 'all', label: 'All', count: tickets.length },
              { key: 'new', label: 'New', count: tickets.filter(t => t.status === 'new').length },
              { key: 'contacted', label: 'Contacted', count: tickets.filter(t => t.status === 'contacted').length },
              { key: 'in_progress', label: 'In Progress', count: tickets.filter(t => t.status === 'in_progress').length },
              { key: 'resolved', label: 'Resolved', count: tickets.filter(t => t.status === 'resolved').length },
              { key: 'archived', label: 'Archived', count: archivedTickets.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '10px 0',
                  borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: activeTab === tab.key ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === tab.key ? '600' : '400',
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </nav>
      </div>

      {ticketsLoading ? (
        <div>Loading tickets...</div>
      ) : (
        <TicketsTable
          tickets={getFilteredTickets()}
          onArchive={handleArchiveTicket}
          onUnarchive={handleUnarchiveTicket}
          showCompanyColumn={isAdmin && !selectedCompany}
          showArchived={activeTab === 'archived'}
          userProfile={profile ? { role: profile.role } : undefined}
        />
      )}
    </div>
  );
}