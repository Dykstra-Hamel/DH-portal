'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
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
  user: User;
  profile: Profile;
}

export default function Dashboard({
  user,
  profile,
}: DashboardProps) {
  const router = useRouter();
  const [analyticsView, setAnalyticsView] = useState<'website' | 'calls'>('website');
  
  // Use global company context
  const { selectedCompany, availableCompanies, isAdmin } = useCompany();

  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      router.push('/login');
    }
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Dashboard</h1>
          <div className={styles.headerActions}>
            {profile.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className={styles.adminButton}
              >
                Admin Dashboard
              </button>
            )}
            <button onClick={handleSignOut} className={styles.signOutButton}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeSection}>
          <h2 className={styles.welcome}>
            Welcome,{' '}
            {profile.first_name || user.user_metadata?.first_name || 'User'}!
          </h2>

          {selectedCompany && (
            <div className={styles.companySection}>
              <div className={styles.singleCompany}>
                <span className={styles.companyName}>
                  {selectedCompany.name}
                </span>
              </div>
            </div>
          )}

          {!selectedCompany && availableCompanies.length === 0 && (
            <div className={styles.noCompany}>
              <p>No companies associated with your account.</p>
            </div>
          )}

          {!selectedCompany && availableCompanies.length > 0 && (
            <div className={styles.noCompany}>
              <p>Please select a company from the header to view analytics.</p>
            </div>
          )}
        </div>

        {/* Analytics View Toggle */}
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
