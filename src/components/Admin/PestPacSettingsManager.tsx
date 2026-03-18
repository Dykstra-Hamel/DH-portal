'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import styles from './AdminManager.module.scss';

interface PestPacSettingsManagerProps {
  companyId: string;
}

interface CompanySetting {
  value: any;
  type: string;
  description: string;
}

interface CompanySettings {
  [key: string]: CompanySetting;
}

export default function PestPacSettingsManager({ companyId }: PestPacSettingsManagerProps) {
  const [settings, setSettings] = useState<CompanySettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadSettings();
    }
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${companyId}/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      const { settings: fetchedSettings } = await response.json();
      setSettings(fetchedSettings || {});
    } catch {
      // Settings load failed silently
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any, type?: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
        type: type ?? prev[key]?.type ?? 'string',
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/companies/${companyId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            pestpac_enabled: {
              value: settings.pestpac_enabled?.value === true || settings.pestpac_enabled?.value === 'true',
              type: 'boolean',
            },
            pestpac_api_key: { value: settings.pestpac_api_key?.value ?? '', type: 'string' },
            pestpac_tenant_id: { value: settings.pestpac_tenant_id?.value ?? '', type: 'string' },
            pestpac_oauth_client_id: { value: settings.pestpac_oauth_client_id?.value ?? '', type: 'string' },
            pestpac_oauth_client_secret: { value: settings.pestpac_oauth_client_secret?.value ?? '', type: 'string' },
            pestpac_wwid_username: { value: settings.pestpac_wwid_username?.value ?? '', type: 'string' },
            pestpac_wwid_password: { value: settings.pestpac_wwid_password?.value ?? '', type: 'string' },
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setMessage({ type: 'success', text: 'PestPac settings saved successfully!' });
      setTimeout(() => setMessage(null), 5000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    const apiKey = settings.pestpac_api_key?.value;
    const tenantId = settings.pestpac_tenant_id?.value;

    if (!apiKey || !tenantId) {
      setTestResult({ success: false, message: 'API Key and Tenant ID are required to test the connection.' });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch(
        `/api/pestpac/clients/search?q=test&companyId=${companyId}`
      );

      if (response.ok || response.status === 400) {
        // 400 means query too short but connection worked
        setTestResult({ success: true, message: 'Connection successful! PestPac API is reachable.' });
      } else if (response.status === 502) {
        setTestResult({ success: false, message: 'Connection failed. Please verify your API Key and Tenant ID.' });
      } else {
        const data = await response.json();
        setTestResult({ success: false, message: data.error ?? 'Connection test failed.' });
      }
    } catch {
      setTestResult({ success: false, message: 'Connection test failed. Check your credentials.' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading PestPac settings...</div>;
  }

  const isEnabled = settings.pestpac_enabled?.value === true || settings.pestpac_enabled?.value === 'true';

  return (
    <div className={styles.settingsForm}>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className={styles.settingGroup}>
        <h3 className={styles.groupTitle}>PestPac Integration</h3>
        <p className={styles.groupDescription}>
          Connect to WorkWave PestPac to allow field technicians to search PestPac customers when submitting opportunities.
        </p>

        {/* Enable toggle */}
        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label htmlFor="pestpac-enabled" className={styles.settingLabel}>
              Enable PestPac Integration
            </label>
            <p className={styles.settingDescription}>
              Allow technicians to search PestPac customers in the TechLeads wizard
            </p>
          </div>
          <div className={styles.settingControl}>
            <label className={styles.toggle}>
              <input
                id="pestpac-enabled"
                type="checkbox"
                checked={isEnabled}
                onChange={e => handleSettingChange('pestpac_enabled', e.target.checked, 'boolean')}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        {/* Tenant ID */}
        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label htmlFor="pestpac-tenant-id" className={styles.settingLabel}>
              Tenant ID
            </label>
            <p className={styles.settingDescription}>
              Your WorkWave PestPac tenant ID (numeric company key)
            </p>
          </div>
          <div className={styles.settingControl}>
            <input
              id="pestpac-tenant-id"
              type="text"
              value={settings.pestpac_tenant_id?.value ?? ''}
              onChange={e => handleSettingChange('pestpac_tenant_id', e.target.value, 'string')}
              className={styles.textInput}
              placeholder="e.g. 301296"
            />
          </div>
        </div>

        {/* API Key */}
        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label htmlFor="pestpac-api-key" className={styles.settingLabel}>
              API Key
            </label>
            <p className={styles.settingDescription}>
              API key from the WorkWave developer portal
            </p>
          </div>
          <div className={styles.settingControl}>
            <div className={styles.inputWithIcon}>
              <input
                id="pestpac-api-key"
                type={showApiKey ? 'text' : 'password'}
                value={settings.pestpac_api_key?.value ?? ''}
                onChange={e => handleSettingChange('pestpac_api_key', e.target.value, 'string')}
                className={styles.textInput}
                placeholder="API key"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className={styles.toggleVisibilityButton}
                title={showApiKey ? 'Hide' : 'Show'}
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* OAuth Client ID */}
        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label htmlFor="pestpac-oauth-client-id" className={styles.settingLabel}>
              OAuth Client ID
            </label>
            <p className={styles.settingDescription}>
              OAuth client ID from the WorkWave developer portal
            </p>
          </div>
          <div className={styles.settingControl}>
            <input
              id="pestpac-oauth-client-id"
              type="text"
              value={settings.pestpac_oauth_client_id?.value ?? ''}
              onChange={e => handleSettingChange('pestpac_oauth_client_id', e.target.value, 'string')}
              className={styles.textInput}
              placeholder="OAuth client ID"
            />
          </div>
        </div>

        {/* OAuth Client Secret */}
        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label htmlFor="pestpac-oauth-client-secret" className={styles.settingLabel}>
              OAuth Client Secret
            </label>
            <p className={styles.settingDescription}>
              OAuth client secret from the WorkWave developer portal
            </p>
          </div>
          <div className={styles.settingControl}>
            <input
              id="pestpac-oauth-client-secret"
              type="password"
              value={settings.pestpac_oauth_client_secret?.value ?? ''}
              onChange={e => handleSettingChange('pestpac_oauth_client_secret', e.target.value, 'string')}
              className={styles.textInput}
              placeholder="OAuth client secret"
            />
          </div>
        </div>

        {/* WWID Username */}
        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label htmlFor="pestpac-wwid-username" className={styles.settingLabel}>
              WWID Username
            </label>
            <p className={styles.settingDescription}>
              WorkWave ID login email (e.g. admin@yourcompany.com)
            </p>
          </div>
          <div className={styles.settingControl}>
            <input
              id="pestpac-wwid-username"
              type="text"
              value={settings.pestpac_wwid_username?.value ?? ''}
              onChange={e => handleSettingChange('pestpac_wwid_username', e.target.value, 'string')}
              className={styles.textInput}
              placeholder="user@company.com"
            />
          </div>
        </div>

        {/* WWID Password */}
        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label htmlFor="pestpac-wwid-password" className={styles.settingLabel}>
              WWID Password
            </label>
            <p className={styles.settingDescription}>
              WorkWave ID login password
            </p>
          </div>
          <div className={styles.settingControl}>
            <input
              id="pestpac-wwid-password"
              type="password"
              value={settings.pestpac_wwid_password?.value ?? ''}
              onChange={e => handleSettingChange('pestpac_wwid_password', e.target.value, 'string')}
              className={styles.textInput}
              placeholder="Password"
            />
          </div>
        </div>

        {/* Test Connection */}
        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <p className={styles.settingLabel}>Test Connection</p>
            <p className={styles.settingDescription}>
              Verify your credentials can reach the PestPac API
            </p>
          </div>
          <div className={styles.settingControl}>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className={styles.saveButton}
              style={{ minWidth: '140px' }}
            >
              {testing ? 'Testing…' : 'Test Connection'}
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`${styles.message} ${testResult.success ? styles.success : styles.error}`}
            style={{ marginTop: '8px' }}
          >
            {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {testResult.message}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button onClick={handleSave} disabled={saving} className={styles.saveButton}>
          <Save size={16} />
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
