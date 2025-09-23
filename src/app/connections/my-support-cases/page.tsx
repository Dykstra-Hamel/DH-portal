'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useCompany } from '@/contexts/CompanyContext';
import { DataTable } from '@/components/Common/DataTable';
import { getSupportCaseColumns, getSupportCaseTabs } from '@/components/SupportCases/SupportCasesList/SupportCasesListConfig';
import { SupportCase } from '@/types/support-case';

export default function MySupportCasesPage() {
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { selectedCompany } = useCompany();

  // Fetch support cases assigned to current user
  const fetchMySupportCases = async () => {
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
        includeArchived: 'false',
      });

      const response = await fetch(`/api/support-cases?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch support cases');
      }

      const data = await response.json();
      setSupportCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching my support cases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch support cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySupportCases();
  }, [user?.id, selectedCompany?.id]);

  const handleRefresh = () => {
    fetchMySupportCases();
  };

  if (!user || !selectedCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please select a company to view your support cases.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <DataTable<SupportCase>
        data={supportCases}
        title="My Support Cases"
        columns={getSupportCaseColumns()}
        tabs={getSupportCaseTabs()}
        loading={loading}
        emptyStateMessage="No support cases assigned to you yet."
        tableType="supportCases"
      />
    </div>
  );
}