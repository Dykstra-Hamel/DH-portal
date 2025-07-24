import { createAdminClient } from '@/lib/supabase/server-admin';

export interface RetellConfig {
  apiKey: string;
  agentId: string;
  phoneNumber: string;
  knowledgeBaseId?: string;
}

export interface RetellConfigResult {
  config?: RetellConfig;
  error?: string;
  missingSettings?: string[];
}

/**
 * Retrieves company-specific Retell settings from the database
 */
export async function getCompanyRetellConfig(companyId: string): Promise<RetellConfigResult> {
  try {
    const supabase = createAdminClient();

    const { data: settings, error } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value')
      .eq('company_id', companyId)
      .in('setting_key', [
        'retell_api_key',
        'retell_agent_id', 
        'retell_phone_number',
        'retell_knowledge_base_id'
      ]);

    if (error) {
      console.error('Failed to fetch company Retell settings:', error);
      return { error: 'Failed to load company configuration' };
    }

    if (!settings || settings.length === 0) {
      return { 
        error: 'No Retell configuration found for this company',
        missingSettings: ['retell_api_key', 'retell_agent_id', 'retell_phone_number']
      };
    }

    // Convert array to key-value map
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {} as Record<string, string>);

    // Check for required settings
    const requiredSettings = ['retell_api_key', 'retell_agent_id', 'retell_phone_number'];
    const missingSettings = requiredSettings.filter(key => !settingsMap[key] || settingsMap[key].trim() === '');

    if (missingSettings.length > 0) {
      return {
        error: 'Incomplete Retell configuration for this company',
        missingSettings
      };
    }

    return {
      config: {
        apiKey: settingsMap.retell_api_key,
        agentId: settingsMap.retell_agent_id,
        phoneNumber: settingsMap.retell_phone_number,
        knowledgeBaseId: settingsMap.retell_knowledge_base_id || undefined
      }
    };
  } catch (error) {
    console.error('Error fetching company Retell configuration:', error);
    return { error: 'An unexpected error occurred while loading configuration' };
  }
}

/**
 * Validates if all required Retell settings are configured for a company
 */
export async function validateRetellConfig(companyId: string): Promise<{
  isValid: boolean;
  error?: string;
  missingSettings?: string[];
}> {
  const result = await getCompanyRetellConfig(companyId);
  
  if (result.error) {
    return {
      isValid: false,
      error: result.error,
      missingSettings: result.missingSettings
    };
  }

  return { isValid: true };
}

/**
 * Logs detailed error messages for Retell configuration issues
 */
export function logRetellConfigError(companyId: string, error: string, missingSettings?: string[]) {
  const errorMessage = `Retell Configuration Error for Company ${companyId}: ${error}`;
  
  if (missingSettings && missingSettings.length > 0) {
    console.error(errorMessage, {
      missingSettings,
      requiredAction: 'Configure missing settings in Company Call Settings'
    });
  } else {
    console.error(errorMessage);
  }
}