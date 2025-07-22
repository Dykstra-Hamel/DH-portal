'use client';

import React, { useState, useEffect } from 'react';
import { Save, Copy, Eye, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { adminAPI } from '@/lib/api-client';
import WidgetPreview from '../WidgetPreview';
import styles from './WidgetConfig.module.scss';
import EmbedPreview from '../WidgetPreview';

interface Company {
  id: string;
  name: string;
  widget_config?: any;
}

interface WidgetConfigData {
  branding: {
    primaryColor: string;
    logo?: string;
    companyName: string;
  };
  headers: {
    headerText: string;
    subHeaderText: string;
  };
  addressApi: {
    enabled: boolean;
    provider: string;
    maxSuggestions: number;
  };
  service_areas: string[];
  messaging: {
    welcome: string;
    fallback: string;
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
  onCompanyChange
}) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [config, setConfig] = useState<WidgetConfigData>({
    branding: {
      primaryColor: '#007bff',
      companyName: ''
    },
    headers: {
      headerText: '',
      subHeaderText: ''
    },
    addressApi: {
      enabled: false,
      provider: 'geoapify',
      maxSuggestions: 5
    },
    service_areas: [],
    messaging: {
      welcome: 'Get Started',
      fallback: 'Get your free pest control estimate in just a few steps.'
    }
  });
  const [serviceAreaInput, setServiceAreaInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle');

  // Load company data when selected company changes
  useEffect(() => {
    if (selectedCompanyId) {
      const company = companies.find(c => c.id === selectedCompanyId);
      if (company) {
        setSelectedCompany(company);
        loadCompanyConfig(company);
      }
    }
  }, [selectedCompanyId, companies]);

  const loadCompanyConfig = (company: Company) => {
    const widgetConfig = company.widget_config || {};
    
    setConfig({
      branding: {
        primaryColor: widgetConfig.branding?.primaryColor || '#007bff',
        logo: widgetConfig.branding?.logo || '',
        companyName: widgetConfig.branding?.companyName || company.name
      },
      headers: {
        headerText: widgetConfig.headers?.headerText || '',
        subHeaderText: widgetConfig.headers?.subHeaderText || ''
      },
      addressApi: {
        enabled: widgetConfig.addressApi?.enabled || false,
        provider: widgetConfig.addressApi?.provider || 'geoapify',
        maxSuggestions: widgetConfig.addressApi?.maxSuggestions || 5
      },
      service_areas: widgetConfig.service_areas || [],
      messaging: {
        welcome: widgetConfig.messaging?.welcome || 'Get Started',
        fallback: widgetConfig.messaging?.fallback || 'Get your free pest control estimate in just a few steps.'
      }
    });
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

  const handleConfigChange = (section: keyof WidgetConfigData, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const addServiceArea = () => {
    if (serviceAreaInput.trim() && !config.service_areas.includes(serviceAreaInput.trim())) {
      setConfig(prev => ({
        ...prev,
        service_areas: [...prev.service_areas, serviceAreaInput.trim()]
      }));
      setServiceAreaInput('');
    }
  };

  const removeServiceArea = (area: string) => {
    setConfig(prev => ({
      ...prev,
      service_areas: prev.service_areas.filter(a => a !== area)
    }));
  };

  const saveConfig = async () => {
    if (!selectedCompany) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      await adminAPI.updateCompany(selectedCompany.id, {
        widget_config: config
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

  const generateEmbedCode = () => {
    if (!selectedCompany) return '';

    let embedCode = `<script 
  src="${window.location.origin}/widget.js"
  data-company-id="${selectedCompany.id}"
  data-base-url="${window.location.origin}"`;

    // Add header attributes if they have values
    if (config.headers.headerText) {
      embedCode += `\n  data-header-text="${config.headers.headerText}"`;
    }
    if (config.headers.subHeaderText) {
      embedCode += `\n  data-sub-header-text="${config.headers.subHeaderText}"`;
    }

    embedCode += `
></script>`;

    return embedCode;
  };

  const copyEmbedCode = async () => {
    if (!selectedCompany) return;
    
    setCopyStatus('copying');
    
    try {
      await navigator.clipboard.writeText(generateEmbedCode());
      setCopyStatus('copied');
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy embed code:', error);
      setCopyStatus('idle');
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
          <select onChange={(e) => handleCompanySelect(e.target.value)} value="">
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
            {isSaving ? <RefreshCw size={16} className={styles.spinning} /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {saveStatus !== 'idle' && (
        <div className={`${styles.statusMessage} ${styles[saveStatus]}`}>
          {saveStatus === 'success' && 'Configuration saved successfully!'}
          {saveStatus === 'error' && 'Failed to save configuration. Please try again.'}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.configSection}>
          {/* Branding Section */}
          <div className={styles.section}>
            <h3>Branding</h3>
            
            <div className={styles.formGroup}>
              <label>Company Name</label>
              <input
                type="text"
                value={config.branding.companyName}
                onChange={(e) => handleConfigChange('branding', 'companyName', e.target.value)}
                placeholder="Your Company Name"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Header Text</label>
              <input
                type="text"
                value={config.headers.headerText}
                onChange={(e) => handleConfigChange('headers', 'headerText', e.target.value)}
                placeholder="Get Free Estimate (default if left blank)"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Sub-Header Text (optional)</label>
              <input
                type="text"
                value={config.headers.subHeaderText}
                onChange={(e) => handleConfigChange('headers', 'subHeaderText', e.target.value)}
                placeholder="Subtitle text - leave blank for no subtitle"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Primary Color</label>
              <div className={styles.colorInput}>
                <input
                  type="color"
                  value={config.branding.primaryColor}
                  onChange={(e) => handleConfigChange('branding', 'primaryColor', e.target.value)}
                />
                <input
                  type="text"
                  value={config.branding.primaryColor}
                  onChange={(e) => handleConfigChange('branding', 'primaryColor', e.target.value)}
                  placeholder="#007bff"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Logo URL (optional)</label>
              <input
                type="url"
                value={config.branding.logo || ''}
                onChange={(e) => handleConfigChange('branding', 'logo', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          {/* Welcome Step Section */}
          <div className={styles.section}>
            <h3>Welcome Step</h3>
            <p className={styles.sectionDescription}>
              Customize the title and description text shown on the first step of your widget.
            </p>
            
            <div className={styles.formGroup}>
              <label>Welcome Title</label>
              <input
                type="text"
                value={config.messaging.welcome}
                onChange={(e) => handleConfigChange('messaging', 'welcome', e.target.value)}
                placeholder="Get Started"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Welcome Description</label>
              <textarea
                value={config.messaging.fallback}
                onChange={(e) => handleConfigChange('messaging', 'fallback', e.target.value)}
                rows={2}
                placeholder="Get your free pest control estimate in just a few steps."
              />
            </div>
          </div>

          {/* Service Areas Section */}
          <div className={styles.section}>
            <h3>Service Areas</h3>
            <p className={styles.sectionDescription}>
              Add zip codes where you provide service. Leave empty to serve all areas.
            </p>
            
            <div className={styles.serviceAreaInput}>
              <input
                type="text"
                value={serviceAreaInput}
                onChange={(e) => setServiceAreaInput(e.target.value)}
                placeholder="Enter zip code (e.g., 12345)"
                onKeyPress={(e) => e.key === 'Enter' && addServiceArea()}
              />
              <button onClick={addServiceArea} type="button">Add</button>
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

          {/* Address API Section */}
          <div className={styles.section}>
            <h3>Address Autocomplete</h3>
            <p className={styles.sectionDescription}>
              Enable address autocomplete to help users enter accurate service addresses. 
              This uses an external API service and may incur costs.
            </p>
            
            <div className={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={config.addressApi.enabled}
                  onChange={(e) => handleConfigChange('addressApi', 'enabled', e.target.checked)}
                />
                Enable Address Autocomplete
              </label>
            </div>

            {config.addressApi.enabled && (
              <>
                <div className={styles.formGroup}>
                  <label>API Provider</label>
                  <select
                    value={config.addressApi.provider}
                    onChange={(e) => handleConfigChange('addressApi', 'provider', e.target.value)}
                  >
                    <option value="geoapify">Geoapify</option>
                  </select>
                  <small className={styles.fieldNote}>
                    Currently only Geoapify is supported. API key must be configured in environment variables.
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label>Max Suggestions</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.addressApi.maxSuggestions}
                    onChange={(e) => handleConfigChange('addressApi', 'maxSuggestions', parseInt(e.target.value) || 5)}
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
              Copy this code and paste it on your website where you want the widget to appear.
            </p>
            
            <div className={styles.embedCode}>
              <code>
{generateEmbedCode()}
              </code>
              <button onClick={copyEmbedCode} className={styles.copyButton} disabled={copyStatus === 'copying'}>
                {copyStatus === 'copying' && <RefreshCw size={16} className={styles.spinning} />}
                {copyStatus === 'copied' && <Check size={16} />}
                {copyStatus === 'idle' && <Copy size={16} />}
                {copyStatus === 'copying' && 'Copying...'}
                {copyStatus === 'copied' && 'Copied!'}
                {copyStatus === 'idle' && 'Copy Code'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className={styles.previewSection}>
            <h3>Widget Preview</h3>
            <div className={styles.previewContainer}>
              <EmbedPreview
                companyId={selectedCompany.id}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetConfig;