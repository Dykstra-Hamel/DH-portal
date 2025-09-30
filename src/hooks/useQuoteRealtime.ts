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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Callback to handle incoming quote updates
  const handleQuoteUpdate = useCallback(
    (payload: QuoteUpdatePayload) => {
      console.log('Received quote update:', payload);

      // Show updating indicator briefly
      setIsUpdating(true);

      // Clear any existing timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Update quote state
      setQuote(payload.quote);

      // Call external callback if provided
      if (onQuoteUpdate) {
        onQuoteUpdate(payload.quote);
      }

      // Hide updating indicator after 500ms
      updateTimeoutRef.current = setTimeout(() => {
        setIsUpdating(false);
      }, 500);
    },
    [onQuoteUpdate]
  );

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
      return;
    }

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
    broadcastUpdate,
  };
}