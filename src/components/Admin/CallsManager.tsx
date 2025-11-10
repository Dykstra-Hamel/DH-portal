'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { adminAPI } from '@/lib/api-client';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import { createClient } from '@/lib/supabase/client';
import { Save, AlertCircle, CheckCircle, Eye, EyeOff, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import styles from './AdminManager.module.scss';

interface CallRecord {
  id: string;
  call_id: string;
  phone_number: string;
  from_number: string;
  call_status: string;
  start_timestamp: string;
  end_timestamp: string;
  duration_seconds: number;
  recording_url?: string;
  transcript?: string;
  sentiment: string;
  home_size: string;
  yard_size: string;
  decision_maker: string;
  pest_issue: string;
  street_address: string;
  preferred_service_time: string;
  opt_out_sensitive_data_storage: boolean;
  disconnect_reason: string;
  created_at: string;
  leads?: {
    id: string;
    customer_id: string;
    company_id: string;
    customers?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  customers?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    company_id: string;
  };
}

interface CompanySetting {
  value: any;
  type: string;
  description: string;
}

interface CompanySettings {
  [key: string]: CompanySetting;
}

export default function CallsManager() {
  // Use global company context
  const { selectedCompany, isLoading: contextLoading } = useCompany();

  // Tab State
  const [activeTab, setActiveTab] = useState<'records' | 'settings'>('records');

  // Call Records State
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  // Call Settings State
  const [settings, setSettings] = useState<CompanySettings>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [businessHoursExpanded, setBusinessHoursExpanded] = useState(false);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [callToDelete, setCallToDelete] = useState<CallRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCalls = useCallback(async (companyId: string) => {
    try {
      setCallsLoading(true);
      setCallsError(null);

      // Use server-side filtering by company
      const data = await adminAPI.getAllCalls({ companyId });

      setCalls(data);
    } catch (err) {
      setCallsError(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      setCallsLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async (companyId: string) => {
    if (!companyId) return;

    try {
      setSettingsLoading(true);
      setSettingsError(null);
      const response = await fetch(`/api/companies/${companyId}/settings`);

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const { settings: fetchedSettings } = await response.json();
      setSettings(fetchedSettings || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettingsError('Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Load data when company or tab changes
  useEffect(() => {
    if (!contextLoading && selectedCompany) {
      if (activeTab === 'records') {
        loadCalls(selectedCompany.id);
      } else if (activeTab === 'settings') {
        loadSettings(selectedCompany.id);
      }
    }
  }, [contextLoading, selectedCompany, activeTab, loadCalls, loadSettings]);

  const handleTabChange = (tab: 'records' | 'settings') => {
    setActiveTab(tab);
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
    if (!selectedCompany) return;

    try {
      setSettingsSaving(true);
      const response = await fetch(`/api/companies/${selectedCompany.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSettingsMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setSettingsMessage(null), 5000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSettingsMessage({ type: 'error', text: 'Failed to save settings' });
      setTimeout(() => setSettingsMessage(null), 5000);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleDeleteClick = (call: CallRecord) => {
    setCallToDelete(call);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!callToDelete) return;

    try {
      setIsDeleting(true);
      
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.access_token) {
        throw new Error('No authentication session');
      }

      const response = await fetch(`/api/calls/${callToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete call record');
      }

      // Refresh the calls list
      if (selectedCompany) {
        loadCalls(selectedCompany.id);
      }

      setShowDeleteModal(false);
      setCallToDelete(null);
    } catch (error) {
      console.error('Error deleting call record:', error);
      alert(`Failed to delete call record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCallToDelete(null);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const number = cleaned.slice(1);
      return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'busy':
        return '#f59e0b';
      case 'no-answer':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return '#10b981';
      case 'negative':
        return '#ef4444';
      case 'neutral':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className={styles.adminManager}>
      <div className={styles.header}>
        <h2>Call Management</h2>
        {selectedCompany && <p>Managing calls for {selectedCompany.name}</p>}
        <small>Use the company dropdown in the header to switch companies.</small>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${activeTab === 'records' ? styles.active : ''}`}
            onClick={() => handleTabChange('records')}
          >
            Call Records
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            Call Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'records' && (
        <div className={styles.tabContent}>
          {!selectedCompany ? (
            <div className={styles.noSelection}>
              <p>Please select a company to view call records.</p>
            </div>
          ) : callsLoading ? (
            <div className={styles.loading}>Loading call records...</div>
          ) : callsError ? (
            <div className={styles.error}>Error: {callsError}</div>
          ) : (
            <>
              <div className={styles.recordsHeader}>
                <h3>Call Records</h3>
                <p>Total: {calls.length} calls</p>
              </div>
              
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Sentiment</th>
                      <th>Pest Issue</th>
                      <th>Address</th>
                      <th>Service Time</th>
                      <th>Data Opt-Out</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map(call => (
                      <tr key={call.id}>
                        <td>{formatDate(call.start_timestamp)}</td>
                        <td>
                          {(() => {
                            const customer = call.leads?.customers || call.customers;
                            return customer
                              ? `${customer.first_name} ${customer.last_name}`
                              : 'Unknown';
                          })()}
                          {(() => {
                            const customer = call.leads?.customers || call.customers;
                            return customer?.email && (
                              <div className={styles.subText}>
                                {customer.email}
                              </div>
                            );
                          })()}
                        </td>
                        <td>{formatPhoneNumber(call.phone_number)}</td>
                        <td>
                          <span
                            className={styles.status}
                            style={{
                              backgroundColor: getStatusColor(call.call_status),
                            }}
                          >
                            {call.call_status || 'Unknown'}
                          </span>
                        </td>
                        <td>{formatDuration(call.duration_seconds)}</td>
                        <td>
                          <span
                            className={styles.sentiment}
                            style={{ color: getSentimentColor(call.sentiment) }}
                          >
                            {call.sentiment || 'N/A'}
                          </span>
                        </td>
                        <td>{call.pest_issue || 'N/A'}</td>
                        <td>{call.street_address || 'N/A'}</td>
                        <td>{call.preferred_service_time || 'N/A'}</td>
                        <td>{call.opt_out_sensitive_data_storage ? 'Yes' : 'No'}</td>
                        <td>
                          <div className={styles.callActions}>
                            <button
                              className={styles.actionButton}
                              onClick={() => setSelectedCall(call)}
                            >
                              View Details
                            </button>
                            <button
                              className={styles.callDeleteButton}
                              onClick={() => handleDeleteClick(call)}
                              title="Delete call record"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Call Settings Tab */}
      {activeTab === 'settings' && (
        <div className={styles.tabContent}>
          {!selectedCompany ? (
            <div className={styles.noSelection}>
              <p>Please select a company from the header dropdown to manage call settings.</p>
            </div>
          ) : settingsLoading ? (
            <div className={styles.loading}>Loading settings...</div>
          ) : settingsError ? (
            <div className={styles.error}>Error: {settingsError}</div>
          ) : (
            <div className={styles.settingsForm}>
              {settingsMessage && (
                <div className={`${styles.message} ${styles[settingsMessage.type]}`}>
                  {settingsMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {settingsMessage.text}
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
                    <label htmlFor="retell-agent-id" className={styles.settingLabel}>
                      Legacy Retell Agent ID
                    </label>
                    <p className={styles.settingDescription}>
                      {settings.retell_agent_id?.description || 'Legacy agent ID (use inbound/outbound specific IDs instead)'}
                    </p>
                  </div>
                  <div className={styles.settingControl}>
                    <input
                      id="retell-agent-id"
                      type="text"
                      value={settings.retell_agent_id?.value || ''}
                      onChange={(e) => handleSettingChange('retell_agent_id', e.target.value)}
                      className={styles.textInput}
                      placeholder="agent_xxxxxxxxxxxxxxxxxxxxxxxx"
                      style={{ opacity: 0.7 }}
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
                  disabled={settingsSaving}
                  className={styles.saveButton}
                >
                  <Save size={16} />
                  {settingsSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedCall && (
        <div className={styles.modal} onClick={() => setSelectedCall(null)}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Call Details</h3>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedCall(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <strong>Call ID:</strong> {selectedCall.call_id}
                </div>
                <div className={styles.detailItem}>
                  <strong>Customer:</strong>{' '}
                  {(() => {
                    const customer = selectedCall.leads?.customers || selectedCall.customers;
                    return customer
                      ? `${customer.first_name} ${customer.last_name}`
                      : 'Unknown';
                  })()}
                </div>
                <div className={styles.detailItem}>
                  <strong>Phone:</strong>{' '}
                  {formatPhoneNumber(selectedCall.phone_number)}
                </div>
                <div className={styles.detailItem}>
                  <strong>From:</strong>{' '}
                  {formatPhoneNumber(selectedCall.from_number)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Status:</strong> {selectedCall.call_status}
                </div>
                <div className={styles.detailItem}>
                  <strong>Start Time:</strong>{' '}
                  {formatDate(selectedCall.start_timestamp)}
                </div>
                <div className={styles.detailItem}>
                  <strong>End Time:</strong>{' '}
                  {formatDate(selectedCall.end_timestamp)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Duration:</strong>{' '}
                  {formatDuration(selectedCall.duration_seconds)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Sentiment:</strong> {selectedCall.sentiment || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Home Size:</strong> {selectedCall.home_size || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Yard Size:</strong> {selectedCall.yard_size || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Decision Maker:</strong>{' '}
                  {selectedCall.decision_maker || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Pest Issue:</strong>{' '}
                  {selectedCall.pest_issue || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Street Address:</strong>{' '}
                  {selectedCall.street_address || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Preferred Service Time:</strong>{' '}
                  {selectedCall.preferred_service_time || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Data Opt-Out:</strong>{' '}
                  {selectedCall.opt_out_sensitive_data_storage ? 'Yes' : 'No'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Disconnect Reason:</strong>{' '}
                  {selectedCall.disconnect_reason || 'N/A'}
                </div>
              </div>

              {/* Call Recording Section */}
              {selectedCall.recording_url && (
                <div className={styles.recordingSection}>
                  <h4>Call Recording</h4>
                  <AudioPlayer
                    src={selectedCall.recording_url}
                    title={`Call Recording - ${selectedCall.call_id}`}
                    className={styles.modalAudioPlayer}
                  />
                </div>
              )}

              {/* Transcript Section */}
              {selectedCall.transcript && (
                <div className={styles.transcriptSection}>
                  <h4>Call Transcript</h4>
                  <div className={styles.transcriptContent}>
                    {selectedCall.transcript}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && callToDelete && (
        <div className={styles.modal} onClick={handleDeleteCancel}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Delete Call Record</h3>
              <button
                className={styles.closeButton}
                onClick={handleDeleteCancel}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Are you sure you want to delete this call record? This action cannot be undone.
              </p>
              <div className={styles.callInfo}>
                <strong>Call ID:</strong> {callToDelete.call_id}
                <br />
                <strong>Phone:</strong> {formatPhoneNumber(callToDelete.phone_number)}
                <br />
                <strong>Date:</strong> {formatDate(callToDelete.start_timestamp)}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={handleDeleteCancel}
                className={styles.cancelButton}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={styles.confirmDeleteButton}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Call Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
