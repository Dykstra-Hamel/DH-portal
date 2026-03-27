'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Bell } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import styles from './AdminManager.module.scss';
import localStyles from './CompanyNotificationSettingsManager.module.scss';

interface CompanySetting {
  value: any;
  type: string;
  description: string;
}

interface CompanySettings {
  [key: string]: CompanySetting;
}

export default function CompanyNotificationSettingsManager() {
  const { selectedCompany, isLoading: contextLoading } = useCompany();

  const [settings, setSettings] = useState<CompanySettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!contextLoading && selectedCompany) {
      loadSettings(selectedCompany.id);
    }
  }, [contextLoading, selectedCompany]);

  const loadSettings = async (companyId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${companyId}/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      const { settings: fetched } = await response.json();
      setSettings(fetched || {});
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBoolValue = (key: string): boolean => {
    return settings[key]?.value === true || settings[key]?.value === 'true';
  };

  const getStringValue = (key: string): string => {
    return settings[key]?.value ?? '';
  };

  const setSetting = (key: string, value: any, type: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value, type },
    }));
  };

  const handleSave = async () => {
    if (!selectedCompany) return;
    try {
      setSaving(true);
      const response = await fetch(
        `/api/companies/${selectedCompany.id}/settings`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings }),
        }
      );
      if (!response.ok) throw new Error('Failed to save settings');
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const quoteEnabled = getBoolValue('quote_submission_notification_enabled');
  const campaignEnabled = getBoolValue('campaign_submission_notification_enabled');
  const ticketEnabled = getBoolValue('ticket_created_notification_enabled');

  return (
    <div>
      {!selectedCompany ? (
        <div className={styles.noSelection}>
          <p>Please select a company from the header dropdown to manage notification settings.</p>
        </div>
      ) : loading ? (
        <div className={styles.loading}>Loading settings...</div>
      ) : (
        <>
          {message && (
            <div className={`${styles.message} ${message.type === 'success' ? styles.success : styles.error}`}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          <div className={localStyles.settingsCard}>
            <div className={localStyles.cardHeader}>
              <Bell size={18} />
              <h3>Quote Page Submitted</h3>
            </div>
            <p className={localStyles.cardDescription}>
              Send a notification email when a customer accepts and signs a quote page. Recipients receive customer info and a link to the lead.
            </p>

            <div className={localStyles.toggleRow}>
              <label className={localStyles.toggleLabel} htmlFor="quote-notif-enabled">
                Enable quote submission notifications
              </label>
              <label className={localStyles.toggle}>
                <input
                  id="quote-notif-enabled"
                  type="checkbox"
                  checked={quoteEnabled}
                  onChange={(e) =>
                    setSetting('quote_submission_notification_enabled', e.target.checked, 'boolean')
                  }
                />
                <span className={localStyles.toggleSlider}></span>
              </label>
            </div>

            {quoteEnabled && (
              <div className={localStyles.emailField}>
                <label htmlFor="quote-notif-emails" className={localStyles.emailLabel}>
                  Notification email addresses <span className={localStyles.hint}>(comma-separated)</span>
                </label>
                <input
                  id="quote-notif-emails"
                  type="text"
                  className={localStyles.emailInput}
                  value={getStringValue('quote_submission_notification_emails')}
                  onChange={(e) =>
                    setSetting('quote_submission_notification_emails', e.target.value, 'string')
                  }
                  placeholder="e.g. sales@company.com, manager@company.com"
                />
              </div>
            )}
          </div>

          <div className={localStyles.settingsCard}>
            <div className={localStyles.cardHeader}>
              <Bell size={18} />
              <h3>Campaign Landing Page Submitted</h3>
            </div>
            <p className={localStyles.cardDescription}>
              Send a notification email when a customer submits a campaign landing page form. Recipients receive customer info and a link to the lead.
            </p>

            <div className={localStyles.toggleRow}>
              <label className={localStyles.toggleLabel} htmlFor="campaign-notif-enabled">
                Enable campaign submission notifications
              </label>
              <label className={localStyles.toggle}>
                <input
                  id="campaign-notif-enabled"
                  type="checkbox"
                  checked={campaignEnabled}
                  onChange={(e) =>
                    setSetting('campaign_submission_notification_enabled', e.target.checked, 'boolean')
                  }
                />
                <span className={localStyles.toggleSlider}></span>
              </label>
            </div>

            {campaignEnabled && (
              <div className={localStyles.emailField}>
                <label htmlFor="campaign-notif-emails" className={localStyles.emailLabel}>
                  Notification email addresses <span className={localStyles.hint}>(comma-separated)</span>
                </label>
                <input
                  id="campaign-notif-emails"
                  type="text"
                  className={localStyles.emailInput}
                  value={getStringValue('campaign_submission_notification_emails')}
                  onChange={(e) =>
                    setSetting('campaign_submission_notification_emails', e.target.value, 'string')
                  }
                  placeholder="e.g. sales@company.com, manager@company.com"
                />
              </div>
            )}
          </div>

          <div className={localStyles.settingsCard}>
            <div className={localStyles.cardHeader}>
              <Bell size={18} />
              <h3>Ticket Created</h3>
            </div>
            <p className={localStyles.cardDescription}>
              Send a notification email whenever a new ticket is created (via form submission or manually). Recipients receive customer info and a link to the ticket.
            </p>

            <div className={localStyles.toggleRow}>
              <label className={localStyles.toggleLabel} htmlFor="ticket-notif-enabled">
                Enable ticket created notifications
              </label>
              <label className={localStyles.toggle}>
                <input
                  id="ticket-notif-enabled"
                  type="checkbox"
                  checked={ticketEnabled}
                  onChange={(e) =>
                    setSetting('ticket_created_notification_enabled', e.target.checked, 'boolean')
                  }
                />
                <span className={localStyles.toggleSlider}></span>
              </label>
            </div>

            {ticketEnabled && (
              <div className={localStyles.emailField}>
                <label htmlFor="ticket-notif-emails" className={localStyles.emailLabel}>
                  Notification email addresses <span className={localStyles.hint}>(comma-separated)</span>
                </label>
                <input
                  id="ticket-notif-emails"
                  type="text"
                  className={localStyles.emailInput}
                  value={getStringValue('ticket_created_notification_emails')}
                  onChange={(e) =>
                    setSetting('ticket_created_notification_emails', e.target.value, 'string')
                  }
                  placeholder="e.g. dispatch@company.com, manager@company.com"
                />
              </div>
            )}
          </div>

          <div className={localStyles.saveRow}>
            <button
              className={localStyles.saveButton}
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
