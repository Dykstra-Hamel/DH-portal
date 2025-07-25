'use client';

import { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/api-client';
import styles from './AdminManager.module.scss';

interface FormAnalyticsData {
  summary?: any;
  stepCompletion?: any;
  completionTimeDistribution?: any;
  stepAnalytics?: any[];
  funnel?: any[];
  totalAbandoned?: number;
  abandonmentRate?: number;
  abandonmentByStep?: any;
  abandonmentReasons?: any;
  abandonmentByTime?: any;
  topAbandonmentReasons?: any[];
  totalCompletedForms?: number;
  avgCompletionTime?: number;
  medianCompletionTime?: number;
  stepTimeAnalytics?: any[];
  fastestCompletions?: any[];
  slowestCompletions?: any[];
  fieldAnalytics?: any;
  pestIssueDistribution?: any[];
  homeSizeDistribution?: any;
  fieldCompletionRates?: any[];
  progressiveStats?: any;
  traditionalStats?: any;
  improvement?: number;
  progressiveAdoption?: number;
  [key: string]: any;
}

export default function FormAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<FormAnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    companyId: '',
    dateRange: '30d',
    metric: 'overview'
  });
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
    fetchCompanies();
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        dateRange: filters.dateRange,
        metric: filters.metric,
        ...(filters.companyId && { companyId: filters.companyId })
      });

      const data = await authenticatedFetch(`/api/admin/form-analytics?${queryParams}`);

      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        console.error('Failed to fetch form analytics:', data.error);
      }
    } catch (error) {
      console.error('Error fetching form analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await authenticatedFetch('/api/admin/companies');
      // Companies API returns array directly (not wrapped in success/data)
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const renderOverview = () => {
    if (!analyticsData.summary) return null;

    const { summary, stepCompletion, completionTimeDistribution } = analyticsData;

    return (
      <div className={styles.formOverview}>
        {/* Summary Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Form Starts</h3>
            <div className={styles.statValue}>{summary.totalFormStarts}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Completed Forms</h3>
            <div className={styles.statValue}>{summary.completedForms}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Completion Rate</h3>
            <div className={styles.statValue}>{summary.completionRate.toFixed(1)}%</div>
          </div>
          <div className={styles.statCard}>
            <h3>Won Leads</h3>
            <div className={styles.statValue}>{summary.wonLeads}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Conversion Rate</h3>
            <div className={styles.statValue}>{summary.conversionRate.toFixed(1)}%</div>
          </div>
          <div className={styles.statCard}>
            <h3>Avg Completion Time</h3>
            <div className={styles.statValue}>{formatTime(summary.avgCompletionTime)}</div>
          </div>
        </div>

        {/* Step Completion Analysis */}
        <div className={styles.stepCompletionSection}>
          <h3>Form Step Completion</h3>
          <div className={styles.stepGrid}>
            {Object.entries(stepCompletion).map(([step, data]: [string, any]) => (
              <div key={step} className={styles.stepCard}>
                <div className={styles.stepName}>
                  {step.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </div>
                <div className={styles.stepStats}>
                  <div className={styles.stepCount}>{data.completed} users</div>
                  <div className={styles.stepPercentage}>{data.percentage.toFixed(1)}%</div>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${data.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Area Analysis */}
        <div className={styles.serviceAreaSection}>
          <h3>Service Area Qualification</h3>
          <div className={styles.serviceAreaGrid}>
            <div className={styles.serviceAreaCard}>
              <div className={styles.serviceAreaLabel}>Served Users</div>
              <div className={styles.serviceAreaValue}>{summary.servedUsers}</div>
              <div className={styles.serviceAreaPercentage}>
                {summary.serviceQualificationRate.toFixed(1)}%
              </div>
            </div>
            <div className={styles.serviceAreaCard}>
              <div className={styles.serviceAreaLabel}>Outside Area</div>
              <div className={styles.serviceAreaValue}>{summary.outsideAreaUsers}</div>
              <div className={styles.serviceAreaPercentage}>
                {((summary.outsideAreaUsers / summary.totalFormStarts) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Completion Time Distribution */}
        <div className={styles.timeDistributionSection}>
          <h3>Completion Time Distribution</h3>
          <div className={styles.timeDistributionGrid}>
            {Object.entries(completionTimeDistribution).map(([range, count]: [string, any]) => (
              <div key={range} className={styles.timeDistributionItem}>
                <div className={styles.timeRange}>{range}</div>
                <div className={styles.timeCount}>{count} forms</div>
                <div className={styles.timeBar}>
                  <div 
                    className={styles.timeBarFill}
                    style={{ 
                      width: `${summary.completedForms > 0 ? (count / summary.completedForms) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStepAnalysis = () => {
    if (!analyticsData.stepAnalytics) return null;

    return (
      <div className={styles.stepAnalysisSection}>
        <h3>Step-by-Step Analysis</h3>
        
        {/* Funnel Visualization */}
        <div className={styles.funnelContainer}>
          {analyticsData.funnel?.map((stage: any, index: number) => (
            <div key={index} className={styles.funnelStage}>
              <div className={styles.stageName}>{stage.step}</div>
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

        {/* Detailed Step Analytics */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Step</th>
                <th>Reached</th>
                <th>Completed</th>
                <th>Abandoned</th>
                <th>Completion Rate</th>
                <th>Abandonment Rate</th>
                <th>Avg Time Spent</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.stepAnalytics.map((step: any) => (
                <tr key={step.step}>
                  <td><strong>{step.name}</strong></td>
                  <td>{step.reached}</td>
                  <td>{step.completed}</td>
                  <td>{step.abandoned}</td>
                  <td>{step.completionRate.toFixed(1)}%</td>
                  <td>{step.abandonmentRate.toFixed(1)}%</td>
                  <td>{formatTime(step.avgTimeSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAbandonmentAnalysis = () => {
    if (!analyticsData.totalAbandoned) return null;

    return (
      <div className={styles.abandonmentSection}>
        <h3>Abandonment Analysis</h3>
        
        <div className={styles.abandonmentOverview}>
          <div className={styles.abandonmentStat}>
            <span>Total Abandoned:</span>
            <strong>{analyticsData.totalAbandoned}</strong>
          </div>
          <div className={styles.abandonmentStat}>
            <span>Abandonment Rate:</span>
            <strong>{analyticsData.abandonmentRate?.toFixed(1)}%</strong>
          </div>
        </div>

        {/* Top Abandonment Reasons */}
        <div className={styles.abandonmentReasonsContainer}>
          <h4>Top Abandonment Reasons</h4>
          <div className={styles.reasonsList}>
            {analyticsData.topAbandonmentReasons?.map((reason: any, index: number) => (
              <div key={index} className={styles.reasonItem}>
                <div className={styles.reasonName}>{reason.reason}</div>
                <div className={styles.reasonCount}>{reason.count} users</div>
                <div className={styles.reasonBar}>
                  <div 
                    className={styles.reasonBarFill}
                    style={{ 
                      width: `${analyticsData.totalAbandoned ? (reason.count / analyticsData.totalAbandoned) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Abandonment by Step */}
        <div className={styles.abandonmentByStepContainer}>
          <h4>Abandonment by Step</h4>
          <div className={styles.stepAbandonmentGrid}>
            {Object.entries(analyticsData.abandonmentByStep || {}).map(([step, count]: [string, any]) => (
              <div key={step} className={styles.stepAbandonmentCard}>
                <div className={styles.stepAbandonmentStep}>
                  {step.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </div>
                <div className={styles.stepAbandonmentCount}>{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Abandonment by Time */}
        <div className={styles.abandonmentByTimeContainer}>
          <h4>Abandonment by Time Spent</h4>
          <div className={styles.timeAbandonmentGrid}>
            {Object.entries(analyticsData.abandonmentByTime || {}).map(([timeRange, count]: [string, any]) => (
              <div key={timeRange} className={styles.timeAbandonmentItem}>
                <div className={styles.timeAbandonmentRange}>{timeRange}</div>
                <div className={styles.timeAbandonmentCount}>{count} users</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCompletionTimes = () => {
    if (!analyticsData.totalCompletedForms) return null;

    return (
      <div className={styles.completionTimesSection}>
        <h3>Completion Time Analysis</h3>
        
        <div className={styles.timeStatsGrid}>
          <div className={styles.timeStat}>
            <h4>Average Time</h4>
            <div className={styles.timeValue}>{formatTime(analyticsData.avgCompletionTime || 0)}</div>
          </div>
          <div className={styles.timeStat}>
            <h4>Median Time</h4>
            <div className={styles.timeValue}>{formatTime(analyticsData.medianCompletionTime || 0)}</div>
          </div>
          <div className={styles.timeStat}>
            <h4>Completed Forms</h4>
            <div className={styles.timeValue}>{analyticsData.totalCompletedForms}</div>
          </div>
        </div>

        {/* Time by Step */}
        <div className={styles.stepTimeContainer}>
          <h4>Average Time by Step</h4>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Avg Time</th>
                  <th>Median Time</th>
                  <th>Min Time</th>
                  <th>Max Time</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.stepTimeAnalytics?.map((step: any) => (
                  <tr key={step.step}>
                    <td><strong>{step.step.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</strong></td>
                    <td>{formatTime(step.avgTime)}</td>
                    <td>{formatTime(step.medianTime)}</td>
                    <td>{formatTime(step.minTime)}</td>
                    <td>{formatTime(step.maxTime)}</td>
                    <td>{step.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFieldAnalysis = () => {
    if (!analyticsData.fieldAnalytics) return null;

    return (
      <div className={styles.fieldAnalysisSection}>
        <h3>Field Analysis</h3>
        
        {/* Field Completion Rates */}
        <div className={styles.fieldCompletionContainer}>
          <h4>Field Completion Rates</h4>
          <div className={styles.fieldCompletionGrid}>
            {analyticsData.fieldCompletionRates?.map((field: any) => (
              <div key={field.field} className={styles.fieldCompletionCard}>
                <div className={styles.fieldName}>
                  {field.field.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                </div>
                <div className={styles.fieldCompletionRate}>
                  {field.completionRate.toFixed(1)}%
                </div>
                <div className={styles.fieldAvgLength}>
                  Avg: {field.avgLength} chars
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pest Issue Distribution */}
        {analyticsData.pestIssueDistribution && (
          <div className={styles.pestIssueContainer}>
            <h4>Most Common Pest Issues</h4>
            <div className={styles.pestIssueList}>
              {analyticsData.pestIssueDistribution.map((issue: any, index: number) => (
                <div key={index} className={styles.pestIssueItem}>
                  <div className={styles.pestIssueName}>{issue.issue}</div>
                  <div className={styles.pestIssueCount}>{issue.count} selections</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Home Size Distribution */}
        {analyticsData.homeSizeDistribution && (
          <div className={styles.homeSizeContainer}>
            <h4>Home Size Distribution</h4>
            <div className={styles.homeSizeGrid}>
              {Object.entries(analyticsData.homeSizeDistribution).map(([range, count]: [string, any]) => (
                <div key={range} className={styles.homeSizeItem}>
                  <div className={styles.homeSizeRange}>{range} sq ft</div>
                  <div className={styles.homeSizeCount}>{count} homes</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProgressiveForms = () => {
    if (!analyticsData.progressiveStats) return null;

    return (
      <div className={styles.progressiveFormsSection}>
        <h3>Progressive vs Traditional Forms</h3>
        
        <div className={styles.progressiveComparison}>
          <div className={styles.formTypeCard}>
            <h4>Progressive Forms</h4>
            <div className={styles.formTypeStats}>
              <div className={styles.formTypeStat}>
                <span>Total:</span>
                <strong>{analyticsData.progressiveStats.total}</strong>
              </div>
              <div className={styles.formTypeStat}>
                <span>Completed:</span>
                <strong>{analyticsData.progressiveStats.completed}</strong>
              </div>
              <div className={styles.formTypeStat}>
                <span>Completion Rate:</span>
                <strong>{analyticsData.progressiveStats.completionRate.toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          <div className={styles.formTypeCard}>
            <h4>Traditional Forms</h4>
            <div className={styles.formTypeStats}>
              <div className={styles.formTypeStat}>
                <span>Total:</span>
                <strong>{analyticsData.traditionalStats.total}</strong>
              </div>
              <div className={styles.formTypeStat}>
                <span>Completed:</span>
                <strong>{analyticsData.traditionalStats.completed}</strong>
              </div>
              <div className={styles.formTypeStat}>
                <span>Completion Rate:</span>
                <strong>{analyticsData.traditionalStats.completionRate.toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.progressiveImpact}>
          <div className={styles.impactMetric}>
            <span>Improvement:</span>
            <strong className={(analyticsData.improvement || 0) > 0 ? styles.positive : styles.negative}>
              {(analyticsData.improvement || 0) > 0 ? '+' : ''}{(analyticsData.improvement || 0).toFixed(1)}%
            </strong>
          </div>
          <div className={styles.impactMetric}>
            <span>Progressive Adoption:</span>
            <strong>{(analyticsData.progressiveAdoption || 0).toFixed(1)}%</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (filters.metric) {
      case 'overview':
        return renderOverview();
      case 'steps':
        return renderStepAnalysis();
      case 'abandonment':
        return renderAbandonmentAnalysis();
      case 'completion-times':
        return renderCompletionTimes();
      case 'field-analysis':
        return renderFieldAnalysis();
      case 'progressive-forms':
        return renderProgressiveForms();
      default:
        return renderOverview();
    }
  };

  return (
    <div className={styles.adminSection}>
      <div className={styles.sectionHeader}>
        <h2>Form Analytics</h2>
        <p>Detailed analysis of form performance and user behavior</p>
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
          <label>Analysis:</label>
          <select 
            value={filters.metric} 
            onChange={(e) => setFilters({...filters, metric: e.target.value})}
          >
            <option value="overview">Overview</option>
            <option value="steps">Step Analysis</option>
            <option value="abandonment">Abandonment</option>
            <option value="completion-times">Completion Times</option>
            <option value="field-analysis">Field Analysis</option>
            <option value="progressive-forms">Progressive Forms</option>
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
        <div className={styles.loading}>Loading form analytics...</div>
      ) : (
        renderContent()
      )}
    </div>
  );
}