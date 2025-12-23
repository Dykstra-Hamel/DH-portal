'use client';
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
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
  how_we_do_it_text: string | null;
  subspecies: string[];
  plan_comparison_header_text: string | null;
}

interface ServicePlan {
  id: string;
  company_id: string;
  plan_name: string;
  plan_description: string;
  plan_category: string;
  initial_price: number;
  initial_discount: number;
  recurring_price: number;
  billing_frequency: string | null;
  treatment_frequency: string;
  includes_inspection: boolean;
  plan_features: string[];
  plan_faqs: Array<{ question: string; answer: string }>;
  display_order: number;
  highlight_badge: string | null;
  color_scheme: any;
  requires_quote: boolean;
  plan_image_url: string | null;
  plan_disclaimer: string | null;
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
    pestSelectBackgroundImage?: string;
    howWeDoItBackgroundImage?: string;
    howWeDoItInteriorImage?: string;
    almostDoneBackgroundImage?: string;
    detailedQuoteBackgroundImage?: string;
    detailedQuoteInteriorImage?: string;
    locationNotServedBackgroundImage?: string;
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
  stepHeadings: {
    address: string;
    howWeDoIt: string;
  };
}
interface WidgetConfigProps {
  companyId: string;
  companyName: string;
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
  companyId,
  companyName,
}) => {
  const [companyDetails, setCompanyDetails] = useState<Company | null>(null);
  const [config, setConfig] = useState<WidgetConfigData>({
    branding: {
      companyName: '',
      hero_image_url: '',
      pestSelectBackgroundImage: '',
      howWeDoItBackgroundImage: '',
      howWeDoItInteriorImage: '',
      almostDoneBackgroundImage: '',
      detailedQuoteBackgroundImage: '',
      detailedQuoteInteriorImage: '',
      locationNotServedBackgroundImage: '',
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
      'You should receive a confirmation email shortly. One of our representatives will contact you to confirm your appointment and answer any of your questions during normal business hours.',
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
    stepHeadings: {
      address: 'Yuck, {pest}! We hate those. No worries, we got you!',
      howWeDoIt: 'How We Do It',
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
    addressApi: false,
    embedCode: true, // Expanded by default
  });

  // Debouncing refs for improved input handling
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const [localInputValues, setLocalInputValues] = useState<{
    howWeDoIt: { [optionId: string]: string };
    subspecies: { [optionId: string]: string };
    planComparisonHeader: { [optionId: string]: string };
    customLabel: { [optionId: string]: string };
  }>({
    howWeDoIt: {},
    subspecies: {},
    planComparisonHeader: {},
    customLabel: {},
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

  // Default color values - memoized to prevent re-creation on every render
  const defaultColors = useMemo(
    () => ({
      primary: '#3b82f6',
      secondary: '#1e293b',
      background: '#ffffff',
      text: '#374151',
    }),
    []
  );

  // Toggle section expansion
  const toggleSection = (sectionKey: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };
  // Color resolution function
  const resolveColors = useCallback(
    (
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
    },
    [defaultColors]
  );
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

  const loadCompanyConfig = useCallback(
    (company: Company) => {
      const widgetConfig = company.widget_config || {};
      setConfig({
        branding: {
          companyName: widgetConfig.branding?.companyName || company.name,
          hero_image_url: widgetConfig.branding?.hero_image_url || '',
          pestSelectBackgroundImage:
            widgetConfig.branding?.pestSelectBackgroundImage || '',
          howWeDoItBackgroundImage:
            widgetConfig.branding?.howWeDoItBackgroundImage || '',
          howWeDoItInteriorImage:
            widgetConfig.branding?.howWeDoItInteriorImage || '',
          almostDoneBackgroundImage:
            widgetConfig.branding?.almostDoneBackgroundImage || '',
          detailedQuoteBackgroundImage:
            widgetConfig.branding?.detailedQuoteBackgroundImage || '',
          detailedQuoteInteriorImage:
            widgetConfig.branding?.detailedQuoteInteriorImage || '',
          locationNotServedBackgroundImage:
            widgetConfig.branding?.locationNotServedBackgroundImage || '',
        },
        headers: {
          headerText: widgetConfig.headers?.headerText || '',
          subHeaderText: widgetConfig.headers?.subHeaderText || '',
        },
        colors: {
          primary: widgetConfig.colors?.primary || defaultColors.primary,
          secondary: widgetConfig.colors?.secondary || defaultColors.secondary,
          background:
            widgetConfig.colors?.background || defaultColors.background,
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
        stepHeadings: {
          address:
            widgetConfig.stepHeadings?.address ||
            'Yuck, {pest}! We hate those. No worries, we got you!',
          howWeDoIt: widgetConfig.stepHeadings?.howWeDoIt || 'How We Do It',
        },
      });
      // Set the notification emails input field
      const emails = widgetConfig.notifications?.emails || [];
      setNotificationEmailsInput(emails.join('\n'));
    },
    [
      defaultColors.background,
      defaultColors.primary,
      defaultColors.secondary,
      defaultColors.text,
    ]
  );

  const geocodeCompanyAddress = useCallback(async (company: Company) => {
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
  }, []);

  const fetchBrandColors = useCallback(async (companyId: string) => {
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
  }, []);

  const loadServiceAreas = useCallback(async (companyId: string) => {
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
  }, []);

  const loadPestOptions = useCallback(async (companyId: string) => {
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
  }, []);

  const loadServicePlans = useCallback(async (companyId: string) => {
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
  }, []);

  // Load company data when companyId changes
  useEffect(() => {
    const loadCompanyData = async () => {
      if (companyId) {
        try {
          // Fetch company details
          const companies = await adminAPI.getCompanies();
          const company = companies.find((c: Company) => c.id === companyId);

          if (company) {
            setCompanyDetails(company);
            loadCompanyConfig(company);
            fetchBrandColors(companyId);
            loadServiceAreas(companyId);
            loadPestOptions(companyId);
            loadServicePlans(companyId);
            geocodeCompanyAddress(company);
          }
        } catch (error) {
          console.error('Error loading company data:', error);
        }
      }
    };

    loadCompanyData();
  }, [
    companyId,
    loadCompanyConfig,
    fetchBrandColors,
    loadServiceAreas,
    loadPestOptions,
    loadServicePlans,
    geocodeCompanyAddress,
  ]);

  const savePestOptions = useCallback(
    async (pestOptions: CompanyPestOption[]) => {
      if (!companyDetails) return;
      try {
        const updateData = {
          pestOptions: pestOptions.map((option, index) => ({
            pest_id: option.pest_id,
            custom_label: option.custom_label,
            display_order: index + 1,
            is_active: true,
            how_we_do_it_text: option.how_we_do_it_text,
            subspecies: option.subspecies,
            plan_comparison_header_text: option.plan_comparison_header_text,
          })),
        };

        const response = await fetch(
          `/api/admin/pest-options/${companyDetails.id}`,
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
    },
    [companyDetails, setSaveStatus, setCompanyPestOptions]
  );

  const addPestOption = (pestType: PestType) => {
    const newOption: CompanyPestOption = {
      id: `temp-${Date.now()}`,
      pest_id: pestType.id,
      name: pestType.name,
      slug: pestType.slug,
      description: pestType.description,
      category: pestType.pest_categories?.name || 'Unknown',
      icon_svg: pestType.icon_svg,
      custom_label: null,
      display_order: companyPestOptions.length + 1,
      is_active: true,
      how_we_do_it_text: null,
      subspecies: [],
      plan_comparison_header_text: null,
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

  // Debounced save function to prevent API calls on every keystroke
  const debouncedSave = useCallback(
    (
      optionId: string,
      field:
        | 'howWeDoIt'
        | 'subspecies'
        | 'planComparisonHeader'
        | 'customLabel',
      value: string | string[]
    ) => {
      const timerKey = `${optionId}-${field}`;

      // Clear existing timer
      if (debounceTimers.current[timerKey]) {
        clearTimeout(debounceTimers.current[timerKey]);
      }

      // Set new timer
      debounceTimers.current[timerKey] = setTimeout(() => {
        const updatedOptions = companyPestOptions.map(option => {
          if (option.id === optionId) {
            if (field === 'howWeDoIt') {
              return { ...option, how_we_do_it_text: value as string };
            } else if (field === 'subspecies') {
              return { ...option, subspecies: value as string[] };
            } else if (field === 'planComparisonHeader') {
              return {
                ...option,
                plan_comparison_header_text: value as string,
              };
            } else if (field === 'customLabel') {
              return { ...option, custom_label: value as string };
            }
          }
          return option;
        });
        setCompanyPestOptions(updatedOptions);
        savePestOptions(updatedOptions);

        // Clear the timer after saving
        delete debounceTimers.current[timerKey];
      }, 500); // 500ms delay
    },
    [companyPestOptions, savePestOptions]
  );

  const updatePestOptionHowWeDoIt = (
    optionId: string,
    howWeDoItText: string
  ) => {
    // Update local state immediately for responsive UI
    setLocalInputValues(prev => ({
      ...prev,
      howWeDoIt: { ...prev.howWeDoIt, [optionId]: howWeDoItText },
    }));

    // Also update the main state for immediate UI feedback
    const updatedOptions = companyPestOptions.map(option =>
      option.id === optionId
        ? { ...option, how_we_do_it_text: howWeDoItText }
        : option
    );
    setCompanyPestOptions(updatedOptions);

    // Debounce the API call
    debouncedSave(optionId, 'howWeDoIt', howWeDoItText);
  };

  const updatePestOptionPlanComparisonHeader = (
    optionId: string,
    headerText: string
  ) => {
    // Update local state immediately for responsive UI
    setLocalInputValues(prev => ({
      ...prev,
      planComparisonHeader: {
        ...prev.planComparisonHeader,
        [optionId]: headerText,
      },
    }));

    // Also update the main state for immediate UI feedback
    const updatedOptions = companyPestOptions.map(option =>
      option.id === optionId
        ? { ...option, plan_comparison_header_text: headerText }
        : option
    );
    setCompanyPestOptions(updatedOptions);

    // Debounce the API call
    debouncedSave(optionId, 'planComparisonHeader', headerText);
  };

  const updatePestOptionSubspecies = (
    optionId: string,
    subspeciesText: string
  ) => {
    // Update local state immediately for responsive UI
    setLocalInputValues(prev => ({
      ...prev,
      subspecies: { ...prev.subspecies, [optionId]: subspeciesText },
    }));

    // Process subspecies on the fly for immediate UI feedback, but don't save yet
    const subspecies = subspeciesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const updatedOptions = companyPestOptions.map(option =>
      option.id === optionId ? { ...option, subspecies } : option
    );
    setCompanyPestOptions(updatedOptions);

    // Debounce the API call
    debouncedSave(optionId, 'subspecies', subspecies);
  };

  const updatePestOptionLabelDebounced = (
    optionId: string,
    customLabel: string
  ) => {
    // Update local state immediately for responsive UI
    setLocalInputValues(prev => ({
      ...prev,
      customLabel: { ...prev.customLabel, [optionId]: customLabel },
    }));

    // Also update the main state for immediate UI feedback
    const updatedOptions = companyPestOptions.map(option =>
      option.id === optionId ? { ...option, custom_label: customLabel } : option
    );
    setCompanyPestOptions(updatedOptions);

    // Debounce the API call
    debouncedSave(optionId, 'customLabel', customLabel);
  };

  const reorderPestOptions = (fromIndex: number, toIndex: number) => {
    const updatedOptions = [...companyPestOptions];
    const [moved] = updatedOptions.splice(fromIndex, 1);
    updatedOptions.splice(toIndex, 0, moved);
    setCompanyPestOptions(updatedOptions);
    savePestOptions(updatedOptions);
  };

  // Service Plans Management Functions
  const createServicePlan = async (planData: Partial<ServicePlan>) => {
    if (!companyDetails) return;
    try {
      const response = await fetch(
        `/api/admin/service-plans/${companyDetails.id}`,
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
        await loadServicePlans(companyDetails.id);
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
    if (!companyDetails) return;

    // Get the plan ID from either editingPlan or the planData itself
    const planId = editingPlan?.id || (planData as any).id;
    if (!planId) {
      console.error('Cannot update service plan: No plan ID found');
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/service-plans/${companyDetails.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...planData,
            id: planId,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        await loadServicePlans(companyDetails.id);
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

  const saveServicePlan = async (planData: Partial<ServicePlan>) => {
    // Determine if this is a create or update based on the plan data
    const isUpdate = !!(planData as any).id || !!editingPlan?.id;

    if (isUpdate) {
      await updateServicePlan(planData);
    } else {
      await createServicePlan(planData);
    }
  };

  const deleteServicePlan = async (planId: string) => {
    if (
      !companyDetails ||
      !confirm('Are you sure you want to delete this service plan?')
    )
      return;
    try {
      const response = await fetch(
        `/api/admin/service-plans/${companyDetails.id}?id=${planId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (data.success) {
        await loadServicePlans(companyDetails.id);
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
    if (!companyDetails) return;
    try {
      const response = await fetch(`/api/service-areas/${companyDetails.id}`, {
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
          { text: '', icon: '' },
        ],
      },
    }));
  };

  const handleRemoveBenefit = (index: number) => {
    setConfig(prev => ({
      ...prev,
      messaging: {
        ...prev.messaging,
        welcomeBenefits: prev.messaging.welcomeBenefits.filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  const handleBenefitChange = (
    index: number,
    field: 'text' | 'icon',
    value: string
  ) => {
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

  const insertVariableIntoInput = (inputId: string, variable: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = input.value;
      const newValue =
        currentValue.slice(0, start) + variable + currentValue.slice(end);
      input.value = newValue;
      input.focus();
      input.setSelectionRange(start + variable.length, start + variable.length);

      // Trigger the onChange handler
      if (inputId === 'stepHeading-address') {
        handleConfigChange('stepHeadings', 'address', newValue);
      } else if (inputId === 'stepHeading-howWeDoIt') {
        handleConfigChange('stepHeadings', 'howWeDoIt', newValue);
      }
    }
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
    if (!companyDetails) return null;

    try {
      const supabase = createClient();
      const filePath = createAssetPath(
        companyDetails.name,
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

  const handlePestSelectBackgroundUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // If there's an existing pest select background image, delete it from storage first
    if (config.branding.pestSelectBackgroundImage) {
      await deleteFileFromStorage(config.branding.pestSelectBackgroundImage);
    }

    const url = await uploadFile(
      file,
      'brand-assets',
      'pest-select-backgrounds'
    );
    if (url) {
      handleConfigChange('branding', 'pestSelectBackgroundImage', url);
      // Clear the input so the same file can be selected again if needed
      event.target.value = '';
    }
  };

  const removePestSelectBackground = async () => {
    if (!config.branding.pestSelectBackgroundImage) return;

    if (
      !confirm(
        'Are you sure you want to delete this pest select background image? This action cannot be undone.'
      )
    ) {
      return;
    }

    const deleted = await deleteFileFromStorage(
      config.branding.pestSelectBackgroundImage
    );

    if (deleted) {
      handleConfigChange('branding', 'pestSelectBackgroundImage', '');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  // How We Do It Background Image handlers
  const handleHowWeDoItBackgroundUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (config.branding.howWeDoItBackgroundImage) {
      await deleteFileFromStorage(config.branding.howWeDoItBackgroundImage);
    }

    const url = await uploadFile(
      file,
      'brand-assets',
      'how-we-do-it-backgrounds'
    );
    if (url) {
      handleConfigChange('branding', 'howWeDoItBackgroundImage', url);
      event.target.value = '';
    }
  };

  const removeHowWeDoItBackground = async () => {
    if (!config.branding.howWeDoItBackgroundImage) return;

    if (
      !confirm(
        'Are you sure you want to delete this how we do it background image? This action cannot be undone.'
      )
    ) {
      return;
    }

    const deleted = await deleteFileFromStorage(
      config.branding.howWeDoItBackgroundImage
    );

    if (deleted) {
      handleConfigChange('branding', 'howWeDoItBackgroundImage', '');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  // How We Do It Interior Image handlers
  const handleHowWeDoItInteriorUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (config.branding.howWeDoItInteriorImage) {
      await deleteFileFromStorage(config.branding.howWeDoItInteriorImage);
    }

    const url = await uploadFile(file, 'brand-assets', 'how-we-do-it-interior');
    if (url) {
      handleConfigChange('branding', 'howWeDoItInteriorImage', url);
      event.target.value = '';
    }
  };

  const removeHowWeDoItInterior = async () => {
    if (!config.branding.howWeDoItInteriorImage) return;

    if (
      !confirm(
        'Are you sure you want to delete this how we do it interior image? This action cannot be undone.'
      )
    ) {
      return;
    }

    const deleted = await deleteFileFromStorage(
      config.branding.howWeDoItInteriorImage
    );

    if (deleted) {
      handleConfigChange('branding', 'howWeDoItInteriorImage', '');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  // Almost Done Background Image handlers
  const handleAlmostDoneBackgroundUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (config.branding.almostDoneBackgroundImage) {
      await deleteFileFromStorage(config.branding.almostDoneBackgroundImage);
    }

    const url = await uploadFile(
      file,
      'brand-assets',
      'almost-done-backgrounds'
    );
    if (url) {
      handleConfigChange('branding', 'almostDoneBackgroundImage', url);
      event.target.value = '';
    }
  };

  const removeAlmostDoneBackground = async () => {
    if (!config.branding.almostDoneBackgroundImage) return;

    if (
      !confirm(
        'Are you sure you want to delete this almost done background image? This action cannot be undone.'
      )
    ) {
      return;
    }

    const deleted = await deleteFileFromStorage(
      config.branding.almostDoneBackgroundImage
    );

    if (deleted) {
      handleConfigChange('branding', 'almostDoneBackgroundImage', '');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  // Detailed Quote Background Image handlers
  const handleDetailedQuoteBackgroundUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (config.branding.detailedQuoteBackgroundImage) {
      await deleteFileFromStorage(config.branding.detailedQuoteBackgroundImage);
    }

    const url = await uploadFile(
      file,
      'brand-assets',
      'detailed-quote-backgrounds'
    );
    if (url) {
      handleConfigChange('branding', 'detailedQuoteBackgroundImage', url);
      event.target.value = '';
    }
  };

  const removeDetailedQuoteBackground = async () => {
    if (!config.branding.detailedQuoteBackgroundImage) return;

    if (
      !confirm(
        'Are you sure you want to delete this detailed quote background image? This action cannot be undone.'
      )
    ) {
      return;
    }

    const deleted = await deleteFileFromStorage(
      config.branding.detailedQuoteBackgroundImage
    );

    if (deleted) {
      handleConfigChange('branding', 'detailedQuoteBackgroundImage', '');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  // Detailed Quote Interior Image handlers
  const handleDetailedQuoteInteriorUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (config.branding.detailedQuoteInteriorImage) {
      await deleteFileFromStorage(config.branding.detailedQuoteInteriorImage);
    }

    const url = await uploadFile(
      file,
      'brand-assets',
      'detailed-quote-interior'
    );
    if (url) {
      handleConfigChange('branding', 'detailedQuoteInteriorImage', url);
      event.target.value = '';
    }
  };

  const removeDetailedQuoteInterior = async () => {
    if (!config.branding.detailedQuoteInteriorImage) return;

    if (
      !confirm(
        'Are you sure you want to delete this detailed quote interior image? This action cannot be undone.'
      )
    ) {
      return;
    }

    const deleted = await deleteFileFromStorage(
      config.branding.detailedQuoteInteriorImage
    );

    if (deleted) {
      handleConfigChange('branding', 'detailedQuoteInteriorImage', '');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  // Location Not Served Background Image handlers
  const handleLocationNotServedBackgroundUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (config.branding.locationNotServedBackgroundImage) {
      await deleteFileFromStorage(
        config.branding.locationNotServedBackgroundImage
      );
    }

    const url = await uploadFile(
      file,
      'brand-assets',
      'location-not-served-backgrounds'
    );
    if (url) {
      handleConfigChange('branding', 'locationNotServedBackgroundImage', url);
      event.target.value = '';
    }
  };

  const removeLocationNotServedBackground = async () => {
    if (!config.branding.locationNotServedBackgroundImage) return;

    if (
      !confirm(
        'Are you sure you want to delete this location not served background image? This action cannot be undone.'
      )
    ) {
      return;
    }

    const deleted = await deleteFileFromStorage(
      config.branding.locationNotServedBackgroundImage
    );

    if (deleted) {
      handleConfigChange('branding', 'locationNotServedBackgroundImage', '');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  const saveConfig = async () => {
    if (!companyDetails) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await adminAPI.updateCompany(companyDetails.id, {
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
    if (!companyDetails) return '';
    let embedCode = `<script 
  src="${window.location.origin}/widget.js"
  data-company-id="${companyDetails.id}"
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
    embedCode += `
></script>`;
    return embedCode;
  };
  const generateMinimalEmbedCode = () => {
    if (!companyDetails) return '';

    // New minimal embed code without company-id or base-url
    // Widget will automatically detect company from domain
    const embedCode = `<script src="${window.location.origin}/widget.js"></script>`;

    return embedCode;
  };

  const generateButtonEmbedCode = () => {
    if (!companyDetails) return '';

    let embedCode = `<script 
  src="${window.location.origin}/widget.js"
  data-company-id="${companyDetails.id}"
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

    embedCode += `
></script>`;

    return embedCode;
  };

  const copyFullEmbedCode = async () => {
    if (!companyDetails) return;

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
    if (!companyDetails) return;
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
    if (!companyDetails) return;

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

  if (!companyDetails) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Widget Configuration</h2>
          <p>Loading widget configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Widget Configuration</h2>
        <p>Configure the AI-powered widget for {companyDetails.name}</p>
        <small>Use the company dropdown in the header to switch companies.</small>
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
            description="Configure your company name, headers, logo and step background images for the widget"
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

            {/* Step Background Images */}
            <hr className={styles.sectionDivider} />
            <h4 className={styles.sectionSubheading}>Step Background Images</h4>

            <div className={styles.formGroup}>
              <label>Choose Pest Background Image</label>
              <p className={styles.fieldNote}>
                Upload a background image for the pest selection step. Image
                should be 386px wide and optimized for the widget height.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handlePestSelectBackgroundUpload}
                className={styles.fileInput}
              />
              {config.branding.pestSelectBackgroundImage && (
                <div className={styles.heroImagePreview}>
                  <Image
                    src={config.branding.pestSelectBackgroundImage}
                    alt="Pest select background preview"
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
                    onClick={removePestSelectBackground}
                    className={styles.removeImageButton}
                  >
                    Remove Background Image
                  </button>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>How We Do It Images</label>
              <p className={styles.fieldNote}>
                Upload background and interior images for the &quot;How We Do
                It&quot; step.
              </p>

              <div className={styles.subFormGroup}>
                <label>Background Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHowWeDoItBackgroundUpload}
                  className={styles.fileInput}
                />
                {config.branding.howWeDoItBackgroundImage && (
                  <div className={styles.heroImagePreview}>
                    <Image
                      src={config.branding.howWeDoItBackgroundImage}
                      alt="How we do it background preview"
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
                      onClick={removeHowWeDoItBackground}
                      className={styles.removeImageButton}
                    >
                      Remove Background Image
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.subFormGroup}>
                <label>Interior Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHowWeDoItInteriorUpload}
                  className={styles.fileInput}
                />
                {config.branding.howWeDoItInteriorImage && (
                  <div className={styles.heroImagePreview}>
                    <Image
                      src={config.branding.howWeDoItInteriorImage}
                      alt="How we do it interior preview"
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
                      onClick={removeHowWeDoItInterior}
                      className={styles.removeImageButton}
                    >
                      Remove Interior Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Step Headings</label>
              <p className={styles.fieldNote}>
                Customize the headings for different steps in your widget. Use
                variables:{' '}
                <code>
                  {'{'}pest{'}'}
                </code>
                ,{' '}
                <code>
                  {'{'}initialPrice{'}'}
                </code>
                ,{' '}
                <code>
                  {'{'}recurringPrice{'}'}
                </code>
              </p>

              <div className={styles.subFormGroup}>
                <label>Address Step Heading</label>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                  }}
                >
                  <input
                    id="stepHeading-address"
                    type="text"
                    value={config.stepHeadings.address}
                    onChange={e =>
                      handleConfigChange(
                        'stepHeadings',
                        'address',
                        e.target.value
                      )
                    }
                    placeholder="Yuck, {pest}! We hate those. No worries, we got you!"
                    style={{ flex: 1 }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        insertVariableIntoInput('stepHeading-address', '{pest}')
                      }
                      className={styles.variableButton}
                      title="Insert pest variable"
                    >
                      {'{'}pest{'}'}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.subFormGroup}>
                <label>How We Do It Step Heading</label>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                  }}
                >
                  <input
                    id="stepHeading-howWeDoIt"
                    type="text"
                    value={config.stepHeadings.howWeDoIt}
                    onChange={e =>
                      handleConfigChange(
                        'stepHeadings',
                        'howWeDoIt',
                        e.target.value
                      )
                    }
                    placeholder="How We Do It"
                    style={{ flex: 1 }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        insertVariableIntoInput(
                          'stepHeading-howWeDoIt',
                          '{pest}'
                        )
                      }
                      className={styles.variableButton}
                      title="Insert pest variable"
                    >
                      {'{'}pest{'}'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertVariableIntoInput(
                          'stepHeading-howWeDoIt',
                          '{initialPrice}'
                        )
                      }
                      className={styles.variableButton}
                      title="Insert initial price variable"
                    >
                      $init
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertVariableIntoInput(
                          'stepHeading-howWeDoIt',
                          '{recurringPrice}'
                        )
                      }
                      className={styles.variableButton}
                      title="Insert recurring price variable"
                    >
                      $rec
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Almost Done - More Info Background Image</label>
              <p className={styles.fieldNote}>
                Upload a background image for the contact information step.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleAlmostDoneBackgroundUpload}
                className={styles.fileInput}
              />
              {config.branding.almostDoneBackgroundImage && (
                <div className={styles.heroImagePreview}>
                  <Image
                    src={config.branding.almostDoneBackgroundImage}
                    alt="Almost done background preview"
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
                    onClick={removeAlmostDoneBackground}
                    className={styles.removeImageButton}
                  >
                    Remove Background Image
                  </button>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Detailed Quote Images</label>
              <p className={styles.fieldNote}>
                Upload background and interior images for the detailed quote
                steps.
              </p>

              <div className={styles.subFormGroup}>
                <label>Background Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDetailedQuoteBackgroundUpload}
                  className={styles.fileInput}
                />
                {config.branding.detailedQuoteBackgroundImage && (
                  <div className={styles.heroImagePreview}>
                    <Image
                      src={config.branding.detailedQuoteBackgroundImage}
                      alt="Detailed quote background preview"
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
                      onClick={removeDetailedQuoteBackground}
                      className={styles.removeImageButton}
                    >
                      Remove Background Image
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.subFormGroup}>
                <label>Interior Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDetailedQuoteInteriorUpload}
                  className={styles.fileInput}
                />
                {config.branding.detailedQuoteInteriorImage && (
                  <div className={styles.heroImagePreview}>
                    <Image
                      src={config.branding.detailedQuoteInteriorImage}
                      alt="Detailed quote interior preview"
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
                      onClick={removeDetailedQuoteInterior}
                      className={styles.removeImageButton}
                    >
                      Remove Interior Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Location Not Served Background Image</label>
              <p className={styles.fieldNote}>
                Upload a background image for the location not served step.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleLocationNotServedBackgroundUpload}
                className={styles.fileInput}
              />
              {config.branding.locationNotServedBackgroundImage && (
                <div className={styles.heroImagePreview}>
                  <Image
                    src={config.branding.locationNotServedBackgroundImage}
                    alt="Location not served background preview"
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
                    onClick={removeLocationNotServedBackground}
                    className={styles.removeImageButton}
                  >
                    Remove Background Image
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
                placeholder="You should receive a confirmation email shortly. One of our representatives will contact you to confirm your appointment and answer any of your questions during normal business hours."
              />
            </div>

            {/* Welcome Benefits Section */}
            <div className={styles.formGroup}>
              <label>Welcome Benefits</label>
              <p className={styles.fieldNote}>
                Add custom benefits with text and SVG icons to display on the
                welcome screen.
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
                        onChange={e =>
                          handleBenefitChange(index, 'text', e.target.value)
                        }
                        placeholder="e.g., Fully Licensed & Insured"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>SVG Icon</label>
                      <textarea
                        value={benefit.icon}
                        onChange={e =>
                          handleBenefitChange(index, 'icon', e.target.value)
                        }
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
                          <span className={styles.previewText}>
                            {benefit.text}
                          </span>
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
                          <div className={styles.pestOptionHeader}>
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
                                  {debounceTimers.current[
                                    `${option.id}-customLabel`
                                  ] && (
                                    <span className={styles.savingIndicator}>
                                      Saving...
                                    </span>
                                  )}
                                </div>
                                <div className={styles.pestCategory}>
                                  {option.category}
                                </div>
                              </div>
                            </div>
                            <div className={styles.pestOptionActions}>
                            <input
                              type="text"
                              className={styles.customLabelInput}
                              placeholder={`Custom label for ${option.name}`}
                              value={
                                localInputValues.customLabel[option.id] ??
                                option.custom_label ??
                                ''
                              }
                              onChange={e =>
                                updatePestOptionLabelDebounced(
                                  option.id,
                                  e.target.value
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() => removePestOption(option.id)}
                              className={styles.removeButton}
                            >
                              Remove
                            </button>
                            </div>
                          </div>

                          {/* Expanded content for "How We Do It" text */}
                          <div className={styles.pestContentSection}>
                            <div className={styles.pestContentField}>
                              <label className={styles.fieldLabel}>
                                How We Do It Text
                                {debounceTimers.current[
                                  `${option.id}-howWeDoIt`
                                ] && (
                                  <span className={styles.savingIndicator}>
                                    Saving...
                                  </span>
                                )}
                              </label>
                              <textarea
                                className={styles.textarea}
                                placeholder={`Describe how you treat ${option.name}...`}
                                value={
                                  localInputValues.howWeDoIt[option.id] ??
                                  option.how_we_do_it_text ??
                                  ''
                                }
                                onChange={e =>
                                  updatePestOptionHowWeDoIt(
                                    option.id,
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div className={styles.pestContentField}>
                              <label className={styles.fieldLabel}>
                                Subspecies (comma-separated)
                                {debounceTimers.current[
                                  `${option.id}-subspecies`
                                ] && (
                                  <span className={styles.savingIndicator}>
                                    Saving...
                                  </span>
                                )}
                              </label>
                              <input
                                type="text"
                                className={styles.pestContentInput}
                                placeholder="e.g., German Cockroach, American Cockroach"
                                value={
                                  localInputValues.subspecies[option.id] ??
                                  (option.subspecies || []).join(', ') ??
                                  ''
                                }
                                onChange={e =>
                                  updatePestOptionSubspecies(
                                    option.id,
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div className={styles.pestContentField}>
                              <label className={styles.fieldLabel}>
                                Plan Comparison Header Text
                                {debounceTimers.current[
                                  `${option.id}-planComparisonHeader`
                                ] && (
                                  <span className={styles.savingIndicator}>
                                    Saving...
                                  </span>
                                )}
                              </label>
                              <textarea
                                className={styles.textarea}
                                placeholder="Text to show in plan comparison for this pest..."
                                value={
                                  localInputValues.planComparisonHeader[
                                    option.id
                                  ] ?? option.plan_comparison_header_text ?? ''
                                }
                                onChange={e =>
                                  updatePestOptionPlanComparisonHeader(
                                    option.id,
                                    e.target.value
                                  )
                                }
                              />
                            </div>
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
                                {type.pest_categories?.name || type.category}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => addPestOption(type)}
                            className={styles.addButton}
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
                    companyId={companyDetails.id}
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
                      Please add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to your environment
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
              <h4>Simple Embed Code (Recommended)</h4>
              <p className={styles.embedDescription}>
                Minimal embed code that automatically detects your company from
                the domain. All customizations will be loaded from your saved
                configuration. Perfect for most use cases.
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
                Includes all your customizations as data attributes. Use this if
                you need to override settings per page or want maximum
                portability without relying on server configuration.
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
              <EmbedPreview companyId={companyDetails.id} />
            </div>
          </div>
        )}

        {/* Service Plan Modal */}
        {showPlanModal && (
          <ServicePlanModal
            plan={editingPlan}
            isOpen={showPlanModal}
            onClose={() => setShowPlanModal(false)}
            onSave={saveServicePlan}
            availablePestTypes={availablePestTypes}
            companyId={companyId}
          />
        )}
      </div>
    </div>
  );
};
export default WidgetConfig;
