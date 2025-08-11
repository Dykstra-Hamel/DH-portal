'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GATrafficData } from '@/lib/google-analytics/types';
import styles from './Charts.module.scss';

interface TrafficChartProps {
  data: GATrafficData[];
}

export default function TrafficChart({ data }: TrafficChartProps) {
  // Format date for display
  const formattedData = data.map(item => {
    // Handle date format from GA4 API (YYYYMMDD)
    let dateObj;
    if (item.date.length === 8) {
      // Format: YYYYMMDD
      const year = item.date.substring(0, 4);
      const month = item.date.substring(4, 6);
      const day = item.date.substring(6, 8);
      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      dateObj = new Date(item.date);
    }
    
    return {
      ...item,
      displayDate: dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    };
  });

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Website Traffic (Last {data.length} Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="displayDate" 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
          />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [
              typeof value === 'number' ? value.toLocaleString() : value,
              name === 'sessions' ? 'Sessions' :
              name === 'pageviews' ? 'Page Views' :
              name === 'users' ? 'Users' : name
            ]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="sessions" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="sessions"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="pageviews" 
            stroke="#10b981" 
            strokeWidth={2}
            name="pageviews"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="users" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            name="users"
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}