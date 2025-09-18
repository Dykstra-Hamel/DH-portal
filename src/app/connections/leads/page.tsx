'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import LeadsTable from '@/components/Leads/LeadsTable/LeadsTable';
import LeadsTabs from '@/components/Leads/LeadsTabs/LeadsTabs';
import { adminAPI } from '@/lib/api-client';
import { Lead } from '@/types/lead';
import { useCompany } from '@/contexts/CompanyContext';
import { PageAccessGuard } from '@/components/Common/AccessControl';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

export default function LeadsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [archivedLeads, setArchivedLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'new' | 'contacted' | 'qualified' | 'quoted' | 'unqualified' | 'all' | 'archived'
  >('all');
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

  const fetchLeads = useCallback(async () => {
    if (!isAdmin && !selectedCompany) return;

    try {
      setLeadsLoading(true);
      
      if (isAdmin) {
        // Admin can filter by specific company or show all
        const filters = { 
          ...(selectedCompany ? { companyId: selectedCompany.id } : {}),
        };
        const leadsData = await adminAPI.getLeads(filters);
        setLeads(leadsData || []);
      } else {
        // Regular user gets leads for their selected company
        const leadsData = await adminAPI.getUserLeads(selectedCompany!.id);
        setLeads(leadsData || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [selectedCompany, isAdmin]);

  const fetchArchivedLeads = useCallback(async () => {
    if (!isAdmin && !selectedCompany) return;

    try {
      setLeadsLoading(true);
      
      if (isAdmin) {
        // Admin can filter by specific company or show all
        const filters = { 
          ...(selectedCompany ? { companyId: selectedCompany.id } : {}),
        };
        const archivedLeadsData = await adminAPI.getArchivedLeads(filters);
        setArchivedLeads(archivedLeadsData || []);
      } else {
        // Regular user gets archived leads for their selected company
        const archivedLeadsData = await adminAPI.getUserArchivedLeads(selectedCompany!.id);
        setArchivedLeads(archivedLeadsData || []);
      }
    } catch (error) {
      console.error('Error fetching archived leads:', error);
      setArchivedLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [selectedCompany, isAdmin]);

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
      fetchLeads();

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
      fetchLeads();
      fetchArchivedLeads();
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
      fetchLeads();
      fetchArchivedLeads();
    } catch (error) {
      console.error('Error unarchiving lead:', error);
      alert('Failed to unarchive lead. Please try again.');
    }
  };

  // Fetch leads when selectedCompany changes or isAdmin changes
  useEffect(() => {
    if (isAdmin || selectedCompany) {
      fetchLeads();
      fetchArchivedLeads();
    }
  }, [selectedCompany, isAdmin, fetchLeads, fetchArchivedLeads]);

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
    <PageAccessGuard pageType="sales">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Leads</h1>
        </div>

        <div className={styles.leadsSection}>
          <div className={styles.sectionHeader}>
            <h2>
              {isAdmin && !selectedCompany
                ? 'All Leads (All Companies)'
                : isAdmin && selectedCompany
                  ? `Leads for ${selectedCompany.name}`
                  : selectedCompany
                    ? `Leads for ${selectedCompany.name}`
                    : 'Leads'}
            </h2>
            <p>
              {isAdmin && !selectedCompany
                ? 'All leads across all companies'
                : selectedCompany
                  ? `All leads for ${selectedCompany.name}`
                  : 'Loading...'}
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
                showCompanyColumn={isAdmin && !selectedCompany}
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
      </div>
    </PageAccessGuard>
  );
}
