'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import LeadsList from '@/components/Leads/LeadsList/LeadsList';
import { Lead } from '@/types/lead';
import { useCompany } from '@/contexts/CompanyContext';

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
  const [wonLeads, setWonLeads] = useState<Lead[]>([]);
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

  const fetchWonLeads = useCallback(async () => {
    if (!selectedCompany?.id) return;

    try {
      setLeadsLoading(true);

      // Use direct API call to fetch won leads for the selected company
      const response = await fetch(`/api/leads?companyId=${selectedCompany.id}&status=won`);

      if (!response.ok) {
        throw new Error('Failed to fetch won leads');
      }

      const leadsData = await response.json();
      setWonLeads(Array.isArray(leadsData) ? leadsData : []);
    } catch (error) {
      console.error('Error fetching won leads:', error);
      setWonLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [selectedCompany?.id]);

  const handleEditLead = (lead: Lead) => {
    router.push(`/leads/${lead.id}?edit=true`);
  };

  // Fetch won leads when selectedCompany changes
  useEffect(() => {
    if (selectedCompany?.id) {
      fetchWonLeads();
    }
  }, [selectedCompany?.id, fetchWonLeads]);

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
                leads={wonLeads}
                loading={leadsLoading}
                onLeadUpdated={() => {
                  fetchWonLeads();
                }}
                onEdit={handleEditLead}
                showCompanyColumn={isAdmin && !selectedCompany}
                userProfile={profile}
                customTabs={[
                  {
                    key: 'ready-to-schedule',
                    label: 'Ready to Schedule',
                    filter: (leads) => leads, // Show all leads (they're already filtered to won)
                    getCount: (leads) => leads.length,
                  }
                ]}
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