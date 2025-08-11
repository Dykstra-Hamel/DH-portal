'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GAPageData } from '@/lib/google-analytics/types';
import styles from './Charts.module.scss';

interface PageViewsChartProps {
  data: GAPageData[];
}

export default function PageViewsChart({ data }: PageViewsChartProps) {
  // Take top 10 pages
  const topPages = data.slice(0, 10);
  
  // Format page titles for better display
  const formattedData = topPages.map(item => ({
    ...item,
    displayTitle: item.pageTitle === 'Unknown' || !item.pageTitle
      ? item.pagePath.length > 20 
        ? item.pagePath.substring(0, 20) + '...'
        : item.pagePath
      : item.pageTitle.length > 25
        ? item.pageTitle.substring(0, 25) + '...'
        : item.pageTitle
  }));

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Top Pages</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="displayTitle" 
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
              name === 'pageviews' ? 'Page Views' : 'Unique Page Views'
            ]}
            labelFormatter={(label) => {
              const item = formattedData.find(d => d.displayTitle === label);
              return item ? `Page: ${item.pageTitle || item.pagePath}` : label;
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar 
            dataKey="pageviews" 
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            name="pageviews"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}