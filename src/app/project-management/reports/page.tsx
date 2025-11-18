'use client';

import React from 'react';
import styles from '../projectManagement.module.scss';

export default function ReportsPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Reports</h1>
      </div>
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        <p>Analytics and reporting dashboard coming soon...</p>
        <p style={{ marginTop: '12px', fontSize: '14px' }}>
          This will include project completion rates, task velocity charts, time tracking, and exportable reports.
        </p>
      </div>
    </div>
  );
}
