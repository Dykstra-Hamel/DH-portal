'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useCompany } from '@/contexts/CompanyContext';
import { DataTable } from '@/components/Common/DataTable';
import { getLeadColumns, getUserLeadTabs } from '@/components/Leads/LeadsList/LeadsListConfig';
import { Lead } from '@/types/lead';

export default function MySalesLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { selectedCompany } = useCompany();

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

  const handleRefresh = () => {
    fetchMyLeads();
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
      />
    </div>
  );
}