'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Lead } from '@/types/lead';
import {
  createLeadReviewChannel,
  subscribeToLeadReviewUpdates,
  type LeadReviewPayload,
} from '@/lib/realtime/lead-review-channel';
import type { LeadReviewStatus } from '@/components/Leads/LeadsList/LeadsList';

/**
 * Builds and maintains a Map<leadId, LeadReviewStatus> by:
 *   1. Seeding from each lead's `reviewed_by` / `review_expires_at` fields
 *      (server-rendered on the first fetch).
 *   2. Listening to the broadcast channel for live changes.
 *   3. Pruning expired locks every 30s.
 *
 * Pure parity with the ticket pattern in `TicketsList`. Multiple consumers
 * (LeadsList, my-sales-leads, archived-leads, FieldSalesLeadsDashboard,
 * etc.) can call this hook independently — they each get their own Map but
 * subscribe to the same singleton channel.
 */
export function useLeadReviewStatuses(
  leads: Pick<
    Lead,
    'id' | 'reviewed_by' | 'review_expires_at' | 'reviewed_by_profile'
  >[]
): Map<string, LeadReviewStatus> {
  const [statuses, setStatuses] = useState<Map<string, LeadReviewStatus>>(
    new Map()
  );
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const initial = new Map<string, LeadReviewStatus>();
    leads.forEach(lead => {
      if (
        lead.reviewed_by &&
        lead.review_expires_at &&
        new Date(lead.review_expires_at) > new Date()
      ) {
        initial.set(lead.id, {
          reviewedBy: lead.reviewed_by,
          reviewedByName: lead.reviewed_by_profile
            ? `${lead.reviewed_by_profile.first_name || ''} ${lead.reviewed_by_profile.last_name || ''}`.trim()
            : undefined,
          reviewedByEmail: lead.reviewed_by_profile?.email ?? undefined,
          reviewedByFirstName:
            lead.reviewed_by_profile?.first_name ?? undefined,
          reviewedByLastName:
            lead.reviewed_by_profile?.last_name ?? undefined,
          reviewedByAvatarUrl:
            lead.reviewed_by_profile?.uploaded_avatar_url ??
            lead.reviewed_by_profile?.avatar_url ??
            null,
          expiresAt: lead.review_expires_at,
        });
      }
    });
    setStatuses(initial);

    const channel = createLeadReviewChannel();
    channelRef.current = channel;
    subscribeToLeadReviewUpdates(channel, (payload: LeadReviewPayload) => {
      setStatuses(prev => {
        const updated = new Map(prev);
        if (payload.reviewed_by && payload.review_expires_at) {
          updated.set(payload.lead_id, {
            reviewedBy: payload.reviewed_by,
            reviewedByName: payload.reviewed_by_name,
            reviewedByEmail: payload.reviewed_by_email,
            reviewedByFirstName: payload.reviewed_by_first_name,
            reviewedByLastName: payload.reviewed_by_last_name,
            reviewedByAvatarUrl: payload.reviewed_by_avatar_url,
            expiresAt: payload.review_expires_at,
          });
        } else {
          updated.delete(payload.lead_id);
        }
        return updated;
      });
    });
  }, [leads]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setStatuses(prev => {
        const updated = new Map(prev);
        const now = Date.now();
        let changed = false;
        updated.forEach((status, leadId) => {
          if (new Date(status.expiresAt).getTime() < now) {
            updated.delete(leadId);
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }, 30000);
    return () => clearInterval(cleanup);
  }, []);

  return statuses;
}
