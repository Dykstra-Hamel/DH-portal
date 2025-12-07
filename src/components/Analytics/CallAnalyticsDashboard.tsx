'use client';

import { useState, useEffect, useCallback } from 'react';
import { CallRailCall } from '@/lib/callrail/client';
import { 
  CallAnalytics, 
  CallVolumeData, 
  CallSourceData, 
  CallStatusData,
  formatDuration,
  formatPhoneNumber 
} from '@/lib/callrail/types';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import styles from './AnalyticsDashboard.module.scss';

interface CallAnalyticsDashboardProps {
  companyId: string;
  companyName: string;
  userRole?: string;
}

interface CallAnalyticsResponse {
  analytics: CallAnalytics;
  volumeData: CallVolumeData[];
  sourceData: CallSourceData[];
  statusData: CallStatusData[];
  recentCalls: CallRailCall[];
  account: {
    id: string;
    name: string;
  };
}

const STATUS_COLORS = {
  'Answered': '#10b981',
  'Voicemail': '#f59e0b', 
  'Missed': '#ef4444'
};

export default function CallAnalyticsDashboard({ 
  companyId, 
  companyName, 
  userRole 
}: CallAnalyticsDashboardProps) {
  const [callData, setCallData] = useState<CallAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  
  // Removed date filter - using default 30 days
  const [selectedCall, setSelectedCall] = useState<CallRailCall | null>(null);

  const fetchCallData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const days = 30; // Default to 30 days if "All Time" is selected
    
    try {
      const response = await fetch(`/api/callrail/calls?companyId=${companyId}&days=${days}`);
      const result = await response.json();

      if (!response.ok) {
        if (result.configured === false) {
          setConfigured(false);
        }
        throw new Error(result.error || 'Failed to fetch call data');
      }

      setCallData(result.data);
      setConfigured(result.configured);
    } catch (err) {
      console.error('CallRail fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [companyId, ]);

  useEffect(() => {
    if (companyId) {
      fetchCallData();
    }
  }, [companyId, fetchCallData]);

  if (loading) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading call analytics...</p>
        </div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.notConfigured}>
          <div className={styles.notConfiguredIcon}>📞</div>
          <h3>CallRail Not Configured</h3>
          <p>
            CallRail has not been configured for <strong>{companyName}</strong>.
            Please contact your administrator to set up call tracking.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>Call Analytics Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => fetchCallData()}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!callData) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.noData}>
          <div className={styles.noDataIcon}>📞</div>
          <h3>No Call Data Available</h3>
          <p>No call data available for the selected period.</p>
        </div>
      </div>
    );
  }

  const { analytics, volumeData, sourceData, statusData, recentCalls, account } = callData;

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.analyticsHeader}>
        <div>
          <h2 className={styles.title}>📞 Call Analytics Dashboard</h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
            CallRail Account: {account.name}
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className={styles.metricsCards}>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {analytics.totalCalls.toLocaleString()}
          </div>
          <div className={styles.metricLabel}>Total Calls</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {analytics.answeredCalls.toLocaleString()}
          </div>
          <div className={styles.metricLabel}>Answered Calls</div>
          <div className={styles.metricGrowth + ' ' + styles.positive}>
            {analytics.conversionRate.toFixed(1)}% answer rate
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {formatDuration(Math.round(analytics.averageDuration))}
          </div>
          <div className={styles.metricLabel}>Avg Duration</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            ${analytics.totalValue.toFixed(0)}
          </div>
          <div className={styles.metricLabel}>Total Value</div>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        {/* Call Volume Chart */}
        <div className={styles.chartRow}>
          <div className={styles.fullWidthChart}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                Call Volume Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="calls" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    name="Total Calls"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="answered" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="Answered"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Call Status Pie Chart */}
        <div className={styles.chartRow}>
          <div className={styles.fullWidthChart}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                Call Status Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData as any[]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="calls"
                    nameKey="status"
                  >
                    {statusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#64748b'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} calls (${statusData.find(s => s.status === name)?.percentage}%)`, 
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
                {statusData.map((entry) => (
                  <div key={entry.status} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <div 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        backgroundColor: STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#64748b' 
                      }}
                    />
                    <span style={{ color: '#64748b' }}>
                      {entry.status}: {entry.calls} ({entry.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Calls Table */}
        <div className={styles.chartRow}>
          <div className={styles.fullWidthChart}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                Recent Calls
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Caller</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Duration</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Recording</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCalls.slice(0, 10).map((call) => (
                      <tr key={call.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 8px', fontSize: '14px', color: '#1e293b' }}>
                          {new Date(call.start_time).toLocaleDateString()} {' '}
                          {new Date(call.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '12px 8px', fontSize: '14px', color: '#1e293b' }}>
                          <div>
                            {call.customer_name || formatPhoneNumber(call.customer_phone_number)}
                          </div>
                          {call.customer_name && (
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {formatPhoneNumber(call.customer_phone_number)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 8px', fontSize: '14px', color: '#1e293b' }}>
                          {formatDuration(call.duration)}
                        </td>
                        <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                          <span 
                            style={{ 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '12px', 
                              fontWeight: '500',
                              backgroundColor: call.answered ? '#dcfce7' : call.voicemail ? '#fef3c7' : '#fee2e2',
                              color: call.answered ? '#16a34a' : call.voicemail ? '#d97706' : '#dc2626'
                            }}
                          >
                            {call.answered ? 'Answered' : call.voicemail ? 'Voicemail' : 'Missed'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {call.recording ? (
                            <button 
                              onClick={() => {
                                setSelectedCall(call);
                              }}
                              style={{
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              ▶ Play
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>No recording</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Recording Modal */}
      {selectedCall && selectedCall.recording && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedCall(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                Call Recording
              </h3>
              <button
                onClick={() => setSelectedCall(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
              <div><strong>Date:</strong> {new Date(selectedCall.start_time).toLocaleString()}</div>
              <div><strong>Caller:</strong> {selectedCall.customer_name || formatPhoneNumber(selectedCall.customer_phone_number)}</div>
              <div><strong>Duration:</strong> {formatDuration(selectedCall.duration)}</div>
            </div>
            
            <AudioPlayer
              src={`/api/callrail/audio?url=${encodeURIComponent(selectedCall.recording)}&companyId=${companyId}`}
              title={`Call Recording - ${selectedCall.customer_name || selectedCall.customer_phone_number}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}