import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  createDomain, 
  getDomain, 
  verifyDomain, 
  deleteDomain,
  type CreateDomainRequest 
} from '@/lib/resend-domains';

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

    // If we have domain settings, get the latest info from Resend
    const resendDomainId = settingsObject.resend_domain_id?.value;
    if (resendDomainId) {
      try {
        const domainInfo = await getDomain(resendDomainId);
        
        // Update local database with latest status if different
        if (domainInfo.status !== settingsObject.email_domain_status?.value) {
          await supabase.from('company_settings').upsert([
            {
              company_id: id,
              setting_key: 'email_domain_status',
              setting_value: domainInfo.status,
              setting_type: 'string'
            },
            {
              company_id: id,
              setting_key: 'email_domain_records',
              setting_value: JSON.stringify(domainInfo.records),
              setting_type: 'json'
            }
          ], { onConflict: 'company_id,setting_key' });
          
          // Update our response with fresh data
          settingsObject.email_domain_status.value = domainInfo.status;
          settingsObject.email_domain_records.value = domainInfo.records;
        }
        
        // Mark domain as verified if status changed
        if (domainInfo.status === 'verified' && !settingsObject.email_domain_verified_at?.value) {
          const verifiedAt = new Date().toISOString();
          await supabase.from('company_settings').upsert({
            company_id: id,
            setting_key: 'email_domain_verified_at',
            setting_value: verifiedAt,
            setting_type: 'string'
          }, { onConflict: 'company_id,setting_key' });
          
          settingsObject.email_domain_verified_at.value = verifiedAt;
        }
      } catch (error) {
        console.warn('Failed to sync domain status from Resend:', error);
        // Continue with local data
      }
    }

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

// POST - Handle domain-specific operations
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the current user and check permissions (same as PUT)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', id)
      .single();

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
        { error: 'Access denied. Company admin privileges required.' },
        { status: 403 }
      );
    }

    const { action, ...data } = await request.json();

    switch (action) {
      case 'create_domain':
        return await handleCreateDomain(supabase, id, data);
      case 'verify_domain':
        return await handleVerifyDomain(supabase, id);
      case 'delete_domain':
        return await handleDeleteDomain(supabase, id);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in domain operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Domain operation handlers
async function handleCreateDomain(supabase: any, companyId: string, data: any) {
  const { domain, region, customReturnPath } = data;

  if (!domain) {
    return NextResponse.json(
      { error: 'Domain name is required' },
      { status: 400 }
    );
  }

  // Enhanced domain validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Validate domain format
  if (!domainRegex.test(domain)) {
    return NextResponse.json(
      { error: 'Domain must be a valid hostname (e.g., mail.company.com)' },
      { status: 400 }
    );
  }
  
  // Additional security checks
  if (domain.length > 253) {
    return NextResponse.json(
      { error: 'Domain name is too long' },
      { status: 400 }
    );
  }
  
  if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
    return NextResponse.json(
      { error: 'Invalid domain format' },
      { status: 400 }
    );
  }
  
  // Validate custom return path if provided
  if (customReturnPath) {
    const pathRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
    if (!pathRegex.test(customReturnPath) || customReturnPath.length > 64) {
      return NextResponse.json(
        { error: 'Email prefix must be alphanumeric with hyphens/underscores only' },
        { status: 400 }
      );
    }
  }

  try {
    // Get current domain ID if exists
    const { data: currentSettings } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'resend_domain_id')
      .single();

    // Delete old domain if exists
    if (currentSettings?.setting_value) {
      try {
        await deleteDomain(currentSettings.setting_value);
      } catch (error) {
        console.warn('Failed to delete old domain:', error);
      }
    }

    // Create new domain in Resend
    const createDomainRequest: CreateDomainRequest = {
      name: domain,
      region: region || 'us-east-1',
      ...(customReturnPath && { custom_return_path: customReturnPath })
    };

    const domainInfo = await createDomain(createDomainRequest);

    // Update settings
    const settingsToUpdate = [
      { key: 'email_domain', value: domain, type: 'string' },
      { key: 'email_domain_status', value: domainInfo.status, type: 'string' },
      { key: 'email_domain_region', value: region || 'us-east-1', type: 'string' },
      { key: 'email_domain_prefix', value: customReturnPath || 'noreply', type: 'string' },
      { key: 'email_domain_records', value: JSON.stringify(domainInfo.records), type: 'json' },
      { key: 'resend_domain_id', value: domainInfo.id, type: 'string' },
      { key: 'email_domain_verified_at', value: '', type: 'string' }
    ];

    await supabase.from('company_settings').upsert(
      settingsToUpdate.map(setting => ({
        company_id: companyId,
        setting_key: setting.key,
        setting_value: setting.value,
        setting_type: setting.type,
        updated_at: new Date().toISOString()
      })),
      { onConflict: 'company_id,setting_key' }
    );

    return NextResponse.json({
      success: true,
      domain: {
        name: domainInfo.name,
        status: domainInfo.status,
        records: domainInfo.records,
        resendDomainId: domainInfo.id
      }
    });
  } catch (error) {
    console.error('Error creating domain:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create domain';
    // Sanitize error message to avoid exposing internal details
    const sanitizedMessage = errorMessage.includes('API') || errorMessage.includes('key') 
      ? 'Domain configuration failed. Please check your domain settings and try again.'
      : errorMessage;
    
    return NextResponse.json(
      { error: sanitizedMessage },
      { status: 500 }
    );
  }
}

