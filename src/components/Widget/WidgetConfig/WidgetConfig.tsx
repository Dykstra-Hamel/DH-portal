'use client';
import React, { useState, useEffect } from 'react';
import { Save, Copy, Eye, RefreshCw, Check } from 'lucide-react';
import { adminAPI } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import styles from './WidgetConfig.module.scss';
import EmbedPreview from '../WidgetPreview';
import ServiceAreaMap from '../ServiceAreaMap';
import {
  getCompanyCoordinates,
  createCachedGeocodeResult,
} from '@/lib/geocoding';
interface Company {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  widget_config?: any;
}
interface ColorState {
  value: string;
  source: 'brand' | 'override' | 'default';
}
interface WidgetConfigData {
  branding: {
    logo?: string;
    companyName: string;
  };
  headers: {
    headerText: string;
    subHeaderText: string;
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  colorOverrides?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  submitButtonText: string;
  successMessage: string;
  addressApi: {
    enabled: boolean;
    maxSuggestions: number;
  };
  service_areas: string[];
  messaging: {
    welcome: string;
    fallback: string;
  };
  notifications: {
    emails: string[];
  };
}
interface WidgetConfigProps {
  companies: Company[];
  selectedCompanyId?: string;
  onCompanyChange?: (companyId: string) => void;
}
const WidgetConfig: React.FC<WidgetConfigProps> = ({
  companies,
  selectedCompanyId,
  onCompanyChange,
}) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [config, setConfig] = useState<WidgetConfigData>({
    branding: {
      companyName: '',
    },
    headers: {
      headerText: '',
      subHeaderText: '',
    },
    colors: {
      primary: '#3b82f6',
      secondary: '#1e293b',
      background: '#ffffff',
      text: '#374151',
    },
    submitButtonText: 'Get My Quote',
    successMessage:
      'Thank you! Your information has been submitted successfully. We will contact you soon.',
    addressApi: {
      enabled: false,
      maxSuggestions: 5,
    },
    service_areas: [],
    messaging: {
      welcome: 'Get Started',
      fallback: 'Get your free pest control estimate in just a few steps.',
    },
    notifications: {
      emails: [],
    },
  });
  const [serviceAreaInput, setServiceAreaInput] = useState('');
  const [notificationEmailsInput, setNotificationEmailsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [showServiceAreaMap, setShowServiceAreaMap] = useState(true);
  const [copyStatusFull, setCopyStatusFull] = useState<
    'idle' | 'copying' | 'copied'
  >('idle');
  const [copyStatusMinimal, setCopyStatusMinimal] = useState<
    'idle' | 'copying' | 'copied'
  >('idle');
  const [copyStatusButton, setCopyStatusButton] = useState<
    'idle' | 'copying' | 'copied'
  >('idle');
  const [brandColors, setBrandColors] = useState<{
    primary?: string;
    secondary?: string;
  }>({});
  const [brandLoading, setBrandLoading] = useState(false);
  const [colorStates, setColorStates] = useState<{
    primary: ColorState;
    secondary: ColorState;
    background: ColorState;
    text: ColorState;
  }>({
    primary: { value: '#3b82f6', source: 'default' },
    secondary: { value: '#1e293b', source: 'default' },
    background: { value: '#ffffff', source: 'default' },
    text: { value: '#374151', source: 'default' },
  });
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  // Default color values
  const defaultColors = {
    primary: '#3b82f6',
    secondary: '#1e293b',
    background: '#ffffff',
    text: '#374151',
  };
  // Color resolution function
  const resolveColors = (
    brandColors: { primary?: string; secondary?: string },
    overrides?: {
      primary?: string;
      secondary?: string;
      background?: string;
      text?: string;
    }
  ) => {
    const resolved: {
      primary: ColorState;
      secondary: ColorState;
      background: ColorState;
      text: ColorState;
    } = {
      primary: {
        value:
          overrides?.primary || brandColors.primary || defaultColors.primary,
        source: overrides?.primary
          ? 'override'
          : brandColors.primary
            ? 'brand'
            : 'default',
      },
      secondary: {
        value:
          overrides?.secondary ||
          brandColors.secondary ||
          defaultColors.secondary,
        source: overrides?.secondary
          ? 'override'
          : brandColors.secondary
            ? 'brand'
            : 'default',
      },
      background: {
        value: overrides?.background || defaultColors.background,
        source: overrides?.background ? 'override' : 'default',
      },
      text: {
        value: overrides?.text || defaultColors.text,
        source: overrides?.text ? 'override' : 'default',
      },
    };
    return resolved;
  };
  // Handle color changes with override tracking
  const handleColorChange = (
    colorType: 'primary' | 'secondary' | 'background' | 'text',
    value: string
  ) => {
    setConfig(prev => {
      const newOverrides = { ...prev.colorOverrides };
      // Check if this color matches the brand color or default
      const brandValue =
        colorType === 'primary'
          ? brandColors.primary
          : colorType === 'secondary'
            ? brandColors.secondary
            : null;
      const defaultValue = defaultColors[colorType];
      if (value === brandValue || (value === defaultValue && !brandValue)) {
        // Remove override if value matches brand or default
        delete newOverrides[colorType];
      } else {
        // Set override if value is different
        newOverrides[colorType] = value;
      }
      return {
        ...prev,
        colorOverrides: newOverrides,
      };
    });
  };
  // Reset individual color to brand/default value
  const resetIndividualColor = (
    colorType: 'primary' | 'secondary' | 'background' | 'text'
  ) => {
    setConfig(prev => {
      const newOverrides = { ...prev.colorOverrides };
      // Remove the override for this specific color
      delete newOverrides[colorType];
      return {
        ...prev,
        colorOverrides: newOverrides,
      };
    });
  };
  // Update color states when brand colors or config changes
  useEffect(() => {
    const resolved = resolveColors(brandColors, config.colorOverrides);
    setColorStates(resolved);
    // Update the colors in config to reflect resolved values
    setConfig(prev => ({
      ...prev,
      colors: {
        primary: resolved.primary.value,
        secondary: resolved.secondary.value,
        background: resolved.background.value,
        text: resolved.text.value,
      },
    }));
  }, [brandColors, config.colorOverrides]);
  // Fetch Google API key on component mount
  useEffect(() => {
    const fetchGoogleApiKey = async () => {
      try {
        const response = await fetch('/api/google-places-key');
        if (response.ok) {
          const data = await response.json();
          setGoogleApiKey(data.apiKey || '');
        }
      } catch (error) {
        console.error('Error fetching Google API key:', error);
      }
    };
    fetchGoogleApiKey();
  }, []);
  // Load company data when selected company changes
  useEffect(() => {
    if (selectedCompanyId) {
      const company = companies.find(c => c.id === selectedCompanyId);
      if (company) {
        setSelectedCompany(company);
        loadCompanyConfig(company);
        fetchBrandColors(selectedCompanyId);
        loadServiceAreas(selectedCompanyId);
        geocodeCompanyAddress(company);
      }
    }
  }, [selectedCompanyId, companies]);
  const loadCompanyConfig = (company: Company) => {
    const widgetConfig = company.widget_config || {};
    setConfig({
      branding: {
        logo: widgetConfig.branding?.logo || '',
        companyName: widgetConfig.branding?.companyName || company.name,
      },
      headers: {
        headerText: widgetConfig.headers?.headerText || '',
        subHeaderText: widgetConfig.headers?.subHeaderText || '',
      },
      colors: {
        primary: widgetConfig.colors?.primary || defaultColors.primary,
        secondary: widgetConfig.colors?.secondary || defaultColors.secondary,
        background: widgetConfig.colors?.background || defaultColors.background,
        text: widgetConfig.colors?.text || defaultColors.text,
      },
      colorOverrides: widgetConfig.colorOverrides || {},
      submitButtonText: widgetConfig.submitButtonText || 'Get My Quote',
      successMessage:
        widgetConfig.successMessage ||
        'Thank you! Your information has been submitted successfully. We will contact you soon.',
      addressApi: {
        enabled: widgetConfig.addressApi?.enabled || false,
        maxSuggestions: widgetConfig.addressApi?.maxSuggestions || 5,
      },
      service_areas: widgetConfig.service_areas || [],
      messaging: {
        welcome: widgetConfig.messaging?.welcome || 'Get Started',
        fallback:
          widgetConfig.messaging?.fallback ||
          'Get your free pest control estimate in just a few steps.',
      },
      notifications: {
        emails: widgetConfig.notifications?.emails || [],
      },
    });
    // Set the notification emails input field
    const emails = widgetConfig.notifications?.emails || [];
    setNotificationEmailsInput(emails.join('\n'));
  };
  const geocodeCompanyAddress = async (company: Company) => {
    try {
      const coordinates = await getCompanyCoordinates(company);
      setMapCenter({ lat: coordinates.lat, lng: coordinates.lng });
      // Cache the result in widget_config if it's not already cached
      if (!company.widget_config?.geocodedAddress) {
        const cachedResult = createCachedGeocodeResult(coordinates);
        // Update the company config to include the cached geocode result
        try {
          await adminAPI.updateCompany(company.id, {
            widget_config: {
              ...company.widget_config,
              geocodedAddress: cachedResult,
            },
          });
        } catch (error) {
          console.error('Failed to cache geocoded address:', error);
          // Non-critical error, don't block the UI
        }
      }
    } catch (error) {
      console.error('Error geocoding company address:', error);
      // setMapCenter will remain null, ServiceAreaMap will use fallback
    }
  };
  const fetchBrandColors = async (companyId: string) => {
    try {
      setBrandLoading(true);
      const supabase = createClient();
      const { data: brandData, error } = await supabase
        .from('brands')
        .select('primary_color_hex, secondary_color_hex')
        .eq('company_id', companyId)
        .single();
      if (!error && brandData) {
        setBrandColors({
          primary: brandData.primary_color_hex,
          secondary: brandData.secondary_color_hex,
        });
      } else {
        setBrandColors({});
      }
    } catch (error) {
      console.error('Error fetching brand colors:', error);
      setBrandColors({});
    } finally {
      setBrandLoading(false);
    }
  };
  const loadServiceAreas = async (companyId: string) => {
    try {
      const response = await fetch(`/api/service-areas/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServiceAreas(data.serviceAreas || []);
        }
      }
    } catch (error) {
      console.error('Error loading service areas:', error);
      setServiceAreas([]);
    }
  };
  const saveServiceAreas = async (areas: any[]) => {
    if (!selectedCompany) return;
    try {
      const response = await fetch(`/api/service-areas/${selectedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceAreas: areas }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServiceAreas(areas);
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
          throw new Error(data.error || 'Failed to save service areas');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server responded with ${response.status}`
        );
      }
    } catch (error) {
      console.error('Error saving service areas:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };
  const resetToBrandColors = () => {
    if (brandColors.primary || brandColors.secondary) {
      setConfig(prev => ({
        ...prev,
        colorOverrides: {
          ...prev.colorOverrides,
          // Remove overrides for colors that have brand values
          primary: brandColors.primary
            ? undefined
            : prev.colorOverrides?.primary,
          secondary: brandColors.secondary
            ? undefined
            : prev.colorOverrides?.secondary,
        },
      }));
    }
  };
  const handleCompanySelect = (companyId: string) => {
    if (onCompanyChange) {
      onCompanyChange(companyId);
    } else {
      const company = companies.find(c => c.id === companyId);
      if (company) {
        setSelectedCompany(company);
        loadCompanyConfig(company);
      }
    }
  };
  const handleConfigChange = (
    section: keyof WidgetConfigData,
    field: string,
    value: any
  ) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
  };
  const addServiceArea = () => {
    if (
      serviceAreaInput.trim() &&
      !config.service_areas.includes(serviceAreaInput.trim())
    ) {
      setConfig(prev => ({
        ...prev,
        service_areas: [...prev.service_areas, serviceAreaInput.trim()],
      }));
      setServiceAreaInput('');
    }
  };
  const removeServiceArea = (area: string) => {
    setConfig(prev => ({
      ...prev,
      service_areas: prev.service_areas.filter(a => a !== area),
    }));
  };
  const parseNotificationEmails = (input: string): string[] => {
    return input
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0 && email.includes('@'));
  };
  const updateNotificationEmails = () => {
    const emails = parseNotificationEmails(notificationEmailsInput);
    setConfig(prev => ({
      ...prev,
      notifications: {
        emails,
      },
    }));
  };
  const removeNotificationEmail = (emailToRemove: string) => {
    // Update the config
    setConfig(prev => ({
      ...prev,
      notifications: {
        emails: prev.notifications.emails.filter(
          email => email !== emailToRemove
        ),
      },
    }));
    // Update the text input field to sync with the removed email
    const currentEmails = config.notifications.emails.filter(
      email => email !== emailToRemove
    );
    setNotificationEmailsInput(currentEmails.join('\n'));
  };
  const saveConfig = async () => {
    if (!selectedCompany) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await adminAPI.updateCompany(selectedCompany.id, {
        widget_config: config,
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving widget config:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };
  const generateFullEmbedCode = () => {
    if (!selectedCompany) return '';
    let embedCode = `<script 
  src="${window.location.origin}/widget.js"
  data-company-id="${selectedCompany.id}"
  data-base-url="${window.location.origin}"`;
    // Add all configuration as data attributes
    if (config.headers.headerText) {
      embedCode += `\n  data-header-text="${config.headers.headerText}"`;
    }
    if (config.headers.subHeaderText) {
      embedCode += `\n  data-sub-header-text="${config.headers.subHeaderText}"`;
    }
    if (config.submitButtonText !== 'Get My Quote') {
      embedCode += `\n  data-submit-button-text="${config.submitButtonText}"`;
    }
    if (
      config.successMessage !==
      'Thank you! Your information has been submitted successfully. We will contact you soon.'
    ) {
      embedCode += `\n  data-success-message="${config.successMessage}"`;
    }
    if (config.colors.primary !== '#3b82f6') {
      embedCode += `\n  data-primary-color="${config.colors.primary}"`;
    }
    if (config.colors.secondary !== '#1e293b') {
      embedCode += `\n  data-secondary-color="${config.colors.secondary}"`;
    }
    if (config.colors.background !== '#ffffff') {
      embedCode += `\n  data-background-color="${config.colors.background}"`;
    }
    if (config.colors.text !== '#374151') {
      embedCode += `\n  data-text-color="${config.colors.text}"`;
    }
    if (config.messaging.welcome !== 'Get Started') {
      embedCode += `\n  data-welcome-title="${config.messaging.welcome}"`;
    }
    if (
      config.messaging.fallback !==
      'Get your free pest control estimate in just a few steps.'
    ) {
      embedCode += `\n  data-welcome-description="${config.messaging.fallback}"`;
    }
    embedCode += `
></script>`;
    return embedCode;
  };
  const generateMinimalEmbedCode = () => {
    if (!selectedCompany) return '';
    return `<script 
  src="${window.location.origin}/widget.js"
  data-company-id="${selectedCompany.id}"
  data-base-url="${window.location.origin}"
></script>`;
  };

  const generateButtonEmbedCode = () => {
    if (!selectedCompany) return '';

    let embedCode = `<script 
  src="${window.location.origin}/widget.js"
  data-company-id="${selectedCompany.id}"
  data-base-url="${window.location.origin}"
  data-display-mode="button"`;

    // Add button text if customized
    if (config.submitButtonText !== 'Get My Quote') {
      embedCode += `\n  data-button-text="${config.submitButtonText}"`;
    }

    embedCode += `
></script>`;

    return embedCode;
  };

  const copyFullEmbedCode = async () => {
    if (!selectedCompany) return;

    setCopyStatusFull('copying');
    try {
      await navigator.clipboard.writeText(generateFullEmbedCode());
      setCopyStatusFull('copied');
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setCopyStatusFull('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy full embed code:', error);
      setCopyStatusFull('idle');
    }
  };
  const copyMinimalEmbedCode = async () => {
    if (!selectedCompany) return;
    setCopyStatusMinimal('copying');
    try {
      await navigator.clipboard.writeText(generateMinimalEmbedCode());
      setCopyStatusMinimal('copied');
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setCopyStatusMinimal('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy minimal embed code:', error);
      setCopyStatusMinimal('idle');
    }
  };

  const copyButtonEmbedCode = async () => {
    if (!selectedCompany) return;

    setCopyStatusButton('copying');

    try {
      await navigator.clipboard.writeText(generateButtonEmbedCode());
      setCopyStatusButton('copied');

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setCopyStatusButton('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy button embed code:', error);
      setCopyStatusButton('idle');
    }
  };

  if (!selectedCompany) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Widget Configuration</h2>
          <p>Select a company to configure their AI-powered widget.</p>
        </div>
        <div className={styles.companySelector}>
          <label>Select Company:</label>
          <select onChange={e => handleCompanySelect(e.target.value)} value="">
            <option value="">Choose a company...</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Widget Configuration</h2>
        <p>Configure the AI-powered widget for {selectedCompany.name}</p>
        <div className={styles.headerActions}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={styles.previewButton}
          >
            <Eye size={16} />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className={styles.saveButton}
          >
            {isSaving ? (
              <RefreshCw size={16} className={styles.spinning} />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
      <div className={styles.companySelector}>
        <label>Select Company:</label>
        <select
          onChange={e => handleCompanySelect(e.target.value)}
          value={selectedCompany.id}
        >
          <option value="">Choose a company...</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>
      {saveStatus !== 'idle' && (
        <div className={`${styles.statusMessage} ${styles[saveStatus]}`}>
          {saveStatus === 'success' && 'Configuration saved successfully!'}
          {saveStatus === 'error' &&
            'Failed to save configuration. Please try again.'}
        </div>
      )}
      <div
        className={`${styles.content} ${showPreview ? styles.withPreview : styles.withoutPreview}`}
      >
        <div className={styles.configSection}>
          {/* Branding Section */}
          <div className={styles.section}>
            <h3>Branding</h3>
            <div className={styles.formGroup}>
              <label>Company Name</label>
              <input
                type="text"
                value={config.branding.companyName}
                onChange={e =>
                  handleConfigChange('branding', 'companyName', e.target.value)
                }
                placeholder="Your Company Name"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Header Text</label>
              <input
                type="text"
                value={config.headers.headerText}
                onChange={e =>
                  handleConfigChange('headers', 'headerText', e.target.value)
                }
                placeholder="Get Free Estimate (default if left blank)"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Sub-Header Text (optional)</label>
              <input
                type="text"
                value={config.headers.subHeaderText}
                onChange={e =>
                  handleConfigChange('headers', 'subHeaderText', e.target.value)
                }
                placeholder="Subtitle text - leave blank for no subtitle"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Logo URL (optional)</label>
              <input
                type="url"
                value={config.branding.logo || ''}
                onChange={e =>
                  handleConfigChange('branding', 'logo', e.target.value)
                }
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
          {/* Widget Colors Section */}
          <div className={styles.section}>
            <h3>Widget Colors</h3>
            <p className={styles.sectionDescription}>
              Customize the color scheme of your widget.
            </p>
            {(brandColors.primary || brandColors.secondary) && (
              <div className={styles.brandColorsSection}>
                <button
                  onClick={resetToBrandColors}
                  disabled={brandLoading}
                  className={styles.resetBrandButton}
                  type="button"
                >
                  <RefreshCw
                    size={16}
                    className={brandLoading ? styles.spinning : ''}
                  />
                  Reset to Brand Colors
                </button>
                <p className={styles.brandColorsNote}>
                  Reset widget colors to your company&apos;s brand colors
                  {brandColors.primary && ` (Primary: ${brandColors.primary})`}
                  {brandColors.secondary &&
                    ` (Secondary: ${brandColors.secondary})`}
                </p>
              </div>
            )}
            <div className={styles.colorGrid}>
              <div className={styles.formGroup}>
                <label>
                  Primary Color
                  <span className={styles.colorSource}>
                    (
                    {colorStates.primary.source === 'brand'
                      ? 'from brand'
                      : colorStates.primary.source === 'override'
                        ? 'custom'
                        : 'default'}
                    )
                  </span>
                </label>
                <div className={styles.colorInputWithReset}>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      value={config.colors.primary}
                      onChange={e =>
                        handleColorChange('primary', e.target.value)
                      }
                    />
                    <input
                      type="text"
                      value={config.colors.primary}
                      onChange={e =>
                        handleColorChange('primary', e.target.value)
                      }
                      placeholder="#3b82f6"
                    />
                  </div>
                  {colorStates.primary.source === 'override' && (
                    <button
                      onClick={() => resetIndividualColor('primary')}
                      className={styles.individualResetButton}
                      type="button"
                      title="Reset to brand/default color"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>
                  Secondary Color
                  <span className={styles.colorSource}>
                    (
                    {colorStates.secondary.source === 'brand'
                      ? 'from brand'
                      : colorStates.secondary.source === 'override'
                        ? 'custom'
                        : 'default'}
                    )
                  </span>
                </label>
                <div className={styles.colorInputWithReset}>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      value={config.colors.secondary}
                      onChange={e =>
                        handleColorChange('secondary', e.target.value)
                      }
                    />
                    <input
                      type="text"
                      value={config.colors.secondary}
                      onChange={e =>
                        handleColorChange('secondary', e.target.value)
                      }
                      placeholder="#1e293b"
                    />
                  </div>
                  {colorStates.secondary.source === 'override' && (
                    <button
                      onClick={() => resetIndividualColor('secondary')}
                      className={styles.individualResetButton}
                      type="button"
                      title="Reset to brand/default color"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>
                  Background Color
                  <span className={styles.colorSource}>
                    (
                    {colorStates.background.source === 'override'
                      ? 'custom'
                      : 'default'}
                    )
                  </span>
                </label>
                <div className={styles.colorInputWithReset}>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      value={config.colors.background}
                      onChange={e =>
                        handleColorChange('background', e.target.value)
                      }
                    />
                    <input
                      type="text"
                      value={config.colors.background}
                      onChange={e =>
                        handleColorChange('background', e.target.value)
                      }
                      placeholder="#ffffff"
                    />
                  </div>
                  {colorStates.background.source === 'override' && (
                    <button
                      onClick={() => resetIndividualColor('background')}
                      className={styles.individualResetButton}
                      type="button"
                      title="Reset to default color"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>
                  Text Color
                  <span className={styles.colorSource}>
                    (
                    {colorStates.text.source === 'override'
                      ? 'custom'
                      : 'default'}
                    )
                  </span>
                </label>
                <div className={styles.colorInputWithReset}>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      value={config.colors.text}
                      onChange={e => handleColorChange('text', e.target.value)}
                    />
                    <input
                      type="text"
                      value={config.colors.text}
                      onChange={e => handleColorChange('text', e.target.value)}
                      placeholder="#374151"
                    />
                  </div>
                  {colorStates.text.source === 'override' && (
                    <button
                      onClick={() => resetIndividualColor('text')}
                      className={styles.individualResetButton}
                      type="button"
                      title="Reset to default color"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Widget Text Section */}
          <div className={styles.section}>
            <h3>Widget Text</h3>
            <p className={styles.sectionDescription}>
              Customize the text content of your widget.
            </p>
            <div className={styles.formGroup}>
              <label>Submit Button Text</label>
              <input
                type="text"
                value={config.submitButtonText}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    submitButtonText: e.target.value,
                  }))
                }
                placeholder="Get My Quote"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Success Message</label>
              <textarea
                value={config.successMessage}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    successMessage: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Thank you! Your information has been submitted successfully. We will contact you soon."
              />
            </div>
          </div>
          {/* Welcome Step Section */}
          <div className={styles.section}>
            <h3>Welcome Step</h3>
            <p className={styles.sectionDescription}>
              Customize the title and description text shown on the first step
              of your widget.
            </p>
            <div className={styles.formGroup}>
              <label>Welcome Title</label>
              <input
                type="text"
                value={config.messaging.welcome}
                onChange={e =>
                  handleConfigChange('messaging', 'welcome', e.target.value)
                }
                placeholder="Get Started"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Welcome Description</label>
              <textarea
                value={config.messaging.fallback}
                onChange={e =>
                  handleConfigChange('messaging', 'fallback', e.target.value)
                }
                rows={2}
                placeholder="Get your free pest control estimate in just a few steps."
              />
            </div>
          </div>
          {/* Email Notifications Section */}
          <div className={styles.section}>
            <h3>Email Notifications</h3>
            <p className={styles.sectionDescription}>
              Enter email addresses that should receive notifications when
              customers submit the widget form. Separate multiple emails with
              commas or new lines.
            </p>
            <div className={styles.formGroup}>
              <label>Notification Email Addresses</label>
              <textarea
                value={notificationEmailsInput}
                onChange={e => setNotificationEmailsInput(e.target.value)}
                onBlur={updateNotificationEmails}
                rows={3}
                placeholder="user@company.com, manager@company.com, admin@company.com"
              />
            </div>
            {config.notifications.emails.length > 0 && (
              <div className={styles.emailList}>
                <label>Current notification emails:</label>
                <div className={styles.emailTags}>
                  {config.notifications.emails.map(email => (
                    <span key={email} className={styles.emailTag}>
                      {email}
                      <button
                        onClick={() => removeNotificationEmail(email)}
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Service Areas Section */}
          <div className={styles.section}>
            <h3>Service Areas</h3>
            <p className={styles.sectionDescription}>
              Define where you provide service using geographic areas or zip
              codes. Leave empty to serve all areas.
            </p>
            <div className={styles.serviceAreaTabs}>
              <button
                type="button"
                className={`${styles.tabButton} ${showServiceAreaMap ? styles.active : ''}`}
                onClick={() => setShowServiceAreaMap(true)}
              >
                Geographic Areas
              </button>
              <button
                type="button"
                className={`${styles.tabButton} ${!showServiceAreaMap ? styles.active : ''}`}
                onClick={() => setShowServiceAreaMap(false)}
              >
                Zip Codes
              </button>
            </div>
            {!showServiceAreaMap ? (
              <div className={styles.zipCodeSection}>
                <div className={styles.serviceAreaInput}>
                  <input
                    type="text"
                    value={serviceAreaInput}
                    onChange={e => setServiceAreaInput(e.target.value)}
                    placeholder="Enter zip code (e.g., 12345)"
                    onKeyDown={e => e.key === 'Enter' && addServiceArea()}
                  />
                  <button onClick={addServiceArea} type="button">
                    Add
                  </button>
                </div>
                <div className={styles.serviceAreas}>
                  {config.service_areas.map(area => (
                    <span key={area} className={styles.serviceArea}>
                      {area}
                      <button onClick={() => removeServiceArea(area)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.geographicSection}>
                {googleApiKey ? (
                  <ServiceAreaMap
                    companyId={selectedCompany.id}
                    existingAreas={serviceAreas}
                    onAreasChange={setServiceAreas}
                    onSave={saveServiceAreas}
                    googleMapsApiKey={googleApiKey}
                    defaultCenter={mapCenter || undefined}
                  />
                ) : (
                  <div className={styles.missingApiKey}>
                    <p>
                      Google Maps API key is required for geographic service
                      areas.
                    </p>
                    <p>
                      Please add GOOGLE_PLACES_API_KEY to your environment
                      variables.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Address API Section */}
          <div className={styles.section}>
            <h3>Address Autocomplete</h3>
            <p className={styles.sectionDescription}>
              Enable address autocomplete to help users enter accurate service
              addresses. This feature uses Google Places API and may incur costs
              based on usage.
            </p>
            <div className={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={config.addressApi.enabled}
                  onChange={e =>
                    handleConfigChange(
                      'addressApi',
                      'enabled',
                      e.target.checked
                    )
                  }
                />
                Enable Address Autocomplete
              </label>
            </div>
            {config.addressApi.enabled && (
              <>
                <div className={styles.formGroup}>
                  <label>API Provider</label>
                  <div className={styles.readOnlyField}>
                    <strong>Google Places API</strong>
                  </div>
                  <small className={styles.fieldNote}>
                    Uses Google Places API for accurate address suggestions.
                    GOOGLE_PLACES_API_KEY must be configured in environment
                    variables.
                  </small>
                </div>
                <div className={styles.formGroup}>
                  <label>Max Suggestions</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.addressApi.maxSuggestions}
                    onChange={e =>
                      handleConfigChange(
                        'addressApi',
                        'maxSuggestions',
                        parseInt(e.target.value) || 5
                      )
                    }
                  />
                  <small className={styles.fieldNote}>
                    Number of address suggestions to show (1-10)
                  </small>
                </div>
              </>
            )}
          </div>
          {/* Embed Code Section */}
          <div className={styles.section}>
            <h3>Embed Code</h3>
            <p className={styles.sectionDescription}>
              Copy this code and paste it on your website where you want the
              widget to appear.
            </p>

            {/* Minimal Embed Code */}
            <div className={styles.embedCodeGroup}>
              <h4>Minimal Configuration (Recommended)</h4>
              <p className={styles.embedDescription}>
                Clean, simple embed code. Customizations will be loaded from your saved configuration.
              </p>
              <div className={styles.embedCode}>
                <code>{generateMinimalEmbedCode()}</code>
                <button
                  onClick={copyMinimalEmbedCode}
                  className={styles.copyButton}
                  disabled={copyStatusMinimal === 'copying'}
                >
                  {copyStatusMinimal === 'copying' && (
                    <RefreshCw size={16} className={styles.spinning} />
                  )}
                  {copyStatusMinimal === 'copied' && <Check size={16} />}
                  {copyStatusMinimal === 'idle' && <Copy size={16} />}
                  {copyStatusMinimal === 'copying' && 'Copying...'}
                  {copyStatusMinimal === 'copied' && 'Copied!'}
                  {copyStatusMinimal === 'idle' && 'Copy Minimal Code'}
                </button>
              </div>
            </div>

            {/* Button + Modal Embed Code */}
            <div className={styles.embedCodeGroup}>
              <h4>Button + Modal</h4>
              <p className={styles.embedDescription}>
                Displays as a button that opens the widget in a lightbox modal. 
                Perfect for pages where you want a smaller footprint.
              </p>
              <div className={styles.embedCode}>
                <code>{generateButtonEmbedCode()}</code>
                <button
                  onClick={copyButtonEmbedCode}
                  className={styles.copyButton}
                  disabled={copyStatusButton === 'copying'}
                >
                  {copyStatusButton === 'copying' && (
                    <RefreshCw size={16} className={styles.spinning} />
                  )}
                  {copyStatusButton === 'copied' && <Check size={16} />}
                  {copyStatusButton === 'idle' && <Copy size={16} />}
                  {copyStatusButton === 'copying' && 'Copying...'}
                  {copyStatusButton === 'copied' && 'Copied!'}
                  {copyStatusButton === 'idle' && 'Copy Button Code'}
                </button>
              </div>
            </div>

            {/* Full Embed Code */}
            <div className={styles.embedCodeGroup}>
              <h4>Full Configuration</h4>
              <p className={styles.embedDescription}>
                Includes all your customizations as data attributes for maximum portability.
              </p>
              <div className={styles.embedCode}>
                <code>{generateFullEmbedCode()}</code>
                <button
                  onClick={copyFullEmbedCode}
                  className={styles.copyButton}
                  disabled={copyStatusFull === 'copying'}
                >
                  {copyStatusFull === 'copying' && (
                    <RefreshCw size={16} className={styles.spinning} />
                  )}
                  {copyStatusFull === 'copied' && <Check size={16} />}
                  {copyStatusFull === 'idle' && <Copy size={16} />}
                  {copyStatusFull === 'copying' && 'Copying...'}
                  {copyStatusFull === 'copied' && 'Copied!'}
                  {copyStatusFull === 'idle' && 'Copy Full Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Preview Section */}
        {showPreview && (
          <div className={styles.previewSection}>
            <h3>Widget Preview</h3>
            <div className={styles.previewContainer}>
              <EmbedPreview companyId={selectedCompany.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default WidgetConfig;