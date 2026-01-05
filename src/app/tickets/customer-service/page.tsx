'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api-client';
import SupportCasesList from '@/components/SupportCases/SupportCasesList/SupportCasesList';
import { SupportCase } from '@/types/support-case';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import { AddSupportCaseModal } from '@/components/SupportCases/AddSupportCaseModal/AddSupportCaseModal';
import {
  createSupportCaseChannel,
  subscribeToSupportCaseUpdates,
  SupportCaseUpdatePayload,
} from '@/lib/realtime/support-case-channel';
import styles from './page.module.scss';

export default function CustomerServicePage() {
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Use global company context
  const { selectedCompany, isLoading: companyLoading } = useCompany();
  const { registerPageAction, unregisterPageAction } = usePageActions();

  const fetchSupportCases = useCallback(async (companyId: string) => {
    if (!companyId) return;

    setLoading(true);
    try {
      const supportCasesData = await adminAPI.supportCases.list({
        companyId,
        includeArchived: false,
      });

      setSupportCases(supportCasesData);
    } catch (error) {
      console.error('Error fetching support cases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCompany?.id) {
      fetchSupportCases(selectedCompany.id);
    }
  }, [selectedCompany?.id, fetchSupportCases]);

  // Register the Add Case button action
  useEffect(() => {
    if (selectedCompany) {
      registerPageAction('add', () => setShowAddModal(true));
    }

    return () => {
      unregisterPageAction('add');
    };
  }, [selectedCompany, registerPageAction, unregisterPageAction]);

  // Supabase Realtime broadcast subscription for live updates
  useEffect(() => {
    if (!selectedCompany?.id) return;

    const channel = createSupportCaseChannel(selectedCompany.id);

    subscribeToSupportCaseUpdates(channel, async (payload: SupportCaseUpdatePayload) => {
      const { company_id, action, record_id } = payload;

      // Verify this is for our selected company
      if (company_id !== selectedCompany.id) {
        return;
      }

      if (action === 'INSERT') {
        // Fetch full support case data with joins
        try {
          const supabase = createClient();
          const { data: fullSupportCase, error } = await supabase
            .from('support_cases')
            .select(`
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
            `)
            .eq('id', record_id)
            .single();

          if (error) {
            console.error('❌ Supabase error fetching support case:', error);
          }

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
          console.error('❌ Error fetching new support case:', error);
        }
      } else if (action === 'UPDATE') {
        // Fetch updated support case data
        try {
          const supabase = createClient();
          const { data: updatedSupportCase, error } = await supabase
            .from('support_cases')
            .select(`
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
            `)
            .eq('id', record_id)
            .single();

          if (error) {
            console.error('❌ Supabase error fetching updated support case:', error);
          }

          if (updatedSupportCase) {
            setSupportCases(prev =>
              prev.map(sc =>
                sc.id === updatedSupportCase.id ? updatedSupportCase : sc
              )
            );
          }
        } catch (error) {
          console.error('❌ Error fetching updated support case:', error);
        }
      } else if (action === 'DELETE') {
        setSupportCases(prev => prev.filter(sc => sc.id !== record_id));
      }
    });

    return () => {
      createClient().removeChannel(channel);
    };
  }, [selectedCompany?.id]);

  return (
    <div className={styles.container}>
      {selectedCompany && (
        <SupportCasesList
          supportCases={supportCases}
          loading={loading}
          onSupportCaseUpdated={() => {
            fetchSupportCases(selectedCompany.id);
          }}
        />
      )}

      {companyLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSkeleton}>
            <div className={styles.skeletonItem} />
            <div className={styles.skeletonItem} />
            <div className={styles.skeletonItem} />
            <div className={styles.skeletonItem} />
          </div>
        </div>
      )}

      {!selectedCompany && !companyLoading && (
        <div className={styles.emptyState}>
          Please select a company to view support cases.
        </div>
      )}

      {/* Add Support Case Modal */}
      {selectedCompany && (
        <AddSupportCaseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          companyId={selectedCompany.id}
          onSuccess={() => {
            fetchSupportCases(selectedCompany.id);
          }}
        />
      )}
    </div>
  );
}
