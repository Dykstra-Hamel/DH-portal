'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { DateRangePicker } from '@/components/Common/DateRangePicker';
import MetricsCard from '@/components/Common/MetricsCard/MetricsCard';
import {
  TimeRange,
  ReportsResponse,
  getDateRangeFromTimeRange,
  getPreviousPeriod,
  getComparisonLabel,
} from '@/services/reportsService';
import styles from './page.module.scss';

export default function ReportsPage() {
  const { selectedCompany } = useCompany();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [comparisonEnabled, setComparisonEnabled] = useState(true);
  const [reports, setReports] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!selectedCompany?.id) return;

    setLoading(true);
    try {
      const { startDate, endDate } = getDateRangeFromTimeRange(
        selectedRange,
        customStartDate,
        customEndDate
      );

      const params = new URLSearchParams({
        companyId: selectedCompany.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        compare: comparisonEnabled.toString(),
      });

      if (comparisonEnabled) {
        const { startDate: compareStart, endDate: compareEnd } =
          getPreviousPeriod(startDate, endDate);
        params.append('compareStartDate', compareStart.toISOString());
        params.append('compareEndDate', compareEnd.toISOString());
      }

      const response = await fetch(`/api/reports?${params}`);
      if (response.ok) {
        const data = await response.json();

        // Add comparison period labels if comparison is enabled
        if (comparisonEnabled) {
          const comparisonLabel = getComparisonLabel(selectedRange);
          Object.keys(data).forEach(key => {
            if (data[key].comparisonValue !== undefined) {
              data[key].comparisonPeriod = comparisonLabel;
            }
          });
        }

        setReports(data);
      } else {
        console.error('Error fetching reports:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [
    selectedCompany,
    selectedRange,
    customStartDate,
    customEndDate,
    comparisonEnabled,
  ]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
  };

  const handleCustomDateChange = (startDate: Date, endDate: Date) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  if (!selectedCompany) {
    return (
      <div className={styles.container}>
        <p>Please select a company to view reports.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <DateRangePicker
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={handleCustomDateChange}
        showComparison={true}
        comparisonEnabled={comparisonEnabled}
        onComparisonToggle={setComparisonEnabled}
      />

      {loading ? (
        <div className={styles.metricsGrid}>
          {[...Array(8)].map((_, i) => (
            <MetricsCard
              key={i}
              title=""
              value={0}
              isLoading={true}
              showComparison={comparisonEnabled}
            />
          ))}
        </div>
      ) : reports ? (
        <>
          <div className={styles.sectionHeader}>
            <h2>Sales Metrics</h2>
          </div>
          <div className={styles.metricsGrid}>
            <MetricsCard
              title={reports.totalLeads.title}
              value={reports.totalLeads.value}
              comparisonValue={reports.totalLeads.comparisonValue}
              comparisonPeriod={reports.totalLeads.comparisonPeriod}
              trend={reports.totalLeads.trend}
              showComparison={comparisonEnabled}
            />
            <MetricsCard
              title={reports.leadsWon.title}
              value={reports.leadsWon.value}
              comparisonValue={reports.leadsWon.comparisonValue}
              comparisonPeriod={reports.leadsWon.comparisonPeriod}
              trend={reports.leadsWon.trend}
              showComparison={comparisonEnabled}
            />
            <MetricsCard
              title={reports.leadsLost.title}
              value={reports.leadsLost.value}
              comparisonValue={reports.leadsLost.comparisonValue}
              comparisonPeriod={reports.leadsLost.comparisonPeriod}
              trend={reports.leadsLost.trend}
              showComparison={comparisonEnabled}
            />
            <MetricsCard
              title={reports.winRate.title}
              value={reports.winRate.value}
              comparisonValue={reports.winRate.comparisonValue}
              comparisonPeriod={reports.winRate.comparisonPeriod}
              trend={reports.winRate.trend}
              showComparison={comparisonEnabled}
            />
            <MetricsCard
              title={reports.pipelineValue.title}
              value={reports.pipelineValue.value}
              comparisonValue={reports.pipelineValue.comparisonValue}
              comparisonPeriod={reports.pipelineValue.comparisonPeriod}
              trend={reports.pipelineValue.trend}
              showComparison={comparisonEnabled}
            />
          </div>

          <div className={styles.sectionHeader}>
            <h2>Call Metrics</h2>
          </div>
          <div className={styles.metricsGrid}>
            <MetricsCard
              title={reports.totalOutboundCalls.title}
              value={reports.totalOutboundCalls.value}
              comparisonValue={reports.totalOutboundCalls.comparisonValue}
              comparisonPeriod={reports.totalOutboundCalls.comparisonPeriod}
              trend={reports.totalOutboundCalls.trend}
              showComparison={comparisonEnabled}
            />
            <MetricsCard
              title={reports.totalInboundCalls.title}
              value={reports.totalInboundCalls.value}
              comparisonValue={reports.totalInboundCalls.comparisonValue}
              comparisonPeriod={reports.totalInboundCalls.comparisonPeriod}
              trend={reports.totalInboundCalls.trend}
              showComparison={comparisonEnabled}
            />
            <MetricsCard
              title={reports.totalCalls.title}
              value={reports.totalCalls.value}
              comparisonValue={reports.totalCalls.comparisonValue}
              comparisonPeriod={reports.totalCalls.comparisonPeriod}
              trend={reports.totalCalls.trend}
              showComparison={comparisonEnabled}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
