'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import ProjectDetailWithTasks from '@/components/Projects/ProjectDetailWithTasks/ProjectDetailWithTasks';
import { Project } from '@/types/project';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projectLoading, setProjectLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  // Extract project ID immediately
  useEffect(() => {
    params.then(p => setProjectId(p.id));
  }, [params]);

  // Check auth and admin status (non-blocking for UI)
  useEffect(() => {
    const checkAuth = async () => {
      try {
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
      } catch (err) {
        console.error('[ProjectDetail] Auth error:', err);
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  // Fetch project data (separate from auth check)
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      if (!project) {
        setProjectLoading(true);
      }
      setError(null);

      try {
        const response = await fetch(`/api/admin/projects/${projectId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Project not found');
          } else {
            setError('Failed to load project');
          }
          return;
        }

        const data = await response.json();
        setProject(data);
      } catch (err) {
        console.error('[ProjectDetail] Error fetching project:', err);
        setError('Failed to load project');
      } finally {
        setProjectLoading(false);
      }
    };

    fetchProject();
  }, [projectId, refreshKey]);

  // Subscribe to project updates to keep details in sync without full refreshes
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          if (!payload.new) return;
          setProject((prev) => (prev ? { ...prev, ...(payload.new as Partial<Project>) } : prev));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        () => {
          setProject(null);
          setError('Project not found');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, supabase]);

  const handleProjectUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>Loading...</div>
      </div>
    );
  }

  // Show error state
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

  // Render immediately after auth check, even if project is still loading
  if (!user || !isAdmin) {
    return <div style={{ padding: '2rem' }}>Redirecting...</div>;
  }

  // Render the component with loading state
  return (
    <ProjectDetailWithTasks
      project={project}
      projectLoading={projectLoading}
      user={user}
      onProjectUpdate={handleProjectUpdate}
    />
  );
}
