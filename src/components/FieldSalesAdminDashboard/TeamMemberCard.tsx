'use client';

import { MiniAvatar } from '@/components/Common/MiniAvatar';
import {
  CheckCircle2,
  FileText,
  TrendingUp,
  Target,
  DollarSign,
} from 'lucide-react';
import styles from './TeamMemberCard.module.scss';

interface TeamMemberCardData {
  userId: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  uploadedAvatarUrl: string | null;
  departments: string[];
  submitted: number;
  won: number;
  winRate: number;
  wonRevenue: number;
  pipelineValue: number;
  stopsCompleted: number;
  leadsFromStops: number;
}

interface TeamMemberCardProps {
  member: TeamMemberCardData;
  isActive: boolean;
  onToggle: (userId: string) => void;
}

function formatCurrency(value: number): string {
  if (value >= 10000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

function splitName(fullName: string): { first: string; last: string } {
  const trimmed = (fullName ?? '').trim();
  if (!trimmed) return { first: '', last: '' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function roleFromDepartments(
  departments: string[]
): { label: string; variant: 'inspector' | 'technician' | 'member' } {
  const set = new Set(departments.map(d => d.toLowerCase()));
  if (set.has('inspector')) return { label: 'Inspector', variant: 'inspector' };
  if (set.has('technician'))
    return { label: 'Technician', variant: 'technician' };
  return { label: 'Member', variant: 'member' };
}

export function TeamMemberCard({
  member,
  isActive,
  onToggle,
}: TeamMemberCardProps) {
  const { first, last } = splitName(member.fullName);
  const role = roleFromDepartments(member.departments ?? []);
  const isTechnician = role.variant === 'technician';
  // Technicians log stops & generate leads from stops; for inspectors the
  // submitted count is the more meaningful "where did this come from" stat.
  const sourceStat = isTechnician
    ? { label: 'Leads from Stops', value: member.leadsFromStops }
    : { label: 'Submitted', value: member.submitted };

  return (
    <button
      type="button"
      className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
      onClick={() => onToggle(member.userId)}
      aria-pressed={isActive}
    >
      <header className={styles.header}>
        <MiniAvatar
          firstName={first}
          lastName={last}
          email={member.email ?? ''}
          userId={member.userId}
          avatarUrl={member.avatarUrl}
          uploadedAvatarUrl={member.uploadedAvatarUrl}
          size="medium"
          showTooltip={false}
        />
        <div className={styles.identity}>
          <div className={styles.name}>{member.fullName}</div>
          <span
            className={`${styles.roleChip} ${styles[`roleChip-${role.variant}`]}`}
          >
            {role.label}
          </span>
        </div>
      </header>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <CheckCircle2 size={14} className={styles.statIcon} />
          <dt>Stops</dt>
          <dd>{member.stopsCompleted}</dd>
        </div>
        <div className={styles.stat}>
          <FileText size={14} className={styles.statIcon} />
          <dt>{sourceStat.label}</dt>
          <dd>{sourceStat.value}</dd>
        </div>
        <div className={styles.stat}>
          <TrendingUp size={14} className={styles.statIcon} />
          <dt>Won</dt>
          <dd>{member.won}</dd>
        </div>
        <div className={styles.stat}>
          <Target size={14} className={styles.statIcon} />
          <dt>Win Rate</dt>
          <dd>{member.winRate}%</dd>
        </div>
        <div className={styles.stat}>
          <DollarSign size={14} className={styles.statIcon} />
          <dt>Won Revenue</dt>
          <dd>{formatCurrency(member.wonRevenue)}</dd>
        </div>
        <div className={styles.stat}>
          <DollarSign size={14} className={styles.statIcon} />
          <dt>Pipeline</dt>
          <dd>{formatCurrency(member.pipelineValue)}</dd>
        </div>
      </dl>
    </button>
  );
}
