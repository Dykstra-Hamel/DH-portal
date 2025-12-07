'use client';

import { AIProvider } from '@/contexts/AIContext';
import PestPressureDashboard from '@/components/AI/PestPressure/PestPressureDashboard';
import styles from './page.module.scss';

export default function PestPressurePage() {
  return (
    <AIProvider>
      <div className={styles.pageContainer}>
        <PestPressureDashboard autoLoad={true} showFilters={true} />
      </div>
    </AIProvider>
  );
}
