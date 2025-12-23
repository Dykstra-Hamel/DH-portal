/**
 * Shared helper utilities for Supabase Realtime channel subscriptions
 * Provides consistent error handling and reconnection logic across all channels
 */

import { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Enhanced subscription handler with better error handling and logging
 *
 * @param status - The subscription status from Supabase
 * @param channelName - Name of the channel for logging
 * @param reconnectAttempts - Current reconnection attempt count (mutable)
 */
export function handleSubscriptionStatus(
  status: string,
  channelName: string,
  reconnectAttempts: { current: number }
): void {
  if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
    // Successfully subscribed, reset reconnect attempts
    reconnectAttempts.current = 0;
    if (isDevelopment) {
      console.log(`✅ Realtime subscribed: ${channelName}`);
    }
  } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
    // Only log error once, not repeatedly
    if (isDevelopment && reconnectAttempts.current === 0) {
      console.warn(`⚠️ Realtime channel error: ${channelName}`);
    }
  } else if (status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT) {
    // Only log timeout once
    if (isDevelopment && reconnectAttempts.current === 0) {
      console.warn(`⏱️ Realtime timed out: ${channelName}`);
    }
  } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
    if (isDevelopment) {
      console.log(`🔌 Realtime channel closed: ${channelName}`);
    }
  }
}

/**
 * Simple subscription handler for utility functions that don't need reconnection
 * Used in channel helper files that are called by components
 *
 * @param status - The subscription status from Supabase
 * @param channelName - Optional channel name for logging
 */
export function simpleSubscriptionHandler(
  status: string,
  channelName?: string
): void {
  const name = channelName || 'channel';

  if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
    // Successfully subscribed
  } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
    if (isDevelopment) {
      console.warn(`⚠️ Channel error: ${name}`);
    }
  } else if (status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT) {
    if (isDevelopment) {
      console.warn(`⏱️ Timed out: ${name}`);
    }
  }
}

/**
 * Log errors in development only, suppress in production
 *
 * @param context - Description of where the error occurred
 * @param error - The error object or message
 */
export function logRealtimeError(context: string, error: unknown): void {
  if (isDevelopment) {
    console.error(`[Realtime] ${context}:`, error);
  }
}
