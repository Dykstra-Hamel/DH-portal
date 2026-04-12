'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, Check } from 'lucide-react';
import { useCompanyRole } from '@/hooks/useCompanyRole';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import QuickQuoteStep1 from './QuickQuoteStep1';
import QuickQuoteStep2, { CustomerFormData } from './QuickQuoteStep2';
import QuickQuoteStep3 from './QuickQuoteStep3';
import QuickQuoteStep4 from './QuickQuoteStep4';
import styles from './QuickQuoteModal.module.scss';

type QuickQuoteStep = 1 | 2 | 3 | 4;

interface PestOption {
  id: string;
  pest_id: string;
  name: string;
  slug: string;
  description: string;
  icon_svg: string;
  custom_label: string | null;
  how_we_do_it_text: string | null;
}

interface CustomerResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  primary_service_address?: Array<{
    service_address: {
      home_size_range?: string | null;
    };
  }> | null;
}

interface ServicePlan {
  id: string;
  plan_name: string;
  plan_description: string | null;
  plan_category: string;
  initial_price: number;
  recurring_price: number;
  billing_frequency: string;
  treatment_frequency: string | null;
  includes_inspection: boolean;
  plan_features: string[] | null;
  highlight_badge: string | null;
  display_order: number;
  coverage_level: string | null;
  home_size_pricing: any;
  yard_size_pricing: any;
  linear_feet_pricing: any;
}

interface QuickQuoteModalProps {
  companyId: string;
  companyName: string;
  userId: string;
  onClose: () => void;
}

const STEP_LABELS: Record<QuickQuoteStep, string> = {
  1: 'Pest',
  2: 'Customer',
  3: 'Plan',
  4: 'Schedule',
};

