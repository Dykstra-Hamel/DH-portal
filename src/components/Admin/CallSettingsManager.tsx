'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { adminAPI } from '@/lib/api-client';
import styles from './AdminManager.module.scss';

interface Company {
  id: string;
  name: string;
}

interface CompanySetting {
  value: any;
  type: string;
  description: string;
}

interface CompanySettings {
  [key: string]: CompanySetting;
}

export default function CallSettingsManager() {
  // State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [settings, setSettings] = useState<CompanySettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [businessHoursExpanded, setBusinessHoursExpanded] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const companiesData = await adminAPI.getCompanies();
      setCompanies(companiesData);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const loadSettings = async (companyId: string) => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/companies/${companyId}/settings`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const { settings: fetchedSettings } = await response.json();
      setSettings(fetchedSettings || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    if (companyId) {
      loadSettings(companyId);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
  };

  const handleSaveSettings = async () => {
    if (!selectedCompanyId) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/companies/${selectedCompanyId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.adminManager}>
      <div className={styles.header}>
        <h2>Call Settings</h2>
      </div>

      {/* Company Dropdown */}
      <div className={styles.companySelector}>
        <label htmlFor="company-select" className={styles.selectorLabel}>
          Select Company:
        </label>
        <select
          id="company-select"
          value={selectedCompanyId}
          onChange={(e) => handleCompanyChange(e.target.value)}
          className={styles.companySelect}
        >
          <option value="">-- Select a Company --</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className={styles.tabContent}>
        {!selectedCompanyId ? (
          <div className={styles.noSelection}>
            <p>Please select a company to manage call settings.</p>
          </div>
        ) : loading ? (
          <div className={styles.loading}>Loading settings...</div>
        ) : error ? (
          <div className={styles.error}>Error: {error}</div>
        ) : (
          <div className={styles.settingsForm}>
            {message && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}

            {/* Phone Call Automation */}
            <div className={styles.settingGroup}>
              <h3 className={styles.groupTitle}>Phone Call Automation</h3>
              <p className={styles.groupDescription}>
                Configure automatic calling behavior for this company.
              </p>

              <div className={styles.setting}>
                <div className={styles.settingInfo}>
                  <label htmlFor="auto-call-enabled" className={styles.settingLabel}>
                    Auto-Call New Leads
                  </label>
                  <p className={styles.settingDescription}>
                    {settings.auto_call_enabled?.description || 'Automatically initiate phone calls for new leads'}
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input
                      id="auto-call-enabled"
                      type="checkbox"
                      checked={settings.auto_call_enabled?.value === true || settings.auto_call_enabled?.value === 'true'}
                      onChange={(e) => handleSettingChange('auto_call_enabled', e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.setting}>
                <div className={styles.settingInfo}>
                  <label htmlFor="off-hour-calling" className={styles.settingLabel}>
                    Off-Hour Calling
                  </label>
                  <p className={styles.settingDescription}>
                    {settings.off_hour_calling_enabled?.description || 'Allow calls outside business hours and on weekends'}
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input
                      id="off-hour-calling"
                      type="checkbox"
                      checked={settings.off_hour_calling_enabled?.value === true || settings.off_hour_calling_enabled?.value === 'true'}
                      onChange={(e) => handleSettingChange('off_hour_calling_enabled', e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.setting}>
                <div className={styles.settingInfo}>
                  <label htmlFor="call-throttle" className={styles.settingLabel}>
                    Call Throttle (minutes)
                  </label>
                  <p className={styles.settingDescription}>
                    {settings.call_throttle_minutes?.description || 'Minimum minutes between calls to same customer'}
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <input
                    id="call-throttle"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.call_throttle_minutes?.value || 5}
                    onChange={(e) => handleSettingChange('call_throttle_minutes', parseInt(e.target.value))}
                    className={styles.textInput}
                  />
                </div>
              </div>
            </div>

            {/* Retell Configuration */}
            <div className={styles.settingGroup}>
              <h3 className={styles.groupTitle}>Retell AI Configuration</h3>
              <p className={styles.groupDescription}>
                Configure Retell AI settings for this company.
              </p>

              <div className={styles.setting}>
                <div className={styles.settingInfo}>
                  <label htmlFor="retell-api-key" className={styles.settingLabel}>
                    Retell API Key
                  </label>
                  <p className={styles.settingDescription}>
                    {settings.retell_api_key?.description || 'Retell AI API key for this company account'}
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <div className={styles.inputWithIcon}>
                    <input
                      id="retell-api-key"
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.retell_api_key?.value || ''}
                      onChange={(e) => handleSettingChange('retell_api_key', e.target.value)}
                      className={styles.textInput}
                      placeholder="key_xxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className={styles.toggleVisibilityButton}
                      title={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.setting}>
                <div className={styles.settingInfo}>
                  <label htmlFor="retell-inbound-agent-id" className={styles.settingLabel}>
                    Retell Inbound Agent ID
                  </label>
                  <p className={styles.settingDescription}>
                    {settings.retell_inbound_agent_id?.description || 'Retell AI agent ID for handling inbound calls'}
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <input
                    id="retell-inbound-agent-id"
                    type="text"
                    value={settings.retell_inbound_agent_id?.value || ''}
                    onChange={(e) => handleSettingChange('retell_inbound_agent_id', e.target.value)}
                    className={styles.textInput}
                    placeholder="agent_xxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
              </div>

              <div className={styles.setting}>
                <div className={styles.settingInfo}>
                  <label htmlFor="retell-outbound-agent-id" className={styles.settingLabel}>
                    Retell Outbound Agent ID
                  </label>
                  <p className={styles.settingDescription}>
                    {settings.retell_outbound_agent_id?.description || 'Retell AI agent ID for handling outbound calls from form submissions'}
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <input
                    id="retell-outbound-agent-id"
                    type="text"
                    value={settings.retell_outbound_agent_id?.value || ''}
                    onChange={(e) => handleSettingChange('retell_outbound_agent_id', e.target.value)}
                    className={styles.textInput}
                    placeholder="agent_xxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
              </div>

              <div className={styles.setting}>
                <div className={styles.settingInfo}>
                  <label htmlFor="retell-phone-number" className={styles.settingLabel}>
                    Retell Phone Number
                  </label>
                  <p className={styles.settingDescription}>
                    {settings.retell_phone_number?.description || 'Phone number to use for Retell AI calls from this company'}
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <input
                    id="retell-phone-number"
                    type="tel"
                    value={settings.retell_phone_number?.value || ''}
                    onChange={(e) => handleSettingChange('retell_phone_number', e.target.value)}
                    className={styles.textInput}
                    placeholder="+12074197718"
                  />
                </div>
              </div>

              <div className={styles.setting}>
                <div className={styles.settingInfo}>
                  <label htmlFor="retell-knowledge-base-id" className={styles.settingLabel}>
                    Retell Knowledge Base ID
                  </label>
                  <p className={styles.settingDescription}>
                    {settings.retell_knowledge_base_id?.description || 'Knowledge base ID for company-specific information'}
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <input
                    id="retell-knowledge-base-id"
                    type="text"
                    value={settings.retell_knowledge_base_id?.value || ''}
                    onChange={(e) => handleSettingChange('retell_knowledge_base_id', e.target.value)}
                    className={styles.textInput}
                    placeholder="kb_xxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
              </div>
            </div>

            {/* Call Summary Emails */}
            <div className={styles.settingGroup}>
              <h3 className={styles.groupTitle}>Call Summary Emails</h3>
              <p className={styles.groupDescription}>
                Configure automatic email notifications with call summaries after calls are completed.
              </p>

              <div className={styles.setting}>
                <div className={styles.settingInfo}>
                  <label htmlFor="call-summary-emails-enabled" className={styles.settingLabel}>
                    Enable Call Summary Emails
                  </label>
                  <p className={styles.settingDescription}>
                    {settings.call_summary_emails_enabled?.description || 'Send detailed call summaries via email when calls complete'}
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input
                      id="call-summary-emails-enabled"
                      type="checkbox"
                      checked={settings.call_summary_emails_enabled?.value === true || settings.call_summary_emails_enabled?.value === 'true'}
                      onChange={(e) => handleSettingChange('call_summary_emails_enabled', e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              {(settings.call_summary_emails_enabled?.value === true || settings.call_summary_emails_enabled?.value === 'true') && (
                <div className={styles.setting}>
                  <div className={styles.settingInfo}>
                    <label htmlFor="call-summary-email-recipients" className={styles.settingLabel}>
                      Email Recipients
                    </label>
                    <p className={styles.settingDescription}>
                      Enter email addresses separated by commas. These recipients will receive detailed call summaries including transcripts, analysis, and customer information.
                    </p>
                  </div>
                  <div className={styles.settingControl}>
                    <textarea
                      id="call-summary-email-recipients"
                      value={settings.call_summary_email_recipients?.value || ''}
                      onChange={(e) => handleSettingChange('call_summary_email_recipients', e.target.value)}
                      className={styles.textArea}
                      placeholder="manager@company.com, sales@company.com, support@company.com"
                      rows={3}
                      style={{ resize: 'vertical', minHeight: '80px' }}
                    />
                    {settings.call_summary_email_recipients?.value && (
                      <div className={styles.emailValidation}>
                        {(() => {
                          const emails = settings.call_summary_email_recipients?.value
                            .split(',')
                            .map((email: string) => email.trim())
                            .filter((email: string) => email.length > 0);
                          
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          const validEmails = emails.filter((email: string) => emailRegex.test(email));
                          const invalidEmails = emails.filter((email: string) => !emailRegex.test(email));
                          
                          return (
                            <div style={{ marginTop: '8px' }}>
                              {validEmails.length > 0 && (
                                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#059669' }}>
                                  ✓ {validEmails.length} valid email{validEmails.length !== 1 ? 's' : ''}: {validEmails.slice(0, 3).join(', ')}{validEmails.length > 3 ? ` and ${validEmails.length - 3} more` : ''}
                                </p>
                              )}
                              {invalidEmails.length > 0 && (
                                <p style={{ margin: '0', fontSize: '12px', color: '#dc2626' }}>
                                  ✗ {invalidEmails.length} invalid email{invalidEmails.length !== 1 ? 's' : ''}: {invalidEmails.slice(0, 2).join(', ')}{invalidEmails.length > 2 ? '...' : ''}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(settings.call_summary_emails_enabled?.value === true || settings.call_summary_emails_enabled?.value === 'true') && (
                <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '6px', padding: '16px', marginTop: '16px' }}>
                  <p style={{ margin: '0', fontSize: '14px', color: '#0369a1', lineHeight: '1.5' }}>
                    <strong>📧 Email Content Preview:</strong><br />
                    Call summary emails include call details, transcript, sentiment analysis, customer information, service details, and call recording links when available. Emails are sent automatically when calls complete.
                  </p>
                </div>
              )}
            </div>

            {/* Business Hours Settings */}
            <div className={styles.settingGroup}>
              <div className={styles.collapsibleHeader} onClick={() => setBusinessHoursExpanded(!businessHoursExpanded)}>
                <h3 className={styles.groupTitle}>Business Hours & Timezone</h3>
                {businessHoursExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              <p className={styles.groupDescription}>
                Configure business hours and timezone for this company. These settings are used for business hours webhook logic and reporting.
                {settings.off_hour_calling_enabled?.value && (
                  <span className={styles.noteText}> Note: Off-Hour Calling is currently enabled, so calls will be allowed outside these hours.</span>
                )}
              </p>

              {businessHoursExpanded && (
                <>
                  {/* Company Timezone Setting */}
                  <div className={styles.setting}>
                    <div className={styles.settingInfo}>
                      <label htmlFor="company-timezone" className={styles.settingLabel}>
                        Company Timezone
                      </label>
                      <p className={styles.settingDescription}>
                        {settings.company_timezone?.description || 'Timezone used for business hours calculations'}
                      </p>
                    </div>
                    <div className={styles.settingControl}>
                      <select
                        id="company-timezone"
                        value={settings.company_timezone?.value || 'America/New_York'}
                        onChange={(e) => handleSettingChange('company_timezone', e.target.value)}
                        className={styles.textInput}
                      >
                        <option value="America/New_York">Eastern (America/New_York)</option>
                        <option value="America/Chicago">Central (America/Chicago)</option>
                        <option value="America/Denver">Mountain (America/Denver)</option>
                        <option value="America/Los_Angeles">Pacific (America/Los_Angeles)</option>
                        <option value="America/Phoenix">Arizona (America/Phoenix)</option>
                        <option value="America/Anchorage">Alaska (America/Anchorage)</option>
                        <option value="Pacific/Honolulu">Hawaii (Pacific/Honolulu)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>

                  {/* Daily Business Hours */}
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <div key={day} className={styles.businessHoursDay}>
                      <div className={styles.dayHeader}>
                        <span className={styles.dayName}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </span>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={settings[`business_hours_${day}`]?.value?.enabled ?? true}
                            onChange={(e) => {
                              const currentValue = settings[`business_hours_${day}`]?.value || {
                                start: '09:00',
                                end: '17:00',
                                enabled: true,
                              };
                              handleSettingChange(`business_hours_${day}`, {
                                ...currentValue,
                                enabled: e.target.checked,
                              });
                            }}
                          />
                          <span className={styles.toggleSlider}></span>
                        </label>
                      </div>

                      {settings[`business_hours_${day}`]?.value?.enabled !== false && (
                        <div className={styles.timeSettings}>
                          <div className={styles.timeInputGroup}>
                            <label className={styles.settingLabel}>Start</label>
                            <input
                              type="time"
                              value={settings[`business_hours_${day}`]?.value?.start || '09:00'}
                              onChange={(e) => {
                                const currentValue = settings[`business_hours_${day}`]?.value || {
                                  start: '09:00',
                                  end: '17:00',
                                  enabled: true,
                                };
                                handleSettingChange(`business_hours_${day}`, {
                                  ...currentValue,
                                  start: e.target.value,
                                });
                              }}
                              className={styles.textInput}
                            />
                          </div>

                          <div className={styles.timeInputGroup}>
                            <label className={styles.settingLabel}>End</label>
                            <input
                              type="time"
                              value={settings[`business_hours_${day}`]?.value?.end || '17:00'}
                              onChange={(e) => {
                                const currentValue = settings[`business_hours_${day}`]?.value || {
                                  start: '09:00',
                                  end: '17:00',
                                  enabled: true,
                                };
                                handleSettingChange(`business_hours_${day}`, {
                                  ...currentValue,
                                  end: e.target.value,
                                });
                              }}
                              className={styles.textInput}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Save Button */}
            <div className={styles.actions}>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className={styles.saveButton}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}