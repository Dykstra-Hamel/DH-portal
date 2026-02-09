'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import { MonthlyServiceDetail } from '@/components/MonthlyServices/MonthlyServiceDetail/MonthlyServiceDetail';

interface MonthlyServiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MonthlyServiceDetailPage({ params }: MonthlyServiceDetailPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [service, setService] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    params.then(p => setServiceId(p.id));
  }, [params]);

  useEffect(() => {
    const checkAuthAndFetchService = async () => {
      if (!serviceId) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        router.push('/login');
        return;
      }

      const adminStatus = isAuthorizedAdminSync(profileData);
      setIsAdmin(adminStatus);

      if (!adminStatus) {
        router.push('/dashboard');
        return;
      }

      try {
        // Get auth headers for API call
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (currentSession?.access_token) {
          headers['Authorization'] = `Bearer ${currentSession.access_token}`;
        }

        const response = await fetch(`/api/admin/monthly-services/${serviceId}`, { headers });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Service not found');
          } else {
            setError('Failed to load service');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setService(data.service);
        setError(null);
      } catch (err) {
        console.error('[MonthlyServiceDetail] Error fetching service:', err);
        setError('Failed to load service');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchService();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [serviceId, router, supabase, refreshKey]);

  const handleServiceUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading service...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/admin/monthly-services')}>
          Back to Monthly Services
        </button>
      </div>
    );
  }

  if (!user || !isAdmin || !service) {
    return <div style={{ padding: '2rem' }}>Redirecting...</div>;
  }

  return (
    <MonthlyServiceDetail
      service={service}
      user={user}
      onServiceUpdate={handleServiceUpdate}
    />
  );
}
