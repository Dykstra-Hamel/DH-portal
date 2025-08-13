export type CallStatus =
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no_answer'
  | 'cancelled';
export type CallSentiment = 'positive' | 'negative' | 'neutral';

export interface CallRecord {
  id: string;
  call_id: string;
  lead_id?: string;
  customer_id?: string;
  phone_number: string;
  from_number?: string;
  call_status: CallStatus;
  start_timestamp?: string;
  end_timestamp?: string;
  duration_seconds?: number;
  recording_url?: string;
  transcript?: string;
  call_analysis?: any; // Raw Retell analysis object

  // Extracted structured data
  sentiment?: CallSentiment;
  home_size?: string;
  yard_size?: string;
  budget_range?: string;
  timeline?: string;
  pain_points?: string[];
  decision_maker?: string;
  pest_issue?: string;
  street_address?: string;
  preferred_service_time?: string;
  contacted_other_companies?: boolean;
  opt_out_sensitive_data_storage?: boolean;

  disconnect_reason?: string;
  retell_variables?: any;

  created_at: string;
  updated_at: string;
}

export interface RetellWebhookPayload {
  call_id: string;
  call_type: string;
  phone_number: string;
  from_number: string;
  to_number: string;
  call_status: CallStatus;
  start_timestamp?: number;
  end_timestamp?: number;
  recording_url?: string;
  transcript?: string;
  call_analysis?: {
    sentiment?: CallSentiment;
    summary?: string;
    custom_analysis?: {
      home_size?: string;
      yard_size?: string;
      budget_range?: string;
      timeline?: string;
      pain_points?: string[];
      decision_maker?: string;
    };
  };
  retell_llm_dynamic_variables?: any;
  call_duration?: number;
  disconnect_reason?: string;
}

export interface CallSummary {
  total_calls: number;
  successful_calls: number;
  average_duration: number;
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
}
