import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET company settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', id)
      .single();

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';
    const hasCompanyAccess = userCompany && !userCompanyError;

    if (!isGlobalAdmin && !hasCompanyAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch company settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', id)
      .order('setting_key');

    if (settingsError) {
      console.error('Error fetching company settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // Convert settings array to key-value object for easier frontend use
    const settingsObject: { [key: string]: any } = {};
    settings?.forEach(setting => {
      let value = setting.setting_value;

      // Convert values based on type
      if (setting.setting_type === 'boolean') {
        value = value === 'true';
      } else if (setting.setting_type === 'number') {
        value = parseFloat(value) || 0;
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch {
          value = null;
        }
      }

      settingsObject[setting.setting_key] = {
        value,
        type: setting.setting_type,
        description: setting.description,
      };
    });

    return NextResponse.json({ settings: settingsObject });
  } catch (error) {
    console.error('Error in company settings GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT/PATCH company settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', id)
      .single();

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';
    const isCompanyAdmin =
      userCompany && ['admin', 'manager', 'owner'].includes(userCompany.role);

    if (!isGlobalAdmin && !isCompanyAdmin) {
      return NextResponse.json(
        {
          error: 'Access denied. Company admin privileges required.',
        },
        { status: 403 }
      );
    }

    const { settings } = await request.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    // Validate Retell configuration fields
    const retellValidationErrors = []
    
    // Validate Retell API key format
    if (settings.retell_api_key?.value) {
      const apiKey = settings.retell_api_key.value
      if (!apiKey.startsWith('key_') || apiKey.length < 10) {
        retellValidationErrors.push('Retell API key must start with "key_" and be at least 10 characters long')
      }
    }

    // Validate Retell agent ID format
    if (settings.retell_agent_id?.value) {
      const agentId = settings.retell_agent_id.value
      if (!agentId.startsWith('agent_') || agentId.length < 10) {
        retellValidationErrors.push('Retell agent ID must start with "agent_" and be at least 10 characters long')
      }
    }

    // Validate phone number format
    if (settings.retell_phone_number?.value) {
      const phoneNumber = settings.retell_phone_number.value
      const phoneRegex = /^\+[1-9]\d{1,14}$/
      if (!phoneRegex.test(phoneNumber)) {
        retellValidationErrors.push('Phone number must be in E.164 format (e.g., +12074197718)')
      }
    }

    // Return validation errors if any
    if (retellValidationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: retellValidationErrors },
        { status: 400 }
      )
    }

    // Update each setting
    const updatePromises = Object.entries(settings).map(
      async ([key, data]: [string, any]) => {
        const settingData = data as { value: any; type?: string };
        let stringValue = String(settingData.value);

        // Handle different data types
        if (settingData.type === 'boolean') {
          stringValue = Boolean(settingData.value).toString();
        } else if (settingData.type === 'json') {
          stringValue = JSON.stringify(settingData.value);
        }

        // Upsert the setting
        const { error } = await supabase.from('company_settings').upsert(
          {
            company_id: id,
            setting_key: key,
            setting_value: stringValue,
            setting_type: settingData.type || 'string',
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'company_id,setting_key',
          }
        );

        if (error) {
          console.error(`Error updating setting ${key}:`, error);
          throw error;
        }
      }
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error in company settings PUT:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
