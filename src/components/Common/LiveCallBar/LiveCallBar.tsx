'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CallRecord } from '@/types/call-record';
import { Ticket } from '@/types/ticket';
import LoadingSpinner from '@/components/Common/LoadingSpinner/LoadingSpinner';
import { getCustomerDisplayName } from '@/lib/display-utils';
import styles from './LiveCallBar.module.scss';

type EnhancedCallRecord = CallRecord & { ticketInfo?: any };

interface LiveCallBarProps {
  liveTickets: Ticket[]; // Live tickets passed from parent (with status='live')
}

const NoCallsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="25"
    viewBox="0 0 24 25"
    fill="none"
    className={styles.noCallsIcon}
  >
    <path
      d="M20.985 13.1872C20.8912 14.9234 20.2966 16.5952 19.273 18.0006C18.2494 19.406 16.8406 20.4849 15.217 21.1067C13.5933 21.7286 11.8243 21.8668 10.1237 21.5047C8.42318 21.1426 6.86392 20.2957 5.63442 19.0664C4.40493 17.837 3.55785 16.2778 3.19558 14.5773C2.83331 12.8768 2.97136 11.1078 3.59304 9.48402C4.21472 7.86029 5.29342 6.45139 6.69874 5.42764C8.10406 4.40389 9.77583 3.80911 11.512 3.7152C11.917 3.6932 12.129 4.1752 11.914 4.5182C11.1949 5.66876 10.8869 7.02907 11.0405 8.37716C11.194 9.72524 11.7999 10.9815 12.7593 11.9409C13.7187 12.9003 14.9749 13.5062 16.323 13.6597C17.6711 13.8132 19.0314 13.5053 20.182 12.7862C20.526 12.5712 21.007 12.7822 20.985 13.1872Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RadioIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="25"
    viewBox="0 0 24 25"
    fill="none"
    className={styles.radioIcon}
  >
    <path
      d="M16.247 8.46216C17.37 9.58708 18.0007 11.1116 18.0007 12.7012C18.0007 14.2907 17.37 15.8152 16.247 16.9402M19.075 5.63416C20.9479 7.50919 21.9999 10.051 21.9999 12.7012C21.9999 15.3513 20.9479 17.8931 19.075 19.7682M4.92499 19.7682C3.05211 17.8931 2.00012 15.3513 2.00012 12.7012C2.00012 10.051 3.05211 7.50919 4.92499 5.63416M7.75299 16.9402C6.63 15.8152 5.99927 14.2907 5.99927 12.7012C5.99927 11.1116 6.63 9.58708 7.75299 8.46216M14 12.7012C14 13.8057 13.1046 14.7012 12 14.7012C10.8954 14.7012 9.99999 13.8057 9.99999 12.7012C9.99999 11.5966 10.8954 10.7012 12 10.7012C13.1046 10.7012 14 11.5966 14 12.7012Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AnimatedSoundWaveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="19"
    viewBox="0 0 18 19"
    fill="none"
    className={styles.soundWaveIcon}
  >
    <path
      d="M1.5 8.48145V10.7314M4.5 5.48145V13.7314M7.5 3.23145V16.7314M10.5 6.98145V12.2314M13.5 4.73145V14.4814M16.5 8.48145V10.7314"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TransferIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="19"
    viewBox="0 0 18 19"
    fill="none"
    className={styles.transferIcon}
  >
    <path
      d="M6 3.23145L3 6.23145M3 6.23145L6 9.23145M3 6.23145H15M12 16.7314L15 13.7314M15 13.7314L12 10.7314M15 13.7314L3 13.7314"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className={styles.chevronIcon}
  >
    <g opacity="0.5">
      <path
        d="M4.66675 9.99935L8.00008 13.3327L11.3334 9.99935M4.66675 5.99935L8.00008 2.66602L11.3334 5.99935"
        stroke="white"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

