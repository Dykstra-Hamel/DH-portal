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
