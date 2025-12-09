/**
 * Campaign Landing Page Editor Step
 *
 * Form for editing all landing page customization fields
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './CampaignLandingPageEditorStep.module.scss';
import ImageUploadField from '../ImageUploadField/ImageUploadField';
import DynamicListEditor, { FieldConfig } from '../DynamicListEditor/DynamicListEditor';
import RichTextEditor, { RichTextEditorHandle } from '@/components/Common/RichTextEditor/RichTextEditor';
import { createClient } from '@/lib/supabase/client';

export interface LandingPageFormData {
  // Hero
  hero_title: string;
  hero_subtitle: string;
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
  selected_addon_ids: string[];

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
  | 'header'
  | 'footer'
  | 'terms'
  | 'branding';

interface ServicePlan {
  id: string;
  plan_name: string;
  plan_faqs?: Array<{ question: string; answer: string }>;
  plan_features?: string[];
}

interface AddOn {
  id: string;
  addon_name: string;
  addon_description: string | null;
  recurring_price: number | null;
}

export default function CampaignLandingPageEditorStep({
  campaignId,
  companyId,
  data,
  onChange,
  servicePlanId,
  onServicePlanChange,
}: CampaignLandingPageEditorStepProps) {
  const supabase = createClient();
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(['serviceplan', 'hero', 'pricing', 'redemption'])
  );
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([]);
  const [selectedServicePlan, setSelectedServicePlan] = useState<ServicePlan | null>(null);
  const [loadingServicePlans, setLoadingServicePlans] = useState(true);
  const letterEditorRef = useRef<RichTextEditorHandle | null>(null);
  const [availableAddons, setAvailableAddons] = useState<AddOn[]>([]);
  const [loadingAddons, setLoadingAddons] = useState(false);
  const selectionInitializedRef = useRef(false);

  // Fetch available service plans for this company
  useEffect(() => {
    const fetchServicePlans = async () => {
      try {
        setLoadingServicePlans(true);
        const { data: plans, error } = await supabase
          .from('service_plans')
          .select('id, plan_name, plan_faqs, plan_features')
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
    const fetchAddons = async () => {
      if (!servicePlanId) {
        setAvailableAddons([]);
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
      }
    };

    fetchAddons();
  }, [servicePlanId, companyId, supabase]);

  // Ensure selected add-ons stay in sync with available options
  useEffect(() => {
    const availableIds = availableAddons.map((addon) => addon.id);
    const currentSelected = data.selected_addon_ids || [];

    // Initialize selection when add-ons load or plan changes
    if (!selectionInitializedRef.current) {
      const initialSelection =
        currentSelected.length > 0
          ? currentSelected.filter((id) => availableIds.includes(id))
          : availableIds;

      selectionInitializedRef.current = true;

      if (initialSelection.join('|') !== currentSelected.join('|')) {
        updateField('selected_addon_ids', initialSelection);
      }
      return;
    }

    // After initialization, only prune invalid selections
    const filteredSelection = currentSelected.filter((id) =>
      availableIds.includes(id)
    );

    if (filteredSelection.length !== currentSelected.length) {
      updateField('selected_addon_ids', filteredSelection);
    }
  }, [availableAddons]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const toggleAddonSelection = (addonId: string) => {
    const current = data.selected_addon_ids || [];
    const next = current.includes(addonId)
      ? current.filter((id) => id !== addonId)
      : [...current, addonId];
    updateField('selected_addon_ids', next);
  };

  const insertVariableIntoField = (textareaId: string, fieldName: keyof LandingPageFormData, variable: string) => {
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
              <label className={styles.label}>
                Hero Title <span className={styles.required}>*</span>
              </label>
              <textarea
                value={data.hero_title}
                onChange={(e) => updateField('hero_title', e.target.value)}
                placeholder="e.g., Quarterly Pest Control starting at only $44/mo"
                className={styles.textarea}
                rows={2}
                id="hero-title-textarea"
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
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{service_name}')}>
                  {'{service_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-title-textarea', 'hero_title', '{company_phone}')}>
                  {'{company_phone}'}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Hero Subtitle</label>
              <input
                type="text"
                value={data.hero_subtitle}
                onChange={(e) => updateField('hero_subtitle', e.target.value)}
                placeholder="e.g., Special Offer"
                className={styles.input}
              />
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
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{service_name}')}>
                  {'{service_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('hero-description-textarea', 'hero_description', '{company_phone}')}>
                  {'{company_phone}'}
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

            <ImageUploadField
              label="Hero Image"
              value={data.hero_image_url || null}
              onChange={(url) => updateField('hero_image_url', url || '')}
              campaignId={campaignId}
              companyId={companyId}
              helpText="Single hero image displayed on the landing page"
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
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{service_name}')}>
                  {'{service_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('redemption-heading-textarea', 'redemption_card_heading', '{company_phone}')}>
                  {'{company_phone}'}
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
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{service_name}')}>
                      {'{service_name}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('', 'letter_content', '{company_phone}')}>
                      {'{company_phone}'}
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

                <ImageUploadField
                  label="Letter Image (Optional)"
                  value={data.letter_image_url || null}
                  onChange={(url) => updateField('letter_image_url', url || '')}
                  campaignId={campaignId}
                  companyId={companyId}
                />
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
              <input
                type="text"
                value={data.feature_heading}
                onChange={(e) => updateField('feature_heading', e.target.value)}
                placeholder="e.g., No initial cost to get started"
                className={styles.input}
                id="feature-heading-input"
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
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{service_name}')}>
                  {'{service_name}'}
                </button>
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('feature-heading-input', 'feature_heading', '{company_phone}')}>
                  {'{company_phone}'}
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

            <ImageUploadField
              label="Features Image (Optional)"
              value={data.feature_image_url || null}
              onChange={(url) => updateField('feature_image_url', url || '')}
              campaignId={campaignId}
              companyId={companyId}
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
                  <input
                    type="text"
                    value={data.additional_services_heading}
                    onChange={(e) => updateField('additional_services_heading', e.target.value)}
                    placeholder="e.g., And that's not all, we offer additional add-on programs as well including:"
                    className={styles.input}
                    id="services-heading-input"
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
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{service_name}')}>
                      {'{service_name}'}
                    </button>
                    <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('services-heading-input', 'additional_services_heading', '{company_phone}')}>
                      {'{company_phone}'}
                    </button>
                  </div>
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
                    <div className={styles.checkboxGrid}>
                      {availableAddons.map((addon) => (
                        <label key={addon.id} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={data.selected_addon_ids?.includes(addon.id)}
                            onChange={() => toggleAddonSelection(addon.id)}
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
                      ))}
                    </div>
                  )}
                </div>

                <ImageUploadField
                  label="Services Image (Optional)"
                  value={data.additional_services_image_url || null}
                  onChange={(url) => updateField('additional_services_image_url', url || '')}
                  campaignId={campaignId}
                  companyId={companyId}
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
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{service_name}')}>
                          {'{service_name}'}
                        </button>
                        <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('faq-heading-input', 'faq_heading', '{company_phone}')}>
                          {'{company_phone}'}
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
                <button type="button" className={styles.variableButton} onClick={() => insertVariableIntoField('footer-tagline-input', 'footer_company_tagline', '{service_name}')}>
                  {'{service_name}'}
                </button>
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

        {/* Terms Section */}
        {renderSection(
          'terms',
          'Terms & Conditions',
          'Legal terms shown in the redemption modal',
          <>
            <div className={styles.field}>
              <label className={styles.label}>Terms Content</label>
              <textarea
                value={data.terms_content}
                onChange={(e) => updateField('terms_content', e.target.value)}
                placeholder="Enter the terms and conditions text"
                className={styles.textarea}
                rows={8}
              />
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
                  value={data.override_primary_color || '#00529B'}
                  onChange={(e) => updateField('override_primary_color', e.target.value)}
                  className={styles.colorPicker}
                />
                <input
                  type="text"
                  value={data.override_primary_color}
                  onChange={(e) => updateField('override_primary_color', e.target.value)}
                  placeholder="#00529B"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Secondary Color Override</label>
              <div className={styles.colorInput}>
                <input
                  type="color"
                  value={data.override_secondary_color || '#00B142'}
                  onChange={(e) => updateField('override_secondary_color', e.target.value)}
                  className={styles.colorPicker}
                />
                <input
                  type="text"
                  value={data.override_secondary_color}
                  onChange={(e) => updateField('override_secondary_color', e.target.value)}
                  placeholder="#00B142"
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
