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
import CampaignLeads from '@/components/Campaigns/CampaignLeads';
import CampaignReport from '@/components/Campaigns/CampaignReport';
import CampaignEditor from '@/components/Campaigns/CampaignEditor';
import EditLandingPageModal from '@/components/Campaigns/EditLandingPageModal/EditLandingPageModal';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

type TabType = 'overview' | 'contacts' | 'leads' | 'executions' | 'report';

export default function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const router = useRouter();
  const { selectedCompany } = useCompany();
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [leadCount, setLeadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [companyTimezone, setCompanyTimezone] =
    useState<string>('America/New_York');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLandingPageModal, setShowLandingPageModal] = useState(false);
  const [isClonedCampaign, setIsClonedCampaign] = useState(false);

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
      const metricsResponse = await fetch(
        `/api/campaigns/${campaignId}/metrics`
      );
      const metricsResult = await metricsResponse.json();

      if (metricsResult.success) {
        setMetrics(metricsResult.metrics);
      }

      // Fetch lead count
      const supabase = createClient();
      const { count, error: countError } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      if (!countError && count !== null) {
        setLeadCount(count);
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
      const response = await fetch(
        `/api/companies/${selectedCompany.id}/settings`
      );
      const result = await response.json();

      if (result.success && result.settings) {
        const tzSetting = result.settings.find(
          (s: any) => s.setting_key === 'company_timezone'
        );
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
        payload => {
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
        payload => {
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

  const handleDuplicateCampaign = async () => {
    if (!campaign) return;

    const confirmed = confirm(`Duplicate campaign "${campaign.name}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_name: `${campaign.name} (Copy)`,
          copy_contact_lists: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Open edit modal with cloned campaign
        setCampaign(result.campaign);
        setIsClonedCampaign(true);
        setShowEditModal(true);
      } else {
        alert(result.error || 'Failed to duplicate campaign');
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      alert('Failed to duplicate campaign');
    }
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
        <button
          onClick={() => router.push('/campaigns')}
          className={styles.backButton}
        >
          <ArrowLeft size={16} />
          Back to Campaigns
        </button>
      </div>
    );
  }

  return (
    <div className={styles.campaignDetailPage}>
      {/* Back Button */}
      <button
        onClick={() => router.push('/campaigns')}
        className={styles.backLink}
      >
        <ArrowLeft size={16} />
        Back to Campaigns
      </button>

      {/* Header */}
      <CampaignDetailHeader
        campaign={campaign}
        onUpdate={handleCampaignUpdate}
        onEdit={() => setShowEditModal(true)}
        onEditLandingPage={() => setShowLandingPageModal(true)}
        onDuplicate={handleDuplicateCampaign}
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
          className={`${styles.tab} ${activeTab === 'leads' ? styles.active : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          Leads ({leadCount})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'executions' ? styles.active : ''}`}
          onClick={() => setActiveTab('executions')}
        >
          Executions ({metrics?.totalExecutions || 0})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'report' ? styles.active : ''}`}
          onClick={() => setActiveTab('report')}
        >
          Report
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <CampaignOverview campaign={campaign} metrics={metrics} />
        )}

        {activeTab === 'contacts' && (
          <CampaignContacts
            campaignId={campaign.id}
            companyId={selectedCompany?.id || ''}
            campaignStatus={campaign.status}
          />
        )}

        {activeTab === 'leads' && (
          <CampaignLeads
            campaignId={campaign.id}
            companyId={selectedCompany?.id || ''}
          />
        )}

        {activeTab === 'executions' && (
          <CampaignExecutions
            campaignId={campaign.id}
            companyId={selectedCompany?.id || ''}
            companyTimezone={companyTimezone}
          />
        )}

        {activeTab === 'report' && (
          <CampaignReport
            campaign={campaign}
            metrics={metrics}
            onRefresh={fetchCampaignData}
          />
        )}
      </div>

      {/* Edit Campaign Modal */}
      <CampaignEditor
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setIsClonedCampaign(false);
        }}
        companyId={campaign.company_id}
        campaign={campaign}
        isCloned={isClonedCampaign}
        onSuccess={() => {
          fetchCampaignData();
          setShowEditModal(false);
          setIsClonedCampaign(false);
        }}
      />

      {/* Edit Landing Page Modal */}
      {showLandingPageModal && campaign && (
        <EditLandingPageModal
          campaign={{
            id: campaign.id,
            company_id: campaign.company_id,
            service_plan_id: campaign.service_plan_id,
          }}
          isOpen={showLandingPageModal}
          onClose={() => setShowLandingPageModal(false)}
          onSuccess={() => {
            fetchCampaignData();
            setShowLandingPageModal(false);
          }}
        />
      )}
    </div>
  );
}
