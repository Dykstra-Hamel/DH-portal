'use client';

import { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch } from '@/lib/api-client';
import styles from './AdminManager.module.scss';

interface AnalyticsData {
  summary?: any;
  sourceBreakdown?: any;
  attributionQuality?: any;
  sourceAnalytics?: any[];
  campaignAnalytics?: any[];
  funnel?: any[];
  performanceMetrics?: any[];
  trends?: any[];
  [key: string]: any;
}

export default function AttributionAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    companyId: '',
    dateRange: '30d',
    metric: 'overview'
  });
  const [companies, setCompanies] = useState<any[]>([]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        dateRange: filters.dateRange,
        metric: filters.metric,
        ...(filters.companyId && { companyId: filters.companyId })
      });

      const data = await authenticatedFetch(`/api/admin/attribution-analytics?${queryParams}`);

      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        console.error('Failed to fetch analytics:', data.error);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCompanies = useCallback(async () => {
    try {
      const data = await authenticatedFetch('/api/admin/companies');
      // Companies API returns array directly (not wrapped in success/data)
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchCompanies();
  }, [fetchAnalytics, fetchCompanies]);

  const renderOverview = () => {
    if (!analyticsData.summary) return null;

    const { summary, sourceBreakdown, attributionQuality } = analyticsData;

    return (
      <div className={styles.analyticsOverview}>
        {/* Summary Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Leads</h3>
            <div className={styles.statValue}>{summary.totalLeads}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Partial Leads</h3>
            <div className={styles.statValue}>{summary.totalPartialLeads}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Conversion Rate</h3>
            <div className={styles.statValue}>{summary.conversionRate}%</div>
          </div>
          <div className={styles.statCard}>
            <h3>Attribution Quality</h3>
            <div className={styles.statValue}>{Math.round(attributionQuality.attributionRate)}%</div>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className={styles.chartSection}>
          <h3>Lead Sources</h3>
          <div className={styles.sourceGrid}>
            {Object.entries(sourceBreakdown).map(([source, count]: [string, any]) => (
              <div key={source} className={styles.sourceCard}>
                <div className={styles.sourceName}>{source}</div>
                <div className={styles.sourceCount}>{count}</div>
                <div className={styles.sourcePercentage}>
                  {summary.totalLeads > 0 ? Math.round((count / summary.totalLeads) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attribution Quality Metrics */}
        <div className={styles.qualitySection}>
          <h3>Attribution Quality Metrics</h3>
          <div className={styles.qualityGrid}>
            <div className={styles.qualityMetric}>
              <span className={styles.qualityLabel}>GCLID Coverage</span>
              <div className={styles.qualityBar}>
                <div 
                  className={styles.qualityFill} 
                  style={{ width: `${attributionQuality.gclidRate}%` }}
                ></div>
              </div>
              <span className={styles.qualityValue}>{Math.round(attributionQuality.gclidRate)}%</span>
            </div>
            <div className={styles.qualityMetric}>
              <span className={styles.qualityLabel}>UTM Coverage</span>
              <div className={styles.qualityBar}>
                <div 
                  className={styles.qualityFill} 
                  style={{ width: `${attributionQuality.utmRate}%` }}
                ></div>
              </div>
              <span className={styles.qualityValue}>{Math.round(attributionQuality.utmRate)}%</span>
            </div>
            <div className={styles.qualityMetric}>
              <span className={styles.qualityLabel}>Detailed Attribution</span>
              <div className={styles.qualityBar}>
                <div 
                  className={styles.qualityFill} 
                  style={{ width: `${attributionQuality.detailedAttributionRate}%` }}
                ></div>
              </div>
              <span className={styles.qualityValue}>{Math.round(attributionQuality.detailedAttributionRate)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSources = () => {
    if (!analyticsData.sourceAnalytics) return null;

    return (
      <div className={styles.sourcesAnalysis}>
        <h3>Source Performance Analysis</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Source</th>
                <th>Leads</th>
                <th>Partial Leads</th>
                <th>Total Value</th>
                <th>Conversions</th>
                <th>Conversion Rate</th>
                <th>Avg Lead Value</th>
                <th>GCLID Coverage</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.sourceAnalytics.map((source: any) => (
                <tr key={source.source}>
                  <td><strong>{source.source}</strong></td>
                  <td>{source.leads}</td>
                  <td>{source.partialLeads}</td>
                  <td>${source.totalValue.toLocaleString()}</td>
                  <td>{source.conversions}</td>
                  <td>{source.conversionRate.toFixed(1)}%</td>
                  <td>${source.avgLeadValue.toFixed(0)}</td>
                  <td>{source.gclidCoverage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCampaigns = () => {
    if (!analyticsData.campaignAnalytics) return null;

    return (
      <div className={styles.campaignAnalysis}>
        <h3>Campaign Performance</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Source</th>
                <th>Medium</th>
                <th>Leads</th>
                <th>Value</th>
                <th>Conversions</th>
                <th>Conversion Rate</th>
                <th>Avg Lead Value</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.campaignAnalytics.slice(0, 20).map((campaign: any, index: number) => (
                <tr key={index}>
                  <td><strong>{campaign.campaign}</strong></td>
                  <td>{campaign.source}</td>
                  <td>{campaign.medium}</td>
                  <td>{campaign.leads}</td>
                  <td>${campaign.value.toLocaleString()}</td>
                  <td>{campaign.conversions}</td>
                  <td>{campaign.conversionRate.toFixed(1)}%</td>
                  <td>${campaign.avgLeadValue.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFunnel = () => {
    if (!analyticsData.funnel) return null;

    return (
      <div className={styles.funnelAnalysis}>
        <h3>Conversion Funnel</h3>
        <div className={styles.funnelContainer}>
          {analyticsData.funnel.map((stage: any, index: number) => (
            <div key={index} className={styles.funnelStage}>
              <div className={styles.stageName}>{stage.stage}</div>
              <div className={styles.stageCount}>{stage.count.toLocaleString()}</div>
              <div className={styles.stagePercentage}>{stage.percentage.toFixed(1)}%</div>
              {stage.dropoffRate > 0 && (
                <div className={styles.dropoffRate}>
                  {stage.dropoffRate.toFixed(1)}% dropoff
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className={styles.funnelMetrics}>
          <div className={styles.funnelMetric}>
            <span>Overall Conversion Rate:</span>
            <strong>{analyticsData.overallConversionRate?.toFixed(2)}%</strong>
          </div>
          <div className={styles.funnelMetric}>
            <span>Qualified to Form Rate:</span>
            <strong>{analyticsData.qualifiedToFormRate?.toFixed(2)}%</strong>
          </div>
          <div className={styles.funnelMetric}>
            <span>Form to Win Rate:</span>
            <strong>{analyticsData.formToWinRate?.toFixed(2)}%</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformance = () => {
    if (!analyticsData.performanceMetrics) return null;

    return (
      <div className={styles.performanceAnalysis}>
        <h3>Performance by Source</h3>
        <div className={styles.performanceGrid}>
          {analyticsData.performanceMetrics.map((metric: any) => (
            <div key={metric.source} className={styles.performanceCard}>
              <h4>{metric.source}</h4>
              <div className={styles.performanceMetrics}>
                <div className={styles.performanceMetric}>
                  <span>Leads:</span>
                  <strong>{metric.leads}</strong>
                </div>
                <div className={styles.performanceMetric}>
                  <span>Total Value:</span>
                  <strong>${metric.totalValue.toLocaleString()}</strong>
                </div>
                <div className={styles.performanceMetric}>
                  <span>Conversions:</span>
                  <strong>{metric.conversions}</strong>
                </div>
                <div className={styles.performanceMetric}>
                  <span>Conv. Rate:</span>
                  <strong>{metric.conversionRate.toFixed(1)}%</strong>
                </div>
                <div className={styles.performanceMetric}>
                  <span>Avg Value:</span>
                  <strong>${metric.avgLeadValue.toFixed(0)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTrends = () => {
    if (!analyticsData.trends) return null;

    return (
      <div className={styles.trendsAnalysis}>
        <h3>Trends Over Time</h3>
        <div className={styles.trendsChart}>
          {/* Simple trend visualization */}
          <div className={styles.trendsGrid}>
            <div className={styles.trendMetric}>
              <span>Avg Daily Leads:</span>
              <strong>{analyticsData.avgDailyLeads?.toFixed(1)}</strong>
            </div>
            <div className={styles.trendMetric}>
              <span>Avg Daily Partial Leads:</span>
              <strong>{analyticsData.avgDailyPartialLeads?.toFixed(1)}</strong>
            </div>
            <div className={styles.trendMetric}>
              <span>Avg Daily Value:</span>
              <strong>${analyticsData.avgDailyValue?.toFixed(0)}</strong>
            </div>
          </div>
          
          {/* Simple trend table */}
          <div className={styles.trendsTable}>
            <h4>Recent Daily Performance</h4>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Leads</th>
                    <th>Partial Leads</th>
                    <th>Value</th>
                    <th>Conversions</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.trends.slice(-7).map((day: any) => (
                    <tr key={day.date}>
                      <td>{new Date(day.date).toLocaleDateString()}</td>
                      <td>{day.leads}</td>
                      <td>{day.partialLeads}</td>
                      <td>${day.value.toLocaleString()}</td>
                      <td>{day.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (filters.metric) {
      case 'overview':
        return renderOverview();
      case 'sources':
        return renderSources();
      case 'campaigns':
        return renderCampaigns();
      case 'funnel':
        return renderFunnel();
      case 'performance':
        return renderPerformance();
      case 'trends':
        return renderTrends();
      default:
        return renderOverview();
    }
  };

  return (
    <div className={styles.adminSection}>
      <div className={styles.sectionHeader}>
        <h2>Attribution Analytics</h2>
        <p>Comprehensive attribution tracking and performance analysis</p>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label>Date Range:</label>
          <select 
            value={filters.dateRange} 
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Company:</label>
          <select 
            value={filters.companyId} 
            onChange={(e) => setFilters({...filters, companyId: e.target.value})}
          >
            <option value="">All Companies</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>View:</label>
          <select 
            value={filters.metric} 
            onChange={(e) => setFilters({...filters, metric: e.target.value})}
          >
            <option value="overview">Overview</option>
            <option value="sources">Sources</option>
            <option value="campaigns">Campaigns</option>
            <option value="funnel">Funnel</option>
            <option value="performance">Performance</option>
            <option value="trends">Trends</option>
          </select>
        </div>

        <button 
          onClick={fetchAnalytics}
          className={styles.refreshButton}
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loading}>Loading analytics...</div>
      ) : (
        renderContent()
      )}
    </div>
  );
}