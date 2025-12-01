'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './CampaignEditor.module.scss';
import WorkflowSelector from './WorkflowSelector';
import ContactListUpload from './ContactListUpload';
import CampaignSchedulePreview from './CampaignSchedulePreview';

interface CampaignEditorProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  campaign?: any; // For editing existing campaigns
  onSuccess: () => void;
}

type Step = 'basic' | 'workflow' | 'contacts' | 'review';

export default function CampaignEditor({
  isOpen,
  onClose,
  companyId,
  campaign,
  onSuccess
}: CampaignEditorProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyTimezone, setCompanyTimezone] = useState<string>('America/New_York');

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
  const [campaignIdAvailable, setCampaignIdAvailable] = useState<boolean | null>(null);
  const [campaignNameValidating, setCampaignNameValidating] = useState(false);
  const [campaignNameAvailable, setCampaignNameAvailable] = useState<boolean | null>(null);
  const [estimatedDays, setEstimatedDays] = useState<number | null>(null);
  const [schedulePreview, setSchedulePreview] = useState<any>(null);

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
        const tzSetting = result.settings.find((s: any) => s.setting_key === 'company_timezone');
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
      // Mark campaign ID and name as available if editing existing campaign
      if (campaign.campaign_id) {
        setCampaignIdAvailable(true);
      }
      if (campaign.name) {
        setCampaignNameAvailable(true);
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
    { key: 'review', label: 'Review & Launch', number: 4 },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return formData.name.trim() &&
               formData.campaign_id.trim() &&
               campaignIdAvailable === true &&
               formData.start_datetime;
      case 'workflow':
        return formData.workflow_id;
      case 'contacts':
        return contactLists.length > 0 && totalContacts > 0;
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

  // Convert datetime-local string to Date object for DatePicker
  const parseDateTime = (datetimeLocal: string): Date | null => {
    if (!datetimeLocal) return null;
    return new Date(datetimeLocal);
  };

  // Convert Date object to datetime-local string for storage
  const formatDateTime = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convert datetime-local input (which is in company timezone) to ISO string for UTC storage
  const convertToUTC = (datetimeLocal: string): string => {
    if (!datetimeLocal) return '';

    // Format: "2025-11-26T10:30"
    // This represents 10:30 AM in the company timezone, not browser timezone

    // Parse the datetime-local string
    const [datePart, timePart] = datetimeLocal.split('T');
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split(':');

    // The trick: create a date string that will be interpreted in the company timezone
    // Format it as an ISO string with explicit timezone indicator
    // First, create a formatter to get the timezone offset
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: companyTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'longOffset'
    });

    // Use the input date/time to create a reference point
    const referenceDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`); // Parse as UTC

    // Format this reference date in the company timezone
    const parts = formatter.formatToParts(referenceDate);
    const tzOffset = parts.find(p => p.type === 'timeZoneName')?.value || 'UTC';

    // Parse the offset (e.g., "GMT-5" -> -5 hours)
    const offsetMatch = tzOffset.match(/GMT([+-]\d+)/);
    const offsetHours = offsetMatch ? parseInt(offsetMatch[1]) : 0;

    // Create the correct UTC time by adding the timezone offset
    const utcDate = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      0
    ));

    // Adjust by subtracting the timezone offset (convert company time to UTC)
    utcDate.setHours(utcDate.getHours() - offsetHours);

    return utcDate.toISOString();
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
        setError('Campaign name is already in use. Please choose a different name.');
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

      const url = campaign
        ? `/api/campaigns/${campaign.id}`
        : '/api/campaigns';

      const method = campaign ? 'PUT' : 'POST';

      // Convert datetimes from company timezone to UTC
      const payload = {
        ...formData,
        start_datetime: convertToUTC(formData.start_datetime),
        company_id: companyId,
        total_contacts: totalContacts,
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

      // If creating a new campaign, assign ALL contact lists
      if (!campaign && result.campaign?.id) {
        const newCampaignId = result.campaign.id;

        // Assign ALL contact lists to the campaign
        // This includes both:
        // - Pre-existing lists that were selected (marked with isExisting)
        // - Newly uploaded lists that were just created (no isExisting flag)
        for (const list of contactLists) {
          try {
            const assignResponse = await fetch(`/api/campaigns/${newCampaignId}/contact-lists/assign`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contact_list_id: list.id,
              }),
            });

            const assignResult = await assignResponse.json();

            if (!assignResult.success) {
              console.error(`Failed to assign contact list "${list.name || list.list_name}":`, assignResult.error);
            }
          } catch (assignErr) {
            console.error(`Error assigning contact list "${list.name || list.list_name}":`, assignErr);
          }
        }

        // All lists (both pre-existing and newly uploaded) are now assigned
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
          hour12: true
        });
        console.log(`Campaign scheduled to start on ${formattedDate}`);
      } else {
        // Immediate start
        console.log('Campaign scheduled to start within the next 5 minutes');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
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
    setEstimatedDays(null);
    setSchedulePreview(null);
    setError(null);
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
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

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
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Spring Promotion 2024"
                />
                {campaignNameValidating && (
                  <small style={{ color: '#666' }}>Checking availability...</small>
                )}
                {!campaignNameValidating && campaignNameAvailable === true && formData.name && (
                  <small style={{ color: '#22c55e' }}>✓ Available</small>
                )}
                {!campaignNameValidating && campaignNameAvailable === false && (
                  <small style={{ color: '#ef4444' }}>✗ This campaign name is already in use. Please choose a unique name.</small>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setFormData({ ...formData, campaign_id: value });
                  }}
                  placeholder="e.g., PEST26"
                  maxLength={50}
                  disabled={!!campaign}
                />
                {campaignIdValidating && (
                  <small style={{ color: '#666' }}>Checking availability...</small>
                )}
                {!campaignIdValidating && campaignIdAvailable === true && formData.campaign_id && (
                  <small style={{ color: '#22c55e' }}>✓ Available</small>
                )}
                {!campaignIdValidating && campaignIdAvailable === false && (
                  <small style={{ color: '#ef4444' }}>✗ Already in use</small>
                )}
                <small>Human-friendly unique identifier for reports and forms</small>
              </div>

              <div className={styles.formGroup}>
                <label>Discount (Optional)</label>
                <select
                  value={formData.discount_id}
                  onChange={e => setFormData({ ...formData, discount_id: e.target.value })}
                >
                  <option value="">No Discount</option>
                  {discounts
                    .filter(d => d.is_active)
                    .map(discount => (
                      <option key={discount.id} value={discount.id}>
                        {discount.discount_name} - {discount.discount_type === 'percentage'
                          ? `${discount.discount_value}%`
                          : `$${discount.discount_value}`}
                      </option>
                    ))}
                </select>
                <small>Select a discount to apply to this campaign</small>
              </div>

              <div className={styles.formGroup}>
                <label>Start Date & Time *</label>
                <DatePicker
                  selected={parseDateTime(formData.start_datetime)}
                  onChange={(date: Date | null) => {
                    setFormData({ ...formData, start_datetime: formatDateTime(date) });
                  }}
                  showTimeSelect
                  timeIntervals={15}
                  timeFormat="h:mm aa"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  placeholderText="Select date and time"
                  className={styles.datePickerInput}
                />
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
                    onChange={e => setFormData({ ...formData, daily_limit: parseInt(e.target.value) || 500 })}
                  />
                  <small>Maximum contacts to process per day (50-1000)</small>
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.respect_business_hours}
                      onChange={e => setFormData({ ...formData, respect_business_hours: e.target.checked })}
                      style={{ width: 'auto', marginRight: '8px' }}
                    />
                    Respect business hours
                  </label>
                  <small>Only send during company business hours (recommended)</small>
                </div>

                {totalContacts > 0 && estimatedDays && (
                  <div className={styles.estimateBox}>
                    <p><strong>Estimated Duration:</strong> {estimatedDays} {estimatedDays === 1 ? 'day' : 'days'}</p>
                    <p><small>Based on {formData.daily_limit} contacts/day</small></p>
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
                    <span className={styles.reviewValue}>{formData.description}</span>
                  </div>
                )}
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Start:</span>
                  <span className={styles.reviewValue}>
                    {new Date(formData.start_datetime).toLocaleString('en-US', { timeZone: companyTimezone })}
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
                    {contactLists.length} list{contactLists.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className={styles.reviewGroup}>
                <h4>Sending Schedule</h4>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Daily Limit:</span>
                  <span className={styles.reviewValue}>{formData.daily_limit} contacts/day</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Batch Size:</span>
                  <span className={styles.reviewValue}>10 contacts per batch (system default)</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Batch Interval:</span>
                  <span className={styles.reviewValue}>10 minutes (system default)</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Business Hours:</span>
                  <span className={styles.reviewValue}>
                    {formData.respect_business_hours ? 'Respect company business hours' : 'Send anytime'}
                  </span>
                </div>
                {estimatedDays !== null && (
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Estimated Duration:</span>
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
                {saving ? 'Saving...' : campaign ? 'Save Changes' : 'Create Campaign'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
