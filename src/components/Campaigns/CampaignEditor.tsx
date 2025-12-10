'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Plus } from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import styles from './CampaignEditor.module.scss';

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);
import WorkflowSelector from './WorkflowSelector';
import ContactListUpload from './ContactListUpload';
import DiscountModal from '@/components/Admin/DiscountModal';
import CampaignSchedulePreview from './CampaignSchedulePreview';
import CampaignLandingPageEditorStep, {
  LandingPageFormData,
} from './CampaignLandingPageEditorStep/CampaignLandingPageEditorStep';

interface CampaignEditorProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  campaign?: any; // For editing existing campaigns
  isCloned?: boolean; // True when campaign was just cloned
  onSuccess: () => void;
}

type Step = 'basic' | 'workflow' | 'contacts' | 'landing-page' | 'review';

export default function CampaignEditor({
  isOpen,
  onClose,
  companyId,
  campaign,
  isCloned = false,
  onSuccess,
}: CampaignEditorProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyTimezone, setCompanyTimezone] =
    useState<string>('America/New_York');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_id: '',
    discount_id: '',
    start_datetime: '',
    workflow_id: '',
    daily_limit: 500,
    respect_business_hours: true,
  });

  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [campaignIdValidating, setCampaignIdValidating] = useState(false);
  const [campaignIdAvailable, setCampaignIdAvailable] = useState<
    boolean | null
  >(null);
  const [campaignNameValidating, setCampaignNameValidating] = useState(false);
  const [campaignNameAvailable, setCampaignNameAvailable] = useState<
    boolean | null
  >(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [estimatedDays, setEstimatedDays] = useState<number | null>(null);
  const [schedulePreview, setSchedulePreview] = useState<any>(null);

  // Landing page state
  const [landingPageEnabled, setLandingPageEnabled] = useState(false);
  const [servicePlanId, setServicePlanId] = useState<string | null>(null);
  const [landingPageData, setLandingPageData] = useState<LandingPageFormData>({
    hero_title: 'Quarterly Pest Control starting at only $44/mo',
    hero_subtitle: 'Special Offer',
    hero_description: '',
    hero_button_text: 'Upgrade Today!',
    hero_button_icon_url: '',
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
    thankyou_greeting: 'Thanks {first_name}!',
    thankyou_content: '',
    thankyou_show_expect: true,
    thankyou_expect_heading: 'What To Expect',
    thankyou_expect_col1_image: '',
    thankyou_expect_col1_heading: '',
    thankyou_expect_col1_content: '',
    thankyou_expect_col2_image: '',
    thankyou_expect_col2_heading: '',
    thankyou_expect_col2_content: '',
    thankyou_expect_col3_image: '',
    thankyou_expect_col3_heading: '',
    thankyou_expect_col3_content: '',
    thankyou_cta_text: 'Go Back To Homepage',
    thankyou_cta_url: '',
  });

  // Fetch company data on mount
  useEffect(() => {
    if (companyId && isOpen) {
      fetchCompanyTimezone();
      fetchDiscounts();
    }
  }, [companyId, isOpen]);

  const fetchCompanyTimezone = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/settings`);
      const result = await response.json();

      if (result.success && result.settings) {
        const tzSetting = result.settings.find(
          (s: any) => s.setting_key === 'company_timezone'
        );
        if (tzSetting) {
          setCompanyTimezone(tzSetting.setting_value || 'America/New_York');
        }
      }
    } catch (error) {
      console.error('Error fetching company timezone:', error);
      // Keep default timezone if fetch fails
    }
  };

  const fetchDiscounts = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/discounts`);
      const result = await response.json();
      if (result.success) {
        setDiscounts(result.discounts || []);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  };

  const handleDiscountCreated = async () => {
    // Refresh discounts list
    await fetchDiscounts();
    setShowDiscountModal(false);

    // Note: We can't auto-select the newly created discount without knowing its ID
    // The DiscountModal would need to return the created discount ID in its onSave callback
  };

  const validateCampaignId = async (campaignId: string) => {
    if (!campaignId.trim()) {
      setCampaignIdAvailable(null);
      return;
    }

    setCampaignIdValidating(true);
    try {
      const response = await fetch('/api/campaigns/validate-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          exclude_campaign_id: campaign?.id,
        }),
      });

      const result = await response.json();
      setCampaignIdAvailable(result.available);
    } catch (error) {
      console.error('Error validating campaign ID:', error);
      setCampaignIdAvailable(null);
    } finally {
      setCampaignIdValidating(false);
    }
  };

  const validateCampaignName = async (name: string) => {
    if (!name.trim()) {
      setCampaignNameAvailable(null);
      return;
    }

    setCampaignNameValidating(true);
    try {
      const response = await fetch('/api/campaigns/validate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company_id: companyId,
          exclude_campaign_id: campaign?.id,
        }),
      });

      const result = await response.json();
      setCampaignNameAvailable(result.available);
    } catch (error) {
      console.error('Error validating campaign name:', error);
      setCampaignNameAvailable(null);
    } finally {
      setCampaignNameValidating(false);
    }
  };

  const fetchLandingPageData = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/landing-page`);
      const result = await response.json();

      if (result.success && result.data?.landingPage) {
        const lp = result.data.landingPage;

        // Enable landing page if data exists
        setLandingPageEnabled(true);

        // Set service plan ID
        if (result.data.campaign?.service_plan_id) {
          setServicePlanId(result.data.campaign.service_plan_id);
        }

        // Map API response to form data
        setLandingPageData({
          hero_title:
            lp.hero.title || 'Quarterly Pest Control starting at only $44/mo',
          hero_subtitle: lp.hero.subtitle || 'Special Offer',
          hero_description: lp.hero.description || '',
          hero_button_text: lp.hero.buttonText || 'Upgrade Today!',
          hero_button_icon_url: lp.hero.buttonIconUrl || '',
          hero_image_url: lp.hero.imageUrl || '',
          display_price: lp.pricing.displayPrice || '$44/mo',
          display_original_price: lp.pricing.originalPrice || '',
          display_savings: lp.pricing.savings || '',
          show_letter: lp.letter.show,
          letter_content: lp.letter.content || '',
          letter_signature_text: lp.letter.signatureText || 'The Team',
          letter_image_url: lp.letter.imageUrl || '',
          feature_heading:
            lp.features.heading || 'No initial cost to get started',
        feature_bullets: lp.features.bullets || [],
        feature_image_url: lp.features.imageUrl || '',
        show_additional_services: lp.additionalServices.show,
        additional_services_heading:
          lp.additionalServices.heading ||
            'And thats not all, we offer additional add-on programs as well including:',
        additional_services: lp.additionalServices.services || [],
        additional_services_image_url: lp.additionalServices.imageUrl || '',
        selected_addon_ids:
          lp.selectedAddonIds && lp.selectedAddonIds.length > 0
            ? lp.selectedAddonIds
            : (lp.addons || []).map((addon: any) => addon.id),
          show_faq: lp.faq.show,
          faq_heading: lp.faq.heading || 'Frequently Asked Questions',
          faq_items: lp.faq.items || [],
          header_primary_button_text:
            lp.header.primaryButtonText || 'Upgrade Now',
          header_secondary_button_text:
            lp.header.secondaryButtonText || 'Call (888) 888-8888',
          show_header_cta: lp.header.showCta,
          footer_company_tagline:
            lp.footer.tagline || 'Personal. Urgent. Reliable.',
          footer_links: lp.footer.links || [],
          terms_content: lp.terms.content || '',
          redemption_card_heading: lp.redemptionCard?.heading || '',
          override_logo_url: lp.branding.logoUrl || '',
          override_primary_color: lp.branding.primaryColor || '',
          override_secondary_color: lp.branding.secondaryColor || '',
          override_phone: lp.branding.phoneNumber || '',
          accent_color_preference:
            lp.branding.accentColorPreference || 'primary',
          thankyou_greeting: lp.thankYou?.greeting || 'Thanks {first_name}!',
          thankyou_content: lp.thankYou?.content || '',
          thankyou_show_expect: lp.thankYou?.showExpect ?? true,
          thankyou_expect_heading: lp.thankYou?.expectHeading || 'What To Expect',
          thankyou_expect_col1_image: lp.thankYou?.expectColumns?.[0]?.imageUrl || '',
          thankyou_expect_col1_heading: lp.thankYou?.expectColumns?.[0]?.heading || '',
          thankyou_expect_col1_content: lp.thankYou?.expectColumns?.[0]?.content || '',
          thankyou_expect_col2_image: lp.thankYou?.expectColumns?.[1]?.imageUrl || '',
          thankyou_expect_col2_heading: lp.thankYou?.expectColumns?.[1]?.heading || '',
          thankyou_expect_col2_content: lp.thankYou?.expectColumns?.[1]?.content || '',
          thankyou_expect_col3_image: lp.thankYou?.expectColumns?.[2]?.imageUrl || '',
          thankyou_expect_col3_heading: lp.thankYou?.expectColumns?.[2]?.heading || '',
          thankyou_expect_col3_content: lp.thankYou?.expectColumns?.[2]?.content || '',
          thankyou_cta_text: lp.thankYou?.ctaText || 'Go Back To Homepage',
          thankyou_cta_url: lp.thankYou?.ctaUrl || '',
        });
      }
    } catch (error) {
      console.error('Error fetching landing page data:', error);
      // Don't throw - landing page is optional
    }
  };

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        campaign_id: campaign.campaign_id || '',
        discount_id: campaign.discount_id || '',
        start_datetime: campaign.start_datetime || '',
        workflow_id: campaign.workflow_id || '',
        daily_limit: campaign.daily_limit || 500,
        respect_business_hours: campaign.respect_business_hours ?? true,
      });
      setSelectedWorkflow(campaign.workflow);
      setEstimatedDays(campaign.estimated_days || null);
      setServicePlanId(campaign.service_plan_id || null);
      // Mark campaign ID and name as available if editing existing campaign
      if (campaign.campaign_id) {
        setCampaignIdAvailable(true);
      }
      if (campaign.name) {
        setCampaignNameAvailable(true);
      }

      // Fetch landing page data if campaign exists
      if (campaign.campaign_id) {
        fetchLandingPageData(campaign.campaign_id);
      }
    }
  }, [campaign]);

  // Debounced validation for campaign name
  useEffect(() => {
    if (!formData.name.trim()) {
      setCampaignNameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      validateCampaignName(formData.name);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name]);

  // Debounced validation for campaign ID
  useEffect(() => {
    if (!formData.campaign_id.trim()) {
      setCampaignIdAvailable(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      validateCampaignId(formData.campaign_id);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.campaign_id]);

  // Calculate estimated days when contacts or daily limit changes
  useEffect(() => {
    if (totalContacts > 0 && formData.daily_limit > 0) {
      // Simple estimation (backend will calculate more accurately with business hours)
      const estimated = Math.ceil(totalContacts / formData.daily_limit);
      setEstimatedDays(estimated);
    } else {
      setEstimatedDays(null);
    }
  }, [totalContacts, formData.daily_limit]);

  const steps: { key: Step; label: string; number: number }[] = [
    { key: 'basic', label: 'Basic Info', number: 1 },
    { key: 'workflow', label: 'Select Workflow', number: 2 },
    { key: 'contacts', label: 'Add Contacts', number: 3 },
    { key: 'landing-page', label: 'Landing Page', number: 4 },
    { key: 'review', label: 'Review & Launch', number: 5 },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return (
          formData.name.trim() &&
          formData.campaign_id.trim() &&
          campaignIdAvailable === true &&
          formData.start_datetime
        );
      case 'workflow':
        return formData.workflow_id;
      case 'contacts':
        return contactLists.length > 0 && totalContacts > 0;
      case 'landing-page':
        // Can always proceed from landing page step
        // If enabled, require hero_title and display_price
        if (landingPageEnabled) {
          return (
            landingPageData.hero_title.trim() !== '' &&
            landingPageData.display_price.trim() !== ''
          );
        }
        return true; // Can skip if not enabled
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation: Ensure campaign is complete
      if (!formData.name.trim()) {
        setError('Please enter a campaign name');
        setSaving(false);
        return;
      }

      if (campaignNameAvailable === false) {
        setError(
          'Campaign name is already in use. Please choose a different name.'
        );
        setSaving(false);
        return;
      }

      if (!formData.workflow_id) {
        setError('Please select a workflow before saving');
        setSaving(false);
        return;
      }

      if (!formData.start_datetime) {
        setError('Please set a start date and time');
        setSaving(false);
        return;
      }

      if (totalContacts === 0 && contactLists.length === 0) {
        setError('Please upload at least one contact list');
        setSaving(false);
        return;
      }

      const url = campaign ? `/api/campaigns/${campaign.id}` : '/api/campaigns';

      const method = campaign ? 'PUT' : 'POST';

      // formData.start_datetime is already in UTC format from DateTimePicker
      const payload = {
        ...formData,
        company_id: companyId,
        total_contacts: totalContacts,
        service_plan_id: servicePlanId,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save campaign');
      }

      // Check if campaign should transition from draft to scheduled
      // This applies to both new campaigns AND cloned campaigns
      const savedCampaignId = campaign ? campaign.id : result.campaign?.id;

      if (savedCampaignId) {
        try {
          // Fetch current campaign status and contact lists
          const [statusCheckResponse, contactListsResponse] = await Promise.all([
            fetch(`/api/campaigns/${savedCampaignId}`),
            fetch(`/api/campaigns/${savedCampaignId}/contact-lists`)
          ]);

          const statusCheckResult = await statusCheckResponse.json();
          const contactListsResult = await contactListsResponse.json();

          if (statusCheckResult.success && statusCheckResult.campaign?.status === 'draft') {
            // Calculate actual total contacts from assigned contact lists
            const actualTotalContacts = contactListsResult.success && contactListsResult.contactLists
              ? contactListsResult.contactLists.reduce((sum: number, list: any) => sum + (list.total_contacts || 0), 0)
              : 0;

            // Check if all requirements for scheduling are met
            const hasWorkflow = !!formData.workflow_id;
            const hasStartTime = !!formData.start_datetime;
            const hasContacts = actualTotalContacts > 0;

            if (hasWorkflow && hasStartTime && hasContacts) {
              const startDate = new Date(formData.start_datetime);
              const now = new Date();

              // Only schedule if start time is in the future
              if (startDate > now) {
                // Use PATCH endpoint to transition status
                await fetch(`/api/campaigns/${savedCampaignId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'scheduled' }),
                });
              }
            }
          }
        } catch (statusErr) {
          // Don't throw - campaign is already saved, status transition is optional
          console.error('Error checking/updating campaign status:', statusErr);
        }
      }

      // Determine campaign_id for landing page operations
      const campaignIdForLandingPage = campaign && !isCloned
        ? campaign.campaign_id // Use existing campaign_id when editing (not cloned)
        : formData.campaign_id; // Use new/updated campaign_id when creating or cloning

      // If creating a new campaign, assign ALL contact lists
      // Note: For cloned/existing campaigns, ContactListUpload handles assignment immediately when user selects lists
      if (!campaign && result.campaign?.id) {
        const newCampaignId = result.campaign.id;

        // Assign ALL contact lists to the campaign
        // This includes both:
        // - Pre-existing lists that were selected (marked with isExisting)
        // - Newly uploaded lists that were just created (no isExisting flag)
        for (const list of contactLists) {
          try {
            const assignResponse = await fetch(
              `/api/campaigns/${newCampaignId}/contact-lists/assign`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contact_list_id: list.id,
                }),
              }
            );

            const assignResult = await assignResponse.json();

            if (!assignResult.success) {
              console.error(
                `Failed to assign contact list "${list.name || list.list_name}":`,
                assignResult.error
              );
            }
          } catch (assignErr) {
            console.error(
              `Error assigning contact list "${list.name || list.list_name}":`,
              assignErr
            );
          }
        }

        // All lists (both pre-existing and newly uploaded) are now assigned
      }

      // Save landing page (works for both create and edit)
      if (landingPageEnabled && campaignIdForLandingPage) {
        try {
          const landingPageMethod = campaign ? 'PUT' : 'POST';
          const landingPageResponse = await fetch(
            `/api/campaigns/${campaignIdForLandingPage}/landing-page`,
            {
              method: landingPageMethod,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...landingPageData,
                service_plan_id: servicePlanId,
              }),
            }
          );

          const landingPageResult = await landingPageResponse.json();

          if (!landingPageResult.success) {
            console.error(
              'Failed to save landing page:',
              landingPageResult.error
            );
            // Don't throw - campaign is already created/updated
          }
        } catch (landingPageErr) {
          console.error('Error saving landing page:', landingPageErr);
          // Don't throw - campaign is already created/updated
        }
      }

      // Show success message based on start time
      const startDate = new Date(formData.start_datetime);
      const now = new Date();

      if (startDate > now) {
        // Future campaign
        const formattedDate = startDate.toLocaleString('en-US', {
          timeZone: companyTimezone,
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        console.log(`Campaign scheduled to start on ${formattedDate}`);
      } else {
        // Immediate start
        console.log('Campaign scheduled to start within the next 5 minutes');
      }

      // Call onSuccess first, then reset state
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset all internal state
    setCurrentStep('basic');
    setFormData({
      name: '',
      description: '',
      campaign_id: '',
      discount_id: '',
      start_datetime: '',
      workflow_id: '',
      daily_limit: 500,
      respect_business_hours: true,
    });
    setSelectedWorkflow(null);
    setContactLists([]);
    setTotalContacts(0);
    setCampaignIdAvailable(null);
    setCampaignNameAvailable(null);
    setEstimatedDays(null);
    setSchedulePreview(null);
    setError(null);

    // Reset landing page state
    setLandingPageEnabled(false);
    setLandingPageData({
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
      thankyou_greeting: 'Thanks {first_name}!',
      thankyou_content: '',
      thankyou_show_expect: true,
      thankyou_expect_heading: 'What To Expect',
      thankyou_expect_col1_image: '',
      thankyou_expect_col1_heading: '',
      thankyou_expect_col1_content: '',
      thankyou_expect_col2_image: '',
      thankyou_expect_col2_heading: '',
      thankyou_expect_col2_content: '',
      thankyou_expect_col3_image: '',
      thankyou_expect_col3_heading: '',
      thankyou_expect_col3_content: '',
      thankyou_cta_text: 'Go Back To Homepage',
      thankyou_cta_url: '',
    });

    // Close the modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>{campaign ? 'Edit Campaign' : 'Create New Campaign'}</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className={styles.steps}>
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`${styles.step} ${
                currentStep === step.key ? styles.active : ''
              } ${index < currentStepIndex ? styles.completed : ''}`}
            >
              <div className={styles.stepNumber}>
                {index < currentStepIndex ? <Check size={16} /> : step.number}
              </div>
              <span className={styles.stepLabel}>{step.label}</span>
              {index < steps.length - 1 && (
                <ChevronRight size={16} className={styles.stepArrow} />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Step Content */}
        <div className={styles.stepContent}>
          {currentStep === 'basic' && (
            <div className={styles.formSection}>
              <h3>Campaign Details</h3>
              <div className={styles.formGroup}>
                <label>Campaign Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Spring Promotion 2024"
                />
                {campaignNameValidating && (
                  <small style={{ color: '#666' }}>
                    Checking availability...
                  </small>
                )}
                {!campaignNameValidating &&
                  campaignNameAvailable === true &&
                  formData.name && (
                    <small style={{ color: '#22c55e' }}>✓ Available</small>
                  )}
                {!campaignNameValidating && campaignNameAvailable === false && (
                  <small style={{ color: '#ef4444' }}>
                    ✗ This campaign name is already in use. Please choose a
                    unique name.
                  </small>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this campaign..."
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Campaign ID *</label>
                <input
                  type="text"
                  value={formData.campaign_id}
                  onChange={e => {
                    const value = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '');
                    setFormData({ ...formData, campaign_id: value });
                  }}
                  placeholder="e.g., PEST26"
                  maxLength={50}
                  disabled={!!campaign && !isCloned}
                />
                {campaignIdValidating && (
                  <small style={{ color: '#666' }}>
                    Checking availability...
                  </small>
                )}
                {!campaignIdValidating &&
                  campaignIdAvailable === true &&
                  formData.campaign_id && (
                    <small style={{ color: '#22c55e' }}>✓ Available</small>
                  )}
                {!campaignIdValidating && campaignIdAvailable === false && (
                  <small style={{ color: '#ef4444' }}>✗ Already in use</small>
                )}
                <small>
                  Human-friendly unique identifier for reports and forms
                </small>
              </div>

              <div className={styles.formGroup}>
                <label>Discount (Optional)</label>
                <select
                  value={formData.discount_id}
                  onChange={e =>
                    setFormData({ ...formData, discount_id: e.target.value })
                  }
                >
                  <option value="">No Discount</option>
                  {discounts
                    .filter(d => d.is_active)
                    .map(discount => (
                      <option key={discount.id} value={discount.id}>
                        {discount.discount_name} -{' '}
                        {discount.discount_type === 'percentage'
                          ? `${discount.discount_value}%`
                          : `$${discount.discount_value}`}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(true)}
                  className={styles.createDiscountButton}
                >
                  <Plus size={16} />
                  Create New Discount
                </button>
                <small>Select a discount to apply to this campaign</small>
              </div>

              <div className={styles.formGroup}>
                <label>Start Date & Time * ({companyTimezone})</label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    value={
                      formData.start_datetime
                        ? dayjs(formData.start_datetime).tz(companyTimezone)
                        : null
                    }
                    onChange={(newValue: Dayjs | null) => {
                      if (newValue) {
                        // Convert the selected time in company timezone to UTC for storage
                        const utcTime = newValue
                          .tz(companyTimezone, true)
                          .utc()
                          .toISOString();
                        setFormData({
                          ...formData,
                          start_datetime: utcTime,
                        });
                      } else {
                        setFormData({
                          ...formData,
                          start_datetime: '',
                        });
                      }
                    }}
                    timeSteps={{ minutes: 10 }}
                    skipDisabled={true}
                    format="MMMM D, YYYY h:mm A"
                    slotProps={{
                      textField: {
                        placeholder: 'Select date and time',
                        fullWidth: true,
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>
            </div>
          )}

          {currentStep === 'workflow' && (
            <WorkflowSelector
              companyId={companyId}
              selectedWorkflowId={formData.workflow_id}
              onSelect={(workflowId, workflow) => {
                setFormData({ ...formData, workflow_id: workflowId });
                setSelectedWorkflow(workflow);
              }}
            />
          )}

          {currentStep === 'contacts' && (
            <div className={styles.contactsStep}>
              <ContactListUpload
                companyId={companyId}
                campaignId={campaign?.id}
                initialLists={contactLists}
                onListsChange={(lists, total) => {
                  setContactLists(lists);
                  setTotalContacts(total);
                }}
              />

              <div className={styles.sendingConfig}>
                <h3>Sending Configuration</h3>
                <div className={styles.formGroup}>
                  <label>Daily Contact Limit</label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    step="50"
                    value={formData.daily_limit}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        daily_limit: parseInt(e.target.value) || 500,
                      })
                    }
                  />
                  <small>Maximum contacts to process per day (50-1000)</small>
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.respect_business_hours}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          respect_business_hours: e.target.checked,
                        })
                      }
                      style={{ width: 'auto', marginRight: '8px' }}
                    />
                    Respect business hours
                  </label>
                  <small>
                    Only send during company business hours (recommended)
                  </small>
                </div>

                {totalContacts > 0 && estimatedDays && (
                  <div className={styles.estimateBox}>
                    <p>
                      <strong>Estimated Duration:</strong> {estimatedDays}{' '}
                      {estimatedDays === 1 ? 'day' : 'days'}
                    </p>
                    <p>
                      <small>
                        Based on {formData.daily_limit} contacts/day
                      </small>
                    </p>
                    {estimatedDays > 7 && (
                      <p style={{ color: '#f59e0b' }}>
                        ⚠️ This campaign will take over a week to complete
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'landing-page' && (
            <div className={styles.landingPageStep}>
              <h3>Landing Page</h3>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={landingPageEnabled}
                    onChange={e => setLandingPageEnabled(e.target.checked)}
                    style={{ width: 'auto', marginRight: '8px' }}
                  />
                  Create custom landing page for this campaign
                </label>
                <small>
                  Add a customized landing page with images, text, and branding
                  specific to this campaign
                </small>
              </div>

              {landingPageEnabled && (
                <CampaignLandingPageEditorStep
                  campaignId={formData.campaign_id}
                  companyId={companyId}
                  data={landingPageData}
                  onChange={setLandingPageData}
                  servicePlanId={servicePlanId}
                  onServicePlanChange={setServicePlanId}
                />
              )}
            </div>
          )}

          {currentStep === 'review' && (
            <div className={styles.reviewSection}>
              <h3>Review Your Campaign</h3>

              <div className={styles.reviewGroup}>
                <h4>Campaign Details</h4>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Name:</span>
                  <span className={styles.reviewValue}>{formData.name}</span>
                </div>
                {formData.description && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Description:</span>
                    <span className={styles.reviewValue}>
                      {formData.description}
                    </span>
                  </div>
                )}
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Start:</span>
                  <span className={styles.reviewValue}>
                    {new Date(formData.start_datetime).toLocaleString('en-US', {
                      timeZone: companyTimezone,
                    })}
                  </span>
                </div>
              </div>

              <div className={styles.reviewGroup}>
                <h4>Workflow</h4>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Name:</span>
                  <span className={styles.reviewValue}>
                    {selectedWorkflow?.name || 'Selected'}
                  </span>
                </div>
                {selectedWorkflow?.workflow_steps && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Steps:</span>
                    <span className={styles.reviewValue}>
                      {selectedWorkflow.workflow_steps.length} workflow steps
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.reviewGroup}>
                <h4>Contact Lists</h4>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Total Contacts:</span>
                  <span className={styles.reviewValue}>{totalContacts}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Lists:</span>
                  <span className={styles.reviewValue}>
                    {contactLists.length} list
                    {contactLists.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className={styles.reviewGroup}>
                <h4>Sending Schedule</h4>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Daily Limit:</span>
                  <span className={styles.reviewValue}>
                    {formData.daily_limit} contacts/day
                  </span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Batch Size:</span>
                  <span className={styles.reviewValue}>
                    10 contacts per batch (system default)
                  </span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Batch Interval:</span>
                  <span className={styles.reviewValue}>
                    10 minutes (system default)
                  </span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Business Hours:</span>
                  <span className={styles.reviewValue}>
                    {formData.respect_business_hours
                      ? 'Respect company business hours'
                      : 'Send anytime'}
                  </span>
                </div>
                {estimatedDays !== null && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>
                      Estimated Duration:
                    </span>
                    <span className={styles.reviewValue}>
                      {estimatedDays} {estimatedDays === 1 ? 'day' : 'days'}
                      {estimatedDays > 7 && (
                        <span style={{ color: '#f59e0b', marginLeft: '8px' }}>
                          ⚠️ Campaign will take over a week
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Schedule Preview */}
              {totalContacts > 0 && (
                <div className={styles.reviewGroup}>
                  <h4>Campaign Timeline</h4>
                  <CampaignSchedulePreview
                    campaignId={campaign?.id}
                    companyId={companyId}
                    totalContacts={totalContacts}
                    dailyLimit={formData.daily_limit}
                    respectBusinessHours={formData.respect_business_hours}
                    startDate={formData.start_datetime}
                  />
                </div>
              )}

              {/* Landing Page Review */}
              {landingPageEnabled && (
                <div className={styles.reviewGroup}>
                  <h4>Landing Page</h4>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Status:</span>
                    <span className={styles.reviewValue}>
                      Custom landing page enabled
                    </span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Hero Title:</span>
                    <span className={styles.reviewValue}>
                      {landingPageData.hero_title}
                    </span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Display Price:</span>
                    <span className={styles.reviewValue}>
                      {landingPageData.display_price}
                    </span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Sections:</span>
                    <span className={styles.reviewValue}>
                      {[
                        landingPageData.show_letter && 'Letter',
                        landingPageData.feature_bullets.length > 0 &&
                          'Features',
                        landingPageData.show_additional_services && 'Services',
                        landingPageData.show_faq && 'FAQ',
                      ]
                        .filter(Boolean)
                        .join(', ') || 'Hero section only'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          <button
            onClick={handleClose}
            className={styles.cancelButton}
            disabled={saving}
          >
            Cancel
          </button>

          <div className={styles.navigationButtons}>
            {currentStepIndex > 0 && (
              <button
                onClick={handleBack}
                className={styles.backButton}
                disabled={saving}
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}

            {currentStepIndex < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className={styles.nextButton}
                disabled={!canProceed() || saving}
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className={styles.saveButton}
                disabled={!canProceed() || saving}
              >
                {saving
                  ? 'Saving...'
                  : campaign
                    ? 'Save Changes'
                    : 'Create Campaign'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Discount Creation Modal */}
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSave={handleDiscountCreated}
        discount={null}
        companyId={companyId}
      />
    </div>
  );
}
