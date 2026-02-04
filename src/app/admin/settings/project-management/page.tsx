'use client';

import React from 'react';
import InternalCategorySettings from '@/components/ProjectManagement/CategorySettings/InternalCategorySettings';
import InternalDepartmentSettings from '@/components/ProjectManagement/DepartmentSettings/InternalDepartmentSettings';
import styles from './page.module.scss';

export default function AdminProjectManagementSettingsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Project Management Settings</h1>
        <p className={styles.subtitle}>
          Manage internal project categories, departments, and default settings for the agency
        </p>
      </div>

      <div className={styles.content}>
        <InternalDepartmentSettings />
        <InternalCategorySettings />
      </div>
    </div>
  );
}
