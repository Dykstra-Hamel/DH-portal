import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Quote } from '@/types/quote';
import {
  createQuoteChannel,
  subscribeToQuoteUpdates,
  removeQuoteChannel,
  broadcastQuoteUpdate,
  QuoteUpdatePayload,
} from '@/lib/realtime/quote-channel';

interface UseQuoteRealtimeOptions {
  leadId: string;
  userId?: string;
  onQuoteUpdate?: (quote: Quote) => void;
  enabled?: boolean;
}

interface UseQuoteRealtimeReturn {
  quote: Quote | null;
  isUpdating: boolean;
  isLoading: boolean;
  broadcastUpdate: (quote: Quote) => Promise<void>;
}

/**
 * Hook to manage real-time quote updates for a lead
 * Subscribes to quote updates via Supabase Realtime broadcast
 * Provides function to broadcast updates to other subscribers
 */
export function useQuoteRealtime({
  leadId,
  userId,
  onQuoteUpdate,
  enabled = true,
}: UseQuoteRealtimeOptions): UseQuoteRealtimeReturn {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stash the latest onQuoteUpdate in a ref so the channel subscription
  // doesn't tear down/rebuild every time the parent passes a new inline fn.
  const onQuoteUpdateRef = useRef(onQuoteUpdate);
  useEffect(() => {
    onQuoteUpdateRef.current = onQuoteUpdate;
  });

  // Stable across renders — does not depend on onQuoteUpdate identity.
  const handleQuoteUpdate = useCallback((payload: QuoteUpdatePayload) => {
    console.log('Received quote update:', payload);

    setIsUpdating(true);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    setQuote(payload.quote);

    onQuoteUpdateRef.current?.(payload.quote);

    updateTimeoutRef.current = setTimeout(() => {
      setIsUpdating(false);
    }, 500);
  }, []);

  // Function to broadcast quote update
  const broadcastUpdate = useCallback(
    async (updatedQuote: Quote) => {
      // Always update local state first
      setQuote(updatedQuote);

      // Then broadcast to other subscribers if possible
      if (!channelRef.current || !userId) {
        console.warn('Cannot broadcast: channel not ready or userId missing');
        return;
      }

      const payload: QuoteUpdatePayload = {
        lead_id: leadId,
        quote: updatedQuote,
        updated_by: userId,
        timestamp: new Date().toISOString(),
      };

      await broadcastQuoteUpdate(channelRef.current, payload);
    },
    [leadId, userId]
  );

  // Fetch initial quote
  useEffect(() => {
    if (!enabled || !leadId) {
      setQuote(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const fetchInitialQuote = async () => {
      try {
        const response = await fetch(`/api/leads/${leadId}/quote`);
        const data = await response.json();

        if (data.success && data.data) {
          setQuote(data.data);
        } else {
          setQuote(null);
        }
      } catch (error) {
        console.error('Error fetching initial quote:', error);
        setQuote(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialQuote();
  }, [enabled, leadId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled || !leadId) {
      return;
    }

    // Create channel
    const channel = createQuoteChannel(leadId);
    channelRef.current = channel;

    // Subscribe to updates
    subscribeToQuoteUpdates(channel, handleQuoteUpdate);

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        removeQuoteChannel(channelRef.current);
        channelRef.current = null;
      }

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [enabled, leadId, handleQuoteUpdate]);

  return {
    quote,
    isUpdating,
    isLoading,
    broadcastUpdate,
  };
}