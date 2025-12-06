/**
 * Campaign Landing Page Editor Step
 *
 * Form for editing all landing page customization fields
 */

'use client';

import { useState, useEffect } from 'react';
import styles from './CampaignLandingPageEditorStep.module.scss';
import ImageUploadField from '../ImageUploadField/ImageUploadField';
import DynamicListEditor, { FieldConfig } from '../DynamicListEditor/DynamicListEditor';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';
import { createClient } from '@/lib/supabase/client';

export interface LandingPageFormData {
  // Hero
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_button_text: string;
  hero_image_url: string; // Changed from hero_image_urls array to single image

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
    new Set(['serviceplan', 'hero', 'pricing'])
  );
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([]);
  const [selectedServicePlan, setSelectedServicePlan] = useState<ServicePlan | null>(null);
  const [loadingServicePlans, setLoadingServicePlans] = useState(true);

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
  }, [servicePlanId, servicePlans]);

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

  const additionalServicesFields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Service Name',
      type: 'text',
      placeholder: 'e.g., Weed Control Services',
      required: true,
    },
    {
      name: 'description',
      label: 'Description (Optional)',
      type: 'textarea',
      placeholder: 'Brief description of the service',
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
              />
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
              />
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
                    value={data.letter_content}
                    onChange={(value) => updateField('letter_content', value)}
                    placeholder="Write a personalized message. Use {customer_first_name} for personalization."
                  />
                  <p className={styles.helpText}>
                    Available placeholders: {'{customer_first_name}'}, {'{customer_last_name}'},
                    {'{service_address}'}, {'{city}'}, {'{state}'}, {'{signature}'}
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
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Features Heading</label>
                  <input
                    type="text"
                    value={data.feature_heading}
                    onChange={(e) => updateField('feature_heading', e.target.value)}
                    placeholder="e.g., No initial cost to get started"
                    className={styles.input}
                  />
                </div>

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
              </>
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
                  />
                </div>

                <DynamicListEditor
                  label="Services"
                  items={data.additional_services}
                  onChange={(items) => updateField('additional_services', items)}
                  fields={additionalServicesFields}
                  addButtonText="Add Service"
                  emptyText="No services added yet."
                />

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
                      />
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

                <div className={styles.field}>
                  <label className={styles.label}>Secondary Button Text</label>
                  <input
                    type="text"
                    value={data.header_secondary_button_text}
                    onChange={(e) => updateField('header_secondary_button_text', e.target.value)}
                    placeholder="e.g., Call (888) 888-8888"
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
              />
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
