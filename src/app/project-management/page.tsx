'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import ProjectsManager from '@/components/Admin/ProjectsManager';

export default function ProjectManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      console.log('[ProjectManagement] Checking session...');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        console.log('[ProjectManagement] No session, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('[ProjectManagement] User session found:', session.user.id);
      setUser(session.user);

      // Get user profile to check admin status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('[ProjectManagement] Error fetching profile:', profileError);
        router.push('/login');
        return;
      }

      console.log('[ProjectManagement] Profile loaded:', { role: profileData?.role });
      setProfile(profileData);
      const adminStatus = isAuthorizedAdminSync(profileData);
      setIsAdmin(adminStatus);

      console.log('[ProjectManagement] Admin status:', adminStatus);

      // Redirect non-super-admin users away from project management page
      if (!adminStatus) {
        console.log('[ProjectManagement] User is not admin, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }

      console.log('[ProjectManagement] Loading complete, rendering ProjectsManager');
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !profile || !isAdmin) {
    return <div>Redirecting...</div>;
  }

  return <ProjectsManager user={user} />;
}
