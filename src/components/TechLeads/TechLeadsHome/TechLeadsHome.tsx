'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Truck } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { TechLeadsNav } from '@/components/TechLeads/TechLeadsNav/TechLeadsNav';
import styles from './TechLeadsHome.module.scss';

interface Stats {
  submitted: number;
  won: number;
  lost: number;
  scheduled: number;
}

function useCountUp(target: number, duration = 800): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (target === 0) {
      setDisplay(0);
      return;
    }
    fromRef.current = 0;
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

interface TechLeadsHomeProps {
  showNav?: boolean;
  newPath?: string;
}

export function TechLeadsHome({ showNav = true, newPath = '/tech-leads/new' }: TechLeadsHomeProps) {
  const router = useRouter();
  const { selectedCompany } = useCompany();
  const [stats, setStats] = useState<Stats>({ submitted: 0, won: 0, lost: 0, scheduled: 0 });

  const submittedDisplay = useCountUp(stats.submitted);
  const wonDisplay = useCountUp(stats.won);
  const scheduledDisplay = useCountUp(stats.scheduled);
  const lostDisplay = useCountUp(stats.lost);

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
          <div className={`${styles.headerIcon} ${selectedCompany?.branding?.icon_logo_url ? styles.headerIconPlain : ''}`}>
            {selectedCompany?.branding?.icon_logo_url ? (
              <Image
                src={selectedCompany.branding.icon_logo_url}
                alt={selectedCompany.name}
                width={175}
                height={175}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <Truck size={32} />
            )}
          </div>
          <h1 className={styles.title}>TechLeads</h1>
          <p className={styles.subtitle}>Capture field opportunities while on-site</p>
        </div>

        <div className={styles.ctaSection}>
          <button
            className={styles.newOpportunityBtn}
            onClick={() => router.push(newPath)}
          >
            <span className={styles.plusIcon}>+</span>
            New Opportunity
          </button>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{submittedDisplay}</span>
            <span className={styles.statLabel}>Submitted</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statNumber} ${styles.statNumberWon}`}>{wonDisplay}</span>
            <span className={styles.statLabel}>Won</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statNumber} ${styles.statNumberScheduled}`}>{scheduledDisplay}</span>
            <span className={styles.statLabel}>Scheduled</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statNumber} ${styles.statNumberLost}`}>{lostDisplay}</span>
            <span className={styles.statLabel}>Lost</span>
          </div>
        </div>
      </div>
      {showNav && <TechLeadsNav />}
    </>
  );
}
