'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/lib/api-client';
import { SupportCase } from '@/types/support-case';
import { useCompany } from '@/contexts/CompanyContext';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

export default function SupportCasesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [supportCasesLoading, setSupportCasesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Use global company context
  const { selectedCompany, isAdmin } = useCompany();

  useEffect(() => {
    const supabase = createClient();

    const getSessionAndData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData);
      }

      setLoading(false);
    };

    getSessionAndData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchSupportCases = useCallback(async () => {
    if (!selectedCompany || !user) return;

    setSupportCasesLoading(true);
    try {
      const supportCasesData = await adminAPI.supportCases.list({
        companyId: selectedCompany.id,
      });
      setSupportCases(supportCasesData);
    } catch (error) {
      console.error('Error fetching support cases:', error);
      setSupportCases([]);
    } finally {
      setSupportCasesLoading(false);
    }
  }, [selectedCompany, user]);

  useEffect(() => {
    if (!loading && selectedCompany) {
      fetchSupportCases();
    }
  }, [loading, selectedCompany, fetchSupportCases]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Support Cases</h1>
        <p>Manage customer support cases and track their resolution.</p>
      </div>

      <div className={styles.content}>
        {supportCasesLoading ? (
          <div className={styles.loading}>Loading support cases...</div>
        ) : supportCases.length > 0 ? (
          <div className={styles.supportCasesList}>
            {supportCases.map((supportCase) => (
              <div
                key={supportCase.id}
                className={styles.supportCaseCard}
                onClick={() => router.push(`/connections/support-cases/${supportCase.id}`)}
              >
                <div className={styles.supportCaseHeader}>
                  <span className={styles.supportCaseId}>#{supportCase.id.slice(-8)}</span>
                  <span className={`${styles.statusBadge} ${styles[supportCase.status]}`}>
                    {supportCase.status}
                  </span>
                </div>
                <h3 className={styles.supportCaseTitle}>{supportCase.summary}</h3>
                <p className={styles.supportCaseDescription}>
                  {supportCase.description || 'No description available'}
                </p>
                <div className={styles.supportCaseMeta}>
                  <span>Priority: {supportCase.priority}</span>
                  <span>Created: {new Date(supportCase.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No support cases found.</p>
          </div>
        )}
      </div>
    </div>
  );
}