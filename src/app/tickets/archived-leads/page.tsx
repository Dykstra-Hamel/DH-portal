'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/Common/DataTable';
import {
  getArchivedLeadColumns,
  getArchivedLeadTabs,
} from '@/components/Leads/LeadsList/ArchivedLeadsListConfig';
import { Lead } from '@/types/lead';
import { useCompany } from '@/contexts/CompanyContext';
import {
  createLeadChannel,
  subscribeToLeadUpdates,
  LeadUpdatePayload,
} from '@/lib/realtime/lead-channel';
import { RecoverLeadModal } from '@/components/Common/RecoverLeadModal/RecoverLeadModal';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

export default function ArchivedLeadsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const router = useRouter();

  // Use global company context
  const { selectedCompany, isAdmin, isLoading: companyLoading } = useCompany();

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

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Fetch archived leads
  const fetchArchivedLeads = useCallback(async () => {
    if (!selectedCompany?.id) {
      setLeadsLoading(false);
      return;
    }

    try {
      setLeadsLoading(true);

      const params = new URLSearchParams({
        companyId: selectedCompany.id,
        includeArchived: 'true', // Include archived leads
      });

      const response = await fetch(`/api/leads?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch archived leads');
      }

      const data = await response.json();
      // Filter to only show archived, lost, or won leads
      const archivedLeads = Array.isArray(data)
        ? data.filter(
            (lead: Lead) =>
              lead.archived ||
              lead.lead_status === 'lost' ||
              lead.lead_status === 'won'
          )
        : [];
      setLeads(archivedLeads);
    } catch (error) {
      console.error('Error fetching archived leads:', error);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [selectedCompany?.id]);

  // Fetch leads when company changes
  useEffect(() => {
    if (!companyLoading && selectedCompany) {
      fetchArchivedLeads();
    }
  }, [selectedCompany, companyLoading, fetchArchivedLeads]);

  // Real-time subscription for lead updates
  useEffect(() => {
    if (!selectedCompany?.id) return;

    const channel = createLeadChannel(selectedCompany.id);

    subscribeToLeadUpdates(channel, async (payload: LeadUpdatePayload) => {
      const { company_id, action, record_id } = payload;

      // Verify this is for our selected company
      if (company_id !== selectedCompany.id) return;

      if (action === 'INSERT') {
        // Fetch full lead data - only add if it's archived/lost/won
        try {
          const supabase = createClient();
          const { data: fullLead } = await supabase
            .from('leads')
            .select(`
              *,
              customer:customers(
                id,
                first_name,
                last_name,
                email,
                phone
              ),
              company:companies(
                id,
                name
              ),
              assigned_user:profiles!leads_assigned_to_fkey(
                id,
                first_name,
                last_name,
                email,
                avatar_url
              )
            `)
            .eq('id', record_id)
            .single();

          if (
            fullLead &&
            (fullLead.archived ||
              fullLead.lead_status === 'lost' ||
              fullLead.lead_status === 'won')
          ) {
            setLeads(prev => {
              const exists = prev.some(lead => lead.id === fullLead.id);
              if (!exists) {
                return [fullLead, ...prev];
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Error fetching new archived lead:', error);
        }
      } else if (action === 'UPDATE') {
        // Fetch updated lead data
        try {
          const supabase = createClient();
          const { data: updatedLead } = await supabase
            .from('leads')
            .select(`
              *,
              customer:customers(
                id,
                first_name,
                last_name,
                email,
                phone
              ),
              company:companies(
                id,
                name
              ),
              assigned_user:profiles!leads_assigned_to_fkey(
                id,
                first_name,
                last_name,
                email,
                avatar_url
              )
            `)
            .eq('id', record_id)
            .single();

          if (updatedLead) {
            // If lead is no longer archived/lost/won, remove it
            if (
              !updatedLead.archived &&
              updatedLead.lead_status !== 'lost' &&
              updatedLead.lead_status !== 'won'
            ) {
              setLeads(prev => prev.filter(lead => lead.id !== record_id));
            } else {
              // Update the lead in the list
              setLeads(prev => {
                const exists = prev.some(lead => lead.id === updatedLead.id);
                if (exists) {
                  return prev.map(lead =>
                    lead.id === updatedLead.id ? updatedLead : lead
                  );
                } else {
                  return [updatedLead, ...prev];
                }
              });
            }
          }
        } catch (error) {
          console.error('Error fetching updated lead:', error);
        }
      } else if (action === 'DELETE') {
        setLeads(prev => prev.filter(lead => lead.id !== record_id));
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [selectedCompany?.id]);

  // Handle item actions (recover or view)
  const handleAction = (action: string, lead: Lead) => {
    if (action === 'recover') {
      setSelectedLead(lead);
      setShowRecoverModal(true);
    } else if (action === 'edit') {
      // Navigate to lead detail when clicking on row
      router.push(`/tickets/leads/${lead.id}`);
    }
  };

  // Handle recover confirmation
  const handleRecoverConfirm = async (newStatus: string, notes?: string) => {
    if (!selectedLead) return;

    setIsRecovering(true);
    try {
      const response = await fetch(
        `/api/leads/${selectedLead.id}/recover`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newStatus, notes }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to recover lead');
      }

      // Redirect to the lead details page
      router.push(`/tickets/leads/${selectedLead.id}`);
    } catch (error) {
      console.error('Error recovering lead:', error);
      alert('Failed to recover lead. Please try again.');
      setIsRecovering(false);
    }
  };

  if (loading || companyLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  if (!selectedCompany) {
    return <div>No company selected</div>;
  }

  return (
    <>
      <DataTable
        data={leads}
        title="Archived Leads"
        columns={getArchivedLeadColumns()}
        tabs={getArchivedLeadTabs()}
        loading={leadsLoading}
        onItemAction={handleAction}
        emptyStateMessage="No archived leads found"
        tableType="leads"
      />

      <RecoverLeadModal
        isOpen={showRecoverModal}
        onClose={() => {
          setShowRecoverModal(false);
          setSelectedLead(null);
        }}
        onConfirm={handleRecoverConfirm}
        customerName={
          selectedLead?.customer
            ? `${selectedLead.customer.first_name} ${selectedLead.customer.last_name}`
            : 'this lead'
        }
        isSubmitting={isRecovering}
      />
    </>
  );
}
