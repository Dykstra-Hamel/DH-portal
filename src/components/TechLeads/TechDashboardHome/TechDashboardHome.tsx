'use client';

import { useRouter } from 'next/navigation';
import { UserPlus, TrendingUp } from 'lucide-react';
import styles from './TechDashboardHome.module.scss';

export function TechDashboardHome() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.buttonGroup}>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={() =>
            router.push('/field-sales/tech-leads/new?flow=send-lead')
          }
        >
          <span className={styles.actionIcon}>
            <UserPlus size={28} strokeWidth={1.75} />
          </span>
          <span className={styles.actionLabel}>Send Lead</span>
          <span className={styles.actionSub}>New customer opportunity</span>
        </button>

        <button
          type="button"
          className={styles.primaryAction}
          onClick={() =>
            router.push('/field-sales/tech-leads/new?flow=upsell')
          }
        >
          <span className={styles.actionIcon}>
            <TrendingUp size={28} strokeWidth={1.75} />
          </span>
          <span className={styles.actionLabel}>Create Upsell</span>
          <span className={styles.actionSub}>
            Additional service for existing customer
          </span>
        </button>
      </div>
    </div>
  );
}
