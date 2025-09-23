'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api-client';
import SupportCasesList from '@/components/SupportCases/SupportCasesList/SupportCasesList';
import { SupportCase } from '@/types/support-case';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import {
  MetricsCard,
  styles as metricsStyles,
} from '@/components/Common/MetricsCard';
import styles from './page.module.scss';

interface SupportCaseMetrics {
  totalCases: {
    title: string;
    value: string;
    comparisonValue: number;
    comparisonPeriod: string;
    trend: 'good' | 'bad';
  };
  newCases: {
    title: string;
    value: string;
    comparisonValue: number;
    comparisonPeriod: string;
    trend: 'good' | 'bad';
  };
  avgResponseTime: {
    title: string;
    value: string;
    comparisonValue: number;
    comparisonPeriod: string;
    trend: 'good' | 'bad';
  };
  avgResolutionTime: {
    title: string;
    value: string;
    comparisonValue: number;
    comparisonPeriod: string;
    trend: 'good' | 'bad';
  };
  satisfactionScore: {
    title: string;
    value: string;
    comparisonValue: number;
    comparisonPeriod: string;
    trend: 'good' | 'bad';
  };
}

export default function CustomerServicePage() {
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<SupportCaseMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Use global company context
  const { selectedCompany } = useCompany();

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

  // Calculate metrics from support cases data
  const calculateMetrics = useCallback((cases: SupportCase[]) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current period (last 30 days)
    const currentCases = cases.filter(
      sc => new Date(sc.created_at) >= thirtyDaysAgo
    );
    // Previous period (30-60 days ago)
    const previousCases = cases.filter(sc => {
      const createdAt = new Date(sc.created_at);
      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    });

    // Total cases
    const totalCurrent = currentCases.length;
    const totalPrevious = previousCases.length;
    const totalChange =
      totalPrevious > 0
        ? ((totalCurrent - totalPrevious) / totalPrevious) * 100
        : 0;

    // New cases
    const newCurrent = currentCases.filter(sc => sc.status === 'new').length;
    const newPrevious = previousCases.filter(sc => sc.status === 'new').length;
    const newChange =
      newPrevious > 0 ? ((newCurrent - newPrevious) / newPrevious) * 100 : 0;

    // Response time calculation
    const casesWithResponse = currentCases.filter(sc => sc.first_response_at);
    const responseTimes = casesWithResponse.map(sc => {
      const created = new Date(sc.created_at).getTime();
      const responded = new Date(sc.first_response_at!).getTime();
      return (responded - created) / (1000 * 60 * 60); // hours
    });
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    // Resolution time calculation
    const resolvedCases = currentCases.filter(sc => sc.resolved_at);
    const resolutionTimes = resolvedCases.map(sc => {
      const created = new Date(sc.created_at).getTime();
      const resolved = new Date(sc.resolved_at!).getTime();
      return (resolved - created) / (1000 * 60 * 60); // hours
    });
    const avgResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, time) => sum + time, 0) /
          resolutionTimes.length
        : 0;

    // Satisfaction score
    const casesWithRating = currentCases.filter(sc => sc.satisfaction_rating);
    const avgSatisfaction =
      casesWithRating.length > 0
        ? casesWithRating.reduce(
            (sum, sc) => sum + sc.satisfaction_rating!,
            0
          ) / casesWithRating.length
        : 0;

    const formatTime = (hours: number) => {
      if (hours < 1) return `${Math.round(hours * 60)}m`;
      if (hours < 24) return `${Math.round(hours)}h`;
      return `${Math.round(hours / 24)}d`;
    };

    return {
      totalCases: {
        title: 'Total Cases',
        value: totalCurrent.toString(),
        comparisonValue: Math.abs(totalChange),
        comparisonPeriod: 'vs last 30 days',
        trend: totalChange > 0 ? 'bad' : 'good',
      },
      newCases: {
        title: 'New Cases',
        value: newCurrent.toString(),
        comparisonValue: Math.abs(newChange),
        comparisonPeriod: 'vs last 30 days',
        trend: newChange > 0 ? 'bad' : 'good',
      },
      avgResponseTime: {
        title: 'Avg Response Time',
        value: formatTime(avgResponseTime),
        comparisonValue: 0,
        comparisonPeriod: 'last 30 days',
        trend: 'good',
      },
      avgResolutionTime: {
        title: 'Avg Resolution Time',
        value: formatTime(avgResolutionTime),
        comparisonValue: 0,
        comparisonPeriod: 'last 30 days',
        trend: 'good',
      },
      satisfactionScore: {
        title: 'Satisfaction Score',
        value: avgSatisfaction > 0 ? avgSatisfaction.toFixed(1) : '--',
        comparisonValue: 0,
        comparisonPeriod: 'out of 5.0',
        trend: avgSatisfaction >= 3.5 ? 'good' : 'bad',
      },
    } as SupportCaseMetrics;
  }, []);

  // Handle support case changes for real-time updates
  const handleSupportCaseChange = useCallback(
    (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      console.log('Support case change:', eventType, newRecord);

      switch (eventType) {
        case 'INSERT':
          if (newRecord && selectedCompany?.id) {
            // Add new support case to the list
            const supabase = createClient();
            supabase
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
              ticket:tickets(
                id,
                type,
                source,
                created_at
              )
            `
              )
              .eq('id', newRecord.id)
              .single()
              .then(({ data: fullSupportCase, error }) => {
                if (error) {
                  console.error(
                    'Error fetching full support case data:',
                    error
                  );
                  setSupportCases(prev => {
                    const exists = prev.some(sc => sc.id === newRecord.id);
                    if (!exists) {
                      return [newRecord, ...prev];
                    }
                    return prev;
                  });
                } else if (fullSupportCase) {
                  setSupportCases(prev => {
                    const exists = prev.some(
                      sc => sc.id === fullSupportCase.id
                    );
                    if (!exists) {
                      return [fullSupportCase, ...prev];
                    }
                    return prev;
                  });
                }
              });
          }
          break;

        case 'UPDATE':
          if (newRecord && selectedCompany?.id) {
            // Update existing support case
            const supabase = createClient();
            supabase
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
              ticket:tickets(
                id,
                type,
                source,
                created_at
              )
            `
              )
              .eq('id', newRecord.id)
              .single()
              .then(({ data: fullSupportCase, error }) => {
                if (error) {
                  console.error(
                    'Error fetching full support case data:',
                    error
                  );
                  setSupportCases(prev =>
                    prev.map(sc => (sc.id === newRecord.id ? newRecord : sc))
                  );
                } else if (fullSupportCase) {
                  setSupportCases(prev =>
                    prev.map(sc =>
                      sc.id === newRecord.id ? fullSupportCase : sc
                    )
                  );
                }
              });
          }
          break;

        case 'DELETE':
          if (oldRecord) {
            setSupportCases(prev => prev.filter(sc => sc.id !== oldRecord.id));
          }
          break;
      }
    },
    [selectedCompany?.id]
  );

  useEffect(() => {
    if (selectedCompany?.id) {
      fetchSupportCases(selectedCompany.id);
    }
  }, [selectedCompany?.id, fetchSupportCases]);

  // Calculate metrics when support cases change
  useEffect(() => {
    if (supportCases.length > 0) {
      setMetricsLoading(false);
      setMetrics(calculateMetrics(supportCases));
    } else if (!loading) {
      setMetricsLoading(false);
      setMetrics(null);
    }
  }, [supportCases, loading, calculateMetrics]);

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    if (!selectedCompany?.id) return;

    const supabase = createClient();

    const channel = supabase
      .channel('support-cases-live-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_cases',
          filter: `company_id=eq.${selectedCompany.id}`,
        },
        payload => {
          console.log('Support case realtime update:', payload);
          handleSupportCaseChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCompany?.id, handleSupportCaseChange]);

  return (
    <div className={styles.container}>
      {selectedCompany && (
        <>
          {/* Metrics Cards */}
          <div
            className={`${metricsStyles.metricsCardWrapper} ${styles.metricsSection}`}
          >
            {metrics && !metricsLoading ? (
              <>
                <MetricsCard
                  title={metrics.totalCases.title}
                  value={metrics.totalCases.value}
                  comparisonValue={metrics.totalCases.comparisonValue}
                  comparisonPeriod={metrics.totalCases.comparisonPeriod}
                  trend={metrics.totalCases.trend}
                />
                <MetricsCard
                  title={metrics.newCases.title}
                  value={metrics.newCases.value}
                  comparisonValue={metrics.newCases.comparisonValue}
                  comparisonPeriod={metrics.newCases.comparisonPeriod}
                  trend={metrics.newCases.trend}
                />
                <MetricsCard
                  title={metrics.avgResponseTime.title}
                  value={metrics.avgResponseTime.value}
                  comparisonValue={metrics.avgResponseTime.comparisonValue}
                  comparisonPeriod={metrics.avgResponseTime.comparisonPeriod}
                  trend={metrics.avgResponseTime.trend}
                />
                <MetricsCard
                  title={metrics.avgResolutionTime.title}
                  value={metrics.avgResolutionTime.value}
                  comparisonValue={metrics.avgResolutionTime.comparisonValue}
                  comparisonPeriod={metrics.avgResolutionTime.comparisonPeriod}
                  trend={metrics.avgResolutionTime.trend}
                />
                <MetricsCard
                  title={metrics.satisfactionScore.title}
                  value={metrics.satisfactionScore.value}
                  comparisonValue={metrics.satisfactionScore.comparisonValue}
                  comparisonPeriod={metrics.satisfactionScore.comparisonPeriod}
                  trend={metrics.satisfactionScore.trend}
                />
              </>
            ) : (
              <>
                <MetricsCard
                  title="Total Cases"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="New Cases"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Avg Response Time"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Avg Resolution Time"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Satisfaction Score"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="out of 5.0"
                  trend="good"
                  isLoading={true}
                />
              </>
            )}
          </div>
        </>
      )}

      {selectedCompany && (
        <SupportCasesList
          supportCases={supportCases}
          loading={loading}
          onSupportCaseUpdated={() => {
            fetchSupportCases(selectedCompany.id);
          }}
        />
      )}

      {!selectedCompany && (
        <div
          style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}
        >
          Please select a company to view support cases.
        </div>
      )}
    </div>
  );
}
