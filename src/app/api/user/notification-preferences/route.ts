import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { upsertNotificationPreference } from '@/lib/email/notification-preferences';
import type { NotificationType } from '@/types/notifications';

// Notification type metadata for UI
const NOTIFICATION_TYPES: Array<{
  type: NotificationType;
  label: string;
  description: string;
}> = [
  {
    type: 'lead_created',
    label: 'New Lead Created',
    description: 'Receive notifications when new leads are submitted through forms or widgets',
  },
  {
    type: 'lead_status_changed_scheduling',
    label: 'Lead Ready for Scheduling',
    description: 'Receive notifications when a lead status changes to scheduling',
  },
  {
    type: 'campaign_submitted',
    label: 'Campaign Submission',
    description: 'Receive notifications when customers redeem campaign landing pages',
  },
  {
    type: 'quote_submitted',
    label: 'Quote Updated',
    description: 'Receive notifications when customers update or submit quotes',
  },
  {
    type: 'quote_signed',
    label: 'Quote Signed',
    description: 'Receive notifications when customers sign quotes',
  },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Verify user is member of company
    const { data: userCompany, error: companyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (companyError || !userCompany) {
      return NextResponse.json(
        { error: 'Access denied to this company' },
        { status: 403 }
      );
    }

    // Fetch existing preferences for this user and company
    const { data: existingPreferences, error: prefsError } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', companyId);

    if (prefsError) {
      console.error('Error fetching notification preferences:', prefsError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Build response with all notification types and their current state
    const allTypes = NOTIFICATION_TYPES.map((typeInfo) => {
      const existingPref = existingPreferences?.find(
        (p) => p.notification_type === typeInfo.type
      );

      return {
        type: typeInfo.type,
        label: typeInfo.label,
        description: typeInfo.description,
        // Default to enabled (opt-out model)
        enabled: existingPref ? existingPref.email_enabled : true,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        preferences: existingPreferences || [],
        allTypes,
      },
    });
  } catch (error) {
    console.error('Error in notification-preferences GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, preferences } = body;

    if (!companyId || !preferences || !Array.isArray(preferences)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected: { companyId, preferences: [] }' },
        { status: 400 }
      );
    }

    // Verify user is member of company
    const { data: userCompany, error: companyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (companyError || !userCompany) {
      return NextResponse.json(
        { error: 'Access denied to this company' },
        { status: 403 }
      );
    }

    // Update each preference using the helper function
    const updatedPreferences = [];
    for (const pref of preferences) {
      const { notification_type, email_enabled } = pref;

      if (!notification_type || typeof email_enabled !== 'boolean') {
        continue; // Skip invalid entries
      }

      const result = await upsertNotificationPreference(
        user.id,
        companyId,
        notification_type as NotificationType,
        email_enabled
      );

      if (result) {
        updatedPreferences.push(result);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        updated: updatedPreferences.length,
        preferences: updatedPreferences,
      },
    });
  } catch (error) {
    console.error('Error in notification-preferences PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
