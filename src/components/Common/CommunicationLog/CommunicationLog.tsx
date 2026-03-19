'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  Mail,
  PhoneOutgoing,
  PhoneCall,
  MessageCircleX,
  MessageCirclePlus,
  MessageCircle,
} from 'lucide-react';
import type { Activity } from '@/types/activity';
import {
  createActivityChannel,
  subscribeToActivityUpdates,
  removeActivityChannel,
  type ActivityUpdatePayload,
} from '@/lib/realtime/activity-channel';
import styles from './CommunicationLog.module.scss';

interface CommunicationLogProps {
  entityId: string;
  companyId: string;
}

function getContactIcon(contactType: string, outcome?: string | null) {
  if (
    contactType === 'outbound_call' ||
    contactType === 'live_call' ||
    contactType === 'ai_call'
  ) {
    if (outcome === 'voicemail_left') return <PhoneOutgoing size={18} />;
    if (outcome === 'no_voicemail') return <PhoneOutgoing size={18} />;
    if (outcome === 'connected') return <PhoneCall size={18} />;
    return <Phone size={18} />;
  }
  if (contactType === 'text_message') {
    if (outcome === 'text_no_response') return <MessageCircleX size={18} />;
    if (outcome === 'text_responded') return <MessageCirclePlus size={18} />;
    return <MessageCircle size={18} />;
  }
  if (contactType === 'email') return <Mail size={18} />;
  return <Phone size={18} />;
}

function getIconBgClass(contactType: string, outcome?: string | null): string {
  if (outcome === 'voicemail_left') return styles.iconVoicemail;
  if (outcome === 'no_voicemail') return styles.iconMissed;
  if (outcome === 'connected') return styles.iconConnected;
  if (outcome === 'text_no_response') return styles.iconMissed;
  if (outcome === 'text_responded') return styles.iconConnected;
  // Legacy fallback by contact_type:
  if (contactType === 'text_message') return styles.iconText;
  if (contactType === 'email') return styles.iconEmail;
  return styles.iconCall;
}

function formatActivityDescription(activity: Activity): string {
  const userName = activity.user
    ? `${activity.user.first_name || ''} ${activity.user.last_name || ''}`.trim() ||
      activity.user.email ||
      'Unknown'
    : 'System';
  const contactType = activity.metadata?.contact_type || 'contact';
  const outcome = activity.metadata?.contact_outcome;

  if (contactType === 'outbound_call' || contactType === 'live_call') {
    if (outcome === 'voicemail_left') return `${userName} left a voicemail`;
    if (outcome === 'no_voicemail')
      return `${userName} called — no voicemail available`;
    if (outcome === 'connected') return `${userName} connected with customer`;
  }
  if (contactType === 'text_message') {
    if (outcome === 'text_no_response') return `Text sent — no response`;
    if (outcome === 'text_responded') return `Text sent — customer responded`;
  }

  switch (contactType) {
    case 'email':
      return `${userName} sent an email`;
    case 'text_message':
      return `${userName} sent a text`;
    case 'outbound_call':
      return `${userName} made an outbound call`;
    case 'live_call':
      return `${userName} made a live call`;
    case 'ai_call':
      return `${userName} generated an AI agent phone call`;
    default:
      return `${userName} made contact`;
  }
}

function getDateGroupLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const activityDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (activityDay.getTime() === today.getTime()) {
    return 'Today';
  }

  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  });
}

function groupActivitiesByDate(
  activities: Activity[]
): { label: string; items: Activity[] }[] {
  const groups: Map<string, Activity[]> = new Map();

  for (const activity of activities) {
    const label = getDateGroupLabel(activity.created_at);
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(activity);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

export function CommunicationLog({
  entityId,
  companyId,
}: CommunicationLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('/api/activity', window.location.origin);
      url.searchParams.set('entity_type', 'lead');
      url.searchParams.set('entity_id', entityId);
      url.searchParams.set('activity_type', 'contact_made');

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch activities');

      const { data } = await response.json();
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading communication log:', error);
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    loadActivities();

    const channel = createActivityChannel(companyId);

    subscribeToActivityUpdates(
      channel,
      async (payload: ActivityUpdatePayload) => {
        if (payload.entity_id !== entityId) return;

        if (payload.action === 'INSERT') {
          try {
            const url = new URL('/api/activity', window.location.origin);
            url.searchParams.set('entity_type', 'lead');
            url.searchParams.set('entity_id', entityId);
            url.searchParams.set('activity_id', payload.record_id);

            const response = await fetch(url.toString());
            if (!response.ok) return;

            const { data } = await response.json();
            if (data && data.length > 0) {
              const activity: Activity = data[0];
              if (activity.activity_type === 'contact_made') {
                setActivities(prev => [activity, ...prev]);
              }
            }
          } catch (error) {
            console.error('Error fetching new activity:', error);
          }
        } else if (payload.action === 'DELETE') {
          setActivities(prev => prev.filter(a => a.id !== payload.record_id));
        }
      }
    );

    return () => {
      removeActivityChannel(channel);
    };
  }, [entityId, companyId, loadActivities]);

  const groups = groupActivitiesByDate(activities);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>Communication Log</div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>Communication Log</div>
      {activities.length === 0 ? (
        <div className={styles.empty}>No communication logged yet</div>
      ) : (
        <div className={styles.list}>
          {groups.map(group => (
            <div key={group.label}>
              <div className={styles.dateGroup}>{group.label}</div>
              {group.items.map(activity => {
                const contactType =
                  activity.metadata?.contact_type || 'contact';
                const outcome = activity.metadata?.contact_outcome;
                return (
                  <div key={activity.id} className={styles.entry}>
                    <div
                      className={`${styles.entryIcon} ${getIconBgClass(contactType, outcome)}`}
                    >
                      {getContactIcon(contactType, outcome)}
                    </div>
                    <div className={styles.entryBody}>
                      <div className={styles.entryText}>
                        {activity.notes || formatActivityDescription(activity)}
                        {activity.metadata?.chat_url && (
                          <>
                            {' - '}
                            <a
                              href={activity.metadata.chat_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.viewChatLink}
                            >
                              View Chat
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
