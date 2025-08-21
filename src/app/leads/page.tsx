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
  role?: string;
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
  const [archivedLeads, setArchivedLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'new' | 'contacted' | 'qualified' | 'quoted' | 'unqualified' | 'all' | 'archived'
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

  const fetchArchivedLeads = useCallback(async () => {
    if (!selectedCompany) return;

    try {
      setLeadsLoading(true);
      const archivedLeadsData = await adminAPI.getUserArchivedLeads(selectedCompany.id);
      setArchivedLeads(archivedLeadsData || []);
    } catch (error) {
      console.error('Error fetching archived leads:', error);
      setArchivedLeads([]);
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

  const fetchArchivedLeadsAdmin = useCallback(async () => {
    try {
      setLeadsLoading(true);
      const filters = adminSelectedCompany
        ? { companyId: adminSelectedCompany }
        : {};
      const archivedLeadsData = await adminAPI.getArchivedLeads(filters);
      setArchivedLeads(archivedLeadsData || []);
    } catch (error) {
      console.error('Error fetching archived admin leads:', error);
      setArchivedLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [adminSelectedCompany]);

  const handleDeleteLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete lead');
      }

      // Refresh leads after successful deletion
      if (isAdmin) {
        fetchLeadsAdmin();
      } else {
        fetchLeads();
      }

      // You could add a toast notification here if you have a toast system
    } catch (error) {
      console.error('Error deleting lead:', error);
      // You could show an error toast here
      alert('Failed to delete lead. Please try again.');
    }
  };

  const handleEditLead = (lead: Lead) => {
    router.push(`/leads/${lead.id}?edit=true`);
  };

  const handleArchiveLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to archive lead');
      }

      // Refresh both active and archived leads after successful archiving
      if (isAdmin) {
        fetchLeadsAdmin();
        fetchArchivedLeadsAdmin();
      } else {
        fetchLeads();
        fetchArchivedLeads();
      }
    } catch (error) {
      console.error('Error archiving lead:', error);
      alert('Failed to archive lead. Please try again.');
    }
  };

  const handleUnarchiveLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unarchive lead');
      }

      // Refresh both active and archived leads after successful unarchiving
      if (isAdmin) {
        fetchLeadsAdmin();
        fetchArchivedLeadsAdmin();
      } else {
        fetchLeads();
        fetchArchivedLeads();
      }
    } catch (error) {
      console.error('Error unarchiving lead:', error);
      alert('Failed to unarchive lead. Please try again.');
    }
  };

  // Fetch leads when selectedCompany changes (regular user) or adminSelectedCompany changes (admin)
  useEffect(() => {
    if (isAdmin) {
      fetchLeadsAdmin();
      fetchArchivedLeadsAdmin();
    } else if (selectedCompany) {
      fetchLeads();
      fetchArchivedLeads();
    }
  }, [selectedCompany, adminSelectedCompany, isAdmin, fetchLeads, fetchLeadsAdmin, fetchArchivedLeads, fetchArchivedLeadsAdmin]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  // Filter leads based on active tab
  const filteredLeads =
    activeTab === 'archived'
      ? archivedLeads
      : activeTab === 'all'
        ? leads
        : leads.filter(lead => lead.lead_status === activeTab);

  // Calculate lead counts for all statuses
  const leadCounts = {
    all: leads.length,
    new: leads.filter(lead => lead.lead_status === 'new').length,
    contacted: leads.filter(lead => lead.lead_status === 'contacted').length,
    qualified: leads.filter(lead => lead.lead_status === 'qualified').length,
    quoted: leads.filter(lead => lead.lead_status === 'quoted').length,
    unqualified: leads.filter(lead => lead.lead_status === 'unqualified').length,
    archived: archivedLeads.length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Leads</h1>
        {isAdmin ? (
          <div className={styles.adminControls}>
            <CompanyDropdown
              selectedCompanyId={adminSelectedCompany}
              onCompanyChange={setAdminSelectedCompany}
              includeAllOption={true}
              placeholder="Select company to view leads"
            />
          </div>
        ) : userCompanies.length > 1 ? (
          <div className={styles.companySelector}>
            <label htmlFor="user-company-select" className={styles.selectorLabel}>
              Select Company:
            </label>
            <select
              id="user-company-select"
              value={selectedCompany?.id || ''}
              onChange={(e) => {
                const company = userCompanies.find(uc => uc.companies.id === e.target.value)?.companies;
                setSelectedCompany(company || null);
              }}
              className={styles.companySelect}
            >
              {userCompanies.map(uc => (
                <option key={uc.companies.id} value={uc.companies.id}>
                  {uc.companies.name}
                </option>
              ))}
            </select>
          </div>
        ) : userCompanies.length === 1 ? (
          <div className={styles.singleCompanyHeader}>
            <h3>Leads for {userCompanies[0].companies.name}</h3>
          </div>
        ) : null}
      </div>

      {(selectedCompany || isAdmin) && (
        <div className={styles.leadsSection}>
          <div className={styles.sectionHeader}>
            <h2>
              {userCompanies.length === 1 && !isAdmin
                ? 'Leads' // Don't repeat company name if already shown above
                : isAdmin
                  ? adminSelectedCompany
                    ? 'Leads for Selected Company'
                    : 'All Leads (All Companies)'
                  : userCompanies.length > 1
                    ? `Leads for ${selectedCompany?.name}`
                    : `Leads for ${selectedCompany?.name}`}
            </h2>
            <p>
              {isAdmin
                ? adminSelectedCompany
                  ? 'Leads for the selected company'
                  : 'All leads across all companies'
                : userCompanies.length === 1
                  ? 'All leads for your company'
                  : 'All leads for the selected company'}
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
                showActions={true}
                showCompanyColumn={isAdmin && !adminSelectedCompany}
                onEdit={handleEditLead}
                onDelete={handleDeleteLead}
                onArchive={handleArchiveLead}
                onUnarchive={handleUnarchiveLead}
                userProfile={profile}
                showArchived={activeTab === 'archived'}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
