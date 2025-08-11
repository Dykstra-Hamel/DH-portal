import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CallRailClient } from '@/lib/callrail/client';
import { 
  calculateCallAnalytics, 
  groupCallsByDate, 
  groupCallsBySource, 
  getCallStatusBreakdown 
} from '@/lib/callrail/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Create supabase client
    const supabase = await createClient();

    // Get current user to verify access
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin first
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    // Verify user has access to this company (admins have access to all companies)
    if (!isAdmin) {
      const { data: userCompany, error: accessError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (accessError || !userCompany) {
        return NextResponse.json(
          { error: 'Unauthorized access to company data' },
          { status: 403 }
        );
      }
    }

    // Get company's CallRail API token from settings
    const { data: callrailSetting, error: callrailError } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'callrail_api_token')
      .single();

    if (callrailError || !callrailSetting) {
      return NextResponse.json(
        { 
          error: 'CallRail not configured for this company',
          configured: false 
        },
        { status: 404 }
      );
    }

    const callrailApiToken = callrailSetting.setting_value;

    if (!callrailApiToken || callrailApiToken.trim() === '') {
      return NextResponse.json(
        { 
          error: 'CallRail not configured for this company',
          configured: false 
        },
        { status: 404 }
      );
    }

    // Initialize CallRail client
    const callrailClient = new CallRailClient(callrailApiToken);

    // Test connection first
    const connectionValid = await callrailClient.testConnection();
    if (!connectionValid) {
      return NextResponse.json(
        {
          error: 'Invalid CallRail API token or connection failed',
          configured: false
        },
        { status: 401 }
      );
    }

    // Check if a specific account ID is configured
    const { data: accountSetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'callrail_account_id')
      .single();

    let accountId = accountSetting?.setting_value?.trim();

    // If no specific account ID is configured, get all accounts and use the first one
    if (!accountId) {
      
      const accounts = await callrailClient.getAccounts();
      if (accounts.length === 0) {
        return NextResponse.json(
          {
            error: 'No CallRail accounts found',
            configured: false
          },
          { status: 404 }
        );
      }

      // Use the first account as fallback
      accountId = accounts[0].id;
    }

    // Fetch recent calls
    const calls = await callrailClient.getRecentCalls(accountId, days);
    
    // Transform data for dashboard
    const analytics = calculateCallAnalytics(calls);
    const volumeData = groupCallsByDate(calls);
    const sourceData = groupCallsBySource(calls);
    const statusData = getCallStatusBreakdown(calls);

    // Get account info for display
    const accounts = await callrailClient.getAccounts();
    const accountInfo = accounts.find(acc => acc.id === accountId) || accounts[0] || { id: accountId, name: 'Unknown Account' };

    return NextResponse.json({
      success: true,
      configured: true,
      data: {
        analytics,
        volumeData,
        sourceData,
        statusData,
        recentCalls: calls.slice(0, 20), // Latest 20 calls for the table
        account: {
          id: accountInfo.id,
          name: accountInfo.name
        }
      }
    });

  } catch (error) {
    console.error('Error fetching CallRail data:', error);
    
    // Check if it's a CallRail API error
    if (error instanceof Error && error.message.includes('CallRail API Error')) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch call data. Please check your CallRail configuration.',
          configured: false
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}