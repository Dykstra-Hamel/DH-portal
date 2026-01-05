'use client';

/**
 * Edit Landing Page Modal Component
 *
 * Modal for editing existing landing page data
 * Fetches current data, allows editing, and saves via PUT endpoint
 */

import { useState, useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import styles from './EditLandingPageModal.module.scss';
import CampaignLandingPageEditorStep, {
  LandingPageFormData,
} from '../CampaignLandingPageEditorStep/CampaignLandingPageEditorStep';

interface EditLandingPageModalProps {
  campaign: {
    id: string;
    company_id: string;
    service_plan_id: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditLandingPageModal({
  campaign,
  isOpen,
  onClose,
  onSuccess,
}: EditLandingPageModalProps) {
  const [formData, setFormData] = useState<LandingPageFormData>({
    hero_title: '',
    hero_subtitle: '',
    hero_description: '',
    hero_button_text: '',
    hero_button_icon_url: '',
    hero_image_url: '',
    display_price: '',
    display_original_price: '',
    display_savings: '',
    show_letter: true,
    letter_content: '',
    letter_signature_text: '',
    letter_image_url: '',
    feature_heading: '',
    feature_bullets: [],
    feature_image_url: '',
    show_additional_services: true,
    additional_services_heading: '',
    additional_services: [],
    additional_services_image_url: '',
    selected_addon_ids: [],
    show_faq: true,
    faq_heading: '',
    faq_items: [],
    header_primary_button_text: '',
    header_secondary_button_text: '',
    show_header_cta: true,
    footer_company_tagline: '',
    footer_links: [],
    terms_content: '',
    redemption_card_heading: '',
    override_logo_url: '',
    override_primary_color: '',
    override_secondary_color: '',
    override_phone: '',
    accent_color_preference: 'primary',
    thankyou_greeting: '',
    thankyou_content: '',
    thankyou_show_expect: false,
    thankyou_expect_heading: '',
    thankyou_expect_col1_image: '',
    thankyou_expect_col1_heading: '',
    thankyou_expect_col1_content: '',
    thankyou_expect_col2_image: '',
    thankyou_expect_col2_heading: '',
    thankyou_expect_col2_content: '',
    thankyou_expect_col3_image: '',
    thankyou_expect_col3_heading: '',
    thankyou_expect_col3_content: '',
    thankyou_cta_text: '',
    thankyou_cta_url: '',
  });

  const [servicePlanId, setServicePlanId] = useState<string | null>(
    campaign.service_plan_id
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing landing page data
  useEffect(() => {
    if (isOpen && campaign.id) {
      fetchLandingPageData();
    }
  }, [isOpen, campaign.id]);

  const fetchLandingPageData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/landing-page`);

      if (!response.ok) {
        if (response.status === 404) {
          // No landing page exists yet, use defaults
          setFormData({
            hero_title: 'Quarterly Pest Control starting at only $44/mo',
            hero_subtitle: 'Special Offer',
            hero_description: '',
            hero_button_text: 'Upgrade Today!',
            hero_image_url: '',
            hero_button_icon_url: '',
            display_price: '$44/mo',
            display_original_price: '',
            display_savings: '',
            show_letter: true,
            letter_content: '',
            letter_signature_text: 'The Team',
            letter_image_url: '',
            feature_heading: 'No initial cost to get started',
            feature_bullets: [],
            feature_image_url: '',
            show_additional_services: true,
            additional_services_heading:
              'And thats not all, we offer additional add-on programs as well including:',
            additional_services: [],
            additional_services_image_url: '',
            selected_addon_ids: [],
            show_faq: true,
            faq_heading: 'Frequently Asked Questions',
            faq_items: [],
            header_primary_button_text: 'Upgrade Now',
            header_secondary_button_text: 'Call (888) 888-8888',
            show_header_cta: true,
            footer_company_tagline: 'Personal. Urgent. Reliable.',
            footer_links: [],
            terms_content: '',
            redemption_card_heading: '',
            override_logo_url: '',
            override_primary_color: '',
            override_secondary_color: '',
            override_phone: '',
            accent_color_preference: 'primary',
            thankyou_greeting: 'Thank you, {first_name}!',
            thankyou_content: '<p>Your request has been received and we&apos;ll be in touch soon.</p>',
            thankyou_show_expect: true,
            thankyou_expect_heading: 'What to Expect Next',
            thankyou_expect_col1_image: '',
            thankyou_expect_col1_heading: 'Confirmation',
            thankyou_expect_col1_content: '<p>You&apos;ll receive a confirmation email shortly.</p>',
            thankyou_expect_col2_image: '',
            thankyou_expect_col2_heading: 'Contact',
            thankyou_expect_col2_content: '<p>Our team will reach out to schedule your service.</p>',
            thankyou_expect_col3_image: '',
            thankyou_expect_col3_heading: 'Service',
            thankyou_expect_col3_content: '<p>We&apos;ll provide exceptional service at your scheduled time.</p>',
            thankyou_cta_text: 'Visit Our Website',
            thankyou_cta_url: '',
          });
          return;
        }
        throw new Error('Failed to fetch landing page data');
      }

      const responseData = await response.json();
      const apiData = responseData.data;

      // Map API response to form data structure
      const mappedData: LandingPageFormData = {
        // Hero
        hero_title: apiData.landingPage.hero.title || '',
        hero_subtitle: apiData.landingPage.hero.subtitle || '',
        hero_description: apiData.landingPage.hero.description || '',
        hero_button_text: apiData.landingPage.hero.buttonText || '',
        hero_image_url: apiData.landingPage.hero.imageUrl || '',
        hero_button_icon_url: apiData.landingPage.hero.buttonIconUrl || '',

        // Pricing
        display_price: apiData.landingPage.pricing.displayPrice || '',
        display_original_price: apiData.landingPage.pricing.originalPrice || '',
        display_savings: apiData.landingPage.pricing.savings || '',

        // Letter
        show_letter: apiData.landingPage.letter.show ?? true,
        letter_content: apiData.landingPage.letter.content || '',
        letter_signature_text: apiData.landingPage.letter.signatureText || '',
        letter_image_url: apiData.landingPage.letter.imageUrl || '',

        // Features
        feature_heading: apiData.landingPage.features.heading || '',
        feature_bullets: apiData.landingPage.features.bullets || [],
        feature_image_url: apiData.landingPage.features.imageUrl || '',

        // Additional Services
        show_additional_services: apiData.landingPage.additionalServices.show ?? true,
        additional_services_heading: apiData.landingPage.additionalServices.heading || '',
        additional_services: apiData.landingPage.additionalServices.services || [],
        additional_services_image_url: apiData.landingPage.additionalServices.imageUrl || '',
        selected_addon_ids:
          apiData.landingPage.selectedAddonIds && apiData.landingPage.selectedAddonIds.length > 0
            ? apiData.landingPage.selectedAddonIds
            : (apiData.landingPage.addons || []).map((addon: any) => addon.id),

        // FAQ
        show_faq: apiData.landingPage.faq.show ?? true,
        faq_heading: apiData.landingPage.faq.heading || '',
        faq_items: apiData.landingPage.faq.serviceFaqs || [],

        // Header
        show_header_cta: apiData.landingPage.header.showCta ?? true,
        header_primary_button_text: apiData.landingPage.header.primaryButtonText || '',
        header_secondary_button_text: apiData.landingPage.header.secondaryButtonText || '',

        // Footer
        footer_company_tagline: apiData.landingPage.footer.tagline || '',
        footer_links: apiData.landingPage.footer.links || [],

        // Terms
        terms_content: apiData.landingPage.terms.content || '',

        // Redemption Card
        redemption_card_heading: apiData.landingPage.redemptionCard?.heading || '',

        // Branding overrides
        override_logo_url: apiData.landingPage.branding.logoUrl || '',
        override_primary_color: apiData.landingPage.branding.primaryColor || '',
        override_secondary_color: apiData.landingPage.branding.secondaryColor || '',
        override_phone: apiData.landingPage.branding.phoneNumber || '',
        accent_color_preference: apiData.landingPage.branding.accentColorPreference || 'primary',

        // Thank You Page
        thankyou_greeting: apiData.landingPage.thankYou?.greeting || 'Thank you, {first_name}!',
        thankyou_content: apiData.landingPage.thankYou?.content || '<p>Your request has been received and we&apos;ll be in touch soon.</p>',
        thankyou_show_expect: apiData.landingPage.thankYou?.showExpect ?? true,
        thankyou_expect_heading: apiData.landingPage.thankYou?.expectHeading || 'What to Expect Next',
        thankyou_expect_col1_image: apiData.landingPage.thankYou?.expectColumns?.[0]?.imageUrl || '',
        thankyou_expect_col1_heading: apiData.landingPage.thankYou?.expectColumns?.[0]?.heading || '',
        thankyou_expect_col1_content: apiData.landingPage.thankYou?.expectColumns?.[0]?.content || '',
        thankyou_expect_col2_image: apiData.landingPage.thankYou?.expectColumns?.[1]?.imageUrl || '',
        thankyou_expect_col2_heading: apiData.landingPage.thankYou?.expectColumns?.[1]?.heading || '',
        thankyou_expect_col2_content: apiData.landingPage.thankYou?.expectColumns?.[1]?.content || '',
        thankyou_expect_col3_image: apiData.landingPage.thankYou?.expectColumns?.[2]?.imageUrl || '',
        thankyou_expect_col3_heading: apiData.landingPage.thankYou?.expectColumns?.[2]?.heading || '',
        thankyou_expect_col3_content: apiData.landingPage.thankYou?.expectColumns?.[2]?.content || '',
        thankyou_cta_text: apiData.landingPage.thankYou?.ctaText || 'Visit Our Website',
        thankyou_cta_url: apiData.landingPage.thankYou?.ctaUrl || '',
      };

      setFormData(mappedData);
      setServicePlanId(apiData.campaign.service_plan_id);
    } catch (err) {
      console.error('Error fetching landing page data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load landing page data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/landing-page`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          service_plan_id: servicePlanId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update landing page');
      }

      onSuccess(); // Refresh parent data
      onClose();
    } catch (err) {
      console.error('Error saving landing page:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // Open preview in new tab with special "preview" customerId
    // This triggers admin preview mode in the API
    const previewUrl = `/campaign/${campaign.id}/preview`;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Edit Landing Page</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalContent}>
          {error && (
            <div className={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading landing page data...</p>
            </div>
          ) : (
            <CampaignLandingPageEditorStep
              campaignId={campaign.id}
              companyId={campaign.company_id}
              data={formData}
              onChange={setFormData}
              servicePlanId={servicePlanId}
              onServicePlanChange={setServicePlanId}
            />
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className={styles.previewButton}
            onClick={handlePreview}
            disabled={loading}
            title="Preview saved landing page"
          >
            <Eye size={16} />
            Preview
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
