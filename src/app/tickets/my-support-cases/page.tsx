'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
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
import styles from '@/components/Common/DataTable/DataTableTabs.module.scss';

export default function MySupportCasesPage() {
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useUser();
  const { selectedCompany } = useCompany();
  const { registerPageAction, unregisterPageAction } = usePageActions();
  const router = useRouter();

  // Get tabs configuration
  const tabs = useMemo(() => getUserSupportCaseTabs(), []);

  // Handle tab change
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
  }, []);

  // Filter data based on active tab
  const filteredByTab = useMemo(() => {
    if (!tabs || tabs.length === 0) return supportCases;
    const activeTabConfig = tabs.find(tab => tab.key === activeTab);
    if (!activeTabConfig) return supportCases;
    return activeTabConfig.filter(supportCases);
  }, [supportCases, activeTab, tabs]);

  // Apply search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;

    const query = searchQuery.toLowerCase();
    return filteredByTab.filter(supportCase => {
      const customerName =
        `${supportCase.customer?.first_name || ''} ${supportCase.customer?.last_name || ''}`.toLowerCase();
      if (customerName.includes(query)) return true;
      if (supportCase.customer?.phone?.toLowerCase().includes(query)) return true;
      if (supportCase.summary?.toLowerCase().includes(query)) return true;
      if (supportCase.status?.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [filteredByTab, searchQuery]);

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
      {/* Tabs and Search Row */}
      {tabs && tabs.length > 0 && (
        <div className={styles.tabsRow}>
          <div className={styles.tabsSection}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.label}
                {tab.getCount && (
                  <span className={styles.tabCount}>
                    {tab.getCount(supportCases)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className={styles.searchSection}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
            />
            <Search size={18} className={styles.searchIcon} />
          </div>
        </div>
      )}

      <DataTable<SupportCase>
        data={filteredData}
        title="My Support Cases"
        columns={getSupportCaseColumns()}
        loading={loading}
        emptyStateMessage="No support cases assigned to you yet."
        tableType="supportCases"
        onItemAction={handleAction}
        searchEnabled={false}
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
