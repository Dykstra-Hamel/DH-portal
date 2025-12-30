'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import { DataTable } from '@/components/Common/DataTable';
import { getLeadColumns, getUserLeadTabs } from '@/components/Leads/LeadsList/LeadsListConfig';
import { Lead } from '@/types/lead';
import { createClient } from '@/lib/supabase/client';
import { AddLeadModal } from '@/components/Leads/AddLeadModal/AddLeadModal';
import {
  createLeadChannel,
  subscribeToLeadUpdates,
  LeadUpdatePayload,
} from '@/lib/realtime/lead-channel';

export default function MySalesLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useUser();
  const { selectedCompany } = useCompany();
  const { registerPageAction, unregisterPageAction } = usePageActions();
  const router = useRouter();

  // Fetch leads assigned to current user
  const fetchMyLeads = async () => {
    if (!user?.id || !selectedCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        companyId: selectedCompany.id,
        assignedTo: user.id, // Filter by current user
      });

      const response = await fetch(`/api/leads?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }

      const data = await response.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching my leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeads();
  }, [user?.id, selectedCompany?.id]);

  // Register the Add Lead button action
  useEffect(() => {
    if (selectedCompany) {
      registerPageAction('add', () => setShowAddModal(true));
    }

    return () => {
      unregisterPageAction('add');
    };
  }, [selectedCompany, registerPageAction, unregisterPageAction]);

  // Real-time subscription for lead updates
  useEffect(() => {
    if (!selectedCompany?.id || !user?.id) return;

    const channel = createLeadChannel(selectedCompany.id);

    subscribeToLeadUpdates(channel, async (payload: LeadUpdatePayload) => {
      const { company_id, action, record_id } = payload;

      // Verify this is for our selected company
      if (company_id !== selectedCompany.id) return;

      if (action === 'INSERT') {
        // Fetch full lead data - only add if assigned to current user
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
              )
            `)
            .eq('id', record_id)
            .eq('assigned_to', user.id) // Filter by current user
            .single();

          if (fullLead) {
            setLeads(prev => {
              const exists = prev.some(lead => lead.id === fullLead.id);
              if (!exists) {
                return [fullLead, ...prev];
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Error fetching new lead:', error);
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
              )
            `)
            .eq('id', record_id)
            .single();

          if (updatedLead) {
            // Check if it&apos;s still assigned to this user
            if (updatedLead.assigned_to === user.id) {
              setLeads(prev => {
                const exists = prev.some(lead => lead.id === updatedLead.id);
                if (exists) {
                  return prev.map(lead =>
                    lead.id === updatedLead.id ? updatedLead : lead
                  );
                } else {
                  // Lead was reassigned to this user
                  return [updatedLead, ...prev];
                }
              });
            } else {
              // Remove if no longer assigned to this user
              setLeads(prev => prev.filter(lead => lead.id !== record_id));
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
      createClient().removeChannel(channel);
    };
  }, [selectedCompany?.id, user?.id]);

  const handleRefresh = () => {
    fetchMyLeads();
  };

  const handleAction = (action: string, lead: Lead) => {
    if (action === 'edit') {
      router.push(`/tickets/leads/${lead.id}`);
    }
  };

  if (!user || !selectedCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please select a company to view your leads.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <DataTable<Lead>
        data={leads}
        title="My Sales Leads"
        columns={getLeadColumns()}
        tabs={getUserLeadTabs()}
        loading={loading}
        emptyStateMessage="No leads assigned to you yet."
        tableType="leads"
        onItemAction={handleAction}
      />

      {/* Add Lead Modal */}
      {selectedCompany && (
        <AddLeadModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          companyId={selectedCompany.id}
          onSuccess={fetchMyLeads}
        />
      )}
    </div>
  );
}