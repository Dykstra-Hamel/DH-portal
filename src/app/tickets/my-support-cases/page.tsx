'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import { DataTable } from '@/components/Common/DataTable';
import {
  getSupportCaseColumns,
  getUserSupportCaseTabs,
} from '@/components/SupportCases/SupportCasesList/SupportCasesListConfig';
import { SupportCase } from '@/types/support-case';
import { createClient } from '@/lib/supabase/client';
import { AddSupportCaseModal } from '@/components/SupportCases/AddSupportCaseModal/AddSupportCaseModal';
import {
  createSupportCaseChannel,
  subscribeToSupportCaseUpdates,
  SupportCaseUpdatePayload,
} from '@/lib/realtime/support-case-channel';

export default function MySupportCasesPage() {
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useUser();
  const { selectedCompany } = useCompany();
  const { registerPageAction, unregisterPageAction } = usePageActions();
  const router = useRouter();

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
      setError(
        err instanceof Error ? err.message : 'Failed to fetch support cases'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySupportCases();
  }, [user?.id, selectedCompany?.id]);

  // Register the Add Case button action
  useEffect(() => {
    if (selectedCompany) {
      registerPageAction('add', () => setShowAddModal(true));
    }

    return () => {
      unregisterPageAction('add');
    };
  }, [selectedCompany, registerPageAction, unregisterPageAction]);

  // Real-time subscription for support case updates
  useEffect(() => {
    if (!selectedCompany?.id || !user?.id) return;

    const channel = createSupportCaseChannel(selectedCompany.id);

    subscribeToSupportCaseUpdates(
      channel,
      async (payload: SupportCaseUpdatePayload) => {
        const { company_id, action, record_id } = payload;

        // Verify this is for our selected company
        if (company_id !== selectedCompany.id) return;

        if (action === 'INSERT') {
          // Fetch full support case data - only add if assigned to current user
          try {
            const supabase = createClient();
            const { data: fullSupportCase } = await supabase
              .from('support_cases')
              .select(
                `
              *,
              customer:customers(
                id,
                first_name,
                last_name,
                email,
                phone,
                address,
                city,
                state,
                zip_code
              ),
              company:companies(
                id,
                name,
                website
              ),
              ticket:tickets!ticket_id(
                id,
                type,
                source,
                created_at
              )
            `
              )
              .eq('id', record_id)
              .eq('assigned_to', user.id) // Filter by current user
              .single();

            if (fullSupportCase) {
              setSupportCases(prev => {
                const exists = prev.some(sc => sc.id === fullSupportCase.id);
                if (!exists) {
                  return [fullSupportCase, ...prev];
                }
                return prev;
              });
            }
          } catch (error) {
            console.error('Error fetching new support case:', error);
          }
        } else if (action === 'UPDATE') {
          // Fetch updated support case data
          try {
            const supabase = createClient();
            const { data: updatedSupportCase } = await supabase
              .from('support_cases')
              .select(
                `
              *,
              customer:customers(
                id,
                first_name,
                last_name,
                email,
                phone,
                address,
                city,
                state,
                zip_code
              ),
              company:companies(
                id,
                name,
                website
              ),
              ticket:tickets!ticket_id(
                id,
                type,
                source,
                created_at
              )
            `
              )
              .eq('id', record_id)
              .single();

            if (updatedSupportCase) {
              // Check if it&apos;s still assigned to this user
              if (updatedSupportCase.assigned_to === user.id) {
                setSupportCases(prev => {
                  const exists = prev.some(
                    sc => sc.id === updatedSupportCase.id
                  );
                  if (exists) {
                    return prev.map(sc =>
                      sc.id === updatedSupportCase.id ? updatedSupportCase : sc
                    );
                  } else {
                    // Case was reassigned to this user
                    return [updatedSupportCase, ...prev];
                  }
                });
              } else {
                // Remove if no longer assigned to this user
                setSupportCases(prev => prev.filter(sc => sc.id !== record_id));
              }
            }
          } catch (error) {
            console.error('Error fetching updated support case:', error);
          }
        } else if (action === 'DELETE') {
          setSupportCases(prev => prev.filter(sc => sc.id !== record_id));
        }
      }
    );

    return () => {
      createClient().removeChannel(channel);
    };
  }, [selectedCompany?.id, user?.id]);

  const handleAction = (action: string, supportCase: SupportCase) => {
    if (action === 'view' || action === 'edit') {
      router.push(`/tickets/customer-service/${supportCase.id}`);
    }
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
        tabs={getUserSupportCaseTabs()}
        loading={loading}
        emptyStateMessage="No support cases assigned to you yet."
        tableType="supportCases"
        onItemAction={handleAction}
      />

      {/* Add Support Case Modal */}
      {selectedCompany && (
        <AddSupportCaseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          companyId={selectedCompany.id}
          onSuccess={fetchMySupportCases}
        />
      )}
    </div>
  );
}
