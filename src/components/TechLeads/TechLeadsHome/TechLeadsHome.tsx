'use client';

import { useRouter } from 'next/navigation';
import styles from './TechLeadsHome.module.scss';

export function TechLeadsHome() {
  const router = useRouter();

  return (
    <div className={styles.container} style={{ minHeight: '100%' }}>
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

      <div className={styles.infoCards}>
        <div className={styles.infoCard}>
          <div className={styles.infoCardIcon}>📸</div>
          <div className={styles.infoCardContent}>
            <h3>Photo Analysis</h3>
            <p>Snap photos on-site and let AI identify pest issues instantly</p>
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardIcon}>🎙️</div>
          <div className={styles.infoCardContent}>
            <h3>Voice Notes</h3>
            <p>Dictate notes hands-free while inspecting the property</p>
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardIcon}>📍</div>
          <div className={styles.infoCardContent}>
            <h3>Nearby Customers</h3>
            <p>Quickly find and link to customers near your current location</p>
          </div>
        </div>
      </div>
    </div>
  );
}
