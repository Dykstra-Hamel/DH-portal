import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnalyticsData } from '@/lib/google-analytics/queries';

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
        console.error('Access check failed:', accessError, 'User ID:', user.id, 'Company ID:', companyId);
        return NextResponse.json(
          { error: 'Unauthorized access to company data' },
          { status: 403 }
        );
      }
    }

    // Get company's GA property ID from settings
    const { data: gaSetting, error: gaError } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'ga_property_id')
      .single();

    if (gaError || !gaSetting) {
      return NextResponse.json(
        { 
          error: 'Google Analytics not configured for this company',
          configured: false 
        },
        { status: 404 }
      );
    }

    const gaPropertyId = gaSetting.setting_value;

    if (!gaPropertyId || gaPropertyId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Google Analytics not configured for this company',
          configured: false 
        },
        { status: 404 }
      );
    }

    // Fetch analytics data
    const analyticsData = await getAnalyticsData(gaPropertyId, days);
    
    return NextResponse.json({
      success: true,
      configured: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    
    // Check if it's a Google Analytics API error
    if (error instanceof Error && error.message.includes('Google Analytics')) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch analytics data. Please check your Google Analytics configuration.',
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