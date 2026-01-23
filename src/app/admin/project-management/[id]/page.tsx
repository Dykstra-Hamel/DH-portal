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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    params.then(p => setProjectId(p.id));
  }, [params]);

  useEffect(() => {
    const checkAuthAndFetchProject = async () => {
      if (!projectId) return;

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
        const response = await fetch(`/api/admin/projects/${projectId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Project not found');
          } else {
            setError('Failed to load project');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setProject(data);
        setError(null);
      } catch (err) {
        console.error('[ProjectDetail] Error fetching project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchProject();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [projectId, router, supabase, refreshKey]);

  const handleProjectUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

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
    <ProjectDetailWithTasks
      project={project}
      user={user}
      onProjectUpdate={handleProjectUpdate}
    />
  );
}
