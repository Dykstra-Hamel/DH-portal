'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Lead } from '@/types/lead';
import { User, Mail, Phone, Calendar, ExternalLink } from 'lucide-react';
import styles from './CampaignLeads.module.scss';

interface CampaignLeadsProps {
  campaignId: string;
  companyId: string;
}

export default function CampaignLeads({ campaignId, companyId }: CampaignLeadsProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId && companyId) {
      fetchLeads();
    }
  }, [campaignId, companyId]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from('leads')
        .select(`
          *,
          customer:customers(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('campaign_id', campaignId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      unassigned: { label: 'Unassigned', className: styles.statusUnassigned },
      contacting: { label: 'Contacting', className: styles.statusContacting },
      quoted: { label: 'Quoted', className: styles.statusQuoted },
      ready_to_schedule: { label: 'Ready To Schedule', className: styles.statusReady },
      scheduled: { label: 'Scheduled', className: styles.statusScheduled },
      won: { label: 'Won', className: styles.statusWon },
      lost: { label: 'Lost', className: styles.statusLost },
    };

    const config = statusConfig[status] || { label: status, className: styles.statusDefault };
    return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { className: string }> = {
      low: { className: styles.priorityLow },
      medium: { className: styles.priorityMedium },
      high: { className: styles.priorityHigh },
      urgent: { className: styles.priorityUrgent },
    };

    const config = priorityConfig[priority] || { className: styles.priorityMedium };
    return <span className={`${styles.priorityBadge} ${config.className}`}>{priority}</span>;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading leads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={fetchLeads} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className={styles.emptyState}>
        <User size={48} />
        <h3>No leads yet</h3>
        <p>Leads from this campaign will appear here once form submissions come in.</p>
      </div>
    );
  }

  return (
    <div className={styles.leadsContainer}>
      <div className={styles.leadsHeader}>
        <h3>Campaign Leads ({leads.length})</h3>
        <button onClick={fetchLeads} className={styles.refreshButton}>
          Refresh
        </button>
      </div>

      <div className={styles.leadsList}>
        {leads.map((lead) => (
          <div key={lead.id} className={styles.leadCard}>
            <div className={styles.leadHeader}>
              <div className={styles.leadInfo}>
                <h4>
                  {lead.customer?.first_name} {lead.customer?.last_name}
                </h4>
                <div className={styles.badges}>
                  {getStatusBadge(lead.lead_status)}
                  {getPriorityBadge(lead.priority)}
                </div>
              </div>
              <a href={`/tickets/leads/${lead.id}`} className={styles.viewLink}>
                View Lead
                <ExternalLink size={14} />
              </a>
            </div>

            {lead.customer && (
              <div className={styles.contactInfo}>
                {lead.customer.email && (
                  <div className={styles.contactItem}>
                    <Mail size={14} />
                    <span>{lead.customer.email}</span>
                  </div>
                )}
                {lead.customer.phone && (
                  <div className={styles.contactItem}>
                    <Phone size={14} />
                    <span>{lead.customer.phone}</span>
                  </div>
                )}
              </div>
            )}

            {lead.comments && (
              <div className={styles.comments}>
                <p>{lead.comments}</p>
              </div>
            )}

            <div className={styles.leadFooter}>
              <div className={styles.metaInfo}>
                <Calendar size={12} />
                <span>{new Date(lead.created_at).toLocaleString()}</span>
              </div>
              {lead.service_type && (
                <span className={styles.serviceType}>{lead.service_type}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
