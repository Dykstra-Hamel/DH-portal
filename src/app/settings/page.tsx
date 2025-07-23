'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useCompanyRole, useIsCompanyAdminAny } from '@/hooks/useCompanyRole';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import { adminAPI } from '@/lib/api-client';
import {
  Save,
  AlertCircle,
  CheckCircle,
  Settings as SettingsIcon,
} from 'lucide-react';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

interface Company {
  id: string;
  name: string;
}

interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  is_primary: boolean;
  companies: Company;
}

interface CompanySetting {
  value: any;
  type: string;
  description: string;
}

interface CompanySettings {
  [key: string]: CompanySetting;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [settings, setSettings] = useState<CompanySettings>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'calling'>('calling');
  const router = useRouter();

  const {
    isAdminForAnyCompany,
    adminCompanies,
    isLoading: roleLoading,
  } = useIsCompanyAdminAny();
  const { isCompanyAdmin } = useCompanyRole(selectedCompanyId);

  // Check if user is global admin
  const isGlobalAdmin = profile ? isAuthorizedAdminSync(profile) : false;
  const [allCompanies, setAllCompanies] = useState<UserCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const getSessionAndData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData);
      }

      setLoading(false);
    };

    getSessionAndData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Fetch all companies for global admins
  useEffect(() => {
    if (isGlobalAdmin && profile) {
      fetchAllCompanies();
    }
  }, [isGlobalAdmin, profile]);

  const fetchAllCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const companies = await adminAPI.getCompanies();

      // Convert to UserCompany format for consistency
      const userCompanies: UserCompany[] = companies.map((company: any) => ({
        id: `global-${company.id}`,
        user_id: profile!.id,
        company_id: company.id,
        role: 'admin', // Global admins have admin role
        is_primary: false,
        companies: {
          id: company.id,
          name: company.name,
        },
      }));
      setAllCompanies(userCompanies);
    } catch (error) {
      console.error('Error fetching all companies:', error);
    } finally {
      setCompaniesLoading(false);
    }
  };

  // Set default selected company when companies are loaded
  useEffect(() => {
    const availableCompanies = isGlobalAdmin ? allCompanies : adminCompanies;
    if (!selectedCompanyId && availableCompanies.length > 0) {
      setSelectedCompanyId(availableCompanies[0].company_id);
    }
  }, [adminCompanies, allCompanies, selectedCompanyId, isGlobalAdmin]);

  // Fetch settings when company is selected
  useEffect(() => {
    if (selectedCompanyId && (isCompanyAdmin || isGlobalAdmin)) {
      fetchSettings();
    }
  }, [selectedCompanyId, isCompanyAdmin, isGlobalAdmin]);

  const fetchSettings = async () => {
    if (!selectedCompanyId) return;

    try {
      setSettingsLoading(true);
      const response = await fetch(
        `/api/companies/${selectedCompanyId}/settings`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const { settings: fetchedSettings } = await response.json();
      setSettings(fetchedSettings || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setSettingsLoading(false);
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

  const handleSave = async () => {
    if (!selectedCompanyId) return;

    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch(
        `/api/companies/${selectedCompanyId}/settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ settings }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || roleLoading || companiesLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user || !profile) {
    return <div className={styles.loading}>Redirecting...</div>;
  }

  // Check if user has admin access to any company OR is global admin
  if (!isAdminForAnyCompany && !isGlobalAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.accessDenied}>
          <AlertCircle size={48} className={styles.icon} />
          <h1>Access Denied</h1>
          <p>You need company admin privileges to access settings.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className={styles.backButton}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const availableCompanies = isGlobalAdmin ? allCompanies : adminCompanies;
  const selectedCompany = availableCompanies.find(
    uc => uc.company_id === selectedCompanyId
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <SettingsIcon size={24} className={styles.titleIcon} />
            <h1 className={styles.title}>Company Settings</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className={styles.backButton}
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Company Selector */}
        {availableCompanies.length > 1 && (
          <div className={styles.companySelector}>
            <label htmlFor="company-select" className={styles.label}>
              Select Company:
            </label>
            <select
              id="company-select"
              value={selectedCompanyId}
              onChange={e => setSelectedCompanyId(e.target.value)}
              className={styles.select}
            >
              {availableCompanies.map(userCompany => (
                <option
                  key={userCompany.company_id}
                  value={userCompany.company_id}
                >
                  {userCompany.companies.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedCompany && (
          <div className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>
              Settings for {selectedCompany.companies.name}
            </h2>

            {message && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.type === 'success' ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {message.text}
              </div>
            )}

            {/* Tab Navigation */}
            <div className={styles.tabNavigation}>
              <button
                className={`${styles.tabButton} ${activeTab === 'calling' ? styles.active : ''}`}
                onClick={() => setActiveTab('calling')}
              >
                Calling Settings
              </button>
            </div>

            {settingsLoading ? (
              <div className={styles.settingsLoading}>Loading settings...</div>
            ) : (
              <div className={styles.settingsForm}>
                {/* Calling Settings Tab */}
                {activeTab === 'calling' && (
                  <>
                    {/* Auto-Call Settings */}
                    <div className={styles.settingGroup}>
                      <h3 className={styles.groupTitle}>
                        Phone Call Automation
                      </h3>

                      <div className={styles.setting}>
                        <div className={styles.settingInfo}>
                          <label
                            htmlFor="auto-call-enabled"
                            className={styles.settingLabel}
                          >
                            Auto-Call New Leads
                          </label>
                          <p className={styles.settingDescription}>
                            {settings.auto_call_enabled?.description ||
                              'Automatically initiate phone calls for new leads'}
                          </p>
                        </div>
                        <div className={styles.settingControl}>
                          <label className={styles.toggle}>
                            <input
                              id="auto-call-enabled"
                              type="checkbox"
                              checked={
                                settings.auto_call_enabled?.value === true
                              }
                              onChange={e =>
                                handleSettingChange(
                                  'auto_call_enabled',
                                  e.target.checked
                                )
                              }
                            />
                            <span className={styles.toggleSlider}></span>
                          </label>
                        </div>
                      </div>

                      <div className={styles.setting}>
                        <div className={styles.settingInfo}>
                          <label
                            htmlFor="weekend-calling"
                            className={styles.settingLabel}
                          >
                            Weekend Calling
                          </label>
                          <p className={styles.settingDescription}>
                            {settings.weekend_calling_enabled?.description ||
                              'Allow calls on weekends'}
                          </p>
                        </div>
                        <div className={styles.settingControl}>
                          <label className={styles.toggle}>
                            <input
                              id="weekend-calling"
                              type="checkbox"
                              checked={
                                settings.weekend_calling_enabled?.value === true
                              }
                              onChange={e =>
                                handleSettingChange(
                                  'weekend_calling_enabled',
                                  e.target.checked
                                )
                              }
                            />
                            <span className={styles.toggleSlider}></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Business Hours Settings */}
                    <div className={styles.settingGroup}>
                      <h3 className={styles.groupTitle}>Business Hours</h3>

                      {[
                        'monday',
                        'tuesday',
                        'wednesday',
                        'thursday',
                        'friday',
                        'saturday',
                        'sunday',
                      ].map(day => (
                        <div key={day} className={styles.dayHours}>
                          <div className={styles.dayHeader}>
                            <span className={styles.dayName}>
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </span>
                            <label className={styles.toggle}>
                              <input
                                type="checkbox"
                                checked={
                                  settings[`business_hours_${day}`]?.value
                                    ?.enabled ?? true
                                }
                                onChange={e => {
                                  const currentValue = settings[
                                    `business_hours_${day}`
                                  ]?.value || {
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

                          {settings[`business_hours_${day}`]?.value
                            ?.enabled && (
                            <div className={styles.timeSettings}>
                              <div className={styles.timeInputGroup}>
                                <label className={styles.settingLabel}>
                                  Start
                                </label>
                                <input
                                  type="time"
                                  value={
                                    settings[`business_hours_${day}`]?.value
                                      ?.start || '09:00'
                                  }
                                  onChange={e => {
                                    const currentValue = settings[
                                      `business_hours_${day}`
                                    ]?.value || {
                                      start: '09:00',
                                      end: '17:00',
                                      enabled: true,
                                    };
                                    handleSettingChange(
                                      `business_hours_${day}`,
                                      {
                                        ...currentValue,
                                        start: e.target.value,
                                      }
                                    );
                                  }}
                                  className={styles.timeField}
                                />
                              </div>

                              <div className={styles.timeInputGroup}>
                                <label className={styles.settingLabel}>
                                  End
                                </label>
                                <input
                                  type="time"
                                  value={
                                    settings[`business_hours_${day}`]?.value
                                      ?.end || '17:00'
                                  }
                                  onChange={e => {
                                    const currentValue = settings[
                                      `business_hours_${day}`
                                    ]?.value || {
                                      start: '09:00',
                                      end: '17:00',
                                      enabled: true,
                                    };
                                    handleSettingChange(
                                      `business_hours_${day}`,
                                      {
                                        ...currentValue,
                                        end: e.target.value,
                                      }
                                    );
                                  }}
                                  className={styles.timeField}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Call Throttling */}
                    <div className={styles.settingGroup}>
                      <h3 className={styles.groupTitle}>Call Management</h3>

                      <div className={styles.setting}>
                        <div className={styles.settingInfo}>
                          <label
                            htmlFor="call-throttle"
                            className={styles.settingLabel}
                          >
                            Call Throttle (minutes)
                          </label>
                          <p className={styles.settingDescription}>
                            {settings.call_throttle_minutes?.description ||
                              'Minimum minutes between calls to same customer'}
                          </p>
                        </div>
                        <div className={styles.settingControl}>
                          <input
                            id="call-throttle"
                            type="number"
                            min="1"
                            max="60"
                            value={settings.call_throttle_minutes?.value || 5}
                            onChange={e =>
                              handleSettingChange(
                                'call_throttle_minutes',
                                parseInt(e.target.value)
                              )
                            }
                            className={styles.numberInput}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Save Button */}
                <div className={styles.actions}>
                  <button
                    onClick={handleSave}
                    disabled={saving || (!isCompanyAdmin && !isGlobalAdmin)}
                    className={styles.saveButton}
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
