/**
 * Campaign Landing Page Editor Step
 *
 * Form for editing all landing page customization fields
 */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import styles from './CampaignLandingPageEditorStep.module.scss';
import ImageUploadField from '../ImageUploadField/ImageUploadField';
import ImagePicker from '../ImagePicker/ImagePicker';
import DynamicListEditor, { FieldConfig } from '../DynamicListEditor/DynamicListEditor';
import RichTextEditor, { RichTextEditorHandle } from '@/components/Common/RichTextEditor/RichTextEditor';
import { createClient } from '@/lib/supabase/client';

export interface LandingPageFormData {
  // Hero
  hero_title: string;
  hero_subtitle: string;
  hero_subheading: string;
  hero_description: string;
  hero_button_text: string;
  hero_image_url: string; // Changed from hero_image_urls array to single image
  hero_button_icon_url: string; // Icon next to CTA button

  // Pricing
  display_price: string;
  display_original_price: string;
  display_savings: string;

  // Letter
  show_letter: boolean;
  letter_content: string;
  letter_signature_text: string;
  letter_image_url: string;

  // Features
  feature_heading: string;
  feature_bullets: string[];
  feature_image_url: string;

  // Additional Services
  show_additional_services: boolean;
  additional_services_heading: string;
  additional_services: Array<{ name: string; description?: string }>;
  additional_services_image_url: string;
  selected_service_plan_ids: string[];
  selected_addon_ids: string[];

  // Pre-Footer
  show_pre_footer: boolean;
  pre_footer_content: string;

  // FAQ
  show_faq: boolean;
  faq_heading: string;
  faq_items: Array<{ question: string; answer: string }>;

  // Header
  header_primary_button_text: string;
  header_secondary_button_text: string;
  show_header_cta: boolean;

  // Footer
  footer_company_tagline: string;
  footer_links: Array<{ label: string; url: string }>;

  // Terms
  terms_content: string;

  // Redemption Card
  redemption_card_heading: string;

  // Brand Overrides
  override_logo_url: string;
  override_primary_color: string;
  override_secondary_color: string;
  override_phone: string;
  accent_color_preference: 'primary' | 'secondary';

  // Thank You Page
  thankyou_greeting: string;
  thankyou_content: string;
  thankyou_show_expect: boolean;
  thankyou_expect_heading: string;
  thankyou_expect_col1_image: string;
  thankyou_expect_col1_heading: string;
  thankyou_expect_col1_content: string;
  thankyou_expect_col2_image: string;
  thankyou_expect_col2_heading: string;
  thankyou_expect_col2_content: string;
  thankyou_expect_col3_image: string;
  thankyou_expect_col3_heading: string;
  thankyou_expect_col3_content: string;
  thankyou_cta_text: string;
  thankyou_cta_url: string;
}

interface CampaignLandingPageEditorStepProps {
  campaignId: string;
  companyId: string;
  data: LandingPageFormData;
  onChange: (data: LandingPageFormData) => void;
  servicePlanId?: string | null; // Current service plan ID (from campaign)
  onServicePlanChange?: (planId: string | null) => void; // Callback to update campaign.service_plan_id
}

type SectionKey =
  | 'serviceplan'
  | 'hero'
  | 'pricing'
  | 'redemption'
  | 'letter'
  | 'features'
  | 'services'
  | 'faq'
  | 'prefooter'
  | 'header'
  | 'footer'
  | 'terms'
  | 'thankyou'
  | 'branding';

interface ServicePlan {
  id: string;
  plan_name: string;
  plan_description?: string | null;
  recurring_price?: number | null;
  plan_faqs?: Array<{ question: string; answer: string }>;
  plan_features?: string[];
}

interface AddOn {
  id: string;
  addon_name: string;
  addon_description: string | null;
  recurring_price: number | null;
}

// Maximum number of total display items in Additional Services
const MAX_ADDONS = 6;

