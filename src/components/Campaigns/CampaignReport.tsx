'use client';

import { useState } from 'react';
import { Mail, TrendingUp, AlertTriangle, CheckCircle, XCircle, RefreshCw, Download, Printer, Eye } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import styles from './CampaignReport.module.scss';

interface CampaignReportProps {
  campaign: any;
  metrics: any;
  onRefresh?: () => Promise<void>;
}

export default function CampaignReport({ campaign, metrics, onRefresh }: CampaignReportProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!metrics || !metrics.email) {
    return <div className={styles.loading}>Loading metrics...</div>;
  }

  const emailMetrics = metrics.email;

  // Calculate delivery rate
  const deliveryRate = emailMetrics.sent > 0
    ? ((emailMetrics.delivered / emailMetrics.sent) * 100).toFixed(1)
    : '0.0';

  // Helper function to get color indicator class based on rate
  const getRateColorClass = (rate: number, type: 'positive' | 'negative' = 'positive') => {
    if (type === 'positive') {
      // For positive metrics (open, click, delivery)
      if (rate >= 20) return styles.success;
      if (rate >= 10) return styles.warning;
      return styles.error;
    } else {
      // For negative metrics (bounce, complaint)
      if (rate < 5) return styles.success;
      if (rate < 10) return styles.warning;
      return styles.error;
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `campaign-${campaign.id}-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate CSV content
  const generateCSV = () => {
    const rows = [
      ['Campaign Email Report'],
      ['Campaign Name', campaign.name || campaign.id],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Metric', 'Count', 'Percentage'],
      ['Total Sent', emailMetrics.sent, '100%'],
      ['Delivered', emailMetrics.delivered, deliveryRate + '%'],
      ['Opened', emailMetrics.opened, emailMetrics.open_rate != null ? `${emailMetrics.open_rate.toFixed(1)}%` : 'N/A'],
      ['Clicked', emailMetrics.clicked, emailMetrics.click_rate != null ? `${emailMetrics.click_rate.toFixed(1)}%` : 'N/A'],
      ['Click-Through Rate', emailMetrics.clicked, emailMetrics.click_through_rate != null ? `${emailMetrics.click_through_rate.toFixed(1)}%` : 'N/A'],
      ['Bounced', emailMetrics.bounced, emailMetrics.bounce_rate != null ? `${emailMetrics.bounce_rate.toFixed(1)}%` : 'N/A'],
      ['Hard Bounces', emailMetrics.hard_bounces, emailMetrics.bounced > 0 ? `${((emailMetrics.hard_bounces / emailMetrics.bounced) * 100).toFixed(1)}%` : '0.0%'],
      ['Soft Bounces', emailMetrics.soft_bounces, emailMetrics.bounced > 0 ? `${((emailMetrics.soft_bounces / emailMetrics.bounced) * 100).toFixed(1)}%` : '0.0%'],
      ['Complained', emailMetrics.complained, emailMetrics.complaint_rate != null ? `${emailMetrics.complaint_rate.toFixed(1)}%` : 'N/A'],
      ['Failed', emailMetrics.failed, emailMetrics.sent > 0 ? `${((emailMetrics.failed / emailMetrics.sent) * 100).toFixed(1)}%` : 'N/A'],
      [''],
      ['Landing Page Views'],
      ['Total Views', metrics.views?.total_views || 0, ''],
      ['Unique Viewers', metrics.views?.unique_viewers || 0, ''],
      ['Total Redeemed', metrics.views?.total_redeemed || 0, ''],
      ['Viewed Not Redeemed', metrics.views?.viewed_not_redeemed || 0, ''],
      ['View to Redemption Rate', '', metrics.views?.view_to_redemption_rate != null ? `${metrics.views.view_to_redemption_rate}%` : 'N/A'],
    ];

    return rows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Email funnel data
  const funnelData = [
    { name: 'Sent', value: emailMetrics.sent, fill: '#0069e0' },
    { name: 'Delivered', value: emailMetrics.delivered, fill: '#089b65' },
    { name: 'Opened', value: emailMetrics.opened, fill: '#0891b2' },
    { name: 'Clicked', value: emailMetrics.clicked, fill: '#8b5cf6' },
  ];

  // Engagement breakdown data
  const engagementData = [
    { name: 'Clicked', value: emailMetrics.clicked, color: '#8b5cf6' },
    { name: 'Opened (not clicked)', value: emailMetrics.opened - emailMetrics.clicked, color: '#0891b2' },
    { name: 'Delivered (not opened)', value: emailMetrics.delivered - emailMetrics.opened, color: '#089b65' },
    { name: 'Failed/Bounced', value: emailMetrics.bounced + emailMetrics.failed, color: '#e7000b' },
  ].filter(item => item.value > 0);

  // Bounce analysis data
  const bounceData = [
    { name: 'Hard Bounces', value: emailMetrics.hard_bounces, color: '#e7000b' },
    { name: 'Soft Bounces', value: emailMetrics.soft_bounces, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  // Landing page view metrics
  const viewMetrics = metrics.views || {
    total_views: 0,
    unique_viewers: 0,
    total_redeemed: 0,
    viewed_not_redeemed: 0,
    view_to_redemption_rate: 0,
  };

  // View time-series data (last 30 days)
  const viewTimeSeriesData = metrics.viewsByDate
    ? Object.entries(metrics.viewsByDate).map(([date, count]) => {
        // Parse YYYY-MM-DD without timezone conversion
        const [year, month, day] = date.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedDate = `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;

        return {
          date: formattedDate,
          views: count,
        };
      })
    : [];

  return (
    <div className={styles.report}>
      {/* Report Header */}
      <div className={styles.reportHeader}>
        <div className={styles.headerInfo}>
          <h2>{campaign.name || `Campaign ${campaign.id}`}</h2>
          <p className={styles.headerMeta}>
            Generated on {new Date().toLocaleString()}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || !onRefresh}
            className={styles.actionButton}
            title="Refresh metrics"
          >
            <RefreshCw size={16} className={isRefreshing ? styles.spinning : ''} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className={styles.actionButton}
            title="Export to CSV"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className={styles.actionButton}
            title="Print report"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {/* Total Sent */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.blue}`}>
            <Mail size={20} />
          </div>
          <div className={styles.kpiContent}>
            <p className={styles.kpiValue}>{emailMetrics.sent.toLocaleString()}</p>
            <p className={styles.kpiLabel}>Total Sent</p>
          </div>
        </div>

        {/* Delivery Rate */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${getRateColorClass(parseFloat(deliveryRate))}`}>
            <CheckCircle size={20} />
          </div>
          <div className={styles.kpiContent}>
            <p className={styles.kpiValue}>{emailMetrics.delivered.toLocaleString()}</p>
            <p className={styles.kpiLabel}>Delivered</p>
            <p className={`${styles.kpiPercent} ${getRateColorClass(parseFloat(deliveryRate))}`}>
              {deliveryRate}%
            </p>
          </div>
        </div>

        {/* Open Rate */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${getRateColorClass(emailMetrics.open_rate)}`}>
            <TrendingUp size={20} />
          </div>
          <div className={styles.kpiContent}>
            <p className={styles.kpiValue}>{emailMetrics.opened.toLocaleString()}</p>
            <p className={styles.kpiLabel}>Opened</p>
            <p className={`${styles.kpiPercent} ${getRateColorClass(emailMetrics.open_rate)}`}>
              {emailMetrics.open_rate != null ? `${emailMetrics.open_rate.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Click Rate */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${getRateColorClass(emailMetrics.click_rate)}`}>
            <TrendingUp size={20} />
          </div>
          <div className={styles.kpiContent}>
            <p className={styles.kpiValue}>{emailMetrics.clicked.toLocaleString()}</p>
            <p className={styles.kpiLabel}>Clicked</p>
            <p className={`${styles.kpiPercent} ${getRateColorClass(emailMetrics.click_rate)}`}>
              {emailMetrics.click_rate != null ? `${emailMetrics.click_rate.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Bounce Rate */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${getRateColorClass(emailMetrics.bounce_rate, 'negative')}`}>
            <AlertTriangle size={20} />
          </div>
          <div className={styles.kpiContent}>
            <p className={styles.kpiValue}>{emailMetrics.bounced.toLocaleString()}</p>
            <p className={styles.kpiLabel}>Bounced</p>
            <p className={`${styles.kpiPercent} ${getRateColorClass(emailMetrics.bounce_rate, 'negative')}`}>
              {emailMetrics.bounce_rate != null ? `${emailMetrics.bounce_rate.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Complaint Rate */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${getRateColorClass(emailMetrics.complaint_rate, 'negative')}`}>
            <XCircle size={20} />
          </div>
          <div className={styles.kpiContent}>
            <p className={styles.kpiValue}>{emailMetrics.complained.toLocaleString()}</p>
            <p className={styles.kpiLabel}>Complained</p>
            <p className={`${styles.kpiPercent} ${getRateColorClass(emailMetrics.complaint_rate, 'negative')}`}>
              {emailMetrics.complaint_rate != null ? `${emailMetrics.complaint_rate.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Landing Page Views */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.purple}`}>
            <Eye size={20} />
          </div>
          <div className={styles.kpiContent}>
            <p className={styles.kpiValue}>{viewMetrics.unique_viewers.toLocaleString()}</p>
            <p className={styles.kpiLabel}>Landing Page Views</p>
            <p className={styles.kpiPercent}>
              {viewMetrics.total_views.toLocaleString()} total
            </p>
          </div>
        </div>

        {/* View to Redemption Rate */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${getRateColorClass(viewMetrics.view_to_redemption_rate)}`}>
            <TrendingUp size={20} />
          </div>
          <div className={styles.kpiContent}>
            <p className={styles.kpiValue}>{viewMetrics.total_redeemed.toLocaleString()}</p>
            <p className={styles.kpiLabel}>Redeemed</p>
            <p className={`${styles.kpiPercent} ${getRateColorClass(viewMetrics.view_to_redemption_rate)}`}>
              {viewMetrics.view_to_redemption_rate}% conversion
            </p>
          </div>
        </div>
      </div>

      {/* Email Funnel Chart */}
      <div className={styles.chartSection}>
        <h3 className={styles.sectionTitle}>Email Delivery Funnel</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Emails" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Landing Page Views Chart */}
      {viewTimeSeriesData.length > 0 && (
        <div className={styles.chartSection}>
          <h3 className={styles.sectionTitle}>Landing Page Views (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={viewTimeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="views"
                name="Page Views"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Engagement Breakdown */}
        <div className={styles.chartSection}>
          <h3 className={styles.sectionTitle}>Engagement Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={engagementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {engagementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bounce Analysis */}
        {bounceData.length > 0 && (
          <div className={styles.chartSection}>
            <h3 className={styles.sectionTitle}>Bounce Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bounceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bounceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Metrics Table */}
      <div className={styles.tableSection}>
        <h3 className={styles.sectionTitle}>Detailed Metrics</h3>
        <table className={styles.metricsTable}>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles.categoryRow}>
              <td colSpan={3}><strong>Delivery Metrics</strong></td>
            </tr>
            <tr>
              <td>Total Sent</td>
              <td>{emailMetrics.sent.toLocaleString()}</td>
              <td>100%</td>
            </tr>
            <tr>
              <td>Delivered</td>
              <td>{emailMetrics.delivered.toLocaleString()}</td>
              <td>{deliveryRate}%</td>
            </tr>
            <tr>
              <td>Failed</td>
              <td>{emailMetrics.failed.toLocaleString()}</td>
              <td>{emailMetrics.sent > 0 ? `${((emailMetrics.failed / emailMetrics.sent) * 100).toFixed(1)}%` : 'N/A'}</td>
            </tr>

            <tr className={styles.categoryRow}>
              <td colSpan={3}><strong>Engagement Metrics</strong></td>
            </tr>
            <tr>
              <td>Opened</td>
              <td>{emailMetrics.opened.toLocaleString()}</td>
              <td>{emailMetrics.open_rate != null ? `${emailMetrics.open_rate.toFixed(1)}%` : 'N/A'}</td>
            </tr>
            <tr>
              <td>Clicked</td>
              <td>{emailMetrics.clicked.toLocaleString()}</td>
              <td>{emailMetrics.click_rate != null ? `${emailMetrics.click_rate.toFixed(1)}%` : 'N/A'}</td>
            </tr>
            <tr>
              <td>Click-Through Rate (CTR)</td>
              <td>{emailMetrics.clicked.toLocaleString()}</td>
              <td>{emailMetrics.click_through_rate != null ? `${emailMetrics.click_through_rate.toFixed(1)}%` : 'N/A'}</td>
            </tr>

            <tr className={styles.categoryRow}>
              <td colSpan={3}><strong>Issues</strong></td>
            </tr>
            <tr>
              <td>Total Bounced</td>
              <td>{emailMetrics.bounced.toLocaleString()}</td>
              <td>{emailMetrics.bounce_rate != null ? `${emailMetrics.bounce_rate.toFixed(1)}%` : 'N/A'}</td>
            </tr>
            <tr>
              <td>&nbsp;&nbsp;Hard Bounces</td>
              <td>{emailMetrics.hard_bounces.toLocaleString()}</td>
              <td>{emailMetrics.bounced > 0 ? `${((emailMetrics.hard_bounces / emailMetrics.bounced) * 100).toFixed(1)}%` : '0.0%'}</td>
            </tr>
            <tr>
              <td>&nbsp;&nbsp;Soft Bounces</td>
              <td>{emailMetrics.soft_bounces.toLocaleString()}</td>
              <td>{emailMetrics.bounced > 0 ? `${((emailMetrics.soft_bounces / emailMetrics.bounced) * 100).toFixed(1)}%` : '0.0%'}</td>
            </tr>
            <tr>
              <td>Complained</td>
              <td>{emailMetrics.complained.toLocaleString()}</td>
              <td>{emailMetrics.complaint_rate != null ? `${emailMetrics.complaint_rate.toFixed(1)}%` : 'N/A'}</td>
            </tr>

            <tr className={styles.categoryRow}>
              <td colSpan={3}><strong>Landing Page Views</strong></td>
            </tr>
            <tr>
              <td>Total Views</td>
              <td>{viewMetrics.total_views.toLocaleString()}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Unique Viewers</td>
              <td>{viewMetrics.unique_viewers.toLocaleString()}</td>
              <td>{emailMetrics.sent > 0 ? `${((viewMetrics.unique_viewers / emailMetrics.sent) * 100).toFixed(1)}%` : 'N/A'}</td>
            </tr>
            <tr>
              <td>Total Redeemed</td>
              <td>{viewMetrics.total_redeemed.toLocaleString()}</td>
              <td>{emailMetrics.sent > 0 ? `${((viewMetrics.total_redeemed / emailMetrics.sent) * 100).toFixed(1)}%` : 'N/A'}</td>
            </tr>
            <tr>
              <td>Viewed Not Redeemed</td>
              <td>{viewMetrics.viewed_not_redeemed.toLocaleString()}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>View to Redemption Rate</td>
              <td>-</td>
              <td>{viewMetrics.view_to_redemption_rate}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
