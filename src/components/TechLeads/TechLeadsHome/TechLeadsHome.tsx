'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompany } from '@/contexts/CompanyContext';
import { TechLeadsNav } from '@/components/TechLeads/TechLeadsNav/TechLeadsNav';
import styles from './TechLeadsHome.module.scss';

interface Stats {
  submitted: number;
  won: number;
}

export function TechLeadsHome() {
  const router = useRouter();
  const { selectedCompany } = useCompany();
  const [stats, setStats] = useState<Stats>({ submitted: 0, won: 0 });

  useEffect(() => {
    if (!selectedCompany?.id) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/tech-leads/stats?companyId=${selectedCompany.id}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silently fail — stats are non-critical
      }
    };

    fetchStats();
  }, [selectedCompany?.id]);

  return (
    <>
      <div className={styles.container} style={{ minHeight: '100%', paddingBottom: '80px' }}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className={styles.title}>TechLeads</h1>
          <p className={styles.subtitle}>Capture field opportunities while on-site</p>
        </div>

        <div className={styles.ctaSection}>
          <button
            className={styles.newOpportunityBtn}
            onClick={() => router.push('/tech-leads/new')}
          >
            <span className={styles.plusIcon}>+</span>
            New Opportunity
          </button>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{stats.submitted}</span>
            <span className={styles.statLabel}>Submitted</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{stats.won}</span>
            <span className={styles.statLabel}>Won</span>
          </div>
        </div>
      </div>
      <TechLeadsNav />
    </>
  );
}
