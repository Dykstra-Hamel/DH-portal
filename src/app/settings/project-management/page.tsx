'use client';

import React from 'react';
import CompanyCategorySettings from '@/components/ProjectManagement/CategorySettings/CompanyCategorySettings';
import styles from './page.module.scss';

export default function CompanyProjectManagementSettingsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Project Management</h1>
        <p className={styles.subtitle}>
          Manage project categories and preferences for your company
        </p>
      </div>

      <div className={styles.content}>
        <CompanyCategorySettings />
      </div>
    </div>
  );
}
