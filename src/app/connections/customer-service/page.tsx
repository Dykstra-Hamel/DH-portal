'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api-client';
import SupportCasesList from '@/components/SupportCases/SupportCasesList/SupportCasesList';
import { SupportCase } from '@/types/support-case';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import {
  createSupportCaseChannel,
  subscribeToSupportCaseUpdates,
  SupportCaseUpdatePayload,
} from '@/lib/realtime/support-case-channel';

export default function CustomerServicePage() {
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(false);

  // Use global company context
  const { selectedCompany, isLoading: companyLoading } = useCompany();

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
    <div style={{ width: '100%' }}>
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
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '800px',
              margin: '0 auto',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          >
            <div
              style={{
                height: '60px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            />
            <div
              style={{
                height: '40px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                marginBottom: '12px',
              }}
            />
            <div
              style={{
                height: '40px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                marginBottom: '12px',
              }}
            />
            <div
              style={{
                height: '40px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
              }}
            />
          </div>
        </div>
      )}

      {!selectedCompany && !companyLoading && (
        <div
          style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}
        >
          Please select a company to view support cases.
        </div>
      )}
    </div>
  );
}
