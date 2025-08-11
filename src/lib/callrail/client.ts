// CallRail API Client
// Documentation: https://apidocs.callrail.com/

export interface CallRailCall {
  id: string;
  direction: 'inbound' | 'outbound';
  business_phone_number: string;
  customer_phone_number: string;
  tracking_phone_number: string;
  customer_name?: string;
  customer_city?: string;
  customer_state?: string;
  customer_country?: string;
  start_time: string;
  duration: number; // in seconds
  recording?: string; // URL to recording
  recording_duration?: number;
  voicemail?: boolean;
  answered?: boolean;
  first_call?: boolean;
  total_calls?: number;
  value?: number;
  lead_status?: string;
  note?: string;
  tags?: string[];
  formatted_customer_phone_number?: string;
  formatted_business_phone_number?: string;
  formatted_customer_location?: string;
  company_id?: string;
  tracker_id?: string;
  campaign?: string;
  source?: string;
  medium?: string;
  referring_url?: string;
  landing_page_url?: string;
  last_requested_url?: string;
  conversions?: any[];
}

export interface CallRailAccount {
  id: string;
  name: string;
  outbound_recording_enabled: boolean;
  hipaa_account: boolean;
}

export interface CallRailApiResponse<T> {
  calls?: T[];
  accounts?: T[];
  total_records: number;
  page: number;
  per_page: number;
}

export class CallRailClient {
  private apiToken: string;
  private baseUrl = 'https://api.callrail.com/v3';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Token token="${this.apiToken}"`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CallRail API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async getAccounts(): Promise<CallRailAccount[]> {
    const response = await this.makeRequest<CallRailApiResponse<CallRailAccount>>('/a.json');
    return response.accounts || [];
  }

  async getCalls(
    accountId: string,
    options: {
      startDate?: string; // YYYY-MM-DD format
      endDate?: string;   // YYYY-MM-DD format
      page?: number;
      perPage?: number;
      answered?: boolean;
      direction?: 'inbound' | 'outbound';
    } = {}
  ): Promise<{ calls: CallRailCall[]; totalRecords: number }> {
    const params: Record<string, any> = {
      start_date: options.startDate,
      end_date: options.endDate,
      page: options.page || 1,
      per_page: options.perPage || 100,
      answered: options.answered,
      direction: options.direction,
      fields: 'id,direction,business_phone_number,customer_phone_number,customer_name,customer_city,customer_state,start_time,duration,recording,answered,voicemail,first_call,value,lead_status,note,tags,campaign,source,medium,referring_url,landing_page_url,tracking_phone_number,formatted_customer_phone_number,formatted_business_phone_number'
    };

    const response = await this.makeRequest<CallRailApiResponse<CallRailCall>>(
      `/a/${accountId}/calls.json`,
      params
    );

    return {
      calls: response.calls || [],
      totalRecords: response.total_records || 0
    };
  }

  async getRecentCalls(
    accountId: string,
    days: number = 30
  ): Promise<CallRailCall[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const { calls } = await this.getCalls(accountId, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      perPage: 100,
      direction: 'inbound' // Focus on inbound calls for lead tracking
    });

    return calls;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getAccounts();
      return true;
    } catch (error) {
      console.error('CallRail connection test failed:', error);
      return false;
    }
  }
}