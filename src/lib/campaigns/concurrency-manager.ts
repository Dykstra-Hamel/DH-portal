/**
 * Concurrency Manager for Campaign Phone Calls
 *
 * Manages the max 10 concurrent outbound calls limit imposed by Retell AI.
 * Tracks active calls and prevents exceeding the concurrency limit.
 */

import { createAdminClient } from '@/lib/supabase/server-admin';

const MAX_CONCURRENT_CALLS = 10;
const CALL_TIMEOUT_HOURS = 1; // Consider calls older than 1 hour as stale

export interface ActiveCallInfo {
  id: string;
  campaignId: string;
  executionId: string | null;
  retellCallId: string | null;
  callStartedAt: string;
  durationMinutes: number;
}

/**
 * Gets the count of currently active calls across all campaigns
 */
export async function getActiveCallsCount(campaignId?: string): Promise<number> {
  const supabase = createAdminClient();

  let query = supabase
    .from('campaign_concurrency_tracker')
    .select('id', { count: 'exact', head: true })
    .is('call_completed_at', null)
    .gt('call_started_at', new Date(Date.now() - CALL_TIMEOUT_HOURS * 60 * 60 * 1000).toISOString());

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error getting active calls count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Gets detailed information about currently active calls
 */
export async function getActiveCallsDetails(campaignId?: string): Promise<ActiveCallInfo[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('campaign_concurrency_tracker')
    .select('*')
    .is('call_completed_at', null)
    .gt('call_started_at', new Date(Date.now() - CALL_TIMEOUT_HOURS * 60 * 60 * 1000).toISOString())
    .order('call_started_at', { ascending: false });

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting active calls details:', error);
    return [];
  }

  return (data || []).map(call => ({
    id: call.id,
    campaignId: call.campaign_id,
    executionId: call.execution_id,
    retellCallId: call.retell_call_id,
    callStartedAt: call.call_started_at,
    durationMinutes: Math.floor((Date.now() - new Date(call.call_started_at).getTime()) / 60000),
  }));
}

/**
 * Checks if a new call can be started (under the concurrency limit)
 */
export async function canStartNewCall(): Promise<boolean> {
  const activeCount = await getActiveCallsCount();
  return activeCount < MAX_CONCURRENT_CALLS;
}

/**
 * Tracks the start of a new campaign call
 */
export async function trackCallStart(
  campaignId: string,
  retellCallId: string,
  executionId?: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('campaign_concurrency_tracker')
    .insert({
      campaign_id: campaignId,
      execution_id: executionId || null,
      retell_call_id: retellCallId,
      call_started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error tracking call start:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Tracks the completion of a campaign call
 */
export async function trackCallEnd(
  retellCallId: string,
  durationSeconds?: number
): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('campaign_concurrency_tracker')
    .update({
      call_completed_at: new Date().toISOString(),
      call_duration_seconds: durationSeconds || null,
    })
    .eq('retell_call_id', retellCallId)
    .is('call_completed_at', null);

  if (error) {
    console.error('Error tracking call end:', error);
    return false;
  }

  return true;
}

/**
 * Waits for an available call slot with timeout
 * Polls every 10 seconds until a slot is available or timeout is reached
 */
export async function waitForAvailableSlot(
  timeoutMs: number = 300000 // 5 minutes default
): Promise<boolean> {
  const startTime = Date.now();
  const pollInterval = 10000; // 10 seconds

  while (Date.now() - startTime < timeoutMs) {
    if (await canStartNewCall()) {
      return true;
    }

    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  // Timeout reached
  return false;
}

/**
 * Cleans up stale call tracking records (calls older than timeout period)
 */
export async function cleanupStaleCalls(): Promise<number> {
  const supabase = createAdminClient();

  const staleThreshold = new Date(
    Date.now() - CALL_TIMEOUT_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from('campaign_concurrency_tracker')
    .update({
      call_completed_at: new Date().toISOString(),
      call_duration_seconds: CALL_TIMEOUT_HOURS * 3600,
    })
    .is('call_completed_at', null)
    .lt('call_started_at', staleThreshold)
    .select('id');

  if (error) {
    console.error('Error cleaning up stale calls:', error);
    return 0;
  }

  const cleanedCount = data?.length || 0;

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} stale call tracking records`);
  }

  return cleanedCount;
}

/**
 * Gets concurrency statistics for monitoring
 */
export async function getConcurrencyStats(): Promise<{
  activeCalls: number;
  availableSlots: number;
  maxConcurrency: number;
  utilizationPercent: number;
}> {
  const activeCalls = await getActiveCallsCount();
  const availableSlots = Math.max(0, MAX_CONCURRENT_CALLS - activeCalls);
  const utilizationPercent = Math.round((activeCalls / MAX_CONCURRENT_CALLS) * 100);

  return {
    activeCalls,
    availableSlots,
    maxConcurrency: MAX_CONCURRENT_CALLS,
    utilizationPercent,
  };
}

/**
 * Estimates wait time for next available slot based on current call durations
 */
export async function estimateWaitTime(): Promise<number> {
  const activeCalls = await getActiveCallsDetails();

  if (activeCalls.length < MAX_CONCURRENT_CALLS) {
    return 0; // Slot available now
  }

  // Find the call that started earliest (most likely to finish soonest)
  const oldestCall = activeCalls.reduce((oldest, call) => {
    return new Date(call.callStartedAt) < new Date(oldest.callStartedAt)
      ? call
      : oldest;
  }, activeCalls[0]);

  // Estimate: assume average call duration of 5 minutes
  // If a call has been running for 4 minutes, estimate 1 minute remaining
  const avgCallDurationMinutes = 5;
  const estimatedWaitMinutes = Math.max(
    1,
    avgCallDurationMinutes - oldestCall.durationMinutes
  );

  return estimatedWaitMinutes;
}
