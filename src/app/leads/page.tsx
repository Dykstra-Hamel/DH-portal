'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import LeadsTable from '@/components/Leads/LeadsTable/LeadsTable';
import LeadsTabs from '@/components/Leads/LeadsTabs/LeadsTabs';
import CompanyDropdown from '@/components/Common/CompanyDropdown/CompanyDropdown';
import { adminAPI } from '@/lib/api-client';
import { Lead } from '@/types/lead';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
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

export default function LeadsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'new' | 'contacted' | 'qualified' | 'quoted' | 'all'
  >('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSelectedCompany, setAdminSelectedCompany] = useState<
    string | undefined
  >(undefined);
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
        setIsAdmin(isAuthorizedAdminSync(profileData));
      }

      // Get user companies (skip for admin users)
      if (!isAuthorizedAdminSync(profileData)) {
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
      }
      // Admin users don't need a selected company - they use the dropdown to filter

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

  const fetchLeads = useCallback(async () => {
    if (!selectedCompany) return;

    try {
      setLeadsLoading(true);
      const leadsData = await adminAPI.getUserLeads(selectedCompany.id);
      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [selectedCompany]);

  const fetchLeadsAdmin = useCallback(async () => {
    try {
      setLeadsLoading(true);
      const filters = adminSelectedCompany
        ? { companyId: adminSelectedCompany }
        : {};
      const leadsData = await adminAPI.getLeads(filters);
      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error fetching admin leads:', error);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [adminSelectedCompany]);

  // Fetch leads when selectedCompany changes (regular user) or adminSelectedCompany changes (admin)
  useEffect(() => {
    if (isAdmin) {
      fetchLeadsAdmin();
    } else if (selectedCompany) {
      fetchLeads();
    }
  }, [selectedCompany, adminSelectedCompany, isAdmin, fetchLeads, fetchLeadsAdmin]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  // Filter leads based on active tab
  const filteredLeads =
    activeTab === 'all'
      ? leads
      : leads.filter(lead => lead.lead_status === activeTab);

  // Calculate lead counts for active statuses only
  const leadCounts = {
    all: leads.length,
    new: leads.filter(lead => lead.lead_status === 'new').length,
    contacted: leads.filter(lead => lead.lead_status === 'contacted').length,
    qualified: leads.filter(lead => lead.lead_status === 'qualified').length,
    quoted: leads.filter(lead => lead.lead_status === 'quoted').length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Leads</h1>
        {isAdmin && (
          <div className={styles.adminControls}>
            <CompanyDropdown
              selectedCompanyId={adminSelectedCompany}
              onCompanyChange={setAdminSelectedCompany}
              includeAllOption={true}
              placeholder="Select company to view leads"
            />
          </div>
        )}
      </div>

      {(selectedCompany || isAdmin) && (
        <div className={styles.leadsSection}>
          <div className={styles.sectionHeader}>
            <h2>
              {isAdmin
                ? adminSelectedCompany
                  ? 'Leads for Selected Company'
                  : 'All Leads (All Companies)'
                : `Leads for ${selectedCompany?.name}`}
            </h2>
            <p>
              {isAdmin
                ? adminSelectedCompany
                  ? 'Leads for the selected company'
                  : 'All leads across all companies'
                : 'All leads for your company'}
            </p>
          </div>

          {leadsLoading ? (
            <div className={styles.loading}>Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No leads found. Create your first lead to get started!</p>
            </div>
          ) : (
            <>
              <LeadsTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                leadCounts={leadCounts}
              />
              <LeadsTable
                leads={filteredLeads}
                showActions={false}
                showCompanyColumn={isAdmin && !adminSelectedCompany}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