export default function QuickQuoteModal({
  companyId,
  companyName,
  userId,
  onClose,
}: QuickQuoteModalProps) {
  const router = useRouter();

  // Scheduling permission
  const { isCompanyAdmin, isLoading: roleLoading } = useCompanyRole(companyId);
  const { departments, isLoading: deptLoading } = useUserDepartments(userId, companyId);
  const hasSchedulingPermission =
    !roleLoading && !deptLoading && (isCompanyAdmin || departments.includes('scheduling'));

  // Wizard state
  const [step, setStep] = useState<QuickQuoteStep>(1);
  const [selectedPest, setSelectedPest] = useState<PestOption | null>(null);
  const [existingCustomer, setExistingCustomer] =
    useState<CustomerResult | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
  });
  const [homeSize, setHomeSize] = useState('');
  const [pestLocations, setPestLocations] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('anytime');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [promptEmail, setPromptEmail] = useState('');
  const [promptEmailError, setPromptEmailError] = useState('');
  const [step1Script, setStep1Script] = useState('');
  const [step1Tips, setStep1Tips] = useState<string[]>([]);
  const [step2Script, setStep2Script] = useState('');
  const [step3Script, setStep3Script] = useState('');

  const DEFAULT_STEP1_SCRIPT = `\u201cThank you for calling ${companyName || 'us'} today! My name is [Your Name] and I\u2019d be happy to help you get a quote. Can I start by asking \u2014 what kind of pest issue are you dealing with?\u201d`;
  const DEFAULT_STEP1_TIPS = [
    'Ask how long they\u2019ve been noticing the problem \u2014 longer duration often signals a bigger issue.',
    'Confirm property ownership \u2014 owners are more likely to commit to recurring plans.',
    'Mention that pest pressure is high in their area to build urgency.',
    'Offer the most comprehensive plan first, then work down if needed.',
    'If they hesitate on price, emphasize the guarantee and re-treatment policy.',
  ];
  const DEFAULT_STEP2_SCRIPT = '\u201cGreat! I just need to gather a few details. Can I get your name and the best phone number to reach you?\u201d';
  const DEFAULT_STEP3_SCRIPT = '\u201cBased on what you\u2019ve described, let me walk you through a few plan options. Our plans are designed to give you the right level of protection \u2014 I\u2019d recommend starting with our most comprehensive option.\u201d';

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/settings`);
        if (!response.ok) return;
        const { settings } = await response.json();

        const s1 = settings?.quick_quote_step1_script?.value?.trim();
        const t1 = settings?.quick_quote_step1_tips?.value?.trim();
        const s2 = settings?.quick_quote_step2_script?.value?.trim();
        const s3 = settings?.quick_quote_step3_script?.value?.trim();

        setStep1Script(s1 || DEFAULT_STEP1_SCRIPT);
        setStep1Tips(t1 ? t1.split('\n').map((l: string) => l.trim()).filter(Boolean) : DEFAULT_STEP1_TIPS);
        setStep2Script(s2 || DEFAULT_STEP2_SCRIPT);
        setStep3Script(s3 || DEFAULT_STEP3_SCRIPT);
      } catch {
        setStep1Script(DEFAULT_STEP1_SCRIPT);
        setStep1Tips(DEFAULT_STEP1_TIPS);
        setStep2Script(DEFAULT_STEP2_SCRIPT);
        setStep3Script(DEFAULT_STEP3_SCRIPT);
      }
    };
    fetchScripts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Derived customer display data
  const getCustomerData = () => {
    if (existingCustomer) {
      return {
        firstName: existingCustomer.first_name,
        lastName: existingCustomer.last_name,
        streetAddress: existingCustomer.address || '',
        city: existingCustomer.city || '',
        state: existingCustomer.state || '',
      };
    }
    return {
      firstName: customerForm.firstName,
      lastName: customerForm.lastName,
      streetAddress: customerForm.streetAddress,
      city: customerForm.city,
      state: customerForm.state,
    };
  };

  // Step 1: pest selected → advance
  const handlePestSelect = useCallback((pest: PestOption) => {
    setSelectedPest(pest);
    setStep(2);
  }, []);

  // Step 2: existing customer selected
  const handleExistingCustomerSelect = useCallback(
    (customer: CustomerResult) => {
      setExistingCustomer(customer);
      setIsNewCustomer(false);
      // Populate form from customer for display purposes
      setCustomerForm({
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone || '',
        email: customer.email || '',
        streetAddress: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip: customer.zip_code || '',
      });

      // Prefill home size from primary service address if available
      const storedHomeSize =
        customer.primary_service_address?.[0]?.service_address?.home_size_range;
      if (storedHomeSize) {
        setHomeSize(storedHomeSize);
      }
    },
    []
  );

  const handleClearCustomer = useCallback(() => {
    setExistingCustomer(null);
    setIsNewCustomer(false);
    setHomeSize('');
    setCustomerForm({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      streetAddress: '',
      city: '',
      state: '',
      zip: '',
    });
  }, []);

  const handleStep2Continue = useCallback(() => {
    setStep(3);
  }, []);

  // Step 3: plan selected
  const handlePlanSelect = useCallback((plan: ServicePlan) => {
    setSelectedPlan(plan);
    // homeSize intentionally NOT reset here — the selected range persists
    // across plan changes; only cleared when the customer is cleared.
  }, []);

  // Build lead creation payload
  const buildLeadPayload = (status: 'quoted' | 'scheduling' | 'won') => {
    const payload: Record<string, any> = {
      companyId,
      leadStatus: status,
      leadType: 'inbound_call',
      leadFormat: 'call',
      leadSource: 'direct',
      pestType: selectedPest?.slug,
      assignedTo: userId,
      selectedPlanId: selectedPlan?.id,
    };

    if (existingCustomer) {
      payload.customerId = existingCustomer.id;
    } else {
      payload.firstName = customerForm.firstName;
      payload.lastName = customerForm.lastName;
      payload.phoneNumber = customerForm.phone;
      payload.email = customerForm.email || undefined;
      payload.streetAddress = customerForm.streetAddress || undefined;
      payload.city = customerForm.city || undefined;
      payload.state = customerForm.state || undefined;
      payload.zip = customerForm.zip || undefined;
    }

    return payload;
  };

  // Core send-quote API flow (called after email is confirmed)
  const executeSendQuote = useCallback(async (leadPayload: Record<string, any>) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Create lead
      const leadRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadPayload),
      });

      if (!leadRes.ok) {
        const err = await leadRes.json();
        throw new Error(err.error || 'Failed to create lead');
      }

      const leadData = await leadRes.json();
      const leadId: string = leadData.lead.id;
      const serviceAddressId: string | null =
        leadData.lead.service_address_id || null;

      // 1b. Add pest sighting locations note (best-effort)
      if (pestLocations.length > 0) {
        await fetch(`/api/leads/${leadId}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_type: 'note_added',
            notes: `Pest sighting locations: ${pestLocations.join(', ')}`,
          }),
        }).catch(() => {});
      }

      // 2. Update service address with home size if selected
      if (homeSize && serviceAddressId) {
        await fetch(`/api/service-addresses/${serviceAddressId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ home_size_range: homeSize }),
        });
      }

      // 3. Create quote
      const quoteRes = await fetch(`/api/leads/${leadId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          service_plans: [{ service_plan_id: selectedPlan!.id }],
        }),
      });

      if (!quoteRes.ok) {
        throw new Error('Failed to create quote');
      }

      const quoteData = await quoteRes.json();
      const quoteId: string = quoteData.data?.id;

      // 4. Send quote email (best-effort)
      if (quoteId) {
        await fetch(`/api/quotes/${quoteId}/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }).catch(() => {});
      }

      // 5. Close modal
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
      setIsSubmitting(false);
    }
  }, [homeSize, pestLocations, selectedPlan, onClose]);

  // Send Quote flow — gate on email for existing customers
  const handleSendQuote = useCallback(async () => {
    if (!selectedPlan) return;
    if (existingCustomer && !existingCustomer.email) {
      setPromptEmail('');
      setPromptEmailError('');
      setShowEmailPrompt(true);
      return;
    }
    await executeSendQuote(buildLeadPayload('quoted'));
  }, [selectedPlan, existingCustomer, executeSendQuote, buildLeadPayload]);

  // Confirm email prompt → patch customer, then proceed
  const handleEmailPromptConfirm = useCallback(async () => {
    const trimmed = promptEmail.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setPromptEmailError('Please enter a valid email address.');
      return;
    }

    // Update the customer record (best-effort)
    if (existingCustomer) {
      await fetch(`/api/customers/${existingCustomer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      }).catch(() => {});
      setExistingCustomer({ ...existingCustomer, email: trimmed });
    }

    setShowEmailPrompt(false);
    const payload = buildLeadPayload('quoted');
    // Ensure the email is included in the new customer path if needed
    if (!existingCustomer) {
      payload.email = trimmed;
    }
    await executeSendQuote(payload);
  }, [promptEmail, existingCustomer, buildLeadPayload, executeSendQuote]);

  // Schedule flow — Step 4 submit
  const handleScheduleSubmit = useCallback(async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Create lead — status and field names depend on scheduling permission
      const leadPayload = hasSchedulingPermission
        ? {
            ...buildLeadPayload('won'),
            scheduledDate: requestedDate || undefined,
            scheduledTime: requestedTime !== 'anytime' ? requestedTime : undefined,
          }
        : {
            ...buildLeadPayload('scheduling'),
            requestedDate: requestedDate || undefined,
            requestedTime: requestedTime !== 'anytime' ? requestedTime : undefined,
          };

      const leadRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadPayload),
      });

      if (!leadRes.ok) {
        const err = await leadRes.json();
        throw new Error(err.error || 'Failed to create lead');
      }

      const leadData = await leadRes.json();
      const leadId: string = leadData.lead.id;
      const serviceAddressId: string | null =
        leadData.lead.service_address_id || null;

      // 1b. Add pest sighting locations note (best-effort)
      if (pestLocations.length > 0) {
        await fetch(`/api/leads/${leadId}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_type: 'note_added',
            notes: `Pest sighting locations: ${pestLocations.join(', ')}`,
          }),
        }).catch(() => {});
      }

      // 2. Update service address with home size if selected
      if (homeSize && serviceAddressId) {
        await fetch(`/api/service-addresses/${serviceAddressId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ home_size_range: homeSize }),
        });
      }

      // 3. Create quote
      const quoteRes = await fetch(`/api/leads/${leadId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          service_plans: [{ service_plan_id: selectedPlan.id }],
        }),
      });

      if (!quoteRes.ok) {
        throw new Error('Failed to create quote');
      }

      // 4. Close modal
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
      setIsSubmitting(false);
    }
  }, [
    selectedPlan,
    homeSize,
    pestLocations,
    requestedDate,
    requestedTime,
    companyId,
    existingCustomer,
    customerForm,
    userId,
    selectedPest,
    onClose,
    hasSchedulingPermission,
  ]);

  // Show step 4 when "Continue to Scheduling" is clicked from step 3
  const handleGoToScheduling = useCallback(() => {
    setStep(4);
  }, []);

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  const steps: QuickQuoteStep[] = [1, 2, 3, 4];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          {step > 1 && (
            <button
              type="button"
              className={styles.backBtn}
              onClick={handleBack}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          )}

          <span className={styles.headerTitle}>Quick Quote</span>

          {/* Step indicators */}
          <div className={styles.stepIndicator}>
            {steps.map((s, idx) => (
              <div
                key={s}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {idx > 0 && <div className={styles.stepConnector} />}
                <div
                  className={`${styles.stepPill} ${
                    s === step
                      ? styles.active
                      : s < step
                        ? styles.completed
                        : ''
                  }`}
                >
                  {s < step ? <Check size={11} /> : null}
                  {STEP_LABELS[s]}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close Quick Quote"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error banner */}
        {submitError && step !== 4 && (
          <div className={styles.errorBanner}>{submitError}</div>
        )}

        {/* Step content */}
        <div className={styles.content}>
          {step === 1 && (
            <QuickQuoteStep1
              companyId={companyId}
              salesScript={step1Script}
              salesTips={step1Tips}
              onSelectPest={handlePestSelect}
            />
          )}

          {step === 2 && selectedPest && (
            <QuickQuoteStep2
              companyId={companyId}
              salesScript={step2Script}
              selectedPest={selectedPest}
              existingCustomer={existingCustomer}
              isNewCustomer={isNewCustomer}
              customerForm={customerForm}
              onExistingCustomerSelect={handleExistingCustomerSelect}
              onClearCustomer={handleClearCustomer}
              onFormChange={setCustomerForm}
              onContinue={handleStep2Continue}
            />
          )}

          {step === 3 && selectedPest && (
            <QuickQuoteStep3
              companyId={companyId}
              salesScript={step3Script}
              selectedPest={selectedPest}
              customerData={getCustomerData()}
              selectedPlan={selectedPlan}
              homeSize={homeSize}
              pestLocations={pestLocations}
              onPlanSelect={handlePlanSelect}
              onHomeSizeChange={setHomeSize}
              onPestLocationsChange={setPestLocations}
              onSendQuote={handleSendQuote}
              onSchedule={handleGoToScheduling}
              isSubmitting={isSubmitting}
            />
          )}

          {step === 4 && selectedPest && (
            <QuickQuoteStep4
              selectedPest={selectedPest}
              selectedPlan={selectedPlan}
              customerData={getCustomerData()}
              homeSize={homeSize}
              requestedDate={requestedDate}
              requestedTime={requestedTime}
              onDateChange={setRequestedDate}
              onTimeChange={setRequestedTime}
              onSubmit={handleScheduleSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
              hasSchedulingPermission={hasSchedulingPermission}
            />
          )}
        </div>
      </div>

      {/* Email required prompt */}
      {showEmailPrompt && (
        <div className={styles.emailPromptBackdrop}>
          <div className={styles.emailPromptDialog}>
            <p className={styles.emailPromptTitle}>Email Required</p>
            <p className={styles.emailPromptBody}>
              This customer doesn&apos;t have an email on file. Please add one
              to send the quote.
            </p>
            <input
              type="email"
              className={styles.emailPromptInput}
              placeholder="customer@example.com"
              value={promptEmail}
              onChange={(e) => {
                setPromptEmail(e.target.value);
                setPromptEmailError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailPromptConfirm()}
              autoFocus
            />
            {promptEmailError && (
              <p className={styles.emailPromptError}>{promptEmailError}</p>
            )}
            <div className={styles.emailPromptActions}>
              <button
                type="button"
                className={styles.emailPromptCancel}
                onClick={() => setShowEmailPrompt(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.emailPromptConfirm}
                onClick={handleEmailPromptConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending\u2026' : 'Send Quote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
