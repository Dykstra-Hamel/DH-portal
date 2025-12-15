'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import { getClientDeviceData } from '@/lib/device-utils';
import { formatDiscount } from '@/lib/campaign-utils';
import styles from './campaignsteps.module.scss';

interface CampaignStepsProps {
  campaign: {
    id: string;
    campaign_id: string;
    name: string;
    description: string | null;
    discount: {
      id: string;
      discount_type: 'percentage' | 'fixed';
      discount_value: number;
      name: string;
    } | null;
  };
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    service_address: {
      id: string;
      street_address: string;
      city: string;
      state: string;
      zip_code: string;
    } | null;
  };
  company: {
    id: string;
    name: string;
    slug: string;
  };
  redemption: {
    isRedeemed: boolean;
    redeemedAt: string | null;
    requestedDate: string | null;
    requestedTime: string | null;
  } | null;
}

export default function CampaignSteps({
  campaign,
  customer,
  company,
  redemption,
}: CampaignStepsProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [requestedDate, setRequestedDate] = useState(redemption?.requestedDate || '');
  const [requestedTime, setRequestedTime] = useState(redemption?.requestedTime || '');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signatureRef = useRef<SignatureCanvas>(null);

  // If already redeemed, show thank you page
  useEffect(() => {
    if (redemption?.isRedeemed) {
      setCurrentStep(4);
    }
  }, [redemption]);

  // Handle step navigation
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Handle signature canvas changes
  const handleSignatureEnd = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setHasSignature(true);
    } else {
      setHasSignature(false);
    }
  };

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setHasSignature(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!termsAccepted) {
      setError('You must accept the terms and conditions to continue.');
      return;
    }

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError('Please provide your signature.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const signatureData = signatureRef.current.toDataURL();
      const clientDeviceData = getClientDeviceData();

      const response = await fetch(`/api/campaigns/${campaign.campaign_id}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          signature_data: signatureData,
          terms_accepted: termsAccepted,
          requested_date: requestedDate,
          requested_time: requestedTime,
          client_device_data: clientDeviceData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to redeem campaign');
      }

      // Move to thank you step
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time labels
  const timeLabels: Record<string, string> = {
    morning: 'Morning (8am - 12pm)',
    afternoon: 'Afternoon (12pm - 4pm)',
    evening: 'Evening (4pm - 8pm)',
    anytime: 'Anytime',
  };

  // Get today's date for min date picker value
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.dhFormWidget}>
      {/* Step 1: Campaign Offer Review */}
      {currentStep === 1 && (
        <div className={styles.dhFormStep}>
          <div className={styles.dhFormStepContent}>
            <div className={styles.dhFormContentArea}>
              <h2 className={styles.stepHeading}>
                Special Offer for You, {customer.first_name}!
              </h2>

              <div className={styles.campaignInfo}>
                <h3 className={styles.campaignName}>{campaign.name}</h3>
                {campaign.description && (
                  <p className={styles.campaignDescription}>{campaign.description}</p>
                )}
              </div>

              {campaign.discount && (
                <div className={styles.discountBanner}>
                  <p>{formatDiscount(campaign.discount)}</p>
                </div>
              )}

              <div className={styles.infoSection}>
                <h3>Your Information</h3>
                <div className={styles.infoContent}>
                  <p><strong>Name:</strong> {customer.first_name} {customer.last_name}</p>
                  <p><strong>Email:</strong> {customer.email}</p>
                  <p><strong>Phone:</strong> {customer.phone_number}</p>
                  {customer.service_address ? (
                    <>
                      <p><strong>Service Address:</strong></p>
                      <p>{customer.service_address.street_address}</p>
                      <p>{customer.service_address.city}, {customer.service_address.state} {customer.service_address.zip_code}</p>
                    </>
                  ) : (
                    <p><strong>Service Address:</strong> Not provided (will be collected when scheduling)</p>
                  )}
                </div>
              </div>

              <button className={styles.primaryButton} onClick={handleNext}>
                Continue
              </button>
            </div>

            <div className={styles.dhPestHero}>
              <div className={styles.dhPestBgImage} />
              <Image
                className={styles.dhPestHeroImage}
                src="/images/campaign-hero-placeholder.svg"
                alt="Campaign Offer"
                width={600}
                height={400}
                priority={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Contact & Scheduling */}
      {currentStep === 2 && (
        <div className={styles.dhFormStep}>
          <div className={styles.dhFormStepContent}>
            <div className={styles.dhFormContentArea}>
              <button onClick={handleBack} className={styles.backButton}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M12.5 15L7.5 10L12.5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back
              </button>

              <h2 className={styles.stepHeading}>
                When would you like us to get started?
              </h2>

              <div className={styles.schedulingSection}>
                <div className={styles.formGroupRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="requested-date">Preferred Start Date:</label>
                    <input
                      type="date"
                      id="requested-date"
                      value={requestedDate}
                      onChange={(e) => setRequestedDate(e.target.value)}
                      min={today}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="requested-time">Preferred Arrival Time:</label>
                    <select
                      id="requested-time"
                      value={requestedTime}
                      onChange={(e) => setRequestedTime(e.target.value)}
                      className={styles.select}
                    >
                      <option value="">Select a time...</option>
                      <option value="morning">Morning (8am - 12pm)</option>
                      <option value="afternoon">Afternoon (12pm - 4pm)</option>
                      <option value="evening">Evening (4pm - 8pm)</option>
                      <option value="anytime">Anytime</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.infoSection}>
                <h3>Contact Details</h3>
                <div className={styles.infoContent}>
                  <p><strong>Name:</strong> {customer.first_name} {customer.last_name}</p>
                  <p><strong>Email:</strong> {customer.email}</p>
                  <p><strong>Phone:</strong> {customer.phone_number}</p>
                  {customer.service_address ? (
                    <>
                      <p><strong>Service Address:</strong></p>
                      <p>{customer.service_address.street_address}</p>
                      <p>{customer.service_address.city}, {customer.service_address.state} {customer.service_address.zip_code}</p>
                    </>
                  ) : (
                    <p><strong>Service Address:</strong> Not provided (will be collected when scheduling)</p>
                  )}
                </div>
              </div>

              <button className={styles.primaryButton} onClick={handleNext}>
                Continue
              </button>
            </div>

            <div className={styles.dhPestHero}>
              <div className={styles.dhPestBgImage} />
              <Image
                className={styles.dhPestHeroImage}
                src="/images/campaign-hero-placeholder.svg"
                alt="Campaign Offer"
                width={600}
                height={400}
                priority={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Terms & Signature */}
      {currentStep === 3 && (
        <div className={styles.dhFormStep}>
          <div className={styles.dhFormStepContent}>
            <div className={styles.dhFormContentArea}>
              <button onClick={handleBack} className={styles.backButton}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M12.5 15L7.5 10L12.5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back
              </button>

              <h2 className={styles.stepHeading}>
                Review and Sign Agreement
              </h2>

              <div className={styles.termsSection}>
                <h3>Terms and Conditions</h3>
                <div className={styles.termsContent}>
                  <p>
                    By signing below, you agree to the following terms and conditions:
                  </p>
                  <ul>
                    <li>This offer is valid for one-time use only</li>
                    <li>Discount will be applied to your first service</li>
                    <li>Services will be scheduled based on availability</li>
                    <li>Payment is due upon completion of service</li>
                    <li>You may cancel with 24 hours notice</li>
                    <li>Standard service terms and conditions apply</li>
                  </ul>
                </div>

                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <label htmlFor="terms-checkbox">
                    I have read and accept the terms and conditions
                  </label>
                </div>
              </div>

              <div className={styles.signatureSection}>
                <h3>Signature</h3>
                <p className={styles.signatureInstructions}>
                  Please sign in the box below using your mouse or touchscreen
                </p>
                <div className={styles.signaturePad}>
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: styles.signatureCanvas,
                    }}
                    onEnd={handleSignatureEnd}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className={styles.secondaryButton}
                >
                  Clear Signature
                </button>

                <div className={styles.signatureDate}>
                  <strong>Date:</strong> {new Date().toLocaleDateString()}
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                className={styles.primaryButton}
                onClick={handleSubmit}
                disabled={isSubmitting || !termsAccepted || !hasSignature}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Agreement'}
              </button>
            </div>

            <div className={styles.dhPestHero}>
              <div className={styles.dhPestBgImage} />
              <Image
                className={styles.dhPestHeroImage}
                src="/images/campaign-hero-placeholder.svg"
                alt="Campaign Offer"
                width={600}
                height={400}
                priority={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Thank You */}
      {currentStep === 4 && (
        <div className={styles.dhFormStep}>
          <div className={styles.dhFormStepContent}>
            <div className={styles.dhFormContentArea}>
              <div className={styles.completionHeader}>
                <div className={styles.checkmark}>✓</div>
                <h2>Thank You, {customer.first_name}!</h2>
                <p>
                  Your campaign offer has been redeemed successfully.
                </p>
              </div>

              <div className={styles.summaryItem}>
                <h4>What&apos;s Next?</h4>
                <ul>
                  <li>Our team will review your request</li>
                  <li>You&apos;ll receive a confirmation email within 24 hours</li>
                  <li>We&apos;ll contact you to schedule your service</li>
                </ul>
              </div>

              {campaign.discount && (
                <div className={styles.summaryItem}>
                  <h4>Your Discount:</h4>
                  <p className={styles.discountSummary}>{formatDiscount(campaign.discount)}</p>
                </div>
              )}

              <div className={styles.summaryItem}>
                <h4>Contact Details:</h4>
                <p><strong>Name:</strong> {customer.first_name} {customer.last_name}</p>
                <p><strong>Email:</strong> {customer.email}</p>
                <p><strong>Phone:</strong> {customer.phone_number}</p>
                {customer.service_address ? (
                  <>
                    <p><strong>Service Address:</strong></p>
                    <p>{customer.service_address.street_address}</p>
                    <p>{customer.service_address.city}, {customer.service_address.state} {customer.service_address.zip_code}</p>
                  </>
                ) : (
                  <p><strong>Service Address:</strong> Not provided (will be collected when scheduling)</p>
                )}
              </div>

              {(requestedDate || requestedTime) && (
                <div className={styles.summaryItem}>
                  <h4>Requested Service Time:</h4>
                  {requestedDate && (
                    <p><strong>Date:</strong> {new Date(requestedDate).toLocaleDateString()}</p>
                  )}
                  {requestedTime && (
                    <p><strong>Time:</strong> {timeLabels[requestedTime] || requestedTime}</p>
                  )}
                </div>
              )}

              <div className={styles.summaryItemCentered}>
                <h4>Questions? Contact us:</h4>
                <p><strong>Company:</strong> {company.name}</p>
              </div>
            </div>

            <div className={styles.dhPestHero}>
              <div className={styles.dhPestBgImage} />
              <Image
                className={styles.dhPestHeroImage}
                src="/images/campaign-hero-placeholder.svg"
                alt="Campaign Offer"
                width={600}
                height={400}
                priority={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
