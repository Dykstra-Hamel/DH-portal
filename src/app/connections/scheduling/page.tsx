'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import LeadsList from '@/components/Leads/LeadsList/LeadsList';
import { Lead } from '@/types/lead';
import { useCompany } from '@/contexts/CompanyContext';
import { getSchedulingLeadTabs } from '@/components/Leads/LeadsList/SchedulingLeadsListConfig';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

export default function SchedulingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [schedulingLeads, setSchedulingLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const fetchSchedulingLeads = useCallback(async () => {
    if (!selectedCompany?.id) return;

    try {
      setLeadsLoading(true);

      // Fetch all scheduling-related leads (ready_to_schedule, scheduled, won, lost)
      const response = await fetch(`/api/leads?companyId=${selectedCompany.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch scheduling leads');
      }

      const leadsData = await response.json();

      // Filter to only include scheduling-related statuses
      const filteredLeads = Array.isArray(leadsData)
        ? leadsData.filter((lead: Lead) =>
            ['ready_to_schedule', 'scheduled', 'won', 'lost'].includes(lead.lead_status)
          )
        : [];

      setSchedulingLeads(filteredLeads);
    } catch (error) {
      console.error('Error fetching scheduling leads:', error);
      setSchedulingLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [selectedCompany?.id]);

  const handleEditLead = (lead: Lead) => {
    router.push(`/connections/leads/${lead.id}?edit=true`);
  };

  // Fetch scheduling leads when selectedCompany changes
  useEffect(() => {
    if (selectedCompany?.id) {
      fetchSchedulingLeads();
    }
  }, [selectedCompany?.id, fetchSchedulingLeads]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  return (
    <div style={{ width: '100%' }}>
      {selectedCompany && (
            <div>
              <LeadsList
                leads={schedulingLeads}
                loading={leadsLoading}
                onLeadUpdated={() => {
                  fetchSchedulingLeads();
                }}
                onEdit={handleEditLead}
                showCompanyColumn={isAdmin && !selectedCompany}
                userProfile={profile}
                customTabs={getSchedulingLeadTabs()}
              />
            </div>
          )}

      {!selectedCompany && (
        <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
          Please select a company to view scheduling.
        </div>
      )}
    </div>
  );
}