'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { ArrowLeft } from 'lucide-react';
import styles from './page.module.scss';
import CampaignDetailHeader from '@/components/Campaigns/CampaignDetailHeader';
import CampaignOverview from '@/components/Campaigns/CampaignOverview';
import CampaignContacts from '@/components/Campaigns/CampaignContacts';
import CampaignExecutions from '@/components/Campaigns/CampaignExecutions';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

type TabType = 'overview' | 'contacts' | 'executions';

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const router = useRouter();
  const { selectedCompany } = useCompany();
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [companyTimezone, setCompanyTimezone] = useState<string>('America/New_York');

  useEffect(() => {
    params.then(p => setCampaignId(p.id));
  }, [params]);

  useEffect(() => {
    if (campaignId && selectedCompany?.id) {
      fetchCampaignData();
      fetchCompanyTimezone();
      setupRealtimeSubscription();
    }
  }, [campaignId, selectedCompany?.id]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch campaign details
      const campaignResponse = await fetch(`/api/campaigns/${campaignId}`);
      const campaignResult = await campaignResponse.json();

      if (!campaignResult.success) {
        throw new Error(campaignResult.error || 'Failed to load campaign');
      }

      setCampaign(campaignResult.campaign);

      // Fetch metrics
      const metricsResponse = await fetch(`/api/campaigns/${campaignId}/metrics`);
      const metricsResult = await metricsResponse.json();

      if (metricsResult.success) {
        setMetrics(metricsResult.metrics);
      }

    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyTimezone = async () => {
    if (!selectedCompany?.id) return;

    try {
      const response = await fetch(`/api/companies/${selectedCompany.id}/settings`);
      const result = await response.json();

      if (result.success && result.settings) {
        const tzSetting = result.settings.find((s: any) => s.setting_key === 'company_timezone');
        if (tzSetting) {
          setCompanyTimezone(tzSetting.setting_value || 'America/New_York');
        }
      }
    } catch (error) {
      console.error('Error fetching company timezone:', error);
      // Keep default timezone if fetch fails
    }
  };

  const setupRealtimeSubscription = () => {
    const supabase = createClient();

    // Subscribe to campaign changes
    const campaignChannel = supabase
      .channel(`campaign-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${campaignId}`,
        },
        (payload) => {
          console.log('Campaign updated:', payload);
          fetchCampaignData();
        }
      )
      .subscribe();

    // Subscribe to execution changes
    const executionsChannel = supabase
      .channel(`campaign-executions-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_executions',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log('Execution updated:', payload);
          fetchCampaignData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(campaignChannel);
      supabase.removeChannel(executionsChannel);
    };
  };

  const handleCampaignUpdate = () => {
    fetchCampaignData();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading campaign...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Campaign</h2>
        <p>{error || 'Campaign not found'}</p>
        <button onClick={() => router.push('/campaigns')} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Campaigns
        </button>
      </div>
    );
  }

  return (
    <div className={styles.campaignDetailPage}>
      {/* Back Button */}
      <button onClick={() => router.push('/campaigns')} className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Campaigns
      </button>

      {/* Header */}
      <CampaignDetailHeader
        campaign={campaign}
        onUpdate={handleCampaignUpdate}
        companyTimezone={companyTimezone}
      />

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'contacts' ? styles.active : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          Contacts ({campaign.total_contacts || 0})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'executions' ? styles.active : ''}`}
          onClick={() => setActiveTab('executions')}
        >
          Executions ({metrics?.totalExecutions || 0})
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <CampaignOverview
            campaign={campaign}
            metrics={metrics}
          />
        )}

        {activeTab === 'contacts' && (
          <CampaignContacts
            campaignId={campaign.id}
            companyId={selectedCompany?.id || ''}
            campaignStatus={campaign.status}
          />
        )}

        {activeTab === 'executions' && (
          <CampaignExecutions
            campaignId={campaign.id}
            companyId={selectedCompany?.id || ''}
            companyTimezone={companyTimezone}
          />
        )}
      </div>
    </div>
  );
}