const ExpandCollapseIcon = ({ isExpanded }: { isExpanded: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="25"
    viewBox="0 0 24 25"
    fill="none"
    className={`${styles.expandCollapseIcon} ${isExpanded ? styles.expanded : ''}`}
  >
    <path
      d="M6 9.63184L12 15.6318L18 9.63184"
      stroke="white"
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Helper functions
const formatDuration = (
  startTime: string,
  currentTime: Date = new Date()
): string => {
  const start = new Date(startTime).getTime();
  const now = currentTime.getTime();
  const diffSeconds = Math.floor((now - start) / 1000);

  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatPhoneNumber = (phone: string): string => {
  // Handle empty or loading states
  if (!phone || phone.trim() === '') {
    return 'N/A';
  }
  if (phone === 'Loading...') {
    return phone;
  }

  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  // Return original if it doesn't match expected formats
  return phone || 'N/A';
};

const formatCallStarted = (startTime: string): string => {
  return new Date(startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export default function LiveCallBar({ liveTickets }: LiveCallBarProps) {
  const [sortConfig, setSortConfig] = useState<{
    direction: 'asc' | 'desc';
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayedCalls, setDisplayedCalls] = useState<EnhancedCallRecord[]>(
    []
  );
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const displayedCallsRef = useRef<EnhancedCallRecord[]>([]);

  // Keep ref in sync with state for stable access
  useEffect(() => {
    displayedCallsRef.current = displayedCalls;
  }, [displayedCalls]);

  // Extract live calls from tickets with 'live' status only, along with ticket info for customer names
  const liveCallsFromTickets = useMemo(() => {
    const liveCalls: EnhancedCallRecord[] = [];

    // Show tickets with 'live' status only - webhook will update status to 'new' when analysis arrives
    liveTickets.forEach(ticket => {
      if (ticket.status === 'live') {
        // Active calls with 'live' status - show immediately, fill in data as it arrives
        // Handle call_records being either a single object (one-to-one) or array (one-to-many)
        const hasCallRecords =
          ticket.call_records &&
          (Array.isArray(ticket.call_records)
            ? ticket.call_records.length > 0
            : (ticket.call_records as any).id);

        if (hasCallRecords) {
          // Use the actual call records from the joined data, attach ticket info for customer name
          // Normalize to array format
          const callRecordsArray = Array.isArray(ticket.call_records)
            ? ticket.call_records
            : [ticket.call_records];

          const enhancedCallRecords = (callRecordsArray as CallRecord[]).map(
            callRecord => ({
              ...callRecord,
              ticketInfo: {
                customer: ticket.customer,
              },
            })
          );
          liveCalls.push(...enhancedCallRecords);
        } else {
          // Show immediately with fallback data, will update when call_records arrive

          const fallbackCallRecord: CallRecord & { ticketInfo?: any } = {
            id: `ticket-${ticket.id}`,
            call_id: `ticket-call-${ticket.id}`,
            customer_id: ticket.customer_id,
            phone_number: ticket.customer?.phone || 'Loading...',
            from_number: ticket.customer?.phone || 'Loading...',
            call_status: 'ongoing',
            start_timestamp: ticket.created_at,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at || ticket.created_at,
            ticketInfo: {
              customer: ticket.customer,
            },
          };

          liveCalls.push(fallbackCallRecord);
        }
      }
    });

    return liveCalls;
  }, [liveTickets]);

  // Use live calls derived from tickets prop
  const validLiveCalls: EnhancedCallRecord[] = liveCallsFromTickets;

  useEffect(() => {
    if (validLiveCalls.length > 0) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setDisplayedCalls(validLiveCalls);
      return;
    }

    // Use ref instead of state to avoid feedback loop
    if (displayedCallsRef.current.length === 0) {
      return;
    }

    if (!hideTimerRef.current) {
      hideTimerRef.current = setTimeout(() => {
        setDisplayedCalls([]);
        hideTimerRef.current = null;
      }, 600);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [validLiveCalls]);

  const callsToRender =
    validLiveCalls.length > 0 ? validLiveCalls : displayedCalls;

  const hasLiveCalls = callsToRender.length > 0;
  const liveCallCount = callsToRender.length;

  // Update current time every second when there are live calls
  useEffect(() => {
    if (!hasLiveCalls) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [hasLiveCalls]);

  const handleSort = () => {
    setSortConfig(prev => ({
      direction: prev?.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Sort calls by start time using valid calls only
  const sortedCalls = useMemo(() => {
    if (!sortConfig) {
      return callsToRender;
    }

    const sorted = [...callsToRender].sort((a, b) => {
      const aTime = new Date(a.start_timestamp || '').getTime();
      const bTime = new Date(b.start_timestamp || '').getTime();

      return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
    });

    return sorted;
  }, [callsToRender, sortConfig]);

  if (!hasLiveCalls) {
    // No live calls state
    return (
      <div className={styles.liveCallBar}>
        <div className={styles.noCallsContent}>
          <NoCallsIcon />
          <span className={styles.noCallsText}>No Live Calls</span>
        </div>
      </div>
    );
  }

  // Live calls state
  return (
    <div className={`${styles.liveCallBar} ${styles.liveCallBackground}`}>
      <div className={styles.liveCallContent}>
        {/* Header */}
        <div className={styles.liveCallHeader}>
          <div className={styles.headerLeft}>
            <RadioIcon />
            <span className={styles.liveCallText}>
              {liveCallCount} Live Call{liveCallCount > 1 ? 's' : ''} In
              Progress
            </span>
          </div>
          <div>
            {liveCallCount > 1 && (
              <button
                className={styles.expandCollapseButton}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <span>{isExpanded ? 'Hide All' : 'View All'}</span>
                <ExpandCollapseIcon isExpanded={isExpanded} />
              </button>
            )}
          </div>
        </div>

        {/* Call Details Grid */}
        <div
          className={`${styles.callDetailsGrid} ${isExpanded ? styles.expanded : styles.collapsed}`}
        >
          {/* Grid Header */}
          <div className={styles.gridHeader}>
            <div
              className={`${styles.gridCell} ${styles.sortableHeader}`}
              onClick={handleSort}
            >
              <span>Call Started</span>
              <ChevronIcon />
            </div>
            <div className={styles.gridCell}>Status</div>
            <div className={styles.gridCell}>Caller ID</div>
            <div className={styles.gridCell}>Phone</div>
            <div className={styles.gridCell}>Duration</div>
            <div className={styles.gridCell}>Call Ended</div>
          </div>

          {/* Call Data Rows */}
          {sortedCalls.map(call => (
            <div key={call.id} className={styles.gridRow}>
              <div className={styles.gridCell}>
                {call.start_timestamp
                  ? formatCallStarted(call.start_timestamp)
                  : 'N/A'}
              </div>
              <div className={styles.gridCell}>
                {(() => {
                  // Simple status logic based on webhook events
                  const enhancedCall = call as CallRecord & {
                    disconnect_reason?: string;
                  };

                  // Processing call (after call_ended webhook)
                  if (call.call_status === 'processing') {
                    return (
                      <div className={styles.statusWithSpinner}>
                        <LoadingSpinner size={14} />
                        <span>Processing Call</span>
                      </div>
                    );
                  }

                  // Call transfer (based on disconnect_reason from webhook)
                  if (enhancedCall.disconnect_reason === 'call_transfer') {
                    return (
                      <div className={styles.statusWithIcon}>
                        <TransferIcon />
                        <span>Call Transferring</span>
                      </div>
                    );
                  }

                  // Default for all other cases: active calls with AI agent
                  return (
                    <div className={styles.statusWithIcon}>
                      <AnimatedSoundWaveIcon />
                      <span>Caller with AI Agent</span>
                    </div>
                  );
                })()}
              </div>
              <div className={styles.gridCell}>
                {(() => {
                  const enhancedCall = call as CallRecord & {
                    ticketInfo?: any;
                  };
                  return getCustomerDisplayName(
                    enhancedCall.ticketInfo?.customer
                  );
                })()}
              </div>
              <div className={styles.gridCell}>
                {formatPhoneNumber(call.from_number || call.phone_number || '')}
              </div>
              <div className={styles.gridCell}>
                {call.start_timestamp
                  ? formatDuration(call.start_timestamp, currentTime)
                  : '00:00:00'}
              </div>
              <div className={styles.gridCell}>
                {/* Empty for active calls */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
