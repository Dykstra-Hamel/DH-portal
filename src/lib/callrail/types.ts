import { CallRailCall } from './client';

// Analytics data types for dashboard
export interface CallAnalytics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  averageDuration: number; // in seconds
  conversionRate: number; // percentage
  totalValue: number;
}

export interface CallVolumeData {
  date: string;
  calls: number;
  answered: number;
  missed: number;
}

export interface CallSourceData {
  source: string;
  calls: number;
  answered: number;
  value: number;
}

export interface CallStatusData {
  status: string;
  calls: number;
  percentage: number;
}

// Transform CallRail data for our dashboard
export function calculateCallAnalytics(calls: CallRailCall[]): CallAnalytics {
  const totalCalls = calls.length;
  const answeredCalls = calls.filter(call => call.answered).length;
  const missedCalls = totalCalls - answeredCalls;
  
  const totalDuration = calls
    .filter(call => call.answered && call.duration)
    .reduce((sum, call) => sum + call.duration, 0);
    
  const averageDuration = answeredCalls > 0 ? totalDuration / answeredCalls : 0;
  
  const conversionRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;
  
  const totalValue = calls.reduce((sum, call) => sum + (call.value || 0), 0);

  return {
    totalCalls,
    answeredCalls,
    missedCalls,
    averageDuration,
    conversionRate,
    totalValue
  };
}

export function groupCallsByDate(calls: CallRailCall[]): CallVolumeData[] {
  const grouped = calls.reduce((acc, call) => {
    const date = call.start_time.split('T')[0]; // Get YYYY-MM-DD
    
    if (!acc[date]) {
      acc[date] = { date, calls: 0, answered: 0, missed: 0 };
    }
    
    acc[date].calls += 1;
    if (call.answered) {
      acc[date].answered += 1;
    } else {
      acc[date].missed += 1;
    }
    
    return acc;
  }, {} as Record<string, CallVolumeData>);

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

export function groupCallsBySource(calls: CallRailCall[]): CallSourceData[] {
  const grouped = calls.reduce((acc, call) => {
    const source = call.source || call.medium || 'Direct';
    
    if (!acc[source]) {
      acc[source] = { source, calls: 0, answered: 0, value: 0 };
    }
    
    acc[source].calls += 1;
    if (call.answered) {
      acc[source].answered += 1;
    }
    acc[source].value += call.value || 0;
    
    return acc;
  }, {} as Record<string, CallSourceData>);

  return Object.values(grouped).sort((a, b) => b.calls - a.calls);
}

export function getCallStatusBreakdown(calls: CallRailCall[]): CallStatusData[] {
  const total = calls.length;
  
  if (total === 0) {
    return [];
  }
  
  const answered = calls.filter(call => call.answered).length;
  const voicemail = calls.filter(call => call.voicemail).length;
  const missed = total - answered - voicemail;

  return [
    {
      status: 'Answered',
      calls: answered,
      percentage: Math.round((answered / total) * 100)
    },
    {
      status: 'Voicemail',
      calls: voicemail,
      percentage: Math.round((voicemail / total) * 100)
    },
    {
      status: 'Missed',
      calls: missed,
      percentage: Math.round((missed / total) * 100)
    }
  ].filter(item => item.calls > 0);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a US/Canada number (11 digits starting with 1)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const number = cleaned.slice(1);
    return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  }
  
  // Check if it's a 10-digit US number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return original if we can't format it
  return phoneNumber;
}