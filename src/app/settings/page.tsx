'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useCompanyRole, useIsCompanyAdminAny } from '@/hooks/useCompanyRole'
import { isAuthorizedAdminSync } from '@/lib/auth-helpers'
import { adminAPI } from '@/lib/api-client'
import { Save, AlertCircle, CheckCircle, Settings as SettingsIcon, Copy, Check, RefreshCw } from 'lucide-react'
import styles from './page.module.scss'

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  role?: string
}

interface Company {
  id: string
  name: string
}

interface UserCompany {
  id: string
  user_id: string
  company_id: string
  role: string
  is_primary: boolean
  companies: Company
}

interface CompanySetting {
  value: any
  type: string
  description: string
}

interface CompanySettings {
  [key: string]: CompanySetting
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [settings, setSettings] = useState<CompanySettings>({})
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'calling' | 'widget'>('calling')
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle')
  const [brandColors, setBrandColors] = useState<{ primary?: string; secondary?: string }>({})
  const [brandLoading, setBrandLoading] = useState(false)
  const router = useRouter()

  const { isAdminForAnyCompany, adminCompanies, isLoading: roleLoading } = useIsCompanyAdminAny()
  const { isCompanyAdmin } = useCompanyRole(selectedCompanyId)
  
  // Check if user is global admin
  const isGlobalAdmin = profile ? isAuthorizedAdminSync(profile) : false
  const [allCompanies, setAllCompanies] = useState<UserCompany[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    const getSessionAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/login')
        return
      }

