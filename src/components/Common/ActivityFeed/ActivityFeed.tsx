import React, { useState, useEffect } from 'react';
import type { Activity, EntityType } from '@/types/activity';
import { FIELD_LABELS } from '@/types/activity';
import {
  createActivityChannel,
  subscribeToActivityUpdates,
  removeActivityChannel,
  type ActivityUpdatePayload,
} from '@/lib/realtime/activity-channel';
import styles from './ActivityFeed.module.scss';

interface ActivityFeedProps {
  entityType: EntityType;
  entityId: string;
  companyId: string;
}

export function ActivityFeed({
  entityType,
  entityId,
  companyId,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    subscribeToActivities();
  }, [entityType, entityId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/activity', window.location.origin);
      url.searchParams.set('entity_type', entityType);
      url.searchParams.set('entity_id', entityId);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch activities');

      const { data } = await response.json();
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToActivities = () => {
    const channel = createActivityChannel(companyId);

    subscribeToActivityUpdates(channel, async (payload: ActivityUpdatePayload) => {
      // Only process updates for the current entity
      if (payload.entity_id !== entityId) {
        return;
      }

      // Handle INSERT: Fetch the new activity and add to the list
      if (payload.action === 'INSERT') {
        try {
          const url = new URL('/api/activity', window.location.origin);
          url.searchParams.set('entity_type', entityType);
          url.searchParams.set('entity_id', entityId);
          url.searchParams.set('activity_id', payload.record_id);

          const response = await fetch(url.toString());
          if (!response.ok) throw new Error('Failed to fetch new activity');

          const { data } = await response.json();
          if (data && data.length > 0) {
            setActivities(prev => [data[0], ...prev]);
          }
        } catch (error) {
          console.error('Error fetching new activity:', error);
        }
      }

      // Handle UPDATE: Refetch all activities to ensure consistency
      else if (payload.action === 'UPDATE') {
        loadActivities();
      }

      // Handle DELETE: Remove the activity from the list
      else if (payload.action === 'DELETE') {
        setActivities(prev => prev.filter(a => a.id !== payload.record_id));
      }
    });

    return () => {
      removeActivityChannel(channel);
    };
  };

  const getFieldLabel = (fieldName: string): string => {
    return FIELD_LABELS[fieldName] || fieldName.replace(/_/g, ' ');
  };

  const formatFieldValue = (fieldName: string, value: string | null): string => {
    if (!value) return '';

    // Map lead status values to their display names
    if (fieldName === 'lead_status') {
      const statusMap: Record<string, string> = {
        'new': 'New',
        'unassigned': 'Assign',
        'contacting': 'Communication',
        'quoted': 'Quote',
        'ready_to_schedule': 'Schedule',
        'scheduled': 'Scheduled',
        'completed': 'Completed',
        'won': 'Won',
        'lost': 'Lost',
      };
      return statusMap[value.toLowerCase()] || value;
    }

    return value;
  };

  const formatActivityText = (activity: Activity): { main: React.ReactNode; detail: React.ReactNode } => {
    const userName = activity.user
      ? `${activity.user.first_name || ''} ${activity.user.last_name || ''}`.trim() ||
        activity.user.email
      : 'System';

    switch (activity.activity_type) {
      case 'field_update':
      case 'status_change':
        const fieldName = activity.field_name || '';
        const formattedOldValue = formatFieldValue(fieldName, activity.old_value || null);
        const formattedNewValue = formatFieldValue(fieldName, activity.new_value || null);

        return {
          main: (
            <span className={styles.activityText}>
              <span className={styles.userName}>{userName}</span> updated{' '}
              <strong>{getFieldLabel(fieldName)}</strong>
            </span>
          ),
          detail: formattedOldValue && formattedNewValue && (
            <div className={styles.changeDetail}>
              {formattedOldValue} → {formattedNewValue}
            </div>
          ),
        };

      case 'note_added':
        return {
          main: (
            <span className={styles.activityText}>
              <span className={styles.userName}>{userName}</span> added a note
            </span>
          ),
          detail: activity.notes && (
            <div className={styles.noteContent}>
              &quot;{activity.notes}&quot;
            </div>
          ),
        };

      case 'contact_made':
        const contactType = activity.metadata?.contact_type || 'contact';
        let actionVerb = 'made contact';

        switch (contactType) {
          case 'email':
            actionVerb = 'sent an email';
            break;
          case 'text_message':
            actionVerb = 'sent a text';
            break;
          case 'outbound_call':
            actionVerb = 'made an outbound call';
            break;
          case 'live_call':
            actionVerb = 'made a live call';
            break;
          case 'ai_call':
            actionVerb = 'generated an AI agent phone call';
            break;
          default:
            actionVerb = `made ${contactType}`;
        }

        return {
          main: (
            <span className={styles.activityText}>
              <span className={styles.userName}>{userName}</span> {actionVerb}
            </span>
          ),
          detail: activity.notes && (
            <div className={styles.noteContent}>{activity.notes}</div>
          ),
        };

      case 'created':
        return {
          main: (
            <span className={styles.activityText}>
              <span className={styles.userName}>{userName}</span> created this{' '}
              {entityType}
            </span>
          ),
          detail: null,
        };

      case 'assignment_changed':
        return {
          main: (
            <span className={styles.activityText}>
              <span className={styles.userName}>{userName}</span> reassigned
            </span>
          ),
          detail: activity.old_value && activity.new_value && (
            <div className={styles.changeDetail}>
              {activity.old_value} → {activity.new_value}
            </div>
          ),
        };

      case 'task_completed':
        return {
          main: (
            <span className={styles.activityText}>
              <span className={styles.userName}>{userName}</span> completed a
              task
            </span>
          ),
          detail: activity.notes && (
            <div className={styles.noteContent}>{activity.notes}</div>
          ),
        };

      case 'cadence_started':
        return {
          main: (
            <span className={styles.activityText}>
              <span className={styles.userName}>{userName}</span> started a sales cadence
            </span>
          ),
          detail: activity.metadata?.cadence_name && (
            <div className={styles.noteContent}>
              Cadence: {activity.metadata.cadence_name}
            </div>
          ),
        };

      case 'cadence_paused':
        return {
          main: (
            <span className={styles.activityText}>
              <span className={styles.userName}>{userName}</span> paused a sales cadence
            </span>
          ),
          detail: null,
        };

      case 'cadence_ended':
        return {
          main: (
            <span className={styles.activityText}>
              <span className={styles.userName}>{userName}</span> ended a sales cadence
            </span>
          ),
          detail: null,
        };

      default:
        return {
          main: (
            <span className={styles.activityText}>
              <span className={styles.userName}>{userName}</span>{' '}
              {activity.activity_type.replace(/_/g, ' ')}
            </span>
          ),
          detail: null,
        };
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60)
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24)
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7)
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading activities...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className={styles.empty}>
        No activity recorded yet. Changes and notes will appear here.
      </div>
    );
  }

  return (
    <div className={styles.activityFeed}>
      <div className={styles.timeline}>
        {activities.map(activity => {
          const formatted = formatActivityText(activity);
          return (
            <div key={activity.id} className={styles.activityItem}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatarFallback}>
                  {activity.user?.first_name?.[0]?.toUpperCase() ||
                    activity.user?.email?.[0]?.toUpperCase() ||
                    'S'}
                </div>
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityRow}>
                  {formatted.main}
                  <div className={styles.timestamp}>
                    {formatTimestamp(activity.created_at)}
                  </div>
                </div>
                {formatted.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
