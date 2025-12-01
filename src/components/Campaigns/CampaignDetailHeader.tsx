'use client';

import { useState } from 'react';
import { Play, Pause, Edit, Copy, X } from 'lucide-react';
import styles from './CampaignDetailHeader.module.scss';

interface CampaignDetailHeaderProps {
  campaign: any;
  onUpdate: () => void;
  companyTimezone?: string;
}

export default function CampaignDetailHeader({ campaign, onUpdate, companyTimezone = 'America/New_York' }: CampaignDetailHeaderProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStartCampaign = async () => {
    try {
      setActionLoading('start');
      const response = await fetch(`/api/campaigns/${campaign.id}/start`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        onUpdate();
      } else {
        alert(result.error || 'Failed to start campaign');
      }
    } catch (error) {
      console.error('Error starting campaign:', error);
      alert('Failed to start campaign');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseCampaign = async () => {
    try {
      setActionLoading('pause');
      const response = await fetch(`/api/campaigns/${campaign.id}/pause`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        onUpdate();
      } else {
        alert(result.error || 'Failed to pause campaign');
      }
    } catch (error) {
      console.error('Error pausing campaign:', error);
      alert('Failed to pause campaign');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelCampaign = async () => {
    if (!confirm('Are you sure you want to cancel this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading('cancel');
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      const result = await response.json();

      if (result.success) {
        onUpdate();
      } else {
        alert(result.error || 'Failed to cancel campaign');
      }
    } catch (error) {
      console.error('Error cancelling campaign:', error);
      alert('Failed to cancel campaign');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: styles.statusDraft },
      scheduled: { label: 'Scheduled', className: styles.statusScheduled },
      running: { label: 'Running', className: styles.statusRunning },
      paused: { label: 'Paused', className: styles.statusPaused },
      completed: { label: 'Completed', className: styles.statusCompleted },
      cancelled: { label: 'Cancelled', className: styles.statusCancelled },
    };

    const config = statusConfig[status] || { label: status, className: styles.statusDefault };

    return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>;
  };

  return (
    <div className={styles.header}>
      <div className={styles.titleSection}>
        <h1>{campaign.name}</h1>
        {getStatusBadge(campaign.status)}
      </div>

      {campaign.description && (
        <p className={styles.description}>{campaign.description}</p>
      )}

      <div className={styles.metadata}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Started:</span>
          <span className={styles.metaValue}>
            {new Date(campaign.start_datetime).toLocaleString('en-US', { timeZone: companyTimezone })}
          </span>
        </div>
        {campaign.workflow && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Workflow:</span>
            <span className={styles.metaValue}>{campaign.workflow.name}</span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {(campaign.status === 'draft' || campaign.status === 'paused') && (
          <button
            className={styles.actionButton}
            onClick={handleStartCampaign}
            disabled={actionLoading === 'start'}
          >
            <Play size={16} />
            {actionLoading === 'start' ? 'Starting...' : 'Start Campaign'}
          </button>
        )}

        {(campaign.status === 'running' || campaign.status === 'scheduled') && (
          <button
            className={styles.actionButton}
            onClick={handlePauseCampaign}
            disabled={actionLoading === 'pause'}
          >
            <Pause size={16} />
            {actionLoading === 'pause' ? 'Pausing...' : 'Pause Campaign'}
          </button>
        )}

        {campaign.status !== 'running' && campaign.status !== 'completed' && campaign.status !== 'cancelled' && (
          <button
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => window.location.href = `/campaigns?edit=${campaign.id}`}
          >
            <Edit size={16} />
            Edit
          </button>
        )}

        {campaign.status !== 'cancelled' && campaign.status !== 'completed' && (
          <button
            className={`${styles.actionButton} ${styles.danger}`}
            onClick={handleCancelCampaign}
            disabled={actionLoading === 'cancel'}
          >
            <X size={16} />
            {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
}
