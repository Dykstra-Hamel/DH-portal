'use client';

import { useState, useEffect, useCallback } from 'react';
import { GAAnalyticsResponse } from '@/lib/google-analytics/types';
import { generateDemoAnalyticsData } from '@/lib/analytics-demo-data';
import TrafficChart from './Charts/TrafficChart';
import DeviceChart from './Charts/DeviceChart';
import SourceChart from './Charts/SourceChart';
import PageViewsChart from './Charts/PageViewsChart';
import PlaceholderWrapper from './PlaceholderWrapper/PlaceholderWrapper';
import styles from './AnalyticsDashboard.module.scss';

interface AnalyticsDashboardProps {
  companyId: string;
  companyName: string;
  userRole?: string;
}

export default function AnalyticsDashboard({ companyId, companyName, userRole }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<GAAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  
  // Removed date filter - using default 30 days

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const days = 30; // Default to 30 days
    
    try {
      const response = await fetch(`/api/analytics?companyId=${companyId}&days=${days}`);
      const result = await response.json();

      if (!response.ok) {
        if (result.configured === false) {
          setConfigured(false);
        }
        throw new Error(result.error || 'Failed to fetch analytics data');
      }

      setAnalyticsData(result.data);
      setConfigured(result.configured);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [companyId, ]);

  useEffect(() => {
    if (companyId) {
      fetchAnalyticsData();
    }
  }, [companyId, fetchAnalyticsData]);

  if (loading) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!configured) {
    // Show demo data with placeholder overlay
    const days = 30;
    const demoData = generateDemoAnalyticsData(days);
    const { traffic, sources, devices, pages, summary } = demoData;

    const demoContent = (
      <div className={styles.analyticsContainer}>
        <div className={styles.analyticsHeader}>
          <h2 className={styles.title}>Analytics Dashboard</h2>
        </div>

        <div className={styles.metricsCards}>
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>
              {summary.totalSessions.toLocaleString()}
            </div>
            <div className={styles.metricLabel}>Total Sessions</div>
            <div className={`${styles.metricGrowth} ${summary.sessionsGrowth >= 0 ? styles.positive : styles.negative}`}>
              {summary.sessionsGrowth >= 0 ? '↗' : '↘'} {Math.abs(summary.sessionsGrowth)}%
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricValue}>
              {summary.totalUsers.toLocaleString()}
            </div>
            <div className={styles.metricLabel}>Total Users</div>
            <div className={`${styles.metricGrowth} ${summary.usersGrowth >= 0 ? styles.positive : styles.negative}`}>
              {summary.usersGrowth >= 0 ? '↗' : '↘'} {Math.abs(summary.usersGrowth)}%
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricValue}>
              {summary.totalPageviews.toLocaleString()}
            </div>
            <div className={styles.metricLabel}>Page Views</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricValue}>
              {summary.averageBounceRate.toFixed(1)}%
            </div>
            <div className={styles.metricLabel}>Bounce Rate</div>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartRow}>
            <div className={styles.fullWidthChart}>
              <TrafficChart data={traffic} />
            </div>
          </div>

          <div className={styles.chartRow}>
            <div className={styles.fullWidthChart}>
              <DeviceChart data={devices} />
            </div>
          </div>

          <div className={styles.chartRow}>
            <div className={styles.fullWidthChart}>
              <SourceChart data={sources} />
            </div>
          </div>

          <div className={styles.chartRow}>
            <div className={styles.fullWidthChart}>
              <PageViewsChart data={pages} />
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <PlaceholderWrapper 
        companyName={companyName}
        isAdmin={userRole === 'admin'}
        onSetupClick={() => {
          // Navigate to company settings or show setup instructions
          window.open('/admin', '_blank');
        }}
      >
        {demoContent}
      </PlaceholderWrapper>
    );
  }

  if (error) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>Analytics Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => fetchAnalyticsData()}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.noData}>
          <div className={styles.noDataIcon}>📈</div>
          <h3>No Data Available</h3>
          <p>No analytics data available for the selected period.</p>
        </div>
      </div>
    );
  }

  const { traffic, sources, devices, pages, summary } = analyticsData;

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.analyticsHeader}>
        <h2 className={styles.title}>Analytics Dashboard</h2>
      </div>

      <div className={styles.metricsCards}>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {summary.totalSessions.toLocaleString()}
          </div>
          <div className={styles.metricLabel}>Total Sessions</div>
          <div className={`${styles.metricGrowth} ${summary.sessionsGrowth >= 0 ? styles.positive : styles.negative}`}>
            {summary.sessionsGrowth >= 0 ? '↗' : '↘'} {Math.abs(summary.sessionsGrowth)}%
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {summary.totalUsers.toLocaleString()}
          </div>
          <div className={styles.metricLabel}>Total Users</div>
          <div className={`${styles.metricGrowth} ${summary.usersGrowth >= 0 ? styles.positive : styles.negative}`}>
            {summary.usersGrowth >= 0 ? '↗' : '↘'} {Math.abs(summary.usersGrowth)}%
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {summary.totalPageviews.toLocaleString()}
          </div>
          <div className={styles.metricLabel}>Page Views</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {summary.averageBounceRate.toFixed(1)}%
          </div>
          <div className={styles.metricLabel}>Bounce Rate</div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartRow}>
          <div className={styles.fullWidthChart}>
            <TrafficChart data={traffic} />
          </div>
        </div>

        <div className={styles.chartRow}>
          <div className={styles.fullWidthChart}>
            <DeviceChart data={devices} />
          </div>
        </div>

        <div className={styles.chartRow}>
          <div className={styles.fullWidthChart}>
            <SourceChart data={sources} />
          </div>
        </div>

        <div className={styles.chartRow}>
          <div className={styles.fullWidthChart}>
            <PageViewsChart data={pages} />
          </div>
        </div>
      </div>
    </div>
  );
}