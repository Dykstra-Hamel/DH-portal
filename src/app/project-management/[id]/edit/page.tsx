'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import ProjectEditPage from '@/components/Projects/ProjectEditPage/ProjectEditPage';
import { Project } from '@/types/project';
import { adminAPI } from '@/lib/api-client';

interface ProjectEditPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectEdit({ params }: ProjectEditPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Unwrap params
  useEffect(() => {
    params.then(p => setProjectId(p.id));
  }, [params]);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!projectId) return;

      console.log('[ProjectEdit] Checking session...');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        console.log('[ProjectEdit] No session, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('[ProjectEdit] User session found:', session.user.id);
      setUser(session.user);

      // Get user profile to check admin status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('[ProjectEdit] Error fetching profile:', profileError);
        router.push('/login');
        return;
      }

      console.log('[ProjectEdit] Profile loaded:', { role: profileData?.role });
      const adminStatus = isAuthorizedAdminSync(profileData);
      setIsAdmin(adminStatus);

      console.log('[ProjectEdit] Admin status:', adminStatus);

      // Redirect non-super-admin users
      if (!adminStatus) {
        console.log('[ProjectEdit] User is not admin, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }

      // Fetch all data in parallel
      console.log('[ProjectEdit] Fetching project and supporting data');
      try {
        const [projectResponse, usersData, companiesData] = await Promise.all([
          fetch(`/api/admin/projects/${projectId}`),
          adminAPI.getUsers(),
          adminAPI.getCompanies(),
        ]);

        if (!projectResponse.ok) {
          if (projectResponse.status === 404) {
            setError('Project not found');
          } else {
            setError('Failed to load project');
          }
          setLoading(false);
          return;
        }

        const projectData = await projectResponse.json();
        console.log('[ProjectEdit] All data loaded successfully');

        setProject(projectData);
        setUsers(usersData || []);
        setCompanies(companiesData || []);
        setError(null);
      } catch (err) {
        console.error('[ProjectEdit] Error fetching data:', err);
        setError('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [projectId, router, supabase]);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading project...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/admin/project-management')}>
          Back to Projects
        </button>
      </div>
    );
  }

  if (!user || !isAdmin || !project) {
    return <div style={{ padding: '2rem' }}>Redirecting...</div>;
  }

  return (
    <ProjectEditPage
      project={project}
      user={user}
      users={users}
      companies={companies}
    />
  );
}
