'use client';

import { Users, CheckCircle, TrendingUp, Clock, Mail, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import styles from './CampaignOverview.module.scss';

interface CampaignOverviewProps {
  campaign: any;
  metrics: any;
}

export default function CampaignOverview({ campaign, metrics }: CampaignOverviewProps) {
  if (!metrics) {
    return <div className={styles.loading}>Loading metrics...</div>;
  }

  const progressPercentage = campaign.total_contacts > 0
    ? Math.round((campaign.processed_contacts / campaign.total_contacts) * 100)
    : 0;

  const successRate = campaign.processed_contacts > 0
    ? Math.round((campaign.successful_contacts / campaign.processed_contacts) * 100)
    : 0;

  // Status breakdown data for pie chart - using design system colors
  const statusData = [
    { name: 'Pending', value: metrics.memberStatus.pending, color: '#99a1af' }, // gray-400
    { name: 'Processing', value: metrics.memberStatus.processing, color: '#0069e0' }, // action-600
    { name: 'Processed', value: metrics.memberStatus.processed, color: '#089b65' }, // success-700
    { name: 'Failed', value: metrics.memberStatus.failed, color: '#e7000b' }, // error-600
  ].filter(item => item.value > 0);

  // Email performance data for bar chart
  const emailData = [
    { name: 'Sent', value: metrics.email.sent },
    { name: 'Delivered', value: metrics.email.delivered },
    { name: 'Opened', value: metrics.email.opened },
    { name: 'Clicked', value: metrics.email.clicked },
  ];

  // Calculate batch progress
  const dailyLimit = campaign.daily_limit || 500;
  const contactsSentToday = campaign.contacts_sent_today || 0;
  const currentBatch = campaign.current_batch || 0;
  const batchSize = campaign.batch_size || 10;
  const lastBatchTime = campaign.last_batch_sent_at;

  return (
    <div className={styles.overview}>
      {/* Batch Progress Section */}
      {campaign.status === 'running' && (
        <div className={styles.batchProgress}>
          <h3>Current Progress</h3>
          <div className={styles.progressStats}>
            <div className={styles.progressStat}>
              <span className={styles.statLabel}>Today&apos;s Progress:</span>
              <span className={styles.statValue}>
                {contactsSentToday} / {dailyLimit} contacts
              </span>
              <div className={styles.miniProgressBar}>
                <div
                  className={styles.miniProgressFill}
                  style={{ width: `${Math.min((contactsSentToday / dailyLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className={styles.progressStat}>
              <span className={styles.statLabel}>Current Batch:</span>
              <span className={styles.statValue}>Batch #{currentBatch}</span>
            </div>
            <div className={styles.progressStat}>
              <span className={styles.statLabel}>Batch Size:</span>
              <span className={styles.statValue}>{batchSize} contacts</span>
            </div>
            {lastBatchTime && (
              <div className={styles.progressStat}>
                <span className={styles.statLabel}>Last Batch:</span>
                <span className={styles.statValue}>
                  {new Date(lastBatchTime).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.blue}`}>
            <Users size={24} />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Total Contacts</p>
            <p className={styles.metricValue}>{campaign.total_contacts}</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.green}`}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Processed</p>
            <p className={styles.metricValue}>{campaign.processed_contacts}</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.purple}`}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Success Rate</p>
            <p className={styles.metricValue}>{successRate}%</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.yellow}`}>
            <Clock size={24} />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>In Progress</p>
            <p className={styles.metricValue}>{metrics.workflow.running}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <h3>Campaign Progress</h3>
          <span className={styles.progressPercent}>{progressPercentage}%</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className={styles.progressText}>
          {campaign.processed_contacts} of {campaign.total_contacts} contacts processed
        </p>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Status Breakdown */}
        <div className={styles.chartCard}>
          <h3>Contact Status Breakdown</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #d2d2d7',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.noData}>No data available yet</p>
          )}
        </div>

        {/* Email Performance */}
        {metrics.email.sent > 0 && (
          <div className={styles.chartCard}>
            <h3>Email Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={emailData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  stroke="#6a7282"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#6a7282"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #d2d2d7',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="value" fill="#0069e0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className={styles.statsSection}>
        <h3>Detailed Statistics</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <Mail size={20} />
            <div>
              <p className={styles.statLabel}>Emails Sent</p>
              <p className={styles.statValue}>{metrics.email.sent}</p>
            </div>
          </div>
          <div className={styles.statItem}>
            <Mail size={20} />
            <div>
              <p className={styles.statLabel}>Email Open Rate</p>
              <p className={styles.statValue}>
                {metrics.email.sent > 0
                  ? Math.round((metrics.email.opened / metrics.email.sent) * 100)
                  : 0}%
              </p>
            </div>
          </div>
          <div className={styles.statItem}>
            <CheckCircle size={20} />
            <div>
              <p className={styles.statLabel}>Successful Contacts</p>
              <p className={styles.statValue}>{campaign.successful_contacts}</p>
            </div>
          </div>
          <div className={styles.statItem}>
            <TrendingUp size={20} />
            <div>
              <p className={styles.statLabel}>Total Executions</p>
              <p className={styles.statValue}>{metrics.totalExecutions}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
