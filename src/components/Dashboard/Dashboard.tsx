'use client';

import { useState } from 'react';
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard';
import CallAnalyticsDashboard from '@/components/Analytics/CallAnalyticsDashboard';
import { useCompany } from '@/contexts/CompanyContext';
import styles from './Dashboard.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

interface DashboardProps {
  profile: Profile;
}

export default function Dashboard({
  profile,
}: DashboardProps) {
  const [analyticsView, setAnalyticsView] = useState<'website' | 'calls'>('website');
  
  // Use global company context
  const { selectedCompany } = useCompany();

  return (
    <div className={styles.dashboard}>
      <main className={styles.main}>
        {selectedCompany && (
          <div className={styles.analyticsToggle}>
            <div className={styles.toggleContainer}>
              <button
                className={`${styles.toggleButton} ${analyticsView === 'website' ? styles.active : ''}`}
                onClick={() => setAnalyticsView('website')}
              >
                📊 Website Analytics
              </button>
              <button
                className={`${styles.toggleButton} ${analyticsView === 'calls' ? styles.active : ''}`}
                onClick={() => setAnalyticsView('calls')}
              >
                📞 Call Analytics
              </button>
            </div>
          </div>
        )}

        <div className={styles.content}>
          {selectedCompany ? (
            <>
              {analyticsView === 'website' ? (
                <AnalyticsDashboard
                  companyId={selectedCompany.id}
                  companyName={selectedCompany.name}
                  userRole={profile.role}
                />
              ) : (
                <CallAnalyticsDashboard
                  companyId={selectedCompany.id}
                  companyName={selectedCompany.name}
                  userRole={profile.role}
                />
              )}
            </>
          ) : (
            <div className={styles.card}>
              <h3>Select a Company</h3>
              <p>Please select a company to view its analytics dashboard.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
