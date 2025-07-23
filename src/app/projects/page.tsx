'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import ProjectRequest from '@/components/Projects/ProjectRequest/ProjectRequest';
import ProjectsTable from '@/components/Projects/ProjectsTable/ProjectsTable';
import { adminAPI } from '@/lib/api-client';
import { Project } from '@/types/project';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Company {
  id: string;
  name: string;
}

interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  is_primary: boolean;
  companies: Company;
}

export default function ProjectsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

      // Get user companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('user_companies')
        .select(
          `
              *,
              companies (
                id,
                name
              )
            `
        )
        .eq('user_id', session.user.id);

      if (!companiesError && companiesData) {
        setUserCompanies(companiesData);

        // Set primary company as selected, or first company if no primary
        const primaryCompany = companiesData.find(uc => uc.is_primary);
        if (primaryCompany) {
          setSelectedCompany(primaryCompany.companies);
        } else if (companiesData.length > 0) {
          setSelectedCompany(companiesData[0].companies);
        }
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

  // Fetch projects when selectedCompany changes
  useEffect(() => {
    if (selectedCompany) {
      fetchProjects();
    }
  }, [selectedCompany]);

  const fetchProjects = async () => {
    if (!selectedCompany) return;

    try {
      setProjectsLoading(true);
      const projectsData = await adminAPI.getUserProjects(selectedCompany.id);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Projects</h1>
      <ProjectRequest
        user={user}
        profile={profile}
        selectedCompany={selectedCompany}
        onProjectCreated={fetchProjects}
      />

      {selectedCompany && (
        <div className={styles.projectsSection}>
          <div className={styles.sectionHeader}>
            <h2>Your Projects for {selectedCompany.name}</h2>
            <p>Projects you&apos;ve requested or been assigned to</p>
          </div>

          {projectsLoading ? (
            <div className={styles.loading}>Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                No projects found. Request your first project to get started!
              </p>
            </div>
          ) : (
            <ProjectsTable projects={projects} showActions={false} />
          )}
        </div>
      )}
    </div>
  );
}
