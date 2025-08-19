import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Users, Mail, Target, Award, Calendar, Activity } from 'lucide-react';
import styles from './ABTestAnalytics.module.scss';

interface AnalyticsData {
  total_campaigns: number;
  active_campaigns: number;
  completed_campaigns: number;
  total_emails_sent: number;
  average_open_rate: number;
  average_click_rate: number;
  average_conversion_rate: number;
  campaigns_with_winners: number;
  average_test_duration_days: number;
  campaign_performance: Array<{
    campaign_id: string;
    campaign_name: string;
    status: string;
    created_at: string;
    emails_sent: number;
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
    has_winner: boolean;
    improvement: number | null;
  }>;
  monthly_trends: Array<{
    month: string;
    campaigns_started: number;
    campaigns_completed: number;
    emails_sent: number;
    average_open_rate: number;
  }>;
  template_performance: Array<{
    template_id: string;
    template_name: string;
    times_tested: number;
    times_won: number;
    win_rate: number;
    average_improvement: number;
  }>;
}

interface ABTestAnalyticsProps {
  companyId: string;
}

export default function ABTestAnalytics({ companyId }: ABTestAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y' | 'all'>('90d');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${companyId}/ab-tests/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const result = await response.json();
        // Handle the API response structure correctly
        if (result.success && result.analytics) {
          // Map the API data to our expected format
          const mappedData: AnalyticsData = {
            total_campaigns: result.analytics.overall_metrics?.total_campaigns || 0,
            active_campaigns: result.analytics.overall_metrics?.active_campaigns || 0,
            completed_campaigns: result.analytics.overall_metrics?.completed_campaigns || 0,
            total_emails_sent: result.analytics.overall_metrics?.total_emails_sent || 0,
            average_open_rate: result.analytics.overall_metrics?.average_open_rate || 0,
            average_click_rate: result.analytics.overall_metrics?.average_click_rate || 0,
            average_conversion_rate: result.analytics.overall_metrics?.average_conversion_rate || 0,
            campaigns_with_winners: result.analytics.overall_metrics?.campaigns_with_winners || 0,
            average_test_duration_days: result.analytics.overall_metrics?.average_test_duration_days || 0,
            campaign_performance: result.analytics.campaign_performance || [],
            monthly_trends: result.analytics.testing_trends || [],
            template_performance: result.analytics.template_performance || []
          };
          setAnalyticsData(mappedData);
        } else {
          // Set default empty data
          setAnalyticsData({
            total_campaigns: 0,
            active_campaigns: 0,
            completed_campaigns: 0,
            total_emails_sent: 0,
            average_open_rate: 0,
            average_click_rate: 0,
            average_conversion_rate: 0,
            campaigns_with_winners: 0,
            average_test_duration_days: 0,
            campaign_performance: [],
            monthly_trends: [],
            template_performance: []
          });
        }
      } else {
        // Set default empty data on API error
        setAnalyticsData({
          total_campaigns: 0,
          active_campaigns: 0,
          completed_campaigns: 0,
          total_emails_sent: 0,
          average_open_rate: 0,
          average_click_rate: 0,
          average_conversion_rate: 0,
          campaigns_with_winners: 0,
          average_test_duration_days: 0,
          campaign_performance: [],
          monthly_trends: [],
          template_performance: []
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set default empty data on error
      setAnalyticsData({
        total_campaigns: 0,
        active_campaigns: 0,
        completed_campaigns: 0,
        total_emails_sent: 0,
        average_open_rate: 0,
        average_click_rate: 0,
        average_conversion_rate: 0,
        campaigns_with_winners: 0,
        average_test_duration_days: 0,
        campaign_performance: [],
        monthly_trends: [],
        template_performance: []
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Activity size={24} className={styles.spinner} />
        Loading analytics...
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={styles.error}>
        Failed to load analytics data. Please try again.
      </div>
    );
  }

  const formatPercentage = (value: number | undefined | null) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0%';
    return `${(value * 100).toFixed(1)}%`;
  };
  
  const formatNumber = (value: number | undefined | null) => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return value.toLocaleString();
  };

  return (
    <div className={styles.analytics}>
      <div className={styles.header}>
        <div>
          <h2>A/B Testing Analytics</h2>
          <p>Performance insights and trends for your A/B testing campaigns</p>
        </div>
        <div className={styles.timeRangeSelector}>
          <label>Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <BarChart3 size={24} />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{analyticsData?.total_campaigns || 0}</div>
            <div className={styles.metricLabel}>Total Campaigns</div>
            <div className={styles.metricSubtext}>
              {analyticsData?.active_campaigns || 0} active, {analyticsData?.completed_campaigns || 0} completed
            </div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <Mail size={24} />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{formatNumber(analyticsData?.total_emails_sent)}</div>
            <div className={styles.metricLabel}>Emails Sent</div>
            <div className={styles.metricSubtext}>
              Across all A/B test campaigns
            </div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <Users size={24} />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{formatPercentage(analyticsData?.average_open_rate)}</div>
            <div className={styles.metricLabel}>Avg. Open Rate</div>
            <div className={styles.metricSubtext}>
              CTR: {formatPercentage(analyticsData?.average_click_rate)}
            </div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <Target size={24} />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{formatPercentage(analyticsData?.average_conversion_rate)}</div>
            <div className={styles.metricLabel}>Avg. Conversion Rate</div>
            <div className={styles.metricSubtext}>
              Across all campaigns
            </div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <Award size={24} />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{analyticsData?.campaigns_with_winners || 0}</div>
            <div className={styles.metricLabel}>Tests with Winners</div>
            <div className={styles.metricSubtext}>
              Statistically significant results
            </div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <Calendar size={24} />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{(analyticsData?.average_test_duration_days || 0).toFixed(1)}</div>
            <div className={styles.metricLabel}>Avg. Test Duration</div>
            <div className={styles.metricSubtext}>
              Days to completion
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className={styles.section}>
        <h3>Campaign Performance</h3>
        <div className={styles.tableContainer}>
          <table className={styles.performanceTable}>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Emails Sent</th>
                <th>Open Rate</th>
                <th>Click Rate</th>
                <th>Conversion Rate</th>
                <th>Winner</th>
                <th>Improvement</th>
              </tr>
            </thead>
            <tbody>
              {(analyticsData?.campaign_performance || []).map((campaign) => (
                <tr key={campaign.campaign_id}>
                  <td>
                    <div className={styles.campaignName}>
                      {campaign.campaign_name}
                      <div className={styles.campaignDate}>
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[campaign.status]}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td>{formatNumber(campaign.emails_sent)}</td>
                  <td>{formatPercentage(campaign.open_rate)}</td>
                  <td>{formatPercentage(campaign.click_rate)}</td>
                  <td>{formatPercentage(campaign.conversion_rate)}</td>
                  <td>
                    {campaign.has_winner ? (
                      <span className={styles.hasWinner}>Yes</span>
                    ) : (
                      <span className={styles.noWinner}>Pending</span>
                    )}
                  </td>
                  <td>
                    {campaign.improvement !== null ? (
                      <span className={styles.improvement}>
                        +{campaign.improvement.toFixed(1)}%
                      </span>
                    ) : (
                      <span className={styles.noImprovement}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Template Performance */}
      <div className={styles.section}>
        <h3>Template Performance</h3>
        <div className={styles.templateGrid}>
          {(analyticsData?.template_performance || []).map((template) => (
            <div key={template.template_id} className={styles.templateCard}>
              <h4>{template.template_name}</h4>
              <div className={styles.templateStats}>
                <div className={styles.templateStat}>
                  <span className={styles.statValue}>{template.times_tested}</span>
                  <span className={styles.statLabel}>Times Tested</span>
                </div>
                <div className={styles.templateStat}>
                  <span className={styles.statValue}>{template.times_won}</span>
                  <span className={styles.statLabel}>Times Won</span>
                </div>
                <div className={styles.templateStat}>
                  <span className={styles.statValue}>{formatPercentage(template.win_rate)}</span>
                  <span className={styles.statLabel}>Win Rate</span>
                </div>
                <div className={styles.templateStat}>
                  <span className={styles.statValue}>+{template.average_improvement.toFixed(1)}%</span>
                  <span className={styles.statLabel}>Avg. Improvement</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className={styles.section}>
        <h3>Monthly Trends</h3>
        <div className={styles.trendsContainer}>
          <div className={styles.trendsTable}>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Emails Sent</th>
                  <th>Avg. Open Rate</th>
                </tr>
              </thead>
              <tbody>
                {(analyticsData?.monthly_trends || []).map((trend) => (
                  <tr key={trend.month}>
                    <td>{trend.month}</td>
                    <td>{trend.campaigns_started}</td>
                    <td>{trend.campaigns_completed}</td>
                    <td>{formatNumber(trend.emails_sent)}</td>
                    <td>{formatPercentage(trend.average_open_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className={styles.section}>
        <h3>Insights & Recommendations</h3>
        <div className={styles.insights}>
          <div className={styles.insight}>
            <TrendingUp size={20} />
            <div>
              <h4>Performance Trends</h4>
              <p>
                Your average open rate of {formatPercentage(analyticsData?.average_open_rate)} is{' '}
                {(analyticsData?.average_open_rate || 0) > 0.25 ? 'above' : 'below'} industry average.
                {(analyticsData?.campaigns_with_winners || 0) > 0 && (
                  ` ${analyticsData?.campaigns_with_winners} of your tests have found statistical winners.`
                )}
              </p>
            </div>
          </div>
          
          <div className={styles.insight}>
            <Target size={20} />
            <div>
              <h4>Testing Recommendations</h4>
              <p>
                {(analyticsData?.average_test_duration_days || 0) < 7
                  ? 'Consider running tests longer to reach statistical significance.'
                  : 'Your test duration looks good for reliable results.'}
                {(analyticsData?.template_performance || []).length > 0 && (
                  ` Focus on testing variations of your best-performing templates.`
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}