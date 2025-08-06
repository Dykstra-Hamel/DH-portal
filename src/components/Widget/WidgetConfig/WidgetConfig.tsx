'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  Save,
  Copy,
  Eye,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';
import { adminAPI } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import styles from './WidgetConfig.module.scss';
import EmbedPreview from '../WidgetPreview';
import ServiceAreaMap from '../ServiceAreaMap';
import ServicePlanModal from './ServicePlanModal';
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
interface DomainRecord {
  record: string;
  name: string;
  value: string;
  type: string;
  ttl?: string;
  priority?: string;
  status?: 'verified' | 'pending' | 'failed';
}

interface DomainConfiguration {
  name?: string;
  configured: boolean;
  status:
    | 'not_configured'
    | 'pending'
    | 'verified'
    | 'failed'
    | 'temporary_failure';
  records: DomainRecord[];
  verifiedAt?: string;
  resendDomainId?: string;
}

interface PestType {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon_svg: string;
  is_active: boolean;
  pest_categories?: {
    name: string;
    slug: string;
  };
}

interface CompanyPestOption {
  id: string;
  pest_id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon_svg: string;
  custom_label: string | null;
  display_order: number;
  is_active: boolean;
}

interface ServicePlan {
  id: string;
  company_id: string;
  plan_name: string;
  plan_description: string;
  plan_category: string;
  initial_price: number;
  recurring_price: number;
  billing_frequency: string;
  treatment_frequency: string;
  includes_inspection: boolean;
  plan_features: string[];
  plan_faqs: Array<{ question: string; answer: string }>;
  display_order: number;
  highlight_badge: string | null;
  color_scheme: any;
  requires_quote: boolean;
  plan_image_url: string | null;
  is_active: boolean;
  pest_coverage?: Array<{
    pest_id: string;
    coverage_level: string;
    pest_name: string;
    pest_slug: string;
    pest_icon: string;
    pest_category: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface WidgetConfigData {
  branding: {
    companyName: string;
    hero_image_url?: string;
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
  welcomeButtonText: string;
  successMessage: string;
  addressApi: {
    enabled: boolean;
    maxSuggestions: number;
  };
  service_areas: string[];
  messaging: {
    welcome: string;
    fallback: string;
    welcomeBenefits: Array<{
      text: string;
      icon: string;
    }>;
  };
  notifications: {
    emails: string[];
  };
  emailNotifications: {
    subjectLine: string;
    enabled: boolean;
  };
}
interface WidgetConfigProps {
  companies: Company[];
  selectedCompanyId?: string;
  onCompanyChange?: (companyId: string) => void;
}

// Collapsible Section Component - moved outside to prevent re-creation on renders
const CollapsibleSection: React.FC<{
  sectionKey: string;
  title: string;
  description: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  styles: any;
}> = ({
  sectionKey,
  title,
  description,
  children,
  isExpanded,
  onToggle,
  styles,
}) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader} onClick={onToggle}>
        <div className={styles.sectionHeaderContent}>
          <h3>{title}</h3>
          {isExpanded ? (
            <ChevronDown size={20} className={styles.chevron} />
          ) : (
            <ChevronRight size={20} className={styles.chevron} />
          )}
        </div>
        {description && (
          <p className={styles.sectionDescription}>{description}</p>
        )}
      </div>
      {isExpanded && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
};
const WidgetConfig: React.FC<WidgetConfigProps> = ({
  companies,
  selectedCompanyId,
  onCompanyChange,
}) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [config, setConfig] = useState<WidgetConfigData>({
    branding: {
      companyName: '',
      hero_image_url: '',
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
    welcomeButtonText: 'Start My Free Estimate',
    successMessage:
      'Thank you! Your information has been submitted successfully. We will contact you soon.',
    addressApi: {
      enabled: true,
      maxSuggestions: 5,
    },
    service_areas: [],
    messaging: {
      welcome: 'Get Started',
      fallback: 'Get your free pest control estimate in just a few steps.',
      welcomeBenefits: [],
    },
    notifications: {
      emails: [],
    },
    emailNotifications: {
      subjectLine: 'New Service Request: {customerName} - {companyName}',
      enabled: true,
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

  // Pest options state
  const [companyPestOptions, setCompanyPestOptions] = useState<
    CompanyPestOption[]
  >([]);
  const [availablePestTypes, setAvailablePestTypes] = useState<PestType[]>([]);
  const [pestOptionsLoading, setPestOptionsLoading] = useState(false);

  // Service plans state
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([]);
  const [servicePlansLoading, setServicePlansLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    branding: true, // Expanded by default
    colors: false,
    text: false,
    pestOptions: false,
    servicePlans: false,
    welcome: false,
    serviceAreas: false,
    emailNotifications: false,
    emailDomain: false,
    addressApi: false,
    embedCode: true, // Expanded by default
  });
  const [brandColors, setBrandColors] = useState<{
    primary?: string;
    secondary?: string;
  }>({});
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
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

  // Domain configuration state
  const [domainConfig, setDomainConfig] = useState<DomainConfiguration>({
    configured: false,
    status: 'not_configured',
    records: [],
  });
  const [domainForm, setDomainForm] = useState({
    domain: '',
    region: 'us-east-1',
    customReturnPath: 'noreply',
  });
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  // Default color values - memoized to prevent re-creation on every render
  const defaultColors = useMemo(() => ({
    primary: '#3b82f6',
    secondary: '#1e293b',
    background: '#ffffff',
    text: '#374151',
  }), []);

  // Toggle section expansion
  const toggleSection = (sectionKey: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };
  // Color resolution function
  const resolveColors = useCallback((
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
  }, [defaultColors]);
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
  }, [brandColors, config.colorOverrides, resolveColors]);
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

  const loadCompanyConfig = useCallback((company: Company) => {
    const widgetConfig = company.widget_config || {};
    setConfig({
      branding: {
        companyName: widgetConfig.branding?.companyName || company.name,
        hero_image_url: widgetConfig.branding?.hero_image_url || '',
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
      welcomeButtonText:
        widgetConfig.welcomeButtonText || 'Start My Free Estimate',
      successMessage:
        widgetConfig.successMessage ||
        'Thank you! Your information has been submitted successfully. We will contact you soon.',
      addressApi: {
        enabled: widgetConfig.addressApi?.hasOwnProperty('enabled')
          ? widgetConfig.addressApi.enabled
          : true,
        maxSuggestions: widgetConfig.addressApi?.maxSuggestions || 5,
      },
      service_areas: widgetConfig.service_areas || [],
      messaging: {
        welcome: widgetConfig.messaging?.welcome || 'Get Started',
        fallback:
          widgetConfig.messaging?.fallback ||
          'Get your free pest control estimate in just a few steps.',
        welcomeBenefits: widgetConfig.messaging?.welcomeBenefits || [],
      },
      notifications: {
        emails: widgetConfig.notifications?.emails || [],
      },
      emailNotifications: {
        enabled: widgetConfig.emailNotifications?.enabled ?? true,
        subjectLine:
          widgetConfig.emailNotifications?.subjectLine ||
          'New {pestIssue} Service Request From: {customerName}',
      },
    });
    // Set the notification emails input field
    const emails = widgetConfig.notifications?.emails || [];
    setNotificationEmailsInput(emails.join('\n'));
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
        loadPestOptions(selectedCompanyId);
        loadServicePlans(selectedCompanyId);
        geocodeCompanyAddress(company);
        loadDomainConfiguration(selectedCompanyId);
      }
    }
  }, [selectedCompanyId]);

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
        .select('primary_color_hex, secondary_color_hex, logo_url')
        .eq('company_id', companyId)
        .single();
      if (!error && brandData) {
        setBrandColors({
          primary: brandData.primary_color_hex,
          secondary: brandData.secondary_color_hex,
        });
        setBrandLogo(brandData.logo_url || null);
      } else {
        setBrandColors({});
        setBrandLogo(null);
      }
    } catch (error) {
      console.error('Error fetching brand colors:', error);
      setBrandColors({});
      setBrandLogo(null);
    } finally {
      setBrandLoading(false);
    }
  };

  // Load domain configuration from company settings
  const loadDomainConfiguration = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          const settings = data.settings;

          // Convert settings to domain config format
          const domainName = settings.email_domain?.value || '';
          const configured =
            domainName !== '' &&
            settings.email_domain_status?.value !== 'not_configured';

          setDomainConfig({
            name: domainName,
            configured,
            status: settings.email_domain_status?.value || 'not_configured',
            records: settings.email_domain_records?.value || [],
            verifiedAt: settings.email_domain_verified_at?.value || undefined,
            resendDomainId: settings.resend_domain_id?.value || undefined,
          });

          if (domainName) {
            setDomainForm(prev => ({
              ...prev,
              domain: domainName,
              region: settings.email_domain_region?.value || 'us-east-1',
              customReturnPath:
                settings.email_domain_prefix?.value || 'noreply',
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading domain configuration:', error);
    }
  };

  // Create or update domain
  const handleDomainSubmit = async () => {
    if (!selectedCompany || !domainForm.domain.trim()) return;

    setDomainLoading(true);
    setDomainError(null);

    try {
      const response = await fetch(
        `/api/companies/${selectedCompany.id}/settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_domain',
            domain: domainForm.domain.trim(),
            region: domainForm.region,
            customReturnPath: domainForm.customReturnPath,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setDomainConfig({
          name: data.domain.name,
          configured: true,
          status: data.domain.status,
          records: data.domain.records,
          resendDomainId: data.domain.resendDomainId,
        });
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setDomainError(data.error || 'Failed to configure domain');
      }
    } catch (error) {
      console.error('Error configuring domain:', error);
      setDomainError('Network error occurred');
    } finally {
      setDomainLoading(false);
    }
  };

  // Verify domain
  const handleDomainVerify = async () => {
    if (!selectedCompany || !domainConfig.resendDomainId) return;

    setDomainLoading(true);
    setDomainError(null);

    try {
      const response = await fetch(
        `/api/companies/${selectedCompany.id}/settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'verify_domain',
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setDomainConfig(prev => ({
          ...prev,
          status: data.domain.status,
          records: data.domain.records,
        }));
      } else {
        setDomainError(data.error || 'Failed to verify domain');
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      setDomainError('Network error occurred');
    } finally {
      setDomainLoading(false);
    }
  };

  // Delete domain configuration
  const handleDomainDelete = async () => {
    if (!selectedCompany || !domainConfig.configured) return;

    if (
      !confirm(
        'Are you sure you want to remove the domain configuration? This will revert to using the default email domain.'
      )
    ) {
      return;
    }

    setDomainLoading(true);
    setDomainError(null);

    try {
      const response = await fetch(
        `/api/companies/${selectedCompany.id}/settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete_domain',
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setDomainConfig({
          configured: false,
          status: 'not_configured',
          records: [],
        });
        setDomainForm(prev => ({
          ...prev,
          domain: '',
        }));
      } else {
        setDomainError(data.error || 'Failed to remove domain');
      }
    } catch (error) {
      console.error('Error removing domain:', error);
      setDomainError('Network error occurred');
    } finally {
      setDomainLoading(false);
    }
  };

  // Get domain status icon
  const getDomainStatusIcon = (status: DomainConfiguration['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={16} className={styles.statusIconSuccess} />;
      case 'pending':
        return <Clock size={16} className={styles.statusIconPending} />;
      case 'failed':
      case 'temporary_failure':
        return <AlertTriangle size={16} className={styles.statusIconError} />;
      default:
        return <Globe size={16} className={styles.statusIconDefault} />;
    }
  };

  // Get record status icon
  const getRecordStatusIcon = (status?: string) => {
    switch (status) {
      case 'verified':
        return (
          <CheckCircle size={14} className={styles.recordStatusVerified} />
        );
      case 'pending':
        return <Clock size={14} className={styles.recordStatusPending} />;
      case 'failed':
        return <X size={14} className={styles.recordStatusFailed} />;
      default:
        return <Clock size={14} className={styles.recordStatusDefault} />;
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

  const loadPestOptions = async (companyId: string) => {
    try {
      setPestOptionsLoading(true);
      const response = await fetch(`/api/admin/pest-options/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompanyPestOptions(data.data.companyPestOptions || []);
          setAvailablePestTypes(data.data.availablePestTypes || []);
        }
      }
    } catch (error) {
      console.error('Error loading pest options:', error);
      setCompanyPestOptions([]);
      setAvailablePestTypes([]);
    } finally {
      setPestOptionsLoading(false);
    }
  };

  const savePestOptions = async (pestOptions: CompanyPestOption[]) => {
    if (!selectedCompany) return;
    try {
      const updateData = {
        pestOptions: pestOptions.map((option, index) => ({
          pest_id: option.pest_id,
          custom_label: option.custom_label,
          display_order: index + 1,
          is_active: true,
        })),
      };

      const response = await fetch(
        `/api/admin/pest-options/${selectedCompany.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setCompanyPestOptions(pestOptions);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error saving pest options:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const addPestOption = (pestType: PestType) => {
    const newOption: CompanyPestOption = {
      id: `temp-${Date.now()}`,
      pest_id: pestType.id,
      name: pestType.name,
      slug: pestType.slug,
      description: pestType.description,
      category: pestType.category,
      icon_svg: pestType.icon_svg,
      custom_label: null,
      display_order: companyPestOptions.length + 1,
      is_active: true,
    };
    const updatedOptions = [...companyPestOptions, newOption];
    setCompanyPestOptions(updatedOptions);
    savePestOptions(updatedOptions);
  };

  const removePestOption = (optionId: string) => {
    const updatedOptions = companyPestOptions.filter(
      option => option.id !== optionId
    );
    setCompanyPestOptions(updatedOptions);
    savePestOptions(updatedOptions);
  };

  const updatePestOptionLabel = (optionId: string, customLabel: string) => {
    const updatedOptions = companyPestOptions.map(option =>
      option.id === optionId ? { ...option, custom_label: customLabel } : option
    );
    setCompanyPestOptions(updatedOptions);
    savePestOptions(updatedOptions);
  };

  const reorderPestOptions = (fromIndex: number, toIndex: number) => {
    const updatedOptions = [...companyPestOptions];
    const [moved] = updatedOptions.splice(fromIndex, 1);
    updatedOptions.splice(toIndex, 0, moved);
    setCompanyPestOptions(updatedOptions);
    savePestOptions(updatedOptions);
  };

  // Service Plans Management Functions
  const loadServicePlans = async (companyId: string) => {
    try {
      setServicePlansLoading(true);
      const response = await fetch(`/api/admin/service-plans/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServicePlans(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading service plans:', error);
      setServicePlans([]);
    } finally {
      setServicePlansLoading(false);
    }
  };

  const createServicePlan = async (planData: Partial<ServicePlan>) => {
    if (!selectedCompany) return;
    try {
      const response = await fetch(
        `/api/admin/service-plans/${selectedCompany.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(planData),
        }
      );

      const data = await response.json();
      if (data.success) {
        await loadServicePlans(selectedCompany.id);
        setShowPlanModal(false);
        setEditingPlan(null);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error creating service plan:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const updateServicePlan = async (planData: Partial<ServicePlan>) => {
    if (!selectedCompany || !editingPlan) return;
    try {
      const response = await fetch(
        `/api/admin/service-plans/${selectedCompany.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...planData,
            id: editingPlan.id,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        await loadServicePlans(selectedCompany.id);
        setShowPlanModal(false);
        setEditingPlan(null);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error updating service plan:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const deleteServicePlan = async (planId: string) => {
    if (
      !selectedCompany ||
      !confirm('Are you sure you want to delete this service plan?')
    )
      return;
    try {
      const response = await fetch(
        `/api/admin/service-plans/${selectedCompany.id}?id=${planId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (data.success) {
        await loadServicePlans(selectedCompany.id);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error deleting service plan:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const openPlanModal = (plan?: ServicePlan) => {
    setEditingPlan(plan || null);
    setShowPlanModal(true);
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

  const handleAddBenefit = () => {
    setConfig(prev => ({
      ...prev,
      messaging: {
        ...prev.messaging,
        welcomeBenefits: [
          ...prev.messaging.welcomeBenefits,
          { text: '', icon: '' }
        ],
      },
    }));
  };

  const handleRemoveBenefit = (index: number) => {
    setConfig(prev => ({
      ...prev,
      messaging: {
        ...prev.messaging,
        welcomeBenefits: prev.messaging.welcomeBenefits.filter((_, i) => i !== index),
      },
    }));
  };

  const handleBenefitChange = (index: number, field: 'text' | 'icon', value: string) => {
    setConfig(prev => ({
      ...prev,
      messaging: {
        ...prev.messaging,
        welcomeBenefits: prev.messaging.welcomeBenefits.map((benefit, i) =>
          i === index ? { ...benefit, [field]: value } : benefit
        ),
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
  // Hero image upload functionality
  const createAssetPath = (
    companyName: string,
    category: string,
    fileName: string
  ): string => {
    const cleanCompanyName = companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const fileExt = fileName.split('.').pop();
    const cleanFileName = fileName
      .replace(`.${fileExt}`, '')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    const timestamp = Date.now();
    const finalFileName = `${cleanFileName}_${timestamp}.${fileExt}`;

    return `${cleanCompanyName}/${category}/${finalFileName}`;
  };

  const uploadFile = async (
    file: File,
    bucket: string,
    category: string
  ): Promise<string | null> => {
    if (!selectedCompany) return null;

    try {
      const supabase = createClient();
      const filePath = createAssetPath(
        selectedCompany.name,
        category,
        file.name
      );

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const deleteFileFromStorage = async (fileUrl: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      const urlParts = fileUrl.split('/storage/v1/object/public/brand-assets/');
      if (urlParts.length !== 2) {
        console.error('Invalid file URL format:', fileUrl);
        return false;
      }

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('brand-assets')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file from storage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting file:', error);
      return false;
    }
  };

  const handleHeroImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // If there's an existing hero image, delete it from storage first
    if (config.branding.hero_image_url) {
      await deleteFileFromStorage(config.branding.hero_image_url);
    }

    const url = await uploadFile(file, 'brand-assets', 'hero-images');
    if (url) {
      handleConfigChange('branding', 'hero_image_url', url);
      // Clear the input so the same file can be selected again if needed
      event.target.value = '';
    }
  };

  const removeHeroImage = async () => {
    if (!config.branding.hero_image_url) return;

    if (
      !confirm(
        'Are you sure you want to delete this hero image? This action cannot be undone.'
      )
    ) {
      return;
    }

    const deleted = await deleteFileFromStorage(config.branding.hero_image_url);

    if (deleted) {
      handleConfigChange('branding', 'hero_image_url', '');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
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
    if (config.welcomeButtonText !== 'Start My Free Estimate') {
      embedCode += `\n  data-welcome-button-text="${config.welcomeButtonText}"`;
    }
    if (config.branding.hero_image_url) {
      embedCode += `\n  data-hero-image-url="${config.branding.hero_image_url}"`;
    }
    embedCode += `
></script>`;
    return embedCode;
  };
  const generateMinimalEmbedCode = () => {
    if (!selectedCompany) return '';

    let embedCode = `<script 
  src="${window.location.origin}/widget.js"
  data-company-id="${selectedCompany.id}"
  data-base-url="${window.location.origin}"`;

    // Add essential color data attributes to prevent style flash
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

    // Add essential messaging attributes if customized
    if (config.messaging.welcome !== 'Get Started') {
      embedCode += `\n  data-welcome-title="${config.messaging.welcome}"`;
    }
    if (
      config.messaging.fallback !==
      'Get your free pest control estimate in just a few steps.'
    ) {
      embedCode += `\n  data-welcome-description="${config.messaging.fallback}"`;
    }
    if (config.welcomeButtonText !== 'Start My Free Estimate') {
      embedCode += `\n  data-welcome-button-text="${config.welcomeButtonText}"`;
    }
    if (config.branding.hero_image_url) {
      embedCode += `\n  data-hero-image-url="${config.branding.hero_image_url}"`;
    }

    embedCode += `
></script>`;

    return embedCode;
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

    // Add essential color data attributes to prevent style flash
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

    // Add essential messaging attributes if customized
    if (config.messaging.welcome !== 'Get Started') {
      embedCode += `\n  data-welcome-title="${config.messaging.welcome}"`;
    }
    if (
      config.messaging.fallback !==
      'Get your free pest control estimate in just a few steps.'
    ) {
      embedCode += `\n  data-welcome-description="${config.messaging.fallback}"`;
    }
    if (config.welcomeButtonText !== 'Start My Free Estimate') {
      embedCode += `\n  data-welcome-button-text="${config.welcomeButtonText}"`;
    }
    if (config.branding.hero_image_url) {
      embedCode += `\n  data-hero-image-url="${config.branding.hero_image_url}"`;
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
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={styles.previewButton}
          >
            <Eye size={16} />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            type="button"
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
          <CollapsibleSection
            sectionKey="branding"
            title="Branding"
            description="Configure your company name, headers, and logo for the widget"
            isExpanded={expandedSections.branding}
            onToggle={() => toggleSection('branding')}
            styles={styles}
          >
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
              <label>Company Logo</label>
              {brandLogo ? (
                <div className={styles.brandLogoDisplay}>
                  <Image
                    src={brandLogo}
                    alt="Company Logo"
                    width={200}
                    height={100}
                    style={{
                      maxWidth: '200px',
                      maxHeight: '100px',
                      objectFit: 'contain',
                    }}
                  />
                  <p className={styles.brandLogoNote}>
                    Logo is managed in{' '}
                    <a href="/admin" target="_blank" rel="noopener noreferrer">
                      Brand Management
                    </a>
                  </p>
                </div>
              ) : (
                <div className={styles.brandLogoMissing}>
                  <p>No company logo uploaded.</p>
                  <p>
                    Upload a logo in{' '}
                    <a href="/admin" target="_blank" rel="noopener noreferrer">
                      Brand Management
                    </a>
                  </p>
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>Hero Image (optional)</label>
              <p className={styles.fieldNote}>
                Upload a hero image to be displayed on the widget&apos;s welcome
                screen alongside your logo.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroImageUpload}
                className={styles.fileInput}
              />
              {config.branding.hero_image_url && (
                <div className={styles.heroImagePreview}>
                  <Image
                    src={config.branding.hero_image_url}
                    alt="Hero image preview"
                    width={300}
                    height={200}
                    style={{
                      maxWidth: '300px',
                      maxHeight: '200px',
                      objectFit: 'contain',
                    }}
                  />
                  <button
                    type="button"
                    onClick={removeHeroImage}
                    className={styles.removeImageButton}
                  >
                    Remove Hero Image
                  </button>
                </div>
              )}
            </div>
          </CollapsibleSection>
          {/* Widget Colors Section */}
          <CollapsibleSection
            sectionKey="colors"
            title="Widget Colors"
            description="Customize the color scheme of your widget."
            isExpanded={expandedSections.colors}
            onToggle={() => toggleSection('colors')}
            styles={styles}
          >
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
          </CollapsibleSection>
          {/* Widget Text Section */}
          <CollapsibleSection
            sectionKey="text"
            title="Widget Text"
            description="Customize the text content of your widget."
            isExpanded={expandedSections.text}
            onToggle={() => toggleSection('text')}
            styles={styles}
          >
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
            <div className={styles.formGroup}>
              <label>Welcome Button Text</label>
              <input
                type="text"
                value={config.welcomeButtonText}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    welcomeButtonText: e.target.value,
                  }))
                }
                placeholder="Start My Free Estimate"
              />
              <small className={styles.fieldNote}>
                Text for the button on the welcome screen (different from the
                final submit button)
              </small>
            </div>
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

            {/* Welcome Benefits Section */}
            <div className={styles.formGroup}>
              <label>Welcome Benefits</label>
              <p className={styles.fieldNote}>
                Add custom benefits with text and SVG icons to display on the welcome screen.
              </p>
              
              {config.messaging.welcomeBenefits.map((benefit, index) => (
                <div key={index} className={styles.benefitItem}>
                  <div className={styles.benefitHeader}>
                    <h4>Benefit {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(index)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className={styles.benefitFields}>
                    <div className={styles.formGroup}>
                      <label>Benefit Text</label>
                      <input
                        type="text"
                        value={benefit.text}
                        onChange={e => handleBenefitChange(index, 'text', e.target.value)}
                        placeholder="e.g., Fully Licensed & Insured"
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>SVG Icon</label>
                      <textarea
                        value={benefit.icon}
                        onChange={e => handleBenefitChange(index, 'icon', e.target.value)}
                        placeholder="<svg>...</svg>"
                        rows={4}
                        className={styles.svgInput}
                      />
                    </div>
                    
                    {benefit.icon && benefit.text && (
                      <div className={styles.benefitPreview}>
                        <div className={styles.previewLabel}>Preview:</div>
                        <div className={styles.previewItem}>
                          <span 
                            className={styles.previewIcon}
                            dangerouslySetInnerHTML={{ __html: benefit.icon }}
                          />
                          <span className={styles.previewText}>{benefit.text}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddBenefit}
                className={styles.addButton}
              >
                + Add Benefit
              </button>
            </div>
          </CollapsibleSection>
          {/* Pest Options Section */}
          <CollapsibleSection
            sectionKey="pestOptions"
            title="Pest Options"
            description="Configure which pest options are available in your widget. Customers will select from these options."
            isExpanded={expandedSections.pestOptions}
            onToggle={() => toggleSection('pestOptions')}
            styles={styles}
          >
            {pestOptionsLoading ? (
              <div className={styles.loading}>Loading pest options...</div>
            ) : (
              <div className={styles.pestOptionsManager}>
                {/* Current Pest Options */}
                <div className={styles.currentPestOptions}>
                  <h4>Current Pest Options</h4>
                  {companyPestOptions.length === 0 ? (
                    <p>
                      No pest options configured. Add some from the available
                      options below.
                    </p>
                  ) : (
                    <div className={styles.pestOptionsList}>
                      {companyPestOptions.map(option => (
                        <div key={option.id} className={styles.pestOptionItem}>
                          <div className={styles.pestOptionInfo}>
                            <span
                              className={styles.pestIcon}
                              dangerouslySetInnerHTML={{
                                __html: option.icon_svg,
                              }}
                            ></span>
                            <div className={styles.pestDetails}>
                              <div className={styles.pestName}>
                                {option.custom_label || option.name}
                              </div>
                              <div className={styles.pestCategory}>
                                Category: {option.category}
                              </div>
                            </div>
                          </div>
                          <div className={styles.pestOptionActions}>
                            <input
                              type="text"
                              placeholder={option.name}
                              value={option.custom_label || ''}
                              onChange={e =>
                                updatePestOptionLabel(option.id, e.target.value)
                              }
                              className={styles.customLabelInput}
                            />
                            <button
                              type="button"
                              onClick={() => removePestOption(option.id)}
                              className={styles.removeButton}
                              title="Remove pest option"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Pest Types */}
                <div className={styles.availablePestTypes}>
                  <h4>Available Pest Types</h4>
                  <div className={styles.pestTypesGrid}>
                    {availablePestTypes
                      .filter(
                        type =>
                          !companyPestOptions.some(
                            option => option.pest_id === type.id
                          )
                      )
                      .map(type => (
                        <div key={type.id} className={styles.pestTypeCard}>
                          <div className={styles.pestTypeInfo}>
                            <span
                              className={styles.pestIcon}
                              dangerouslySetInnerHTML={{
                                __html: type.icon_svg,
                              }}
                            ></span>
                            <div className={styles.pestDetails}>
                              <div className={styles.pestName}>{type.name}</div>
                              <div className={styles.pestCategory}>
                                {type.pest_categories?.name ||
                                  'Unknown Category'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => addPestOption(type)}
                            className={styles.addButton}
                            title="Add to widget"
                          >
                            +
                          </button>
                        </div>
                      ))}
                  </div>
                  {availablePestTypes.filter(
                    type =>
                      !companyPestOptions.some(
                        option => option.pest_id === type.id
                      )
                  ).length === 0 && (
                    <p>
                      All available pest types are already added to your widget.
                    </p>
                  )}
                </div>
              </div>
            )}
          </CollapsibleSection>
          {/* Service Plans Section */}
          <CollapsibleSection
            sectionKey="servicePlans"
            title="Service Plans"
            description="Manage service plans that customers can select based on their pest issues."
            isExpanded={expandedSections.servicePlans}
            onToggle={() => toggleSection('servicePlans')}
            styles={styles}
          >
            {servicePlansLoading ? (
              <div className={styles.loading}>Loading service plans...</div>
            ) : (
              <div className={styles.servicePlansManager}>
                <div className={styles.servicePlansHeader}>
                  <h4>Current Service Plans ({servicePlans.length})</h4>
                  <button
                    type="button"
                    onClick={() => openPlanModal()}
                    className={styles.createPlanButton}
                  >
                    + Create New Plan
                  </button>
                </div>

                {servicePlans.length === 0 ? (
                  <div className={styles.noPlans}>
                    <p>No service plans configured yet.</p>
                    <p>
                      Create your first plan to enable dynamic plan suggestions
                      in the widget.
                    </p>
                  </div>
                ) : (
                  <div className={styles.plansTable}>
                    <div className={styles.plansTableHeader}>
                      <div>Plan Name</div>
                      <div>Category</div>
                      <div>Price</div>
                      <div>Coverage</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    {servicePlans.map(plan => (
                      <div key={plan.id} className={styles.planRow}>
                        <div className={styles.planName}>
                          <strong>{plan.plan_name}</strong>
                          {plan.highlight_badge && (
                            <span className={styles.planBadge}>
                              {plan.highlight_badge}
                            </span>
                          )}
                          <div className={styles.planDescription}>
                            {plan.plan_description}
                          </div>
                        </div>
                        <div className={styles.planCategory}>
                          {plan.plan_category || 'Standard'}
                        </div>
                        <div className={styles.planPrice}>
                          <div>
                            ${plan.recurring_price}/{plan.billing_frequency}
                          </div>
                          {plan.initial_price && (
                            <div className={styles.initialPrice}>
                              Setup: ${plan.initial_price}
                            </div>
                          )}
                        </div>
                        <div className={styles.planCoverage}>
                          {plan.pest_coverage?.length || 0} pests
                        </div>
                        <div className={styles.planStatus}>
                          <span
                            className={`${styles.statusIndicator} ${plan.is_active ? styles.active : styles.inactive}`}
                          >
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className={styles.planActions}>
                          <button
                            type="button"
                            onClick={() => openPlanModal(plan)}
                            className={styles.editButton}
                            title="Edit plan"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteServicePlan(plan.id)}
                            className={styles.deleteButton}
                            title="Delete plan"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>
          {/* Service Areas Section */}
          <CollapsibleSection
            sectionKey="serviceAreas"
            title="Service Areas"
            description="Define where you provide service using geographic areas or zip codes. Leave empty to serve all areas."
            isExpanded={expandedSections.serviceAreas}
            onToggle={() => toggleSection('serviceAreas')}
            styles={styles}
          >
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
                      <button
                        type="button"
                        onClick={() => removeServiceArea(area)}
                      >
                        ×
                      </button>
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
          </CollapsibleSection>

          {/* Email Notifications Section */}
          <CollapsibleSection
            sectionKey="emailNotifications"
            title="Email Notifications"
            description="Configure email notifications that are sent when customers submit the widget form."
            isExpanded={expandedSections.emailNotifications}
            onToggle={() => toggleSection('emailNotifications')}
            styles={styles}
          >
            <div className={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={config.emailNotifications.enabled}
                  onChange={e =>
                    handleConfigChange(
                      'emailNotifications',
                      'enabled',
                      e.target.checked
                    )
                  }
                />
                Enable Email Notifications
              </label>
            </div>

            {config.emailNotifications.enabled && (
              <>
                <div className={styles.formGroup}>
                  <label>Notification Email Addresses</label>
                  <textarea
                    value={notificationEmailsInput}
                    onChange={e => setNotificationEmailsInput(e.target.value)}
                    onBlur={updateNotificationEmails}
                    rows={3}
                    placeholder="user@company.com, manager@company.com, admin@company.com"
                  />
                  <small className={styles.fieldNote}>
                    Enter email addresses that should receive notifications.
                    Separate multiple emails with commas or new lines.
                  </small>
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

                <div className={styles.formGroup}>
                  <label>Subject Line Template</label>
                  <input
                    type="text"
                    value={config.emailNotifications.subjectLine}
                    onChange={e =>
                      handleConfigChange(
                        'emailNotifications',
                        'subjectLine',
                        e.target.value
                      )
                    }
                    placeholder="New {pestIssue} Service Request From: {customerName}"
                  />
                  <small className={styles.fieldNote}>
                    Available variables: {'{customerName}'}, {'{companyName}'},{' '}
                    {'{pestIssue}'}, {'{priority}'}, {'{address}'}
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label>Subject Line Preview</label>
                  <div className={styles.previewBox}>
                    <strong>Subject:</strong>{' '}
                    {config.emailNotifications.subjectLine
                      .replace(/\{customerName\}/g, 'John Smith')
                      .replace(
                        /\{companyName\}/g,
                        config.branding.companyName || 'Your Company'
                      )
                      .replace(/\{pestIssue\}/g, 'Ant Treatment')
                      .replace(/\{priority\}/g, 'HIGH')
                      .replace(/\{address\}/g, '123 Main St, City, State')}
                  </div>
                </div>

                {/* Email Domain Configuration */}
                <div className={styles.domainSection}>
                  <h4>Custom Email Domain</h4>
                  <p className={styles.domainSectionDescription}>
                    Configure a custom domain for sending emails to customers.
                    This allows emails to be sent from your domain (e.g.,
                    noreply@
                    {config.branding.companyName
                      .toLowerCase()
                      .replace(/\s+/g, '')}
                    .com) instead of the default system domain.
                  </p>

                  {domainError && (
                    <div className={styles.domainError}>
                      <AlertTriangle size={16} />
                      {domainError}
                    </div>
                  )}

                  {!domainConfig.configured ? (
                    <div className={styles.domainForm}>
                      <div className={styles.formGroup}>
                        <label>Domain Name</label>
                        <input
                          type="text"
                          value={domainForm.domain}
                          onChange={e =>
                            setDomainForm(prev => ({
                              ...prev,
                              domain: e.target.value,
                            }))
                          }
                          placeholder="example.com"
                          disabled={domainLoading}
                        />
                        <small className={styles.fieldNote}>
                          Enter your company&apos;s domain name (without www or
                          http://)
                        </small>
                      </div>

                      <div className={styles.formGroup}>
                        <label>Email Sending Region</label>
                        <select
                          value={domainForm.region}
                          onChange={e =>
                            setDomainForm(prev => ({
                              ...prev,
                              region: e.target.value,
                            }))
                          }
                          disabled={domainLoading}
                        >
                          <option value="us-east-1">
                            US East (N. Virginia)
                          </option>
                          <option value="eu-west-1">EU West (Ireland)</option>
                          <option value="sa-east-1">
                            South America (São Paulo)
                          </option>
                          <option value="ap-northeast-1">
                            Asia Pacific (Tokyo)
                          </option>
                        </select>
                        <small className={styles.fieldNote}>
                          Choose the region closest to your customers for better
                          delivery
                        </small>
                      </div>

                      <div className={styles.formGroup}>
                        <label>Email Prefix</label>
                        <input
                          type="text"
                          value={domainForm.customReturnPath}
                          onChange={e =>
                            setDomainForm(prev => ({
                              ...prev,
                              customReturnPath: e.target.value,
                            }))
                          }
                          placeholder="noreply"
                          disabled={domainLoading}
                        />
                        <small className={styles.fieldNote}>
                          The prefix for your email address (e.g.,
                          &quot;noreply&quot; creates noreply@yourdomain.com)
                        </small>
                      </div>

                      <button
                        onClick={handleDomainSubmit}
                        disabled={domainLoading || !domainForm.domain.trim()}
                        className={styles.domainButton}
                        type="button"
                      >
                        {domainLoading ? (
                          <RefreshCw size={16} className={styles.spinning} />
                        ) : (
                          <Globe size={16} />
                        )}
                        {domainLoading ? 'Configuring...' : 'Configure Domain'}
                      </button>
                    </div>
                  ) : (
                    <div className={styles.domainConfigured}>
                      <div className={styles.domainHeader}>
                        <div className={styles.domainInfo}>
                          {getDomainStatusIcon(domainConfig.status)}
                          <div>
                            <strong>{domainConfig.name}</strong>
                            <div className={styles.domainStatus}>
                              Status:{' '}
                              {domainConfig.status === 'verified'
                                ? 'Verified'
                                : domainConfig.status === 'pending'
                                  ? 'Verification Pending'
                                  : domainConfig.status === 'failed'
                                    ? 'Verification Failed'
                                    : domainConfig.status ===
                                        'temporary_failure'
                                      ? 'Temporary Failure'
                                      : 'Not Started'}
                              {domainConfig.verifiedAt && (
                                <span className={styles.verifiedDate}>
                                  (Verified{' '}
                                  {new Date(
                                    domainConfig.verifiedAt
                                  ).toLocaleDateString()}
                                  )
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={styles.domainActions}>
                          <button
                            onClick={handleDomainVerify}
                            disabled={domainLoading}
                            className={styles.verifyButton}
                            type="button"
                          >
                            {domainLoading ? (
                              <RefreshCw
                                size={16}
                                className={styles.spinning}
                              />
                            ) : (
                              <RefreshCw size={16} />
                            )}
                            Check Status
                          </button>
                          <button
                            onClick={handleDomainDelete}
                            disabled={domainLoading}
                            className={styles.deleteButton}
                            type="button"
                          >
                            <X size={16} />
                            Remove
                          </button>
                        </div>
                      </div>

                      {domainConfig.records.length > 0 && (
                        <div className={styles.dnsRecords}>
                          <h5>DNS Records to Add</h5>
                          <p className={styles.dnsInstructions}>
                            Add these DNS records to your domain&apos;s DNS
                            settings. Contact your domain provider if you need
                            help.
                          </p>
                          <div className={styles.recordsList}>
                            {domainConfig.records.map((record, index) => (
                              <div key={index} className={styles.dnsRecord}>
                                <div className={styles.recordHeader}>
                                  <div className={styles.recordType}>
                                    {record.type}
                                  </div>
                                  <div className={styles.recordStatus}>
                                    {getRecordStatusIcon(record.status)}
                                    <span className={styles.recordStatusText}>
                                      {record.status === 'verified'
                                        ? 'Verified'
                                        : record.status === 'pending'
                                          ? 'Pending'
                                          : record.status === 'failed'
                                            ? 'Failed'
                                            : 'Not Checked'}
                                    </span>
                                  </div>
                                </div>
                                <div className={styles.recordDetails}>
                                  <div className={styles.recordField}>
                                    <label>Name:</label>
                                    <code>{record.name}</code>
                                  </div>
                                  <div className={styles.recordField}>
                                    <label>Value:</label>
                                    <code className={styles.recordValue}>
                                      {record.value}
                                    </code>
                                  </div>
                                  {record.priority && (
                                    <div className={styles.recordField}>
                                      <label>Priority:</label>
                                      <code>{record.priority}</code>
                                    </div>
                                  )}
                                  {record.ttl && (
                                    <div className={styles.recordField}>
                                      <label>TTL:</label>
                                      <code>{record.ttl}</code>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {domainConfig.status !== 'verified' && (
                            <div className={styles.verificationNote}>
                              <AlertTriangle size={16} />
                              <div>
                                <strong>Domain not yet verified</strong>
                                <p>
                                  After adding these DNS records, click
                                  &quot;Check Status&quot; to verify your
                                  domain. Verification can take up to 72 hours.
                                </p>
                              </div>
                            </div>
                          )}

                          {domainConfig.status === 'verified' && (
                            <div className={styles.successNote}>
                              <CheckCircle size={16} />
                              <div>
                                <strong>Domain verified successfully!</strong>
                                <p>
                                  Emails will now be sent from{' '}
                                  {domainForm.customReturnPath}@
                                  {domainConfig.name}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CollapsibleSection>

          {/* Address API Section */}
          <CollapsibleSection
            sectionKey="addressApi"
            title="Address Autocomplete"
            description="Enable address autocomplete to help users enter accurate service addresses. This feature uses Google Places API and may incur costs based on usage."
            isExpanded={expandedSections.addressApi}
            onToggle={() => toggleSection('addressApi')}
            styles={styles}
          >
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
          </CollapsibleSection>
          {/* Embed Code Section */}
          <CollapsibleSection
            sectionKey="embedCode"
            title="Embed Code"
            description="Copy this code and paste it on your website where you want the widget to appear."
            isExpanded={expandedSections.embedCode}
            onToggle={() => toggleSection('embedCode')}
            styles={styles}
          >
            {/* Minimal Embed Code */}
            <div className={styles.embedCodeGroup}>
              <h4>Minimal Configuration (Recommended)</h4>
              <p className={styles.embedDescription}>
                Optimized embed code with essential styling to prevent flash of
                default styles. Additional customizations will be loaded from
                your saved configuration.
              </p>
              <div className={styles.embedCode}>
                <code>{generateMinimalEmbedCode()}</code>
                <button
                  type="button"
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
                  type="button"
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
                Includes all your customizations as data attributes for maximum
                portability.
              </p>
              <div className={styles.embedCode}>
                <code>{generateFullEmbedCode()}</code>
                <button
                  type="button"
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
          </CollapsibleSection>
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

        {/* Service Plan Modal */}
        {showPlanModal && (
          <ServicePlanModal
            plan={editingPlan}
            isOpen={showPlanModal}
            onClose={() => setShowPlanModal(false)}
            onSave={editingPlan ? updateServicePlan : createServicePlan}
            availablePestTypes={availablePestTypes}
          />
        )}
      </div>
    </div>
  );
};
export default WidgetConfig;
