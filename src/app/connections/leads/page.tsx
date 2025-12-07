'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import LeadsList from '@/components/Leads/LeadsList/LeadsList';
import { adminAPI } from '@/lib/api-client';
import { Lead } from '@/types/lead';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import {
  MetricsCard,
  styles as metricsStyles,
} from '@/components/Common/MetricsCard';
import { MetricsResponse } from '@/services/metricsService';
import {
  createLeadChannel,
  subscribeToLeadUpdates,
  LeadUpdatePayload,
} from '@/lib/realtime/lead-channel';
import { AddLeadModal } from '@/components/Leads/AddLeadModal/AddLeadModal';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

export default function LeadsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const router = useRouter();

  // Use global company context
  const { selectedCompany, isAdmin } = useCompany();

  // Register page action for Add Lead button
  const { registerPageAction } = usePageActions();

  useEffect(() => {
    registerPageAction('add', () => {
      setIsAddLeadModalOpen(true);
    });
  }, [registerPageAction]);

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

  const fetchLeads = useCallback(async () => {
    if (!isAdmin && !selectedCompany) return;

    try {
      setLeadsLoading(true);

      if (isAdmin) {
        // Admin can filter by specific company or show all
        const filters = {
          ...(selectedCompany ? { companyId: selectedCompany.id } : {}),
          includeArchived: true, // Get both active and archived leads
        };
        const leadsData = await adminAPI.getLeads(filters);
        setLeads(leadsData || []);
      } else {
        // Regular user gets all leads (active and archived) for their selected company
        const [activeLeads, archivedLeads] = await Promise.all([
          adminAPI.getUserLeads(selectedCompany!.id),
          adminAPI.getUserArchivedLeads(selectedCompany!.id),
        ]);
        setLeads([...(activeLeads || []), ...(archivedLeads || [])]);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [selectedCompany, isAdmin]);

  const handleEditLead = (lead: Lead) => {
    router.push(`/connections/leads/${lead.id}?edit=true`);
  };

  const fetchMetrics = useCallback(async (companyId: string) => {
    if (!companyId) return;

    setMetricsLoading(true);
    try {
      const params = new URLSearchParams({
        companyId,
      });

      const response = await fetch(`/api/metrics?${params}`);
      if (response.ok) {
        const metricsData = await response.json();
        setMetrics(metricsData);
      } else {
        console.error('Error fetching metrics:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Fetch leads and metrics when selectedCompany changes or isAdmin changes
  useEffect(() => {
    if (selectedCompany?.id) {
      fetchLeads();
      fetchMetrics(selectedCompany.id);
    }
  }, [selectedCompany, isAdmin, fetchLeads, fetchMetrics]);

  // Real-time subscription for lead updates
  useEffect(() => {
    if (!selectedCompany?.id) {
      return;
    }

    const channel = createLeadChannel(selectedCompany.id);

    subscribeToLeadUpdates(channel, async (payload: LeadUpdatePayload) => {
      const { company_id, action, record_id } = payload;

      // Verify this is for our selected company
      if (company_id !== selectedCompany.id) {
        return;
      }

      if (action === 'INSERT') {
        // Fetch the new lead with all its relationships
        try {
          const supabase = createClient();
          const { data: newLead } = await supabase
            .from('leads')
            .select(
              `
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
            `
            )
            .eq('id', record_id)
            .single();

          if (newLead) {
            setLeads(prev => [newLead, ...prev]);
          }
        } catch (error) {
          console.error('Error fetching new lead:', error);
        }
      } else if (action === 'UPDATE') {
        // Fetch the updated lead
        try {
          const supabase = createClient();
          const { data: updatedLead } = await supabase
            .from('leads')
            .select(
              `
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
            `
            )
            .eq('id', record_id)
            .single();

          if (updatedLead) {
            setLeads(prev =>
              prev.map(lead => (lead.id === updatedLead.id ? updatedLead : lead))
            );
          }
        } catch (error) {
          console.error('Error fetching updated lead:', error);
        }
      } else if (action === 'DELETE') {
        // Remove the lead from the list
        setLeads(prev => prev.filter(lead => lead.id !== record_id));
      }
    });

    return () => {
      createClient().removeChannel(channel);
    };
  }, [selectedCompany?.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  return (
    <div style={{ width: '100%' }}>
      {selectedCompany && (
        <>
          {/* Metrics Cards */}
          <div className={metricsStyles.metricsCardWrapper}>
            {metrics && !metricsLoading ? (
              <>
                <MetricsCard
                  title={metrics.totalCalls.title}
                  value={metrics.totalCalls.value}
                  comparisonValue={metrics.totalCalls.comparisonValue}
                  comparisonPeriod={metrics.totalCalls.comparisonPeriod}
                  trend={metrics.totalCalls.trend}
                />
                <MetricsCard
                  title={metrics.totalForms.title}
                  value={metrics.totalForms.value}
                  comparisonValue={metrics.totalForms.comparisonValue}
                  comparisonPeriod={metrics.totalForms.comparisonPeriod}
                  trend={metrics.totalForms.trend}
                />
                <MetricsCard
                  title={metrics.avgTimeToAssign.title}
                  value={metrics.avgTimeToAssign.value}
                  comparisonValue={metrics.avgTimeToAssign.comparisonValue}
                  comparisonPeriod={metrics.avgTimeToAssign.comparisonPeriod}
                  trend={metrics.avgTimeToAssign.trend}
                />
                <MetricsCard
                  title={metrics.hangupCalls.title}
                  value={metrics.hangupCalls.value}
                  comparisonValue={metrics.hangupCalls.comparisonValue}
                  comparisonPeriod={metrics.hangupCalls.comparisonPeriod}
                  trend={metrics.hangupCalls.trend}
                />
                <MetricsCard
                  title={metrics.customerServiceCalls.title}
                  value={metrics.customerServiceCalls.value}
                  comparisonValue={metrics.customerServiceCalls.comparisonValue}
                  comparisonPeriod={
                    metrics.customerServiceCalls.comparisonPeriod
                  }
                  trend={metrics.customerServiceCalls.trend}
                />
              </>
            ) : (
              <>
                <MetricsCard
                  title="Total Calls"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Total Forms"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Avg Time To Be Assigned"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Hang-up Calls"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Customer Service Calls"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
              </>
            )}
          </div>
        </>
      )}

      {selectedCompany && (
        <LeadsList
          leads={leads}
          loading={leadsLoading}
          onLeadUpdated={() => {
            fetchLeads();
            fetchMetrics(selectedCompany.id);
          }}
          onEdit={handleEditLead}
          showCompanyColumn={isAdmin && !selectedCompany}
          userProfile={profile}
          defaultSort={{ key: 'created_at', direction: 'asc' }}
        />
      )}

      {!selectedCompany && (
        <div
          style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}
        >
          Please select a company to view leads.
        </div>
      )}

      {/* Add Lead Modal */}
      {selectedCompany && (
        <AddLeadModal
          isOpen={isAddLeadModalOpen}
          onClose={() => setIsAddLeadModalOpen(false)}
          companyId={selectedCompany.id}
          onSuccess={() => {
            fetchLeads();
            fetchMetrics(selectedCompany.id);
          }}
        />
      )}
    </div>
  );
}
