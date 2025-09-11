'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import SMSTestManager from '@/components/Admin/SMSTestManager';

export default function SMSTestPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Get user profile to check admin status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        router.push('/login');
        return;
      }

      setProfile(profileData);
      const adminStatus = isAuthorizedAdminSync(profileData);
      setIsAdmin(adminStatus);

      // Redirect non-admin users away from SMS test page
      if (!adminStatus) {
        router.push('/');
        return;
      }

      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        color: '#6b7280'
      }}>
        Loading SMS test interface...
      </div>
    );
  }

  if (!user || !profile || !isAdmin) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        color: '#6b7280'
      }}>
        Redirecting to login...
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '2rem' 
    }}>
      <div style={{ 
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 0.5rem 0'
        }}>
          SMS Testing Interface
        </h1>
        <p style={{
          color: '#64748b',
          fontSize: '1rem',
          margin: '0'
        }}>
          Test SMS functionality with custom messages and configurations
        </p>
      </div>
      
      <SMSTestManager />
    </div>
  );
}