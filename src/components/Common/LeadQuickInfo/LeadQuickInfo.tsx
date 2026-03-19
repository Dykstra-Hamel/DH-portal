'use client';

import { Bug, ChevronDown, Funnel, MapPinHouse } from 'lucide-react';
import { Lead } from '@/types/lead';
import styles from './LeadQuickInfo.module.scss';

interface LeadQuickInfoProps {
  lead: Lead;
  isExpanded: boolean;
  onToggle: () => void;
}

function formatLeadSource(lead: Lead): string {
  if (lead.lead_source === 'campaign' && lead.campaign?.name) {
    return lead.campaign.name;
  }
  return lead.lead_source
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatAddress(lead: Lead): string {
  const addr = lead.primary_service_address;
  if (addr) {
    return [addr.street_address, addr.city, `${addr.state} ${addr.zip_code}`]
      .filter(Boolean)
      .join(', ');
  }
  const cust = lead.customer;
  if (cust) {
    return [cust.address, cust.city, cust.state, cust.zip_code]
      .filter(Boolean)
      .join(', ');
  }
  return '—';
}

function formatContact(lead: Lead): string {
  return (
    lead.customer?.phone ||
    lead.call_record?.phone_number ||
    lead.customer?.email ||
    '—'
  );
}

export function LeadQuickInfo({
  lead,
  isExpanded,
  onToggle,
}: LeadQuickInfoProps) {
  const source = formatLeadSource(lead);
  const pest = lead.pest_type ?? lead.call_record?.pest_issue ?? '—';
  const address = formatAddress(lead);
  const contact = formatContact(lead);

  return (
    <div
      className={`${styles.wrapper} ${isExpanded ? styles.wrapperExpanded : ''}`}
    >
      <div className={styles.tilesRow}>
        <div className={styles.tile}>
          <span className={styles.tileLabel}>
            <Funnel size={16} /> Lead Source
          </span>
          <span className={styles.tileValue} title={source}>
            {source}
          </span>
        </div>
        <div className={styles.divider} />
        <div className={styles.tile}>
          <span className={styles.tileLabel}>
            <Bug size={16} /> Pest Concern
          </span>
          <span className={styles.tileValue} title={pest}>
            {pest}
          </span>
        </div>
        <div className={styles.divider} />
        <div className={styles.tile}>
          <span className={styles.tileLabel}>
            <MapPinHouse size={16} /> Address
          </span>
          <span className={styles.tileValue} title={address}>
            {address}
          </span>
        </div>
        <div className={styles.divider} />
        <div className={styles.tile}>
          <span className={styles.tileLabel}>
            <MapPinHouse size={16} /> Quick Contact
          </span>
          <span className={styles.tileValue} title={contact}>
            {contact}
          </span>
        </div>
        <button
          type="button"
          className={styles.chevronBtn}
          onClick={onToggle}
          aria-label={
            isExpanded ? 'Collapse communication' : 'Expand communication'
          }
        >
          <ChevronDown size={18} className={isExpanded ? styles.rotated : ''} />
        </button>
      </div>
    </div>
  );
}
