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

  // Status breakdown data for pie chart
  const statusData = [
    { name: 'Pending', value: metrics.memberStatus.pending, color: '#94a3b8' },
    { name: 'Processing', value: metrics.memberStatus.processing, color: '#3b82f6' },
    { name: 'Processed', value: metrics.memberStatus.processed, color: '#10b981' },
    { name: 'Failed', value: metrics.memberStatus.failed, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Email performance data for bar chart
  const emailData = [
    { name: 'Sent', value: metrics.email.sent },
    { name: 'Delivered', value: metrics.email.delivered },
    { name: 'Opened', value: metrics.email.opened },
    { name: 'Clicked', value: metrics.email.clicked },
  ];

  return (
    <div className={styles.overview}>
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
                <Tooltip />
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
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
