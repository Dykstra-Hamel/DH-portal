'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCompanyRole, useIsCompanyAdminAny } from '@/hooks/useCompanyRole';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import { useCompany } from '@/contexts/CompanyContext';
import { adminAPI } from '@/lib/api-client';
import {
  Save,
  AlertCircle,
  CheckCircle,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import KnowledgeBase from '@/components/KnowledgeBase/KnowledgeBase';
import AccountLinking from '@/components/AccountLinking/AccountLinking';
import AutomationSettings from '@/components/Automation/AutomationSettings';
import NotificationPreferences from '@/components/NotificationPreferences/NotificationPreferences';
import AnnouncementsManager from '@/components/Admin/AnnouncementsManager';
import CompanyNotificationSettingsManager from '@/components/Admin/CompanyNotificationSettingsManager';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  title?: string;
  phone?: string;
  contact_email?: string;
  uploaded_avatar_url?: string;
  avatar_url?: string;
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
  const [settings, setSettings] = useState<CompanySettings>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    'knowledge-base' | 'automation' | 'announcements' | 'project-management' | 'notifications'
  >('automation');
  const [activeSection, setActiveSection] = useState<'user' | 'company'>(
    'user'
  );

  // Profile form state
  const [profileForm, setProfileForm] = useState({ title: '', phone: '', contact_email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  // Use global company context
  const { selectedCompany, isLoading: contextLoading } = useCompany();

  const {
    isAdminForAnyCompany,
    adminCompanies,
    isLoading: roleLoading,
  } = useIsCompanyAdminAny();
  const { isCompanyAdmin } = useCompanyRole(selectedCompany?.id || '');

  // Check if user is global admin
  const isGlobalAdmin = profile ? isAuthorizedAdminSync(profile) : false;

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
        setProfileForm({
          title: profileData.title || '',
          phone: profileData.phone || '',
          contact_email: profileData.contact_email || '',
        });
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

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');
      setProfile(prev => prev ? { ...prev, ...data.profile } : data.profile);
      setProfileMessage({ type: 'success', text: 'Profile saved.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save profile' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);

    setAvatarUploading(true);
    setProfileMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setProfile(prev => prev ? { ...prev, uploaded_avatar_url: data.url } : prev);
      setAvatarPreview(data.url);
      setProfileMessage({ type: 'success', text: 'Avatar updated.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' });
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getProfileAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (profile?.uploaded_avatar_url) return profile.uploaded_avatar_url;
    if (profile?.avatar_url) return profile.avatar_url;
    if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url;
    if (user?.user_metadata?.picture) return user.user_metadata.picture;
    return null;
  };

  const getProfileInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const fetchSettings = useCallback(async () => {
    if (!selectedCompany?.id) return;

    try {
      setSettingsLoading(true);
      const response = await fetch(
        `/api/companies/${selectedCompany.id}/settings`
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
  }, [selectedCompany?.id]);

  // Fetch settings when company is selected or changes
  useEffect(() => {
    if (
      !contextLoading &&
      selectedCompany &&
      (isCompanyAdmin || isGlobalAdmin)
    ) {
      fetchSettings();
    }
  }, [
    contextLoading,
    selectedCompany,
    isCompanyAdmin,
    isGlobalAdmin,
    fetchSettings,
  ]);

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
    if (!selectedCompany?.id) return;

    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch(
        `/api/companies/${selectedCompany.id}/settings`,
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

  if (loading || roleLoading || contextLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user || !profile) {
    return <div className={styles.loading}>Redirecting...</div>;
  }

  // Show user settings to all users, company settings only to admins
  const showCompanySettings = isAdminForAnyCompany || isGlobalAdmin;

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {/* Main Section Navigation */}
        <div className={styles.mainNavigation}>
          <button
            className={`${styles.mainNavButton} ${activeSection === 'user' ? styles.active : ''}`}
            onClick={() => setActiveSection('user')}
          >
            User Settings
          </button>
          {showCompanySettings && (
            <button
              className={`${styles.mainNavButton} ${activeSection === 'company' ? styles.active : ''}`}
              onClick={() => setActiveSection('company')}
            >
              Company Settings
            </button>
          )}
        </div>

        {/* User Settings Section */}
        {activeSection === 'user' && (
          <div className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>User Settings</h2>

            <div className={styles.settingsForm}>
              {/* Profile Information */}
              <div className={styles.settingGroup}>
                <h3 className={styles.groupTitle}>Profile Information</h3>
                <p className={styles.groupDescription}>
                  Update your profile details and avatar.
                </p>

                {profileMessage && (
                  <div className={`${styles.message} ${styles[profileMessage.type]}`}>
                    {profileMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {profileMessage.text}
                  </div>
                )}

                {/* Avatar upload */}
                <div className={styles.avatarUploadWrap}>
                  <button
                    type="button"
                    className={styles.avatarBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    aria-label="Change profile photo"
                  >
                    {getProfileAvatarUrl() ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getProfileAvatarUrl()!} alt="Profile" className={styles.avatarImg} />
                    ) : (
                      <span className={styles.avatarInitials}>{getProfileInitials()}</span>
                    )}
                    <span className={styles.avatarEditOverlay}>
                      {avatarUploading ? 'Uploading…' : 'Change Photo'}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className={styles.avatarFileInput}
                    onChange={handleAvatarChange}
                  />
                </div>

                {/* Read-only: Name & Login Email */}
                <div className={styles.setting}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Name</label>
                    <p className={styles.settingDescription}>
                      {profile?.first_name} {profile?.last_name}
                    </p>
                  </div>
                </div>

                <div className={styles.setting}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Login Email</label>
                    <p className={styles.settingDescription}>
                      {profile?.email || user?.email}
                    </p>
                  </div>
                </div>

                {/* Editable fields */}
                <div className={styles.profileFormGrid}>
                  <div className={styles.profileField}>
                    <label className={styles.settingLabel} htmlFor="profile-title">Title</label>
                    <input
                      id="profile-title"
                      type="text"
                      className={styles.profileInput}
                      placeholder="e.g. Lead Sales Inspector"
                      value={profileForm.title}
                      onChange={e => setProfileForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className={styles.profileField}>
                    <label className={styles.settingLabel} htmlFor="profile-phone">Contact Phone</label>
                    <input
                      id="profile-phone"
                      type="tel"
                      className={styles.profileInput}
                      placeholder="e.g. (555) 867-5309"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className={styles.profileField}>
                    <label className={styles.settingLabel} htmlFor="profile-contact-email">Contact Email</label>
                    <input
                      id="profile-contact-email"
                      type="email"
                      className={styles.profileInput}
                      placeholder="e.g. john@yourcompany.com"
                      value={profileForm.contact_email}
                      onChange={e => setProfileForm(prev => ({ ...prev, contact_email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className={styles.profileSaveRow}>
                  <button
                    type="button"
                    className={styles.profileSaveBtn}
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                  >
                    {profileSaving ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              </div>
              {/* Email Notification Preferences */}
              {selectedCompany && (
                <div className={styles.settingGroup}>
                  <NotificationPreferences companyId={selectedCompany.id} />
                </div>
              )}
              {/* Linked Accounts */}
              <div className={styles.settingGroup}>
                <AccountLinking user={user} />
              </div>
            </div>
          </div>
        )}

        {/* Company Settings Section */}
        {activeSection === 'company' && showCompanySettings && (
          <>
            {selectedCompany ? (
              <div className={styles.settingsSection}>
                <h2 className={styles.sectionTitle}>
                  Settings for {selectedCompany.name}
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
                    className={`${styles.tabButton} ${activeTab === 'automation' ? styles.active : ''}`}
                    onClick={() => setActiveTab('automation')}
                  >
                    Automation
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'knowledge-base' ? styles.active : ''}`}
                    onClick={() => setActiveTab('knowledge-base')}
                  >
                    Knowledge Base
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'project-management' ? styles.active : ''}`}
                    onClick={() => setActiveTab('project-management')}
                  >
                    Project Management
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'announcements' ? styles.active : ''}`}
                    onClick={() => setActiveTab('announcements')}
                  >
                    Announcements
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'notifications' ? styles.active : ''}`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    Notifications
                  </button>
                </div>

                {settingsLoading ? (
                  <div className={styles.settingsLoading}>
                    Loading settings...
                  </div>
                ) : (
                  <div className={styles.settingsForm}>
                    {/* Automation Tab */}
                    {activeTab === 'automation' && (
                      <div className={styles.automationSection}>
                        <AutomationSettings companyId={selectedCompany.id} />
                      </div>
                    )}

                    {/* Knowledge Base Tab */}
                    {activeTab === 'knowledge-base' && (
                      <div className={styles.knowledgeBaseSection}>
                        <KnowledgeBase companyId={selectedCompany.id} />
                      </div>
                    )}

                    {/* Project Management Tab */}
                    {activeTab === 'project-management' && (
                      <div className={styles.projectManagementSection}>
                        <div className={styles.settingsInfo}>
                          <p>
                            Manage project categories and settings for{' '}
                            <strong>{selectedCompany.name}</strong>.
                          </p>
                          <p>
                            <Link
                              href="/settings/project-management"
                              style={{
                                color: 'var(--blue-500)',
                                fontWeight: 600,
                              }}
                            >
                              Go to Project Management Settings →
                            </Link>
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Announcements Tab */}
                    {activeTab === 'announcements' && (
                      <div className={styles.announcementsSection}>
                        <AnnouncementsManager companyId={selectedCompany.id} />
                      </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                      <div className={styles.notificationsSection}>
                        <CompanyNotificationSettingsManager />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.settingsSection}>
                <div className={styles.message}>
                  <AlertCircle size={16} />
                  Please select a company from the header dropdown to view
                  settings.
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
