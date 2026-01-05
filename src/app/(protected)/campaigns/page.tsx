'use client';

import { useEffect, useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import { createClient } from '@/lib/supabase/client';
import styles from './campaigns.module.scss';
import CampaignEditor from '@/components/Campaigns/CampaignEditor';
import {
  Play,
  Pause,
  Copy,
  Calendar,
  Users,
  Mail,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  start_datetime: string;
  end_datetime: string | null;
  total_contacts: number;
  processed_contacts: number;
  successful_contacts: number;
  failed_contacts: number;
  workflow: {
    id: string;
    name: string;
    workflow_type: string;
  } | null;
  created_at: string;
}

export default function CampaignsPage() {
  const { selectedCompany } = useCompany();
  const { registerPageAction, unregisterPageAction } = usePageActions();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'draft' | 'past'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [companyTimezone, setCompanyTimezone] = useState<string>('America/New_York');
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [isClonedCampaign, setIsClonedCampaign] = useState(false);

  // Register the Create Campaign action button in the page header
  useEffect(() => {
    registerPageAction('add', () => setShowCreateModal(true));
    return () => unregisterPageAction('add');
  }, [registerPageAction, unregisterPageAction]);

  useEffect(() => {
    if (selectedCompany?.id) {
      fetchCompanyTimezone();
      fetchCampaigns();
    } else {
      setLoading(false);
    }
  }, [selectedCompany?.id, activeTab]);

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

  const fetchCampaigns = async () => {
    if (!selectedCompany?.id) return;

    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        setCampaigns([]);
        setLoading(false);
        return;
      }

      // Filter by status
      const filteredData = data?.filter(c => {
        if (activeTab === 'active') return c.status === 'running';
        if (activeTab === 'scheduled') return ['scheduled', 'paused'].includes(c.status);
        if (activeTab === 'draft') return c.status === 'draft';
        return ['completed', 'cancelled'].includes(c.status);
      }) || [];

      setCampaigns(filteredData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        fetchCampaigns();
      } else {
        alert(result.error || 'Failed to start campaign');
      }
    } catch (error) {
      console.error('Error starting campaign:', error);
      alert('Failed to start campaign');
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/pause`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        fetchCampaigns();
      } else {
        alert(result.error || 'Failed to pause campaign');
      }
    } catch (error) {
      console.error('Error pausing campaign:', error);
      alert('Failed to pause campaign');
    }
  };

  const handleDuplicateCampaign = async (campaignId: string) => {
    setDuplicatingId(campaignId);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Let backend auto-increment the name (Copy, Copy 2, Copy 3, etc.)
          copy_contact_lists: false, // Don't copy contact lists
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Open modal with cloned campaign data
        setEditingCampaign(result.campaign);
        setIsClonedCampaign(true);
        setShowCreateModal(true);
      } else {
        alert(result.error || 'Failed to duplicate campaign');
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      alert('Failed to duplicate campaign');
    } finally {
      setDuplicatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', className: styles.statusDraft },
      scheduled: { label: 'Scheduled', className: styles.statusScheduled },
      running: { label: 'Running', className: styles.statusRunning },
      paused: { label: 'Paused', className: styles.statusPaused },
      completed: { label: 'Completed', className: styles.statusCompleted },
      cancelled: { label: 'Cancelled', className: styles.statusCancelled },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: styles.statusDefault
    };

    return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>;
  };

  const getProgressPercentage = (campaign: Campaign) => {
    if (campaign.total_contacts === 0) return 0;
    return Math.round((campaign.processed_contacts / campaign.total_contacts) * 100);
  };

  return (
    <div className={styles.campaignsPage}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'scheduled' ? styles.active : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          Scheduled
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'draft' ? styles.active : ''}`}
          onClick={() => setActiveTab('draft')}
        >
          Drafts
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'past' ? styles.active : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
      </div>

      <div className={styles.campaignsList}>
        {loading ? (
          <div className={styles.loading}>Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className={styles.emptyState}>
            <Mail size={48} />
            <h3>No campaigns found</h3>
            <p>Create your first campaign to reach out to your customers</p>
          </div>
        ) : (
          campaigns.map(campaign => (
            <div key={campaign.id} className={styles.campaignCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <h3>{campaign.name}</h3>
                  {getStatusBadge(campaign.status)}
                </div>
                <div className={styles.cardActions}>
                  {campaign.status === 'paused' ? (
                    <button
                      className={styles.actionButton}
                      onClick={() => handleStartCampaign(campaign.id)}
                      title="Resume campaign"
                    >
                      <Play size={16} />
                    </button>
                  ) : null}
                  {campaign.status === 'running' || campaign.status === 'scheduled' ? (
                    <button
                      className={styles.actionButton}
                      onClick={() => handlePauseCampaign(campaign.id)}
                      title="Pause campaign"
                    >
                      <Pause size={16} />
                    </button>
                  ) : null}
                  <button
                    className={styles.actionButton}
                    onClick={() => handleDuplicateCampaign(campaign.id)}
                    title="Duplicate campaign"
                    disabled={duplicatingId === campaign.id}
                  >
                    <Copy size={16} />
                    <span className={styles.actionLabel}>Duplicate</span>
                  </button>
                </div>
              </div>

              {campaign.description && (
                <p className={styles.cardDescription}>{campaign.description}</p>
              )}

              <div className={styles.cardMetrics}>
                <div className={styles.metric}>
                  <Users size={16} />
                  <span>{campaign.total_contacts} contacts</span>
                </div>
                <div className={styles.metric}>
                  <CheckCircle size={16} />
                  <span>{campaign.successful_contacts} successful</span>
                </div>
                <div className={styles.metric}>
                  <XCircle size={16} />
                  <span>{campaign.failed_contacts} failed</span>
                </div>
                {campaign.workflow && (
                  <div className={styles.metric}>
                    <TrendingUp size={16} />
                    <span>{campaign.workflow.name}</span>
                  </div>
                )}
              </div>

              {campaign.status === 'running' && campaign.total_contacts > 0 && (
                <div className={styles.progressSection}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${getProgressPercentage(campaign)}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {getProgressPercentage(campaign)}% complete ({campaign.processed_contacts} / {campaign.total_contacts})
                  </span>
                </div>
              )}

              <div className={styles.cardFooter}>
                <div className={styles.cardDate}>
                  <Calendar size={14} />
                  <span>
                    Starts: {new Date(campaign.start_datetime).toLocaleString('en-US', { timeZone: companyTimezone })}
                  </span>
                </div>
                {campaign.end_datetime && (
                  <div className={styles.cardDate}>
                    <Clock size={14} />
                    <span>
                      Ends: {new Date(campaign.end_datetime).toLocaleString('en-US', { timeZone: companyTimezone })}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.cardLink}>
                <a href={`/campaigns/${campaign.id}`}>View Details →</a>
              </div>
            </div>
          ))
        )}
      </div>

      <CampaignEditor
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCampaign(null);
          setIsClonedCampaign(false);
        }}
        companyId={selectedCompany?.id || ''}
        campaign={editingCampaign}
        isCloned={isClonedCampaign}
        onSuccess={() => {
          fetchCampaigns();
          setShowCreateModal(false);
          setEditingCampaign(null);
          setIsClonedCampaign(false);
        }}
      />
    </div>
  );
}
