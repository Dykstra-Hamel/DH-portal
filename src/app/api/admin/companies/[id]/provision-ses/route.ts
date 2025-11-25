/**
 * AWS SES Tenant Provisioning API
 *
 * Provisions a new AWS SES tenant for a company, including:
 * - Creating the tenant
 * - Creating email identity (if domain provided)
 * - Creating configuration set with SNS event destinations
 * - Associating resources with tenant
 * - Storing configuration in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createTenant, deleteTenant } from '@/lib/aws-ses/tenants';
import { createEmailIdentity, associateIdentityWithTenant, getDkimTokens, deleteEmailIdentity } from '@/lib/aws-ses/identities';
import { createConfigurationSetWithEvents, associateConfigSetWithTenant, deleteConfigurationSet } from '@/lib/aws-ses/config-sets';

interface ProvisionRequest {
  domain?: string;
  snsTopicArn?: string;
}

/**
 * POST - Provision AWS SES tenant for a company
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body: ProvisionRequest = await request.json();
    const { domain, snsTopicArn } = body;

    const supabase = createAdminClient();

    // Get company information
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check if tenant already exists
    const { data: existingSettings } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'aws_ses_tenant_name')
      .single();

    if (existingSettings) {
      return NextResponse.json(
        { success: false, error: 'SES tenant already provisioned for this company' },
        { status: 400 }
      );
    }

    // Step 1: Create SES tenant
    const tenantResult = await createTenant(companyId, company.name);

    if (!tenantResult.success || !tenantResult.data) {
      return NextResponse.json(
        { success: false, error: `Failed to create tenant: ${tenantResult.error}` },
        { status: 500 }
      );
    }

    const tenant = tenantResult.data;

    // Step 2: Create configuration set (for event tracking)
    const configSetResult = await createConfigurationSetWithEvents(
      companyId,
      snsTopicArn
    );

    if (!configSetResult.success || !configSetResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: `Tenant created but failed to create configuration set: ${configSetResult.error}`,
        },
        { status: 500 }
      );
    }

    const configSet = configSetResult.data;

    // Step 3: Associate configuration set with tenant
    const configAssocResult = await associateConfigSetWithTenant(
      configSet.name,
      tenant.tenantName
    );

    if (!configAssocResult.success) {
      console.warn('Failed to associate config set with tenant:', configAssocResult.error);
    }

    let identityArn: string | undefined;
    let dkimTokens: any[] = [];

    // Step 4: Create email identity if domain provided
    if (domain) {
      const identityResult = await createEmailIdentity(domain);

      if (!identityResult.success || !identityResult.data) {
        return NextResponse.json(
          {
            success: false,
            error: `Tenant created but failed to create identity: ${identityResult.error}`,
            tenant,
            configSet,
          },
          { status: 500 }
        );
      }

      identityArn = identityResult.data.identityArn;
      dkimTokens = identityResult.dkimTokens || [];

      // Associate identity with tenant
      const identityAssocResult = await associateIdentityWithTenant(
        domain,
        tenant.tenantName,
        identityArn
      );

      if (!identityAssocResult.success) {
        console.warn('Failed to associate identity with tenant:', identityAssocResult.error);
      }
    }

    // Step 5: Store configuration in database
    const settingsToInsert = [
      {
        company_id: companyId,
        setting_key: 'aws_ses_tenant_id',
        setting_value: tenant.tenantId,
      },
      {
        company_id: companyId,
        setting_key: 'aws_ses_tenant_name',
        setting_value: tenant.tenantName,
      },
      {
        company_id: companyId,
        setting_key: 'aws_ses_tenant_arn',
        setting_value: tenant.tenantArn,
      },
      {
        company_id: companyId,
        setting_key: 'aws_ses_configuration_set',
        setting_value: configSet.name,
      },
    ];

    if (identityArn) {
      settingsToInsert.push({
        company_id: companyId,
        setting_key: 'aws_ses_identity_arn',
        setting_value: identityArn,
      });
    }

    if (dkimTokens.length > 0) {
      settingsToInsert.push({
        company_id: companyId,
        setting_key: 'aws_ses_dkim_tokens',
        setting_value: JSON.stringify(dkimTokens),
      });
    }

    const { error: insertError } = await supabase
      .from('company_settings')
      .insert(settingsToInsert);

    if (insertError) {
      console.error('Failed to save SES configuration to database:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'SES provisioned but failed to save configuration to database',
          tenant,
          configSet,
          identityArn,
          dkimTokens,
        },
        { status: 500 }
      );
    }

    // If domain was provided, also update email_domain settings
    if (domain) {
      const domainSettingsToInsert = [
        {
          company_id: companyId,
          setting_key: 'email_domain',
          setting_value: domain,
        },
        {
          company_id: companyId,
          setting_key: 'email_domain_status',
          setting_value: 'pending',
        },
        {
          company_id: companyId,
          setting_key: 'email_domain_prefix',
          setting_value: 'noreply',
        },
      ];

      await supabase
        .from('company_settings')
        .upsert(domainSettingsToInsert, {
          onConflict: 'company_id,setting_key',
        });
    }

    return NextResponse.json({
      success: true,
      message: 'SES tenant provisioned successfully',
      tenant: {
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        tenantArn: tenant.tenantArn,
        sendingStatus: tenant.sendingStatus,
      },
      configurationSet: {
        name: configSet.name,
      },
      identity: identityArn
        ? {
            arn: identityArn,
            domain,
            dkimTokens,
          }
        : null,
    });
  } catch (error) {
    console.error('Error provisioning SES tenant:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get SES provisioning status for a company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = createAdminClient();

    // Get SES settings from database
    const { data: settings, error } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value')
      .eq('company_id', companyId)
      .in('setting_key', [
        'aws_ses_tenant_id',
        'aws_ses_tenant_name',
        'aws_ses_tenant_arn',
        'aws_ses_configuration_set',
        'aws_ses_identity_arn',
        'aws_ses_dkim_tokens',
        'email_domain',
        'email_domain_status',
      ]);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Convert to object for easier access
    const settingsMap: Record<string, string> = {};
    settings?.forEach((s) => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    // Check if tenant is actually provisioned by checking for tenant_name
    if (!settingsMap.aws_ses_tenant_name) {
      return NextResponse.json({
        success: true,
        provisioned: false,
        message: 'No SES tenant provisioned for this company',
      });
    }

    const dkimTokens = settingsMap.aws_ses_dkim_tokens
      ? JSON.parse(settingsMap.aws_ses_dkim_tokens)
      : null;

    return NextResponse.json({
      success: true,
      provisioned: true,
      tenant: {
        tenantId: settingsMap.aws_ses_tenant_id,
        tenantName: settingsMap.aws_ses_tenant_name,
        tenantArn: settingsMap.aws_ses_tenant_arn,
      },
      configurationSet: settingsMap.aws_ses_configuration_set,
      identity: settingsMap.aws_ses_identity_arn
        ? {
            arn: settingsMap.aws_ses_identity_arn,
            domain: settingsMap.email_domain,
            status: settingsMap.email_domain_status,
            dkimTokens,
          }
        : null,
    });
  } catch (error) {
    console.error('Error getting SES provisioning status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete AWS SES tenant for a company
 * Removes tenant, configuration set, and all database settings
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = createAdminClient();

    // Get SES settings from database
    const { data: settings } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value')
      .eq('company_id', companyId)
      .in('setting_key', [
        'aws_ses_tenant_name',
        'aws_ses_configuration_set',
        'email_domain',
      ]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s) => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    const tenantName = settingsMap.aws_ses_tenant_name;
    const configSetName = settingsMap.aws_ses_configuration_set;
    const emailDomain = settingsMap.email_domain;

    // Delete email identity from AWS SES if it exists
    if (emailDomain) {
      console.log(`Deleting email identity: ${emailDomain}`);
      const identityResult = await deleteEmailIdentity(emailDomain);
      if (!identityResult.success) {
        console.warn(`Failed to delete email identity ${emailDomain}:`, identityResult.error);
      }
    }

    // Delete configuration set from AWS SES if it exists
    if (configSetName) {
      console.log(`Deleting configuration set: ${configSetName}`);
      const configSetResult = await deleteConfigurationSet(configSetName);
      if (!configSetResult.success) {
        console.warn(`Failed to delete configuration set ${configSetName}:`, configSetResult.error);
      }
    }

    // Delete tenant from AWS SES if it exists
    if (tenantName) {
      console.log(`Deleting tenant: ${tenantName}`);
      const tenantResult = await deleteTenant(tenantName);
      if (!tenantResult.success) {
        console.warn(`Failed to delete tenant ${tenantName}:`, tenantResult.error);
      }
    }

    // Delete all SES-related settings from database
    const { error: deleteError } = await supabase
      .from('company_settings')
      .delete()
      .eq('company_id', companyId)
      .in('setting_key', [
        'aws_ses_tenant_id',
        'aws_ses_tenant_name',
        'aws_ses_tenant_arn',
        'aws_ses_configuration_set',
        'aws_ses_identity_arn',
        'aws_ses_dkim_tokens',
        'email_domain',
        'email_domain_status',
        'email_domain_prefix',
        'email_domain_verified_at',
      ]);

    if (deleteError) {
      console.error('Failed to delete SES settings from database:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete SES settings from database',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'SES tenant and all related resources deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting SES tenant:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