async function handleVerifyDomain(supabase: any, companyId: string) {
  try {
    // Get current domain ID
    const { data: domainIdSetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'resend_domain_id')
      .single();

    if (!domainIdSetting?.setting_value) {
      return NextResponse.json(
        { error: 'No domain configured' },
        { status: 404 }
      );
    }

    // Trigger verification
    const verificationResult = await verifyDomain(domainIdSetting.setting_value);
    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.message },
        { status: 400 }
      );
    }

    // Get updated domain info
    const domainInfo = await getDomain(domainIdSetting.setting_value);

    // Update settings
    const settingsToUpdate = [
      { key: 'email_domain_status', value: domainInfo.status, type: 'string' },
      { key: 'email_domain_records', value: JSON.stringify(domainInfo.records), type: 'json' }
    ];

    if (domainInfo.status === 'verified') {
      settingsToUpdate.push({
        key: 'email_domain_verified_at',
        value: new Date().toISOString(),
        type: 'string'
      });
    }

    await supabase.from('company_settings').upsert(
      settingsToUpdate.map(setting => ({
        company_id: companyId,
        setting_key: setting.key,
        setting_value: setting.value,
        setting_type: setting.type,
        updated_at: new Date().toISOString()
      })),
      { onConflict: 'company_id,setting_key' }
    );

    return NextResponse.json({
      success: true,
      domain: {
        status: domainInfo.status,
        records: domainInfo.records
      }
    });
  } catch (error) {
    console.error('Error verifying domain:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to verify domain';
    // Sanitize error message
    const sanitizedMessage = errorMessage.includes('API') || errorMessage.includes('key')
      ? 'Domain verification failed. Please try again later.'
      : errorMessage;
    
    return NextResponse.json(
      { error: sanitizedMessage },
      { status: 500 }
    );
  }
}

async function handleDeleteDomain(supabase: any, companyId: string) {
  try {
    // Get current domain ID
    const { data: domainIdSetting } = await supabase
      .from('company_settings')  
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'resend_domain_id')
      .single();

    // Delete from Resend if exists
    if (domainIdSetting?.setting_value) {
      try {
        await deleteDomain(domainIdSetting.setting_value);
      } catch (error) {
        console.warn('Failed to delete domain from Resend:', error);
      }
    }

    // Reset domain settings
    const settingsToReset = [
      { key: 'email_domain', value: '', type: 'string' },
      { key: 'email_domain_status', value: 'not_configured', type: 'string' },
      { key: 'email_domain_records', value: '[]', type: 'json' },
      { key: 'resend_domain_id', value: '', type: 'string' },
      { key: 'email_domain_verified_at', value: '', type: 'string' }
    ];

    await supabase.from('company_settings').upsert(
      settingsToReset.map(setting => ({
        company_id: companyId,
        setting_key: setting.key,
        setting_value: setting.value,
        setting_type: setting.type,
        updated_at: new Date().toISOString()
      })),
      { onConflict: 'company_id,setting_key' }
    );

    return NextResponse.json({
      success: true,
      message: 'Domain configuration removed'
    });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Failed to remove domain configuration' },
      { status: 500 }
    );
  }
}
