'use client';

import React from 'react';
import Image from 'next/image';
import styles from './MonthlyServicesTable.module.scss';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
}

interface WeekProgress {
  week: number;
  completed: number;
  total: number;
  percentage: number;
}

interface MonthlyService {
  id: string;
  service_name: string;
  description: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  company_id: string;
  companies: Company;
  weekProgress: WeekProgress[];
}

interface MonthlyServicesTableProps {
  services: MonthlyService[];
  month: string;
  onServiceClick?: (serviceId: string) => void;
}

export function MonthlyServicesTable({
  services,
  month,
  onServiceClick,
}: MonthlyServicesTableProps) {
  // Format month display (e.g., "January 2024")
  const formatMonth = (monthStr: string) => {
    // Parse month string as YYYY-MM
    const [year, month] = monthStr.split('-').map(Number);
    // Create date in local timezone (month is 0-indexed, so subtract 1)
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Calculate date range for the month
  const getDateRange = (monthStr: string) => {
    // Parse month string as YYYY-MM
    const [year, month] = monthStr.split('-').map(Number);

    // Create dates in local timezone
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Day 0 = last day of previous month (which is our target month)

    const formatDate = (date: Date) => {
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Get progress bar color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return '#E5E7EB'; // Gray
    if (percentage === 100) return '#10B981'; // Green
    return '#3B82F6'; // Blue for partial
  };

  const handleRowClick = (serviceId: string) => {
    if (onServiceClick) {
      onServiceClick(serviceId);
    }
  };

  if (services.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No active monthly services found.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.companyColumn}>Company</th>
            <th className={styles.monthColumn}>Month</th>
            <th className={styles.dateColumn}>Complete During</th>
            <th className={styles.weekColumn}>Week 1</th>
            <th className={styles.weekColumn}>Week 2</th>
            <th className={styles.weekColumn}>Week 3</th>
            <th className={styles.weekColumn}>Week 4</th>
          </tr>
        </thead>
        <tbody>
          {services.map(service => (
            <tr
              key={service.id}
              className={styles.row}
              onClick={() => handleRowClick(service.id)}
            >
              {/* Company */}
              <td className={styles.companyCell}>
                <div className={styles.companyInfo}>
                  {service.companies.logo_url ? (
                    <Image
                      src={service.companies.logo_url}
                      alt={service.companies.name}
                      width={32}
                      height={32}
                      className={styles.logo}
                    />
                  ) : (
                    <div className={styles.logoPlaceholder}>
                      {service.companies.name.charAt(0)}
                    </div>
                  )}
                  <span className={styles.companyName}>
                    {service.companies.name}
                  </span>
                </div>
              </td>

              {/* Status */}
              <td className={styles.statusCell}>
                <span className={styles.status}>{formatMonth(month)}</span>
              </td>

              {/* Date Range */}
              <td className={styles.dateCell}>
                <span className={styles.dateRange}>{getDateRange(month)}</span>
              </td>

              {/* Week Progress Columns */}
              {service.weekProgress.map(weekData => (
                <td key={weekData.week} className={styles.weekCell}>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressText}>
                      <span className={styles.progressFraction}>
                        {weekData.completed} of {weekData.total}
                      </span>
                      <span className={styles.progressPercentage}>
                        {weekData.percentage}%
                      </span>
                    </div>
                    <div className={styles.progressBarContainer}>
                      <div
                        className={styles.progressBar}
                        style={{
                          width: `${weekData.percentage}%`,
                          backgroundColor: getProgressColor(
                            weekData.percentage
                          ),
                        }}
                      />
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
