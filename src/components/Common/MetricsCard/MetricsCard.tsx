'use client';

import { useState } from 'react';
import styles from './MetricsCard.module.scss';

const ChartUpIcon = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
    <path d="M16 7.90955H22V13.9095" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 7.90955L13.5 16.4095L8.5 11.4095L2 17.9095" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChartDownIcon = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
    <path d="M16 17.9095H22V11.9095" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 17.9095L13.5 9.40955L8.5 14.4095L2 7.90955" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export interface MetricsCardProps {
  title: string;
  value: number | string;
  comparisonValue: number;
  comparisonPeriod: string;
  trend: 'good' | 'bad';
  type?: 'ticket';
  isLoading?: boolean;
}

export default function MetricsCard({
  title,
  value,
  comparisonValue,
  comparisonPeriod,
  trend,
  type = 'ticket',
  isLoading = false
}: MetricsCardProps) {
  const trendColor = trend === 'good' ? 'var(--sales-good)' : 'var(--sales-bad)';
  const isPositive = comparisonValue > 0;
  
  if (isLoading) {
    return (
      <div className={`${styles.card} ${styles.loading}`}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingTitle}></div>
          <div className={styles.loadingValue}></div>
          <div className={styles.loadingComparison}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>
      
      <div className={styles.content}>
        <div className={styles.valueSection}>
          <span className={styles.value}>{value}</span>
        </div>
        
        <div className={styles.comparisonSection}>
          <div className={styles.comparison}>
            {isPositive ? (
              <ChartUpIcon color={trendColor} />
            ) : (
              <ChartDownIcon color={trendColor} />
            )}
            <span className={styles.comparisonText}>
              {Math.abs(comparisonValue)}% {comparisonPeriod}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}