export default function CampaignLandingPageEditorStep({
  campaignId,
  companyId,
  data,
  onChange,
  servicePlanId,
  onServicePlanChange,
}: CampaignLandingPageEditorStepProps) {
  const supabase = createClient();
  const [brandDefaults, setBrandDefaults] = useState<{
    primaryColorHex: string | null;
    secondaryColorHex: string | null;
  }>({ primaryColorHex: null, secondaryColorHex: null });
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(['serviceplan', 'hero', 'pricing', 'redemption'])
  );
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([]);
  const [selectedServicePlan, setSelectedServicePlan] = useState<ServicePlan | null>(null);
  const [loadingServicePlans, setLoadingServicePlans] = useState(true);
  const heroTitleEditorRef = useRef<RichTextEditorHandle | null>(null);
  const heroSubheadingEditorRef = useRef<RichTextEditorHandle | null>(null);
  const letterEditorRef = useRef<RichTextEditorHandle | null>(null);
  const thankyouContentEditorRef = useRef<RichTextEditorHandle | null>(null);
  const thankyouCol1EditorRef = useRef<RichTextEditorHandle | null>(null);
  const thankyouCol2EditorRef = useRef<RichTextEditorHandle | null>(null);
  const thankyouCol3EditorRef = useRef<RichTextEditorHandle | null>(null);
  const featureHeadingEditorRef = useRef<RichTextEditorHandle | null>(null);
  const additionalServicesHeadingEditorRef = useRef<RichTextEditorHandle | null>(null);
  const preFooterEditorRef = useRef<RichTextEditorHandle | null>(null);
  const [availableAddons, setAvailableAddons] = useState<AddOn[]>([]);
  const [loadingAddons, setLoadingAddons] = useState(false);
  const addonsLoadedRef = useRef(false);
  const selectionInitializedRef = useRef(false);

  useEffect(() => {
    const fetchBrandDefaults = async () => {
      try {
        const { data: brandData, error } = await supabase
          .from('brands')
          .select('primary_color_hex, secondary_color_hex')
          .eq('company_id', companyId)
          .maybeSingle();

        if (error) throw error;

        setBrandDefaults({
          primaryColorHex: brandData?.primary_color_hex || null,
          secondaryColorHex: brandData?.secondary_color_hex || null,
        });
      } catch (error) {
        console.error('Error fetching brand defaults:', error);
        setBrandDefaults({ primaryColorHex: null, secondaryColorHex: null });
      }
    };

    fetchBrandDefaults();
  }, [companyId, supabase]);

  // Fetch available service plans for this company
  useEffect(() => {
    const fetchServicePlans = async () => {
      try {
        setLoadingServicePlans(true);
        const { data: plans, error } = await supabase
          .from('service_plans')
          .select('id, plan_name, plan_description, recurring_price, plan_faqs, plan_features')
          .eq('company_id', companyId)
          .order('plan_name');

        if (error) throw error;
        setServicePlans(plans || []);
      } catch (error) {
        console.error('Error fetching service plans:', error);
        setServicePlans([]);
      } finally {
        setLoadingServicePlans(false);
      }
    };

    fetchServicePlans();
  }, [companyId, supabase]);

  // Update selected service plan when servicePlanId prop changes
  useEffect(() => {
    if (servicePlanId && servicePlans.length > 0) {
      const plan = servicePlans.find((p) => p.id === servicePlanId);
      setSelectedServicePlan(plan || null);
    } else {
      setSelectedServicePlan(null);
    }
    selectionInitializedRef.current = false;
  }, [servicePlanId, servicePlans]);

  // Fetch eligible add-ons for the selected service plan
  useEffect(() => {
    addonsLoadedRef.current = false;
    const fetchAddons = async () => {
      if (!servicePlanId) {
        setAvailableAddons([]);
        addonsLoadedRef.current = true;
        return;
      }

      try {
        setLoadingAddons(true);
        const { data: eligible } = await supabase
          .rpc('get_eligible_addons_for_plan', {
            p_service_plan_id: servicePlanId,
            p_company_id: companyId,
          });

        const eligibleIds =
          eligible
            ?.filter((addon: any) => addon.is_eligible)
            .map((addon: any) => addon.addon_id) || [];

        if (eligibleIds.length === 0) {
          setAvailableAddons([]);
          return;
        }

        const { data: addons } = await supabase
          .from('add_on_services')
          .select('id, addon_name, addon_description, recurring_price')
          .in('id', eligibleIds)
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('addon_name');

        setAvailableAddons(addons || []);
      } catch (error) {
        console.error('Error fetching add-ons:', error);
        setAvailableAddons([]);
      } finally {
        setLoadingAddons(false);
        addonsLoadedRef.current = true;
      }
    };

    fetchAddons();
  }, [servicePlanId, companyId, supabase]);

  const primaryColorFallback =
    data.override_primary_color ||
    brandDefaults.primaryColorHex ||
    '#00529B';
  const secondaryColorFallback =
    data.override_secondary_color ||
    brandDefaults.secondaryColorHex ||
    '#00B142';
  const selectedServicePlanCount = data.selected_service_plan_ids?.length || 0;
  const selectedAddonCount = data.selected_addon_ids?.length || 0;
  const customDisplayItemCount = data.additional_services?.length || 0;
  const totalDisplayItemCount =
    selectedServicePlanCount + selectedAddonCount + customDisplayItemCount;
  const availableAdditionalServicePlans = useMemo(
    () => servicePlans.filter((plan) => plan.id !== servicePlanId),
    [servicePlans, servicePlanId]
  );

  // Ensure selected additional service plans stay in sync and never include
  // the campaign's linked base plan.
  useEffect(() => {
    // Don't prune until service plans have loaded
    if (loadingServicePlans) return;

    const currentSelected = data.selected_service_plan_ids || [];
    const availableIds = new Set(availableAdditionalServicePlans.map((plan) => plan.id));
    const maxSelectablePlans = Math.max(
      0,
      MAX_ADDONS - selectedAddonCount - customDisplayItemCount
    );

    let filteredSelection = currentSelected.filter((id) => availableIds.has(id));

    if (filteredSelection.length > maxSelectablePlans) {
      filteredSelection = filteredSelection.slice(0, maxSelectablePlans);
    }

    if (filteredSelection.join('|') !== currentSelected.join('|')) {
      updateField('selected_service_plan_ids', filteredSelection);
    }
  }, [
    availableAdditionalServicePlans,
    customDisplayItemCount,
    data.selected_service_plan_ids,
    loadingServicePlans,
    selectedAddonCount,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure selected add-ons stay in sync with available options
  useEffect(() => {
    // Don't initialize until add-ons have actually loaded — otherwise we'd
    // wipe the stored selection before we can validate it against real IDs.
    if (loadingAddons) return;
    if (!addonsLoadedRef.current) return;

    const availableIds = availableAddons.map((addon) => addon.id);
    const currentSelected = data.selected_addon_ids || [];
    const maxSelectableAddons = Math.max(
      0,
      MAX_ADDONS - selectedServicePlanCount - customDisplayItemCount
    );

    // Initialize selection when add-ons load or plan changes
    if (!selectionInitializedRef.current) {
      // Respect the stored selection — filter to valid IDs only
      let initialSelection = currentSelected.filter((id) => availableIds.includes(id));

      // Enforce remaining display item limit on initialization
      if (initialSelection.length > maxSelectableAddons) {
        initialSelection = initialSelection.slice(0, maxSelectableAddons);
      }

      selectionInitializedRef.current = true;

      if (initialSelection.join('|') !== currentSelected.join('|')) {
        updateField('selected_addon_ids', initialSelection);
      }
      return;
    }

    // After initialization, prune invalid selections AND enforce limit
    let filteredSelection = currentSelected.filter((id) =>
      availableIds.includes(id)
    );

    if (filteredSelection.length > maxSelectableAddons) {
      filteredSelection = filteredSelection.slice(0, maxSelectableAddons);
    }

    if (filteredSelection.length !== currentSelected.length) {
      updateField('selected_addon_ids', filteredSelection);
    }
  }, [
    availableAddons,
    customDisplayItemCount,
    data.selected_addon_ids,
    loadingAddons,
    selectedServicePlanCount,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = (section: SectionKey) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateField = (field: keyof LandingPageFormData, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleServicePlanChange = async (planId: string) => {
    const newPlanId = planId === '' ? null : planId;
    if (onServicePlanChange) {
      onServicePlanChange(newPlanId);
    }
  };

  const toggleServicePlanSelection = (planId: string) => {
    const current = data.selected_service_plan_ids || [];

    // If deselecting, always allow
    if (current.includes(planId)) {
      const next = current.filter((id) => id !== planId);
      updateField('selected_service_plan_ids', next);
      return;
    }

    // If selecting, enforce shared display item limit.
    if (current.length + selectedAddonCount + customDisplayItemCount >= MAX_ADDONS) {
      return;
    }

    updateField('selected_service_plan_ids', [...current, planId]);
  };

  const toggleAddonSelection = (addonId: string) => {
    const current = data.selected_addon_ids || [];

    // If deselecting, always allow
    if (current.includes(addonId)) {
      const next = current.filter((id) => id !== addonId);
      updateField('selected_addon_ids', next);
      return;
    }

    // If selecting, check combined limit (service plans + add-ons + custom items)
    if (
      selectedServicePlanCount + current.length + customDisplayItemCount >=
      MAX_ADDONS
    ) {
      return; // Do nothing - checkbox will be disabled
    }

    // Add to selection
    const next = [...current, addonId];
    updateField('selected_addon_ids', next);
  };

  const insertVariableIntoField = (textareaId: string, fieldName: keyof LandingPageFormData, variable: string) => {
    // Special handling for Hero Title RichTextEditor
    if (fieldName === 'hero_title') {
      if (heroTitleEditorRef.current?.insertText) {
        heroTitleEditorRef.current.insertText(variable);
      } else {
        const currentValue = data[fieldName] as string;
        const newValue = currentValue ? `${currentValue} ${variable}` : variable;
        updateField(fieldName, newValue);
      }
      return;
    }

    // Special handling for Hero Subheading RichTextEditor
    if (fieldName === 'hero_subheading') {
      if (heroSubheadingEditorRef.current?.insertText) {
        heroSubheadingEditorRef.current.insertText(variable);
      } else {
        const currentValue = data[fieldName] as string;
        const newValue = currentValue ? `${currentValue} ${variable}` : variable;
        updateField(fieldName, newValue);
      }
      return;
    }

    // Special handling for RichTextEditor (letter_content)
    if (fieldName === 'letter_content') {
      if (letterEditorRef.current?.insertText) {
        letterEditorRef.current.insertText(variable);
      } else {
        const currentValue = data[fieldName] as string;
        const newValue = currentValue ? `${currentValue} ${variable}` : variable;
        updateField(fieldName, newValue);
      }
      return;
    }

    // Special handling for Thank You content RichTextEditor
    if (fieldName === 'thankyou_content') {
      if (thankyouContentEditorRef.current?.insertText) {
        thankyouContentEditorRef.current.insertText(variable);
      } else {
        const currentValue = data[fieldName] as string;
        const newValue = currentValue ? `${currentValue} ${variable}` : variable;
        updateField(fieldName, newValue);
      }
      return;
    }

    // Special handling for Thank You column RichTextEditors
    if (fieldName === 'thankyou_expect_col1_content') {
      if (thankyouCol1EditorRef.current?.insertText) {
        thankyouCol1EditorRef.current.insertText(variable);
      } else {
        const currentValue = data[fieldName] as string;
        const newValue = currentValue ? `${currentValue} ${variable}` : variable;
        updateField(fieldName, newValue);
      }
      return;
    }

    if (fieldName === 'thankyou_expect_col2_content') {
      if (thankyouCol2EditorRef.current?.insertText) {
        thankyouCol2EditorRef.current.insertText(variable);
      } else {
        const currentValue = data[fieldName] as string;
        const newValue = currentValue ? `${currentValue} ${variable}` : variable;
        updateField(fieldName, newValue);
      }
      return;
    }

    if (fieldName === 'thankyou_expect_col3_content') {
      if (thankyouCol3EditorRef.current?.insertText) {
        thankyouCol3EditorRef.current.insertText(variable);
      } else {
        const currentValue = data[fieldName] as string;
        const newValue = currentValue ? `${currentValue} ${variable}` : variable;
        updateField(fieldName, newValue);
      }
      return;
    }

    // Special handling for Features heading RichTextEditor
    if (fieldName === 'feature_heading') {
      if (featureHeadingEditorRef.current?.insertText) {
        featureHeadingEditorRef.current.insertText(variable);
      } else {
        const currentValue = data[fieldName] as string;
        const newValue = currentValue ? `${currentValue} ${variable}` : variable;
        updateField(fieldName, newValue);
      }
      return;
    }

    // Special handling for Pre-Footer content RichTextEditor
    if (fieldName === 'pre_footer_content') {
      if (preFooterEditorRef.current?.insertText) {
        preFooterEditorRef.current.insertText(variable);
      } else {
        const currentValue = data[fieldName] as string;
        const newValue = currentValue ? `${currentValue} ${variable}` : variable;
        updateField(fieldName, newValue);
      }
      return;
    }

    // Special handling for Additional Services heading RichTextEditor
    if (fieldName === 'additional_services_heading') {
      if (additionalServicesHeadingEditorRef.current?.insertText) {
        additionalServicesHeadingEditorRef.current.insertText(variable);
      } else {
        const currentValue = data[fieldName] as string;
        const newValue = currentValue ? `${currentValue} ${variable}` : variable;
        updateField(fieldName, newValue);
      }
      return;
    }

    const element = document.getElementById(textareaId) as HTMLTextAreaElement | HTMLInputElement;
    if (!element) return;

    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const currentValue = data[fieldName] as string;

    const newValue =
      currentValue.substring(0, start) +
      variable +
      currentValue.substring(end);

    updateField(fieldName, newValue);

    setTimeout(() => {
      element.setSelectionRange(start + variable.length, start + variable.length);
      element.focus();
    }, 0);
  };

  // Field configurations for dynamic lists
  const featureBulletsFields: FieldConfig[] = [
    {
      name: 'value',
      label: 'Feature',
      type: 'text',
      placeholder: 'e.g., Covers Ants, Spiders, Wasps & More',
      required: true,
    },
  ];

  const faqItemsFields: FieldConfig[] = [
    {
      name: 'question',
      label: 'Question',
      type: 'text',
      placeholder: 'e.g., How soon can you get here?',
      required: true,
    },
    {
      name: 'answer',
      label: 'Answer',
      type: 'textarea',
      placeholder: 'Detailed answer to the question',
      required: true,
    },
  ];

  const footerLinksFields: FieldConfig[] = [
    {
      name: 'label',
      label: 'Link Text',
      type: 'text',
      placeholder: 'e.g., Quarterly Pest Control',
      required: true,
    },
    {
      name: 'url',
      label: 'URL',
      type: 'text',
      placeholder: 'e.g., /services/pest-control',
      required: true,
    },
  ];

  const renderSection = (
    key: SectionKey,
    title: string,
    description: string,
    content: React.ReactNode
  ) => {
    const isExpanded = expandedSections.has(key);

    return (
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => toggleSection(key)}
        >
          <div className={styles.sectionTitle}>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isExpanded && <div className={styles.sectionContent}>{content}</div>}
      </div>
    );
  };

  return (
    <div className={styles.editor}>
      <div className={styles.header}>
        <h2>Landing Page Customization</h2>
        <p>
          Customize your campaign landing page with personalized content, images, and branding.
        </p>
      </div>

      <div className={styles.sections}>
        {/* Service Plan Section */}
        {renderSection(
          'serviceplan',
          'Service Plan Integration (Optional)',
          'Link this campaign to a service plan to automatically use its FAQs and features',
          <>
            <div className={styles.field}>
              <label className={styles.label}>Link to Service Plan</label>
              <select
                value={servicePlanId || ''}
                onChange={(e) => handleServicePlanChange(e.target.value)}
                className={styles.input}
                disabled={loadingServicePlans}
              >
                <option value="">None (Use Manual Configuration)</option>
                {servicePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.plan_name}
                  </option>
                ))}
              </select>
              <p className={styles.helpText}>
                When linked to a service plan, this campaign will automatically use the plan&apos;s
                FAQs and features. When not linked, you can manually configure FAQs and features
                below.
              </p>
            </div>

            {selectedServicePlan && (
              <div className={styles.servicePlanPreview}>
                <div className={styles.previewHeader}>
                  <h4>Using: {selectedServicePlan.plan_name}</h4>
                  <button
                    type="button"
                    onClick={() => handleServicePlanChange('')}
                    className={styles.unlinkButton}
                  >
                    Unlink
                  </button>
                </div>

                {selectedServicePlan.plan_features && selectedServicePlan.plan_features.length > 0 && (
                  <div className={styles.previewSection}>
                    <h5>Features from Service Plan:</h5>
                    <ul className={styles.previewList}>
                      {selectedServicePlan.plan_features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedServicePlan.plan_faqs && selectedServicePlan.plan_faqs.length > 0 && (
                  <div className={styles.previewSection}>
                    <h5>FAQs from Service Plan:</h5>
                    <ul className={styles.previewList}>
                      {selectedServicePlan.plan_faqs.map((faq, idx) => (
                        <li key={idx}>
                          <strong>Q: {faq.question}</strong>
                          <br />
                          A: {faq.answer}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className={styles.helpText}>
                  Changes to the service plan will automatically reflect in this campaign. To use
                  custom FAQs/features instead, click &quot;Unlink&quot; above.
                </p>
              </div>
            )}
          </>
        )}

        {/* Hero Section */}
        {renderSection(
          'hero',
          'Hero Section',
          'Main banner with title, description, and image',
          <>
            <div className={styles.field}>
              <label className={styles.label}>Hero Eyebrow</label>
              <input
                type="text"
                value={data.hero_subtitle}
                onChange={(e) => updateField('hero_subtitle', e.target.value)}
                placeholder="e.g., Special Offer"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Hero Title <span className={styles.required}>*</span>
              </label>
              <RichTextEditor
                ref={heroTitleEditorRef}
                value={data.hero_title}
                onChange={(value) => updateField('hero_title', value)}
                placeholder="e.g., Quarterly Pest Control starting at only $44/mo"
              />
              <p className={styles.helpText}>
                Use variables like {'{first_name}'}, {'{display_price}'}, {'{company_name}'} for personalization.
              </p>
            </div>

            <div className={styles.variableButtons}>
              <label className={styles.label}>Insert Variables:</label>
              <div className={styles.buttonGrid}>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{first_name}')}>
                  {'{first_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{last_name}')}>
                  {'{last_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{email}')}>
                  {'{email}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{phone_number}')}>
                  {'{phone_number}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{service_address}')}>
                  {'{service_address}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{city}')}>
                  {'{city}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{state}')}>
                  {'{state}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{zip_code}')}>
                  {'{zip_code}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{display_price}')}>
                  {'{display_price}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{original_price}')}>
                  {'{original_price}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{savings}')}>
                  {'{savings}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{price_amount}')}>
                  {'{price_amount}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{price_frequency}')}>
                  {'{price_frequency}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{company_name}')}>
                  {'{company_name}'}
                </button>
                {servicePlanId && (
                  <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{service_name}')}>
                    {'{service_name}'}
                  </button>
                )}
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{company_phone}')}>
                  {'{company_phone}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{tagline}')}>
                  {'{tagline}'}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Hero Subheading</label>
              <RichTextEditor
                ref={heroSubheadingEditorRef}
                value={data.hero_subheading}
                onChange={(value) => updateField('hero_subheading', value)}
                placeholder="e.g., Protect your home year-round"
              />
              <p className={styles.helpText}>
                Use variables like {'{first_name}'}, {'{display_price}'}, {'{company_name}'} for personalization.
              </p>
            </div>

            <div className={styles.variableButtons}>
              <label className={styles.label}>Insert Variables:</label>
              <div className={styles.buttonGrid}>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{first_name}')}>
                  {'{first_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{last_name}')}>
                  {'{last_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{email}')}>
                  {'{email}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{phone_number}')}>
                  {'{phone_number}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{service_address}')}>
                  {'{service_address}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{city}')}>
                  {'{city}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{state}')}>
                  {'{state}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{zip_code}')}>
                  {'{zip_code}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{display_price}')}>
                  {'{display_price}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{original_price}')}>
                  {'{original_price}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{savings}')}>
                  {'{savings}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{price_amount}')}>
                  {'{price_amount}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{price_frequency}')}>
                  {'{price_frequency}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{company_name}')}>
                  {'{company_name}'}
                </button>
                {servicePlanId && (
                  <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{service_name}')}>
                    {'{service_name}'}
                  </button>
                )}
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{company_phone}')}>
                  {'{company_phone}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-subheading-textarea', 'hero_subheading', '{tagline}')}>
                  {'{tagline}'}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Hero Description</label>
              <textarea
                value={data.hero_description}
                onChange={(e) => updateField('hero_description', e.target.value)}
                placeholder="Additional hero section text (optional)"
                className={styles.textarea}
                rows={3}
                id="hero-description-textarea"
              />
              <p className={styles.helpText}>
                Use variables for personalization.
              </p>
            </div>

            <div className={styles.variableButtons}>
              <label className={styles.label}>Insert Variables:</label>
              <div className={styles.buttonGrid}>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{first_name}')}>
                  {'{first_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{last_name}')}>
                  {'{last_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{email}')}>
                  {'{email}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{phone_number}')}>
                  {'{phone_number}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{service_address}')}>
                  {'{service_address}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{city}')}>
                  {'{city}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{state}')}>
                  {'{state}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{zip_code}')}>
                  {'{zip_code}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{display_price}')}>
                  {'{display_price}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{original_price}')}>
                  {'{original_price}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{savings}')}>
                  {'{savings}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{price_amount}')}>
                  {'{price_amount}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{price_frequency}')}>
                  {'{price_frequency}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{company_name}')}>
                  {'{company_name}'}
                </button>
                {servicePlanId && (
                  <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{service_name}')}>
                    {'{service_name}'}
                  </button>
                )}
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{company_phone}')}>
                  {'{company_phone}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{tagline}')}>
                  {'{tagline}'}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Hero Button Text</label>
              <input
                type="text"
                value={data.hero_button_text}
                onChange={(e) => updateField('hero_button_text', e.target.value)}
                placeholder="e.g., Upgrade Today!"
                className={styles.input}
              />
            </div>

            <ImageUploadField
              label="Button Icon (Optional)"
              value={data.hero_button_icon_url || null}
              onChange={(url) => updateField('hero_button_icon_url', url || '')}
              campaignId={campaignId}
              companyId={companyId}
              helpText="Optional badge/icon displayed next to the CTA button (e.g., BBB accreditation, trust badges)"
            />

            <ImagePicker
              label="Hero Image"
              value={data.hero_image_url || null}
              onChange={(url) => updateField('hero_image_url', url || '')}
              campaignId={campaignId}
              companyId={companyId}
              aspectRatio={754/725}
              recommendedWidth={754}
              recommendedHeight={725}
              imageField="hero_image"
            />
          </>
        )}

        {/* Pricing Section */}
        {renderSection(
          'pricing',
          'Pricing Display',
          'How pricing is displayed on the landing page',
          <>
            <div className={styles.field}>
              <label className={styles.label}>
                Display Price <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={data.display_price}
                onChange={(e) => updateField('display_price', e.target.value)}
                placeholder="e.g., $44/mo"
                className={styles.input}
              />
              <p className={styles.helpText}>The main price shown to customers</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Original Price (Optional)</label>
              <input
                type="text"
                value={data.display_original_price}
                onChange={(e) => updateField('display_original_price', e.target.value)}
                placeholder="e.g., $199"
                className={styles.input}
              />
              <p className={styles.helpText}>Shown with strikethrough to highlight savings</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Savings Text (Optional)</label>
              <input
                type="text"
                value={data.display_savings}
                onChange={(e) => updateField('display_savings', e.target.value)}
                placeholder="e.g., 100% off setup fee"
                className={styles.input}
              />
            </div>
          </>
        )}

        {/* Redemption Card Section */}
        {renderSection(
          'redemption',
          'Redemption Card',
          'Customize the offer heading in the redemption card',
          <>
            <div className={styles.field}>
              <label className={styles.label}>Redemption Card Heading</label>
              <textarea
                value={data.redemption_card_heading}
                onChange={(e) => updateField('redemption_card_heading', e.target.value)}
                placeholder="e.g., {original_price} {display_price} Initial Startup Fee* & Only {display_price} Thereafter"
                className={styles.textarea}
                rows={3}
                id="redemption-heading-textarea"
              />
              <p className={styles.helpText}>
                Pricing variables like {'{original_price}'}, {'{display_price}'}, and {'{savings}'}
                will be automatically styled (strikethrough for original price, highlight for display price/savings).
              </p>
            </div>

            <div className={styles.variableButtons}>
              <label className={styles.label}>Insert Variables:</label>
              <div className={styles.buttonGrid}>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{first_name}')}>
                  {'{first_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{last_name}')}>
                  {'{last_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{email}')}>
                  {'{email}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{phone_number}')}>
                  {'{phone_number}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{service_address}')}>
                  {'{service_address}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{city}')}>
                  {'{city}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{state}')}>
                  {'{state}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{zip_code}')}>
                  {'{zip_code}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{display_price}')}>
                  {'{display_price}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{original_price}')}>
                  {'{original_price}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{savings}')}>
                  {'{savings}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{price_amount}')}>
                  {'{price_amount}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{price_frequency}')}>
                  {'{price_frequency}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{company_name}')}>
                  {'{company_name}'}
                </button>
                {servicePlanId && (
                  <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{service_name}')}>
                    {'{service_name}'}
                  </button>
                )}
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{company_phone}')}>
                  {'{company_phone}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{tagline}')}>
                  {'{tagline}'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Letter Section */}
        {renderSection(
          'letter',
          'Personalized Letter',
          'Personal message to the customer',
          <>
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={data.show_letter}
                  onChange={(e) => updateField('show_letter', e.target.checked)}
                />
                <span>Show letter section</span>
              </label>
            </div>

            {data.show_letter && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Letter Content</label>
                  <RichTextEditor
                    ref={letterEditorRef}
                    value={data.letter_content}
                    onChange={(value) => updateField('letter_content', value)}
                    placeholder="Write a personalized message. Use variables for personalization."
                  />
                </div>

                <div className={styles.variableButtons}>
                  <label className={styles.label}>Insert Variables:</label>
                  <div className={styles.buttonGrid}>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{first_name}')}>
                      {'{first_name}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{last_name}')}>
                      {'{last_name}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{email}')}>
                      {'{email}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{phone_number}')}>
                      {'{phone_number}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{service_address}')}>
                      {'{service_address}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{city}')}>
                      {'{city}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{state}')}>
                      {'{state}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{zip_code}')}>
                      {'{zip_code}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{display_price}')}>
                      {'{display_price}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{original_price}')}>
                      {'{original_price}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{savings}')}>
                      {'{savings}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{price_amount}')}>
                      {'{price_amount}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{price_frequency}')}>
                      {'{price_frequency}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{company_name}')}>
                      {'{company_name}'}
                    </button>
                    {servicePlanId && (
                      <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{service_name}')}>
                        {'{service_name}'}
                      </button>
                    )}
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{company_phone}')}>
                      {'{company_phone}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{tagline}')}>
                      {'{tagline}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{signature}')}>
                      {'{signature}'}
                    </button>
                  </div>
                  <p className={styles.helpText}>
                    Click a variable to append it to the letter content. Format with bold, italic, and links using the toolbar above.
                  </p>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Signature Text</label>
                  <input
                    type="text"
                    value={data.letter_signature_text}
                    onChange={(e) => updateField('letter_signature_text', e.target.value)}
                    placeholder="e.g., The Team"
                    className={styles.input}
                  />
                </div>

              </>
            )}
          </>
        )}

        {/* Features Section */}
        {renderSection(
          'features',
          'Features Section',
          'Highlight key features with bullet points',
          <>
            <div className={styles.field}>
              <label className={styles.label}>Features Heading</label>
              <RichTextEditor
                ref={featureHeadingEditorRef}
                value={data.feature_heading}
                onChange={(value) => updateField('feature_heading', value)}
                placeholder="e.g., No initial cost to get started"
              />
            </div>

            <div className={styles.variableButtons}>
              <label className={styles.label}>Insert Variables:</label>
              <div className={styles.buttonGrid}>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{first_name}')}>
                  {'{first_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{last_name}')}>
                  {'{last_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{email}')}>
                  {'{email}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{phone_number}')}>
                  {'{phone_number}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{service_address}')}>
                  {'{service_address}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{city}')}>
                  {'{city}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{state}')}>
                  {'{state}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{zip_code}')}>
                  {'{zip_code}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{display_price}')}>
                  {'{display_price}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{original_price}')}>
                  {'{original_price}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{savings}')}>
                  {'{savings}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{price_amount}')}>
                  {'{price_amount}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{price_frequency}')}>
                  {'{price_frequency}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{company_name}')}>
                  {'{company_name}'}
                </button>
                {servicePlanId && (
                  <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{service_name}')}>
                    {'{service_name}'}
                  </button>
                )}
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{company_phone}')}>
                  {'{company_phone}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{tagline}')}>
                  {'{tagline}'}
                </button>
              </div>
            </div>

            {selectedServicePlan ? (
              <>
                <div className={styles.notice}>
                  <p>
                    <strong>Using features from linked service plan:</strong>{' '}
                    {selectedServicePlan.plan_name}
                  </p>
                  <p className={styles.helpText}>
                    To use custom features instead, unlink the service plan above.
                  </p>
                </div>
                {selectedServicePlan.plan_features && selectedServicePlan.plan_features.length > 0 && (
                  <ul className={styles.previewList}>
                    {selectedServicePlan.plan_features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <DynamicListEditor
                label="Feature Bullets"
                items={data.feature_bullets.map((b) => ({ value: b }))}
                onChange={(items) =>
                  updateField('feature_bullets', items.map((i: any) => i.value))
                }
                fields={featureBulletsFields}
                addButtonText="Add Feature"
                emptyText="No features added yet."
              />
            )}

            <ImagePicker
              label="Features Image (Optional)"
              value={data.feature_image_url || null}
              onChange={(url) => updateField('feature_image_url', url || '')}
              campaignId={campaignId}
              companyId={companyId}
              aspectRatio={4/3}
              recommendedWidth={1516}
              recommendedHeight={1134}
              imageField="features_image"
            />
          </>
        )}

        {/* Additional Services Section */}
        {renderSection(
          'services',
          'Additional Services',
          'List of add-on services offered',
          <>
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={data.show_additional_services}
                  onChange={(e) => updateField('show_additional_services', e.target.checked)}
                />
                <span>Show additional services section</span>
              </label>
            </div>

            {data.show_additional_services && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Services Heading</label>
                  <RichTextEditor
                    ref={additionalServicesHeadingEditorRef}
                    value={data.additional_services_heading}
                    onChange={(value) => updateField('additional_services_heading', value)}
                    placeholder="e.g., And that's not all, we offer additional add-on programs as well including:"
                  />
                </div>

                <div className={styles.variableButtons}>
                  <label className={styles.label}>Insert Variables:</label>
                  <div className={styles.buttonGrid}>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{first_name}')}>
                      {'{first_name}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{last_name}')}>
                      {'{last_name}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{email}')}>
                      {'{email}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{phone_number}')}>
                      {'{phone_number}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{service_address}')}>
                      {'{service_address}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{city}')}>
                      {'{city}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{state}')}>
                      {'{state}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{zip_code}')}>
                      {'{zip_code}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{display_price}')}>
                      {'{display_price}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{original_price}')}>
                      {'{original_price}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{savings}')}>
                      {'{savings}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{price_amount}')}>
                      {'{price_amount}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{price_frequency}')}>
                      {'{price_frequency}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{company_name}')}>
                      {'{company_name}'}
                    </button>
                    {servicePlanId && (
                      <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{service_name}')}>
                        {'{service_name}'}
                      </button>
                    )}
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{company_phone}')}>
                      {'{company_phone}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{tagline}')}>
                      {'{tagline}'}
                    </button>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Additional Service Plans</label>
                  {loadingServicePlans && (
                    <p className={styles.helpText}>Loading service plans…</p>
                  )}
                  {!loadingServicePlans &&
                    availableAdditionalServicePlans.length === 0 && (
                      <p className={styles.helpText}>
                        No additional service plans available.
                      </p>
                    )}
                  {availableAdditionalServicePlans.length > 0 && (
                    <>
                      <div className={styles.addonLimitInfo}>
                        <p className={styles.helpText}>
                          {totalDisplayItemCount} of {MAX_ADDONS} display items used
                          {totalDisplayItemCount >= MAX_ADDONS &&
                            ` (maximum reached)`}
                        </p>
                      </div>
                      <div className={styles.checkboxGrid}>
                        {availableAdditionalServicePlans.map((plan) => {
                          const isSelected = data.selected_service_plan_ids?.includes(plan.id);
                          const isAtLimit = totalDisplayItemCount >= MAX_ADDONS;
                          const isDisabled = !isSelected && isAtLimit;

                          return (
                            <label
                              key={plan.id}
                              className={`${styles.checkboxLabel} ${isDisabled ? styles.disabled : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleServicePlanSelection(plan.id)}
                                disabled={isDisabled}
                              />
                              <div>
                                <div className={styles.addonName}>{plan.plan_name}</div>
                                {plan.plan_description && (
                                  <div className={styles.addonDescription}>
                                    {plan.plan_description}
                                  </div>
                                )}
                                {plan.recurring_price !== null && plan.recurring_price !== undefined && (
                                  <div className={styles.addonPrice}>${plan.recurring_price}</div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Available Add-Ons</label>
                  {!servicePlanId && (
                    <p className={styles.helpText}>
                      Link a service plan to select eligible add-ons.
                    </p>
                  )}
                  {servicePlanId && loadingAddons && (
                    <p className={styles.helpText}>Loading add-ons…</p>
                  )}
                  {servicePlanId && !loadingAddons && availableAddons.length === 0 && (
                    <p className={styles.helpText}>No eligible add-ons for this plan.</p>
                  )}
                  {availableAddons.length > 0 && (
                    <>
                      <div className={styles.addonLimitInfo}>
                        <p className={styles.helpText}>
                          {totalDisplayItemCount} of {MAX_ADDONS} display items used
                          {totalDisplayItemCount >= MAX_ADDONS &&
                            ` (maximum reached)`
                          }
                        </p>
                      </div>
                      <div className={styles.checkboxGrid}>
                        {availableAddons.map((addon) => {
                          const isSelected = data.selected_addon_ids?.includes(addon.id);
                          const isAtLimit = totalDisplayItemCount >= MAX_ADDONS;
                          const isDisabled = !isSelected && isAtLimit;

                          return (
                            <label
                              key={addon.id}
                              className={`${styles.checkboxLabel} ${isDisabled ? styles.disabled : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAddonSelection(addon.id)}
                                disabled={isDisabled}
                              />
                              <div>
                                <div className={styles.addonName}>{addon.addon_name}</div>
                                {addon.addon_description && (
                                  <div className={styles.addonDescription}>{addon.addon_description}</div>
                                )}
                                {addon.recurring_price !== null && (
                                  <div className={styles.addonPrice}>${addon.recurring_price}</div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Custom Display Items</label>
                  <p className={styles.helpText}>
                    Add custom items (e.g., &quot;&amp; So Much More!&quot;) to display alongside service plans and add-ons. Combined total limited to {MAX_ADDONS}.
                  </p>
                  {(() => {
                    const servicePlanCount = data.selected_service_plan_ids?.length || 0;
                    const selectedCount = data.selected_addon_ids?.length || 0;
                    const customCount = data.additional_services?.length || 0;
                    const totalCount = servicePlanCount + selectedCount + customCount;
                    const isAtLimit = totalCount >= MAX_ADDONS;

                    return (
                      <>
                        <div className={styles.customItemInputRow}>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="e.g., & So Much More!"
                            id="custom-item-input"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.currentTarget;
                                const value = input.value.trim();
                                if (!value || isAtLimit) return;
                                const current = data.additional_services || [];
                                updateField('additional_services', [...current, { name: value }]);
                                input.value = '';
                              }
                            }}
                            disabled={isAtLimit}
                          />
                          <button
                            type="button"
                            className={styles.addButton}
                            disabled={isAtLimit}
                            onClick={() => {
                              const input = document.getElementById('custom-item-input') as HTMLInputElement;
                              const value = input?.value.trim();
                              if (!value || isAtLimit) return;
                              const current = data.additional_services || [];
                              updateField('additional_services', [...current, { name: value }]);
                              input.value = '';
                            }}
                          >
                            Add
                          </button>
                        </div>
                        {isAtLimit && (
                          <p className={styles.helpText}>
                            Maximum of {MAX_ADDONS} combined items reached ({servicePlanCount} service plans + {selectedCount} add-ons + {customCount} custom).
                          </p>
                        )}
                        {data.additional_services && data.additional_services.length > 0 && (
                          <div className={styles.customItemsList}>
                            {data.additional_services.map((item, index) => (
                              <div key={index} className={styles.customItemRow}>
                                <span>{item.name}</span>
                                <button
                                  type="button"
                                  className={styles.customItemDelete}
                                  onClick={() => {
                                    const current = [...(data.additional_services || [])];
                                    current.splice(index, 1);
                                    updateField('additional_services', current);
                                  }}
                                  aria-label={`Remove ${item.name}`}
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <ImagePicker
                  label="Services Image (Optional)"
                  value={data.additional_services_image_url || null}
                  onChange={(url) => updateField('additional_services_image_url', url || '')}
                  campaignId={campaignId}
                  companyId={companyId}
                  aspectRatio={4/3}
                  recommendedWidth={1516}
                  recommendedHeight={1134}
                  imageField="additional_services_image"
                />
              </>
            )}
          </>
        )}

        {/* FAQ Section */}
        {renderSection(
          'faq',
          'FAQ Section',
          'Frequently asked questions',
          <>
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={data.show_faq}
                  onChange={(e) => updateField('show_faq', e.target.checked)}
                />
                <span>Show FAQ section</span>
              </label>
            </div>

            {data.show_faq && (
              <>
                {selectedServicePlan ? (
                  <>
                    <div className={styles.notice}>
                      <p>
                        <strong>Using FAQs from linked service plan:</strong>{' '}
                        {selectedServicePlan.plan_name}
                      </p>
                      <p className={styles.helpText}>
                        To use custom FAQs instead, unlink the service plan above.
                      </p>
                    </div>
                    {selectedServicePlan.plan_faqs && selectedServicePlan.plan_faqs.length > 0 && (
                      <div className={styles.previewList}>
                        {selectedServicePlan.plan_faqs.map((faq, idx) => (
                          <div key={idx} className={styles.faqPreview}>
                            <strong>Q: {faq.question}</strong>
                            <p>A: {faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className={styles.field}>
                      <label className={styles.label}>FAQ Heading</label>
                      <input
                        type="text"
                        value={data.faq_heading}
                        onChange={(e) => updateField('faq_heading', e.target.value)}
                        placeholder="e.g., Frequently Asked Questions"
                        className={styles.input}
                        id="faq-heading-input"
                      />
                    </div>

                    <div className={styles.variableButtons}>
                      <label className={styles.label}>Insert Variables:</label>
                      <div className={styles.buttonGrid}>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{first_name}')}>
                          {'{first_name}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{last_name}')}>
                          {'{last_name}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{email}')}>
                          {'{email}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{phone_number}')}>
                          {'{phone_number}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{service_address}')}>
                          {'{service_address}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{city}')}>
                          {'{city}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{state}')}>
                          {'{state}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{zip_code}')}>
                          {'{zip_code}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{display_price}')}>
                          {'{display_price}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{original_price}')}>
                          {'{original_price}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{savings}')}>
                          {'{savings}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{price_amount}')}>
                          {'{price_amount}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{price_frequency}')}>
                          {'{price_frequency}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{company_name}')}>
                          {'{company_name}'}
                        </button>
                        {servicePlanId && (
                          <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{service_name}')}>
                            {'{service_name}'}
                          </button>
                        )}
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{company_phone}')}>
                          {'{company_phone}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{tagline}')}>
                          {'{tagline}'}
                        </button>
                      </div>
                    </div>

                    <DynamicListEditor
                      label="FAQ Items"
                      items={data.faq_items}
                      onChange={(items) => updateField('faq_items', items)}
                      fields={faqItemsFields}
                      addButtonText="Add FAQ"
                      emptyText="No FAQs added yet."
                    />
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Pre-Footer Section */}
        {renderSection(
          'prefooter',
          'Pre-Footer',
          'Rich text section between FAQ and footer',
          <>
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={data.show_pre_footer}
                  onChange={(e) => updateField('show_pre_footer', e.target.checked)}
                />
                <span>Show pre-footer section</span>
              </label>
            </div>

            {data.show_pre_footer && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Pre-Footer Content</label>
                  <RichTextEditor
                    ref={preFooterEditorRef}
                    value={data.pre_footer_content}
                    onChange={(value) => updateField('pre_footer_content', value)}
                    placeholder="Enter pre-footer content (supports rich text and variables)"
                  />
                </div>

                <div className={styles.variableButtons}>
                  <label className={styles.label}>Insert Variables:</label>
                  <div className={styles.buttonGrid}>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{first_name}')}>
                      {'{first_name}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{last_name}')}>
                      {'{last_name}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{email}')}>
                      {'{email}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{phone_number}')}>
                      {'{phone_number}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{service_address}')}>
                      {'{service_address}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{city}')}>
                      {'{city}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{state}')}>
                      {'{state}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{zip_code}')}>
                      {'{zip_code}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{display_price}')}>
                      {'{display_price}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{original_price}')}>
                      {'{original_price}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{savings}')}>
                      {'{savings}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{price_amount}')}>
                      {'{price_amount}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{price_frequency}')}>
                      {'{price_frequency}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{company_name}')}>
                      {'{company_name}'}
                    </button>
                    {servicePlanId && (
                      <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{service_name}')}>
                        {'{service_name}'}
                      </button>
                    )}
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{company_phone}')}>
                      {'{company_phone}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'pre_footer_content', '{tagline}')}>
                      {'{tagline}'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Header Section */}
        {renderSection(
          'header',
          'Header CTAs',
          'Call-to-action buttons in the header',
          <>
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={data.show_header_cta}
                  onChange={(e) => updateField('show_header_cta', e.target.checked)}
                />
                <span>Show header CTA buttons</span>
              </label>
            </div>

            {data.show_header_cta && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Primary Button Text</label>
                  <input
                    type="text"
                    value={data.header_primary_button_text}
                    onChange={(e) => updateField('header_primary_button_text', e.target.value)}
                    placeholder="e.g., Upgrade Now"
                    className={styles.input}
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Footer Section */}
        {renderSection(
          'footer',
          'Footer',
          'Footer tagline and links',
          <>
            <div className={styles.field}>
              <label className={styles.label}>Company Tagline</label>
              <input
                type="text"
                value={data.footer_company_tagline}
                onChange={(e) => updateField('footer_company_tagline', e.target.value)}
                placeholder="e.g., Personal. Urgent. Reliable."
                className={styles.input}
                id="footer-tagline-input"
              />
            </div>

            <div className={styles.variableButtons}>
              <label className={styles.label}>Insert Variables:</label>
              <div className={styles.buttonGrid}>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{first_name}')}>
                  {'{first_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{last_name}')}>
                  {'{last_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{email}')}>
                  {'{email}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{phone_number}')}>
                  {'{phone_number}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{service_address}')}>
                  {'{service_address}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{city}')}>
                  {'{city}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{state}')}>
                  {'{state}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{zip_code}')}>
                  {'{zip_code}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{display_price}')}>
                  {'{display_price}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{original_price}')}>
                  {'{original_price}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{savings}')}>
                  {'{savings}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{price_amount}')}>
                  {'{price_amount}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{price_frequency}')}>
                  {'{price_frequency}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{company_name}')}>
                  {'{company_name}'}
                </button>
                {servicePlanId && (
                  <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{service_name}')}>
                    {'{service_name}'}
                  </button>
                )}
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{company_phone}')}>
                  {'{company_phone}'}
                </button>
              </div>
            </div>

            <DynamicListEditor
              label="Footer Links"
              items={data.footer_links}
              onChange={(items) => updateField('footer_links', items)}
              fields={footerLinksFields}
              addButtonText="Add Link"
              emptyText="No footer links added yet."
            />
          </>
        )}

        {/* Thank You Page Section */}
        {renderSection(
          'thankyou',
          'Thank You Page',
          'Customize the page shown after campaign redemption',
          <>
            {/* Greeting */}
            <div className={styles.field}>
              <label className={styles.label}>Greeting</label>
              <input
                type="text"
                value={data.thankyou_greeting}
                onChange={(e) => updateField('thankyou_greeting', e.target.value)}
                placeholder="e.g., Thanks {first_name}!"
                className={styles.input}
                id="thankyou-greeting-input"
              />
            </div>

            <div className={styles.variableButtons}>
              <label className={styles.label}>Insert Variables:</label>
              <div className={styles.buttonGrid}>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('thankyou-greeting-input', 'thankyou_greeting', '{first_name}')}>
                  {'{first_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('thankyou-greeting-input', 'thankyou_greeting', '{last_name}')}>
                  {'{last_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('thankyou-greeting-input', 'thankyou_greeting', '{company_name}')}>
                  {'{company_name}'}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className={styles.field}>
              <label className={styles.label}>Content (Rich Text)</label>
              <RichTextEditor
                ref={thankyouContentEditorRef}
                value={data.thankyou_content}
                onChange={(html) => updateField('thankyou_content', html)}
                placeholder="Add content to appear below the greeting..."
              />
            </div>

            <div className={styles.variableButtons}>
              <label className={styles.label}>Insert Variables:</label>
              <div className={styles.buttonGrid}>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'thankyou_content', '{first_name}')}>
                  {'{first_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'thankyou_content', '{last_name}')}>
                  {'{last_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'thankyou_content', '{email}')}>
                  {'{email}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'thankyou_content', '{phone_number}')}>
                  {'{phone_number}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'thankyou_content', '{company_name}')}>
                  {'{company_name}'}
                </button>
              </div>
            </div>

            {/* What To Expect Section */}
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={data.thankyou_show_expect}
                  onChange={(e) => updateField('thankyou_show_expect', e.target.checked)}
                />
                <span>Show &quot;What To Expect&quot; section</span>
              </label>
            </div>

            {data.thankyou_show_expect && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Section Heading</label>
                  <input
                    type="text"
                    value={data.thankyou_expect_heading}
                    onChange={(e) => updateField('thankyou_expect_heading', e.target.value)}
                    placeholder="e.g., What To Expect"
                    className={styles.input}
                  />
                </div>

                <p className={styles.helpText}>
                  Configure up to 3 columns. Only columns with a heading or content will be displayed.
                </p>

                {/* Column 1 */}
                <div className={styles.expectColumnEditor}>
                  <h4 className={styles.columnTitle}>Column 1</h4>

                  <ImageUploadField
                    label="Image (Optional)"
                    value={data.thankyou_expect_col1_image || null}
                    onChange={(url) => updateField('thankyou_expect_col1_image', url || '')}
                    campaignId={campaignId}
                    companyId={companyId}
                  />

                  <div className={styles.field}>
                    <label className={styles.label}>Heading</label>
                    <input
                      type="text"
                      value={data.thankyou_expect_col1_heading}
                      onChange={(e) => updateField('thankyou_expect_col1_heading', e.target.value)}
                      placeholder="e.g., We'll Contact You"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Content (Rich Text)</label>
                    <RichTextEditor
                      ref={thankyouCol1EditorRef}
                      value={data.thankyou_expect_col1_content}
                      onChange={(html) => updateField('thankyou_expect_col1_content', html)}
                      placeholder="Add column content..."
                    />
                  </div>

                  <div className={styles.variableButtons}>
                    <label className={styles.label}>Insert Variables:</label>
                    <div className={styles.buttonGrid}>
                      <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'thankyou_expect_col1_content', '{first_name}')}>
                        {'{first_name}'}
                      </button>
                      <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'thankyou_expect_col1_content', '{company_name}')}>
                        {'{company_name}'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className={styles.expectColumnEditor}>
                  <h4 className={styles.columnTitle}>Column 2</h4>

                  <ImageUploadField
                    label="Image (Optional)"
                    value={data.thankyou_expect_col2_image || null}
                    onChange={(url) => updateField('thankyou_expect_col2_image', url || '')}
                    campaignId={campaignId}
                    companyId={companyId}
                  />

                  <div className={styles.field}>
                    <label className={styles.label}>Heading</label>
                    <input
                      type="text"
                      value={data.thankyou_expect_col2_heading}
                      onChange={(e) => updateField('thankyou_expect_col2_heading', e.target.value)}
                      placeholder="e.g., Schedule Your Service"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Content (Rich Text)</label>
                    <RichTextEditor
                      ref={thankyouCol2EditorRef}
                      value={data.thankyou_expect_col2_content}
                      onChange={(html) => updateField('thankyou_expect_col2_content', html)}
                      placeholder="Add column content..."
                    />
                  </div>

                  <div className={styles.variableButtons}>
                    <label className={styles.label}>Insert Variables:</label>
                    <div className={styles.buttonGrid}>
                      <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'thankyou_expect_col2_content', '{first_name}')}>
                        {'{first_name}'}
                      </button>
                      <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'thankyou_expect_col2_content', '{company_name}')}>
                        {'{company_name}'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className={styles.expectColumnEditor}>
                  <h4 className={styles.columnTitle}>Column 3</h4>

                  <ImageUploadField
                    label="Image (Optional)"
                    value={data.thankyou_expect_col3_image || null}
                    onChange={(url) => updateField('thankyou_expect_col3_image', url || '')}
                    campaignId={campaignId}
                    companyId={companyId}
                  />

                  <div className={styles.field}>
                    <label className={styles.label}>Heading</label>
                    <input
                      type="text"
                      value={data.thankyou_expect_col3_heading}
                      onChange={(e) => updateField('thankyou_expect_col3_heading', e.target.value)}
                      placeholder="e.g., Enjoy Peace of Mind"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Content (Rich Text)</label>
                    <RichTextEditor
                      ref={thankyouCol3EditorRef}
                      value={data.thankyou_expect_col3_content}
                      onChange={(html) => updateField('thankyou_expect_col3_content', html)}
                      placeholder="Add column content..."
                    />
                  </div>

                  <div className={styles.variableButtons}>
                    <label className={styles.label}>Insert Variables:</label>
                    <div className={styles.buttonGrid}>
                      <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'thankyou_expect_col3_content', '{first_name}')}>
                        {'{first_name}'}
                      </button>
                      <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'thankyou_expect_col3_content', '{company_name}')}>
                        {'{company_name}'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* CTA Button */}
            <div className={styles.field}>
              <label className={styles.label}>CTA Button Text</label>
              <input
                type="text"
                value={data.thankyou_cta_text}
                onChange={(e) => updateField('thankyou_cta_text', e.target.value)}
                placeholder="e.g., Go Back To Homepage"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>CTA Button URL (Optional)</label>
              <input
                type="url"
                value={data.thankyou_cta_url}
                onChange={(e) => updateField('thankyou_cta_url', e.target.value)}
                placeholder="Leave empty to use company website"
                className={styles.input}
              />
              <p className={styles.helpText}>
                If left empty, the button will link to your company&apos;s website.
              </p>
            </div>
          </>
        )}

        {/* Branding Overrides */}
        {renderSection(
          'branding',
          'Brand Overrides (Optional)',
          'Override company branding for this specific campaign',
          <>
            <p className={styles.helpText}>
              Leave these fields empty to use the company&apos;s default branding settings.
            </p>

            <ImageUploadField
              label="Logo Override"
              value={data.override_logo_url || null}
              onChange={(url) => updateField('override_logo_url', url || '')}
              campaignId={campaignId}
              companyId={companyId}
              helpText="Override the company logo for this campaign only"
            />

            <div className={styles.field}>
              <label className={styles.label}>Primary Color Override</label>
              <div className={styles.colorInput}>
                <input
                  type="color"
                  value={primaryColorFallback}
                  onChange={(e) => updateField('override_primary_color', e.target.value)}
                  className={styles.colorPicker}
                />
                <input
                  type="text"
                  value={data.override_primary_color}
                  onChange={(e) => updateField('override_primary_color', e.target.value)}
                  placeholder={brandDefaults.primaryColorHex || '#00529B'}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Secondary Color Override</label>
              <div className={styles.colorInput}>
                <input
                  type="color"
                  value={secondaryColorFallback}
                  onChange={(e) => updateField('override_secondary_color', e.target.value)}
                  className={styles.colorPicker}
                />
                <input
                  type="text"
                  value={data.override_secondary_color}
                  onChange={(e) => updateField('override_secondary_color', e.target.value)}
                  placeholder={brandDefaults.secondaryColorHex || '#00B142'}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Accent Color Preference</label>
              <select
                value={data.accent_color_preference}
                onChange={(e) => updateField('accent_color_preference', e.target.value as 'primary' | 'secondary')}
                className={styles.input}
              >
                <option value="primary">Primary Color (default)</option>
                <option value="secondary">Secondary Color</option>
              </select>
              <p className={styles.helpText}>
                Choose which brand color to use for interactive elements like buttons, links,
                and highlights. This affects hero badge, price highlights, CTA buttons,
                feature icons, and phone links throughout the landing page.
              </p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Phone Number Override</label>
              <input
                type="tel"
                value={data.override_phone}
                onChange={(e) => updateField('override_phone', e.target.value)}
                placeholder="e.g., (888) 888-8888"
                className={styles.input}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
