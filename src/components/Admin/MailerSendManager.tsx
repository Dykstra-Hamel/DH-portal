'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './MailerSendManager.module.scss';

interface MailerSendManagerProps {
  companyId: string;
}

type Provider = 'aws-ses' | 'mailersend';

interface MailerSendSettings {
  provider: Provider;
  hasApiKey: boolean;
  fromEmail: string | null;
  fromName: string | null;
}

export default function MailerSendManager({ companyId }: MailerSendManagerProps) {
  const [settings, setSettings] = useState<MailerSendSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState<Provider>('aws-ses');
  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/companies/${companyId}/mailersend`);

      if (!response.ok) {
        throw new Error('Failed to load MailerSend settings');
      }

      const data: MailerSendSettings & { success: boolean } = await response.json();

      setSettings(data);
      setSelectedProvider(data.provider || 'aws-ses');
      setFromEmail(data.fromEmail || '');
      setFromName(data.fromName || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const body: Record<string, string> = { provider: selectedProvider };

      if (selectedProvider === 'mailersend') {
        if (!fromEmail) {
          setError('From Email is required for MailerSend.');
          setSaving(false);
          return;
        }

        // Only include apiKey if user typed something (allows updating other fields without re-entering key)
        if (apiKey) {
          body.apiKey = apiKey;
        } else if (!settings?.hasApiKey) {
          setError('API Key is required.');
          setSaving(false);
          return;
        }

        body.fromEmail = fromEmail;
        if (fromName) body.fromName = fromName;
      }

      const response = await fetch(`/api/admin/companies/${companyId}/mailersend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess(
        selectedProvider === 'mailersend'
          ? 'MailerSend configured successfully. Emails for this company will route through MailerSend.'
          : 'Switched back to AWS SES.'
      );
      setApiKey('');
      await fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading email provider settings...</div>;
  }

  const activeProvider = settings?.provider || 'aws-ses';

  return (
    <div className={styles.mailerSendManager}>
      <div className={styles.header}>
        <h3>Email Provider</h3>
        <p className={styles.subtitle}>
          Choose which email service to use for outbound emails from this company.
        </p>
      </div>

      <div className={styles.providerBadge} data-provider={activeProvider}>
        Currently active: <strong>{activeProvider === 'mailersend' ? 'MailerSend' : 'AWS SES'}</strong>
      </div>

      {error && (
        <div className={styles.alert} data-type="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className={styles.alert} data-type="success">
          {success}
        </div>
      )}

      <div className={styles.providerToggle}>
        <button
          type="button"
          className={styles.providerOption}
          data-active={selectedProvider === 'aws-ses'}
          onClick={() => setSelectedProvider('aws-ses')}
        >
          <span className={styles.providerIcon}>&#9729;</span>
          <span className={styles.providerLabel}>AWS SES</span>
          <span className={styles.providerDesc}>Default · Tenant-isolated</span>
        </button>
        <button
          type="button"
          className={styles.providerOption}
          data-active={selectedProvider === 'mailersend'}
          onClick={() => setSelectedProvider('mailersend')}
        >
          <span className={styles.providerIcon}>&#9993;</span>
          <span className={styles.providerLabel}>MailerSend</span>
          <span className={styles.providerDesc}>Simple · No domain provisioning</span>
        </button>
      </div>

      {selectedProvider === 'mailersend' && (
        <div className={styles.mailerSendForm}>
          <div className={styles.infoNote}>
            The from email must be a verified sender in your MailerSend account.
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="ms-api-key">API Key</label>
            <input
              type="password"
              id="ms-api-key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={settings?.hasApiKey ? '••••••••••••••••' : 'Enter your MailerSend API key'}
              className={styles.input}
              disabled={saving}
              autoComplete="off"
            />
            {settings?.hasApiKey && (
              <small>Leave blank to keep the existing API key.</small>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="ms-from-email">From Email</label>
            <input
              type="email"
              id="ms-from-email"
              value={fromEmail}
              onChange={e => setFromEmail(e.target.value)}
              placeholder="noreply@yourdomain.com"
              className={styles.input}
              disabled={saving}
              required
            />
            <small>Must be verified in your MailerSend account.</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="ms-from-name">From Name <span className={styles.optional}>(optional)</span></label>
            <input
              type="text"
              id="ms-from-name"
              value={fromName}
              onChange={e => setFromName(e.target.value)}
              placeholder="Your Company Name"
              className={styles.input}
              disabled={saving}
            />
          </div>
        </div>
      )}

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={handleSave}
          className={styles.btnPrimary}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Provider Settings'}
        </button>
      </div>
    </div>
  );
}
