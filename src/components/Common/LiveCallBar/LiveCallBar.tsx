'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CallRecord } from '@/types/call-record';
import { Ticket } from '@/types/ticket';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import LoadingSpinner from '@/components/Common/LoadingSpinner/LoadingSpinner';
import styles from './LiveCallBar.module.scss';

interface LiveCallBarProps {
  tickets?: Ticket[];
  liveCallsData?: CallRecord[]; // Keep for backward compatibility - will be deprecated
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
const formatDuration = (startTime: string): string => {
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  const diffSeconds = Math.floor((now - start) / 1000);
  
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

const formatCallStarted = (startTime: string): string => {
  return new Date(startTime).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });
};

export default function LiveCallBar({ tickets = [], liveCallsData = [] }: LiveCallBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sortConfig, setSortConfig] = useState<{ direction: 'asc' | 'desc' } | null>(null);
  const [realTimeTickets, setRealTimeTickets] = useState<Ticket[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [useMock, setUseMock] = useState<boolean>(false);

  // Use global company context for real-time filtering
  const { selectedCompany } = useCompany();

  // Update current time every second for live duration calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize mock mode from localStorage or env (client-side only)
  useEffect(() => {
    try {
      const ls = typeof window !== 'undefined' ? window.localStorage.getItem('USE_MOCK_LIVE_CALLS') : null;
      if (ls !== null) {
        setUseMock(ls === 'true');
        return;
      }
    } catch {}

    // Fallback to env flag (inlined at build time in Next.js)
    if (process.env.NEXT_PUBLIC_USE_MOCK_LIVE_CALLS === 'true') {
      setUseMock(true);
    }
  }, []);


  // Handle real-time ticket changes - EXACT SAME LOGIC AS TICKETS PAGE
  const handleTicketChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        // Add new ticket to the list - EXACT SAME AS TICKETS PAGE
        if (newRecord) {
          setRealTimeTickets(prev => {
            // Check if already exists to prevent duplicates
            const exists = prev.some(ticket => ticket.id === newRecord.id);
            if (!exists) {
              return [newRecord, ...prev]; // Add to beginning for newest first
            }
            return prev;
          });
        }
        break;

      case 'UPDATE':
        // Update existing ticket - EXACT SAME AS TICKETS PAGE
        if (newRecord) {
          setRealTimeTickets(prev =>
            prev.map(ticket => ticket.id === newRecord.id ? newRecord : ticket)
          );
        }
        break;

      case 'DELETE':
        // Remove ticket from list - EXACT SAME AS TICKETS PAGE
        if (oldRecord) {
          setRealTimeTickets(prev => prev.filter(ticket => ticket.id !== oldRecord.id));
        }
        break;
    }
  }, []);


  // Supabase Realtime subscription for ticket and call_records updates (disabled in mock mode)
  useEffect(() => {
    if (useMock) return; // Skip realtime when mocking
    if (!selectedCompany?.id) return;

    const supabase = createClient();

    const channel = supabase
      .channel('live-call-bar-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `company_id=eq.${selectedCompany.id}`
        },
        (payload) => {
          console.log('LiveCallBar: Ticket update:', payload);
          handleTicketChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_records'
        },
        (payload) => {
          console.log('LiveCallBar: Call record update:', payload);
          // When call_records update, we rely on the parent component (tickets page) to
          // refresh and pass updated tickets through props. The real-time tickets from
          // our subscription don't have the call_records relationships, so we'll mainly
          // use the prop tickets which have the full joined data.

          // Just trigger a re-render by updating state slightly
          setRealTimeTickets(prev => [...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCompany?.id, handleTicketChange, useMock]);

  // Extract live calls from tickets with 'live' status only
  const liveCallsFromTickets = useMemo(() => {
    const liveCalls: CallRecord[] = [];

    // Combine real-time tickets with prop tickets (real-time takes precedence)
    const allTickets = [...realTimeTickets];

    // Add prop tickets that aren't already in real-time tickets
    tickets.forEach(ticket => {
      const existsInRealTime = realTimeTickets.some(rtTicket => rtTicket.id === ticket.id);
      if (!existsInRealTime) {
        allTickets.push(ticket);
      }
    });

    // Show tickets with 'live' status only - webhook will update status to 'new' when analysis arrives
    allTickets.forEach(ticket => {
      console.log('LiveCallBar: Processing ticket', ticket.id, 'status:', ticket.status, 'type:', ticket.type);

      if (ticket.status === 'live') {
        // Active calls with 'live' status - show immediately, fill in data as it arrives
        if (ticket.call_records && ticket.call_records.length > 0) {
          // Use the actual call records from the joined data
          console.log('LiveCallBar: Adding call records:', ticket.call_records.length, 'for ticket:', ticket.id);
          liveCalls.push(...(ticket.call_records as CallRecord[]));
        } else {
          // Show immediately with fallback data, will update when call_records arrive
          console.log('LiveCallBar: Adding fallback call record for ticket:', ticket.id);
          const fallbackCallRecord: CallRecord = {
            id: `ticket-${ticket.id}`,
            call_id: `ticket-call-${ticket.id}`,
            customer_id: ticket.customer_id,
            phone_number: ticket.customer?.phone || 'Incoming Call',
            from_number: ticket.customer?.phone || undefined, // Set from_number too
            call_status: 'ongoing',
            start_timestamp: ticket.created_at,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at || ticket.created_at
          };

          liveCalls.push(fallbackCallRecord);
        }
      }
    });

    return liveCalls;
  }, [tickets, realTimeTickets]);

  // Mock data for development styling/testing
  const mockCalls: CallRecord[] = useMemo(() => [
    {
      id: 'mock-1',
      call_id: 'mock-call-1',
      customer_id: 'mock-customer-1',
      phone_number: '(555) 123-4567',
      from_number: '+15551234567',
      call_status: 'ongoing',
      start_timestamp: new Date(Date.now() - 125000).toISOString(), // ~2 minutes ago
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-2',
      call_id: 'mock-call-2',
      customer_id: 'mock-customer-2',
      phone_number: '(555) 987-6543',
      from_number: '+15559876543',
      call_status: 'processing',
      start_timestamp: new Date(Date.now() - 45000).toISOString(), // ~45 seconds ago
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-3',
      call_id: 'mock-call-3',
      customer_id: 'mock-customer-3',
      phone_number: '(555) 456-7890',
      from_number: '+15554567890',
      call_status: 'transferring',
      start_timestamp: new Date(Date.now() - 15000).toISOString(), // ~15 seconds ago
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ], [currentTime]);

  // Priority order: live calls from tickets (includes real-time) > fallback prop data
  const validLiveCalls = useMock
    ? mockCalls
    : (liveCallsFromTickets.length > 0
      ? liveCallsFromTickets
      : liveCallsData);

  const hasLiveCalls = validLiveCalls.length > 0;
  const liveCallCount = validLiveCalls.length;


  const handleSort = () => {
    setSortConfig(prev => ({
      direction: prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort calls by start time using valid calls only
  const sortedCalls = [...validLiveCalls].sort((a, b) => {
    if (!sortConfig) return 0;

    const aTime = new Date(a.start_timestamp || '').getTime();
    const bTime = new Date(b.start_timestamp || '').getTime();

    return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
  });

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
              {liveCallCount} Live Call{liveCallCount > 1 ? 's' : ''} In Progress
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
            {process.env.NODE_ENV !== 'production' && (
              <button
                className={styles.expandCollapseButton}
                onClick={() => {
                  const next = !useMock;
                  setUseMock(next);
                  try {
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('USE_MOCK_LIVE_CALLS', String(next));
                    }
                  } catch {}
                }}
                title={useMock ? 'Switch to live data' : 'Switch to mock data'}
              >
                <span>{useMock ? 'Use Live Data' : 'Use Mock Data'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Call Details Grid */}
        <div className={`${styles.callDetailsGrid} ${isExpanded ? styles.expanded : styles.collapsed}`}>
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
          {sortedCalls.map((call) => (
            <div key={call.id} className={styles.gridRow}>
              <div className={styles.gridCell}>
                {call.start_timestamp ? formatCallStarted(call.start_timestamp) : 'N/A'}
              </div>
              <div className={styles.gridCell}>
                {call.call_status === 'transferring' ? (
                  <div className={styles.statusWithIcon}>
                    <TransferIcon />
                    <span>Call Transferring</span>
                  </div>
                ) : call.call_status === 'processing' ? (
                  <div className={styles.statusWithSpinner}>
                    <LoadingSpinner size={14} />
                    <span>Processing Call</span>
                  </div>
                ) : call.call_status === 'ongoing' ? (
                  <div className={styles.statusWithIcon}>
                    <AnimatedSoundWaveIcon />
                    <span>Caller with AI Agent</span>
                  </div>
                ) : (
                  <span>
                    {call.call_status === 'in-progress' ? 'In Progress' :
                     call.call_status === 'active' ? 'Active' :
                     call.call_status === 'connecting' ? 'Connecting' :
                     call.call_status || 'In Progress'}
                  </span>
                )}
              </div>
              <div className={styles.gridCell}>
                {call.from_number ? formatPhoneNumber(call.from_number) : 'Unknown Caller'}
              </div>
              <div className={styles.gridCell}>
                {call.from_number ? formatPhoneNumber(call.from_number) : 'N/A'}
              </div>
              <div className={styles.gridCell}>
                {call.start_timestamp ? formatDuration(call.start_timestamp) : '00:00:00'}
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
