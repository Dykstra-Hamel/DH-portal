'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GASourceData } from '@/lib/google-analytics/types';
import styles from './Charts.module.scss';

interface SourceChartProps {
  data: GASourceData[];
}

export default function SourceChart({ data }: SourceChartProps) {
  // Take top 8 sources and group others
  const topSources = data.slice(0, 8);
  const otherSources = data.slice(8);
  
  const chartData = [...topSources];
  
  if (otherSources.length > 0) {
    const otherTotal = otherSources.reduce((sum, item) => sum + item.sessions, 0);
    const otherPercentage = otherSources.reduce((sum, item) => sum + item.percentage, 0);
    
    chartData.push({
      source: 'Others',
      sessions: otherTotal,
      percentage: otherPercentage
    });
  }

  // Format source names for better display
  const formattedData = chartData.map(item => ({
    ...item,
    displaySource: item.source.length > 15 
      ? item.source.substring(0, 15) + '...' 
      : item.source
  }));

  if (data.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>Traffic Sources</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '300px', 
          color: '#6b7280',
          fontSize: '14px'
        }}>
          No traffic source data available
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Traffic Sources ({data.length} sources)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="displaySource" 
            tick={{ fontSize: 10 }}
            stroke="#64748b"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
          />
          <Tooltip 
            formatter={(value, name) => [
              typeof value === 'number' ? value.toLocaleString() : value,
              'Sessions'
            ]}
            labelFormatter={(label) => `Source: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar 
            dataKey="sessions" 
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}