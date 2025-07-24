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
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import KnowledgeBase from '@/components/KnowledgeBase/KnowledgeBase';
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
  const [activeTab, setActiveTab] = useState<'widget' | 'knowledge-base'>('widget');
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
                className={`${styles.tabButton} ${activeTab === 'widget' ? styles.active : ''}`}
                onClick={() => setActiveTab('widget')}
              >
                Widget Settings
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'knowledge-base' ? styles.active : ''}`}
                onClick={() => setActiveTab('knowledge-base')}
              >
                Knowledge Base
              </button>
            </div>

            {settingsLoading ? (
              <div className={styles.settingsLoading}>Loading settings...</div>
            ) : (
              <div className={styles.settingsForm}>
                {/* Widget Settings Tab */}
                {activeTab === 'widget' && (
                  <>
                    <div className={styles.settingGroup}>
                      <h3 className={styles.groupTitle}>Widget Form Settings</h3>
                      <p className={styles.groupDescription}>
                        Configure the lead capture widget for your website.
                      </p>
                      
                      <div className={styles.setting}>
                        <div className={styles.settingInfo}>
                          <label htmlFor="widget-enabled" className={styles.settingLabel}>
                            Enable Widget
                          </label>
                          <p className={styles.settingDescription}>
                            Enable or disable the lead capture widget.
                          </p>
                        </div>
                        <div className={styles.settingControl}>
                          <label className={styles.toggle}>
                            <input
                              id="widget-enabled"
                              type="checkbox"
                              checked={settings.widget_enabled?.value === true}
                              onChange={e => handleSettingChange('widget_enabled', e.target.checked)}
                            />
                            <span className={styles.toggleSlider}></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Knowledge Base Tab */}
                {activeTab === 'knowledge-base' && (
                  <div className={styles.knowledgeBaseSection}>
                    <KnowledgeBase companyId={selectedCompanyId} />
                  </div>
                )}

                {/* Save Button - only show for widget tab */}
                {activeTab === 'widget' && (
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
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