      setUser(session.user)

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profileError && profileData) {
        setProfile(profileData)
      }

      setLoading(false)
    }

    getSessionAndData()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (!session?.user) {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  // Fetch all companies for global admins
  useEffect(() => {
    if (isGlobalAdmin && profile) {
      fetchAllCompanies()
    }
  }, [isGlobalAdmin, profile])

  const fetchAllCompanies = async () => {
    try {
      setCompaniesLoading(true)
      const companies = await adminAPI.getCompanies()
      
      // Convert to UserCompany format for consistency
      const userCompanies: UserCompany[] = companies.map((company: any) => ({
        id: `global-${company.id}`,
        user_id: profile!.id,
        company_id: company.id,
        role: 'admin', // Global admins have admin role
        is_primary: false,
        companies: {
          id: company.id,
          name: company.name
        }
      }))
      setAllCompanies(userCompanies)
    } catch (error) {
      console.error('Error fetching all companies:', error)
    } finally {
      setCompaniesLoading(false)
    }
  }

  // Set default selected company when companies are loaded
  useEffect(() => {
    const availableCompanies = isGlobalAdmin ? allCompanies : adminCompanies
    if (!selectedCompanyId && availableCompanies.length > 0) {
      setSelectedCompanyId(availableCompanies[0].company_id)
    }
  }, [adminCompanies, allCompanies, selectedCompanyId, isGlobalAdmin])

  // Fetch settings when company is selected
  useEffect(() => {
    if (selectedCompanyId && (isCompanyAdmin || isGlobalAdmin)) {
      fetchSettings()
      fetchBrandColors()
    }
  }, [selectedCompanyId, isCompanyAdmin, isGlobalAdmin])

  const fetchSettings = async () => {
    if (!selectedCompanyId) return

    try {
      setSettingsLoading(true)
      const response = await fetch(`/api/companies/${selectedCompanyId}/settings`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const { settings: fetchedSettings } = await response.json()
      setSettings(fetchedSettings || {})
    } catch (error) {
      console.error('Error fetching settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value
      }
    }))
  }

  const handleSave = async () => {
    if (!selectedCompanyId) return

    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch(`/api/companies/${selectedCompanyId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const generateEmbedCode = () => {
    if (!selectedCompanyId) return ''

    const title = settings.widget_form_title?.value || 'Get Your Free Pest Control Quote'
    const description = settings.widget_form_description?.value || 'Fill out this form to get a customized quote for your pest control needs.'

    let embedCode = `<script 
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js"
  data-company-id="${selectedCompanyId}"
  data-base-url="${typeof window !== 'undefined' ? window.location.origin : ''}"`

    // Add widget form settings as data attributes
    if (title) {
      embedCode += `\n  data-header-text="${title}"`
    }
    if (description) {
      embedCode += `\n  data-sub-header-text="${description}"`
    }

    embedCode += `
></script>`

    return embedCode
  }

  const copyEmbedCode = async () => {
    if (!selectedCompanyId) return
    
    setCopyStatus('copying')
    
    try {
      await navigator.clipboard.writeText(generateEmbedCode())
      setCopyStatus('copied')
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Failed to copy embed code:', error)
      setCopyStatus('idle')
    }
  }

  const fetchBrandColors = async () => {
    if (!selectedCompanyId) return

    try {
      setBrandLoading(true)
      // Fetch brand colors directly from brands table
      const supabase = createClient()
      const { data: brandData, error } = await supabase
        .from('brands')
        .select('primary_color_hex, secondary_color_hex')
        .eq('company_id', selectedCompanyId)
        .single()
      
      if (!error && brandData) {
        setBrandColors({
          primary: brandData.primary_color_hex,
          secondary: brandData.secondary_color_hex
        })
      } else {
        setBrandColors({})
      }
    } catch (error) {
      console.error('Error fetching brand colors:', error)
      setBrandColors({})
    } finally {
      setBrandLoading(false)
    }
  }

  const resetToBrandColors = () => {
    if (brandColors.primary || brandColors.secondary) {
      const currentColors = settings.widget_form_colors?.value || { 
        primary: '#3b82f6', 
        secondary: '#1e293b', 
        background: '#ffffff', 
        text: '#374151' 
      }
      
      handleSettingChange('widget_form_colors', {
        ...currentColors,
        primary: brandColors.primary || currentColors.primary,
        secondary: brandColors.secondary || currentColors.secondary
      })
    }
  }

  if (loading || roleLoading || companiesLoading) {
    return <div className={styles.loading}>Loading...</div>
  }

  if (!user || !profile) {
    return <div className={styles.loading}>Redirecting...</div>
  }

  // Check if user has admin access to any company OR is global admin
  if (!isAdminForAnyCompany && !isGlobalAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.accessDenied}>
          <AlertCircle size={48} className={styles.icon} />
          <h1>Access Denied</h1>
          <p>You need company admin privileges to access settings.</p>
          <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const availableCompanies = isGlobalAdmin ? allCompanies : adminCompanies
  const selectedCompany = availableCompanies.find(uc => uc.company_id === selectedCompanyId)

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <SettingsIcon size={24} className={styles.titleIcon} />
            <h1 className={styles.title}>Company Settings</h1>
          </div>
          <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
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
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className={styles.select}
            >
              {availableCompanies.map((userCompany) => (
                <option key={userCompany.company_id} value={userCompany.company_id}>
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
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
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
              <button
                className={`${styles.tabButton} ${activeTab === 'widget' ? styles.active : ''}`}
                onClick={() => setActiveTab('widget')}
              >
                Widget Form
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
                      <h3 className={styles.groupTitle}>Phone Call Automation</h3>
                  
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
                          checked={settings.auto_call_enabled?.value === true}
                          onChange={(e) => handleSettingChange('auto_call_enabled', e.target.checked)}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.setting}>
                    <div className={styles.settingInfo}>
                      <label htmlFor="weekend-calling" className={styles.settingLabel}>
                        Weekend Calling
                      </label>
                      <p className={styles.settingDescription}>
                        {settings.weekend_calling_enabled?.description || 'Allow calls on weekends'}
                      </p>
                    </div>
                    <div className={styles.settingControl}>
                      <label className={styles.toggle}>
                        <input
                          id="weekend-calling"
                          type="checkbox"
                          checked={settings.weekend_calling_enabled?.value === true}
                          onChange={(e) => handleSettingChange('weekend_calling_enabled', e.target.checked)}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>
                  </div>
                </div>

                    {/* Business Hours Settings */}
                    <div className={styles.settingGroup}>
                      <h3 className={styles.groupTitle}>Business Hours</h3>
                      
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <div key={day} className={styles.dayHours}>
                          <div className={styles.dayHeader}>
                            <span className={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                            <label className={styles.toggle}>
                              <input
                                type="checkbox"
                                checked={settings[`business_hours_${day}`]?.value?.enabled ?? true}
                                onChange={(e) => {
                                  const currentValue = settings[`business_hours_${day}`]?.value || { start: '09:00', end: '17:00', enabled: true }
                                  handleSettingChange(`business_hours_${day}`, {
                                    ...currentValue,
                                    enabled: e.target.checked
                                  })
                                }}
                              />
                              <span className={styles.toggleSlider}></span>
                            </label>
                          </div>
                          
                          {settings[`business_hours_${day}`]?.value?.enabled && (
                            <div className={styles.timeSettings}>
                              <div className={styles.timeInputGroup}>
                                <label className={styles.settingLabel}>Start</label>
                                <input
                                  type="time"
                                  value={settings[`business_hours_${day}`]?.value?.start || '09:00'}
                                  onChange={(e) => {
                                    const currentValue = settings[`business_hours_${day}`]?.value || { start: '09:00', end: '17:00', enabled: true }
                                    handleSettingChange(`business_hours_${day}`, {
                                      ...currentValue,
                                      start: e.target.value
                                    })
                                  }}
                                  className={styles.timeField}
                                />
                              </div>
                              
                              <div className={styles.timeInputGroup}>
                                <label className={styles.settingLabel}>End</label>
                                <input
                                  type="time"
                                  value={settings[`business_hours_${day}`]?.value?.end || '17:00'}
                                  onChange={(e) => {
                                    const currentValue = settings[`business_hours_${day}`]?.value || { start: '09:00', end: '17:00', enabled: true }
                                    handleSettingChange(`business_hours_${day}`, {
                                      ...currentValue,
                                      end: e.target.value
                                    })
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
                            className={styles.numberInput}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Widget Form Settings Tab */}
                {activeTab === 'widget' && (
                  <>
                    {/* General Widget Settings */}
                    <div className={styles.settingGroup}>
                      <h3 className={styles.groupTitle}>Widget Form Configuration</h3>
                      
                      <div className={styles.setting}>
                        <div className={styles.settingInfo}>
                          <label htmlFor="widget-enabled" className={styles.settingLabel}>
                            Enable Widget Form
                          </label>
                          <p className={styles.settingDescription}>
                            Allow leads to be captured through the widget form
                          </p>
                        </div>
                        <div className={styles.settingControl}>
                          <label className={styles.toggle}>
                            <input
                              id="widget-enabled"
                              type="checkbox"
                              checked={settings.widget_form_enabled?.value === true}
                              onChange={(e) => handleSettingChange('widget_form_enabled', e.target.checked)}
                            />
                            <span className={styles.toggleSlider}></span>
                          </label>
                        </div>
                      </div>

                      <div className={styles.setting}>
                        <div className={styles.settingInfo}>
                          <label htmlFor="widget-title" className={styles.settingLabel}>
                            Widget Title
                          </label>
                          <p className={styles.settingDescription}>
                            Main heading displayed on the widget form
                          </p>
                        </div>
                        <div className={styles.settingControl}>
                          <input
                            id="widget-title"
                            type="text"
                            value={settings.widget_form_title?.value || 'Get Your Free Pest Control Quote'}
                            onChange={(e) => handleSettingChange('widget_form_title', e.target.value)}
                            className={styles.textInput}
                          />
                        </div>
                      </div>

                      <div className={styles.setting}>
                        <div className={styles.settingInfo}>
                          <label htmlFor="widget-description" className={styles.settingLabel}>
                            Widget Description
                          </label>
                          <p className={styles.settingDescription}>
                            Description text shown below the title
                          </p>
                        </div>
                        <div className={styles.settingControl}>
                          <textarea
                            id="widget-description"
                            value={settings.widget_form_description?.value || 'Fill out this form to get a customized quote for your pest control needs.'}
                            onChange={(e) => handleSettingChange('widget_form_description', e.target.value)}
                            className={styles.textareaInput}
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className={styles.setting}>
                        <div className={styles.settingInfo}>
                          <label htmlFor="widget-button-text" className={styles.settingLabel}>
                            Submit Button Text
                          </label>
                          <p className={styles.settingDescription}>
                            Text displayed on the form submit button
                          </p>
                        </div>
                        <div className={styles.settingControl}>
                          <input
                            id="widget-button-text"
                            type="text"
                            value={settings.widget_form_button_text?.value || 'Get My Quote'}
                            onChange={(e) => handleSettingChange('widget_form_button_text', e.target.value)}
                            className={styles.textInput}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Widget Colors */}
                    <div className={styles.settingGroup}>
                      <h3 className={styles.groupTitle}>Widget Appearance</h3>
                      
                      {(brandColors.primary || brandColors.secondary) && (
                        <div className={styles.brandColorsSection}>
                          <button
                            onClick={resetToBrandColors}
                            disabled={brandLoading}
                            className={styles.resetBrandButton}
                          >
                            <RefreshCw size={16} className={brandLoading ? styles.spinning : ''} />
                            Reset to Brand Colors
                          </button>
                          <p className={styles.brandColorsNote}>
                            Reset widget colors to your company&apos;s brand colors
                            {brandColors.primary && ` (Primary: ${brandColors.primary})`}
                            {brandColors.secondary && ` (Secondary: ${brandColors.secondary})`}
                          </p>
                        </div>
                      )}
                      
                      <div className={styles.colorSettings}>
                        <div className={styles.colorSetting}>
                          <label htmlFor="color-primary" className={styles.settingLabel}>
                            Primary Color
                          </label>
                          <input
                            id="color-primary"
                            type="color"
                            value={settings.widget_form_colors?.value?.primary || '#3b82f6'}
                            onChange={(e) => {
                              const currentColors = settings.widget_form_colors?.value || { primary: '#3b82f6', secondary: '#1e293b', background: '#ffffff', text: '#374151' }
                              handleSettingChange('widget_form_colors', {
                                ...currentColors,
                                primary: e.target.value
                              })
                            }}
                            className={styles.colorInput}
                          />
                        </div>

                        <div className={styles.colorSetting}>
                          <label htmlFor="color-secondary" className={styles.settingLabel}>
                            Secondary Color
                          </label>
                          <input
                            id="color-secondary"
                            type="color"
                            value={settings.widget_form_colors?.value?.secondary || '#1e293b'}
                            onChange={(e) => {
                              const currentColors = settings.widget_form_colors?.value || { primary: '#3b82f6', secondary: '#1e293b', background: '#ffffff', text: '#374151' }
                              handleSettingChange('widget_form_colors', {
                                ...currentColors,
                                secondary: e.target.value
                              })
                            }}
                            className={styles.colorInput}
                          />
                        </div>

                        <div className={styles.colorSetting}>
                          <label htmlFor="color-background" className={styles.settingLabel}>
                            Background Color
                          </label>
                          <input
                            id="color-background"
                            type="color"
                            value={settings.widget_form_colors?.value?.background || '#ffffff'}
                            onChange={(e) => {
                              const currentColors = settings.widget_form_colors?.value || { primary: '#3b82f6', secondary: '#1e293b', background: '#ffffff', text: '#374151' }
                              handleSettingChange('widget_form_colors', {
                                ...currentColors,
                                background: e.target.value
                              })
                            }}
                            className={styles.colorInput}
                          />
                        </div>

                        <div className={styles.colorSetting}>
                          <label htmlFor="color-text" className={styles.settingLabel}>
                            Text Color
                          </label>
                          <input
                            id="color-text"
                            type="color"
                            value={settings.widget_form_colors?.value?.text || '#374151'}
                            onChange={(e) => {
                              const currentColors = settings.widget_form_colors?.value || { primary: '#3b82f6', secondary: '#1e293b', background: '#ffffff', text: '#374151' }
                              handleSettingChange('widget_form_colors', {
                                ...currentColors,
                                text: e.target.value
                              })
                            }}
                            className={styles.colorInput}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form Configuration */}
                    <div className={styles.settingGroup}>
                      <h3 className={styles.groupTitle}>Form Behavior</h3>
                      
                      <div className={styles.setting}>
                        <div className={styles.settingInfo}>
                          <label htmlFor="widget-success-message" className={styles.settingLabel}>
                            Success Message
                          </label>
                          <p className={styles.settingDescription}>
                            Message shown after successful form submission
                          </p>
                        </div>
                        <div className={styles.settingControl}>
                          <textarea
                            id="widget-success-message"
                            value={settings.widget_form_success_message?.value || 'Thank you! Your information has been submitted successfully. We will contact you soon.'}
                            onChange={(e) => handleSettingChange('widget_form_success_message', e.target.value)}
                            className={styles.textareaInput}
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className={styles.setting}>
                        <div className={styles.settingInfo}>
                          <label htmlFor="widget-lead-priority" className={styles.settingLabel}>
                            Default Lead Priority
                          </label>
                          <p className={styles.settingDescription}>
                            Priority assigned to leads created from this widget
                          </p>
                        </div>
                        <div className={styles.settingControl}>
                          <select
                            id="widget-lead-priority"
                            value={settings.widget_form_lead_priority?.value || 'medium'}
                            onChange={(e) => handleSettingChange('widget_form_lead_priority', e.target.value)}
                            className={styles.selectInput}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Embed Code Section */}
                    <div className={styles.settingGroup}>
                      <h3 className={styles.groupTitle}>Embed Code</h3>
                      <p className={styles.groupDescription}>
                        Copy this code and paste it on your website where you want the widget form to appear.
                      </p>
                      
                      <div className={styles.embedCodeSection}>
                        <div className={styles.embedCode}>
                          <code>
                            {generateEmbedCode()}
                          </code>
                        </div>
                        <button 
                          onClick={copyEmbedCode} 
                          className={styles.copyButton}
                          disabled={copyStatus === 'copying'}
                        >
                          {copyStatus === 'copying' && <RefreshCw size={16} className={styles.spinning} />}
                          {copyStatus === 'copied' && <Check size={16} />}
                          {copyStatus === 'idle' && <Copy size={16} />}
                          <span>
                            {copyStatus === 'copying' && 'Copying...'}
                            {copyStatus === 'copied' && 'Copied!'}
                            {copyStatus === 'idle' && 'Copy Code'}
                          </span>
                        </button>
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
  )
}