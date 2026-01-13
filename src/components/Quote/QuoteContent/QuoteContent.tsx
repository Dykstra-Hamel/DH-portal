'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import { getClientDeviceData } from '@/lib/device-utils';
import { formatHomeSizeRange, formatYardSizeRange } from '@/lib/display-utils';
import HeaderSection from './HeaderSection';
import styles from './quotecontent.module.scss';
import HeroSection from './HeroSection';
import PlanDetails from './PlanDetails';
import FooterSection from './FooterSection';
import QuoteTotalPricing from './QuoteTotalPricing';
import Link from 'next/link';

interface AlternativeColor {
  hex: string;
  cmyk: string;
  name: string;
  pantone: string;
}

interface Branding {
  primary_color: string;
  secondary_color: string;
  alternative_colors: AlternativeColor[];
  logo_url: string;
  icon_logo_url: string;
  font_primary_name?: string;
  font_secondary_name?: string;
  primary_hero_image_url?: string | null;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  website: any;
  privacy_policy_url: string;
  terms_conditions_url: string;
  quote_terms: string;
  quote_thanks_content: string;
}

interface Quote {
  id: string;
  primary_pest: string;
  additional_pests: string[];
  total_initial_price: number;
  total_recurring_price: number;
  line_items: any[];
  signed_at: string | null;
  home_size_range: string | null;
  yard_size_range: string | null;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  service_address: {
    street_address: string;
    apartment_unit: string | null;
    city: string;
    state: string;
    zip_code: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  lead: {
    id: string;
    lead_status: string;
    service_type: string;
    comments: string;
    requested_date: string | null;
    requested_time: string | null;
  };
}

interface QuoteStepsProps {
  company: Company;
  branding: Branding | null;
  quote: Quote;
  token: string | null;
}

export default function QuoteContent({
  company,
  branding,
  quote,
  token,
}: QuoteStepsProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [preferredDate, setPreferredDate] = useState(
    quote.lead.requested_date || ''
  );
  const [preferredTime, setPreferredTime] = useState(
    quote.lead.requested_time || ''
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string>(
    '/images/quote-hero-placeholder.svg'
  );
  const [expandedPlanIndexes, setExpandedPlanIndexes] = useState<number[]>([0]);

  const signatureRef = useRef<SignatureCanvas>(null);

  const heroContent = {
    title: `Your Custom Pest Protection Plan Is Ready, ${quote.customer.first_name}`,
    subtitle: `Protect your home and family at <strong>${quote.service_address?.street_address} in ${quote.service_address?.city}</strong> from a local company trusted for over 50 years.`,
    buttonText: 'Review & Activate Your Plan',
    imageUrl: branding?.primary_hero_image_url ?? null,
  };

  const footer_links = {
    privacyUrl: company.privacy_policy_url,
    termsUrl: company.terms_conditions_url,
  };

  const footer_branding = {
    logoUrl: branding?.logo_url ?? null,
    companyName: company.name,
    phoneNumber: company.phone,
    email: company.email,
  };

  // If quote is already signed, redirect to thank you step
  useEffect(() => {
    if (quote.signed_at) {
      setCurrentStep(4);
    }
  }, [quote.signed_at]);

  // Update lead scheduling when date/time changes
  const updateLeadSchedule = async (
    field: 'requested_date' | 'requested_time',
    value: string
  ) => {
    if (!token) {
      console.error('Cannot update schedule: missing token');
      return;
    }

    try {
      const response = await fetch(`/api/leads/${quote.lead.id}/schedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: value || null,
          quote_id: quote.id,
          token: token,
        }),
      });

      if (!response.ok) {
        console.error('Failed to update lead schedule');
      }
    } catch (error) {
      console.error('Error updating lead schedule:', error);
    }
  };

  // Generate Street View or Satellite image URL for hero section
  useEffect(() => {
    const generateHeroImage = async () => {
      // If no service address, keep placeholder
      if (!quote.service_address) {
        return;
      }

      try {
        // Fetch API key from endpoint
        const apiKeyResponse = await fetch('/api/google-places-key');
        if (!apiKeyResponse.ok) {
          return;
        }
        const apiKeyData = await apiKeyResponse.json();
        const apiKey = apiKeyData.apiKey;

        if (!apiKey) {
          return;
        }

        // Prioritize using lat/lng coordinates if available, otherwise use address string
        let locationParam: string;
        if (quote.service_address.latitude && quote.service_address.longitude) {
          // Use precise coordinates for more accurate location
          locationParam = `${quote.service_address.latitude},${quote.service_address.longitude}`;
        } else {
          // Fall back to address string
          const addressString = `${quote.service_address.street_address}, ${quote.service_address.city}, ${quote.service_address.state} ${quote.service_address.zip_code}`;
          locationParam = encodeURIComponent(addressString);
        }

        // Check Street View availability
        const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${locationParam}&key=${apiKey}`;
        const metadataResponse = await fetch(metadataUrl);
        const metadata = await metadataResponse.json();

        if (metadata.status === 'OK') {
          // Street View is available
          const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=420x600&location=${locationParam}&key=${apiKey}`;
          setHeroImageUrl(streetViewUrl);
        } else {
          // Fallback to satellite view
          const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${locationParam}&zoom=18&size=420x600&maptype=satellite&key=${apiKey}`;
          setHeroImageUrl(satelliteUrl);
        }
      } catch (err) {
        // Keep default placeholder on error
      }
    };

    generateHeroImage();
  }, [
    quote.service_address?.latitude,
    quote.service_address?.longitude,
    quote.service_address?.street_address,
  ]);

  // Sort line items: regular plans first, add-ons last
  const sortedLineItems = [...quote.line_items].sort((a, b) => {
    const aIsAddon = Boolean(a.addon_service_id);
    const bIsAddon = Boolean(b.addon_service_id);

    // If one is addon and other isn't, addon goes last
    if (aIsAddon && !bIsAddon) return 1;
    if (!aIsAddon && bIsAddon) return -1;
    return 0; // Keep original order if both same type
  });

  // Apply branding colors and font via CSS variables
  const brandingStyle = {
    '--brand-primary': branding?.primary_color,
    '--brand-secondary': branding?.secondary_color,
    '--accent-color': branding?.alternative_colors[0].hex,
    '--primary-font': branding?.font_primary_name,
    '--secondary-font': branding?.font_secondary_name,
  } as React.CSSProperties;

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

  // Handle form submission
  const handleSubmit = async () => {
    if (!token) {
      setError('Invalid or missing access token.');
      return;
    }

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

      const response = await fetch(`/api/quotes/${quote.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature_data: signatureData,
          terms_accepted: termsAccepted,
          token: token,
          preferred_date: preferredDate,
          preferred_time: preferredTime,
          client_device_data: clientDeviceData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept quote');
      }

      // Move to completion step
      handleNext();
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear signature
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setHasSignature(false);
    }
  };

  // Get minimum date for date picker (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className={styles.quoteContainer} style={brandingStyle}>
      <HeaderSection
        logo={branding?.logo_url}
        companyName={company.name}
        buttonText={company.phone}
        phoneNumber={company.phone}
        removeBackground={currentStep === 1 ? false : true}
      />
      {/* Step 1: Plan Comparison */}
      {currentStep === 1 && (
        <>
          <HeroSection hero={heroContent} companyId={company.id} />
          <div className={styles.quoteStep}>
            <div className={styles.contentArea}>
              <PlanDetails
                quote={quote}
                expandedPlanIndexes={expandedPlanIndexes}
                setExpandedPlanIndexes={setExpandedPlanIndexes}
                onContinue={handleNext}
                sortedLineItems={sortedLineItems}
              />
            </div>
          </div>
        </>
      )}

      {/* Step 2: Contact & Scheduling */}
      {currentStep === 2 && (
        <div className={styles.quoteStep}>
          <div className={styles.quoteStepContent}>
            <div className={styles.contentArea}>
              <div className={styles.twoColumnGridContent}>
                <div className={styles.leftColumnContent}>
                  <h2 className={styles.stepHeading}>
                    Great! When would you like us to get started?
                  </h2>

                  <div className={styles.schedulingSection}>
                    <div className={styles.formGroupRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="start-date">
                          Preferred Start Date:
                        </label>
                        <input
                          type="date"
                          id="start-date"
                          value={preferredDate}
                          onChange={e => {
                            const newValue = e.target.value;
                            setPreferredDate(newValue);
                            updateLeadSchedule('requested_date', newValue);
                          }}
                          min={getMinDate()}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="arrival-time">
                          Preferred Arrival Time:
                        </label>
                        <select
                          id="arrival-time"
                          value={preferredTime}
                          onChange={e => {
                            const newValue = e.target.value;
                            setPreferredTime(newValue);
                            updateLeadSchedule('requested_time', newValue);
                          }}
                          className={styles.select}
                        >
                          <option value="">Select a time...</option>
                          <option value="morning">Morning (8am - 12pm)</option>
                          <option value="afternoon">
                            Afternoon (12pm - 4pm)
                          </option>
                          <option value="evening">Evening (4pm - 8pm)</option>
                          <option value="anytime">Anytime</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={styles.infoSection}>
                    <div className={styles.infoSectionRow}>
                      <div className={styles.infoColumn}>
                        <h3>Contact Details</h3>
                        <div className={styles.infoContent}>
                          <p>
                            <span>Name: </span>
                            {quote.customer.first_name}{' '}
                            {quote.customer.last_name}
                          </p>
                          <p>
                            <span>Email: </span>
                            {quote.customer.email}
                          </p>
                          <p>
                            <span>Phone: </span>
                            {quote.customer.phone}
                          </p>
                          {quote.service_address && (
                            <>
                              <p>
                                <span>Address: </span>
                                {quote.service_address.street_address},{' '}
                                {quote.service_address.apartment_unit && (
                                  <>{quote.service_address.apartment_unit}</>
                                )}
                                <br />
                                {quote.service_address.city},{' '}
                                {quote.service_address.state}{' '}
                                {quote.service_address.zip_code}
                              </p>
                            </>
                          )}
                          <p>
                            <span>Home Size: </span>
                            {formatHomeSizeRange(quote.home_size_range)}
                          </p>
                          <p>
                            <span>Yard Size: </span>
                            {formatYardSizeRange(quote.yard_size_range)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.rightColumnContent}>
                  <div className={styles.contactSectionImageWrapper}>
                    <Image
                      className={styles.contactSectionImage}
                      src={heroImageUrl}
                      alt=""
                      fill={true}
                      priority={true}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.bottomButtonsWrapper}>
                <button
                  type="button"
                  onClick={handleBack}
                  className={styles.backButton}
                  aria-label="Go back to previous step"
                >
                  Go Back
                </button>
                <button className={styles.primaryButton} onClick={handleNext}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Terms & Signature */}
      {currentStep === 3 && (
        <div className={styles.quoteStep}>
          <div className={styles.quoteStepContent}>
            <div className={styles.contentArea}>
              <h2 className={styles.stepHeading}>Review and Sign Agreement</h2>
              <QuoteTotalPricing quote={quote} lineItems={sortedLineItems} />

              <div className={styles.reviewInfoSection}>
                <div className={styles.reviewInfoContent}>
                  <h3>Contact Details</h3>
                  <div className={styles.reviewDetailsRow}>
                    <div className={styles.infoColumn}>
                      <div className={styles.infoContent}>
                        <p>
                          <span>Name: </span>
                          {quote.customer.first_name} {quote.customer.last_name}
                        </p>
                        <p>
                          <span>Email: </span>
                          {quote.customer.email}
                        </p>
                        <p>
                          <span>Phone: </span>
                          {quote.customer.phone}
                        </p>
                      </div>
                    </div>
                    <div className={styles.infoColumn}>
                      <div className={styles.infoContent}>
                        {quote.service_address && (
                          <>
                            <p>
                              <span>Address: </span>
                              {quote.service_address.street_address},{' '}
                              {quote.service_address.apartment_unit && (
                                <>{quote.service_address.apartment_unit}</>
                              )}
                              {quote.service_address.city},{' '}
                              {quote.service_address.state}{' '}
                              {quote.service_address.zip_code}
                            </p>
                          </>
                        )}
                        <p>
                          <span>Home Size: </span>
                          {formatHomeSizeRange(quote.home_size_range)}
                        </p>
                        <p>
                          <span>Yard Size: </span>
                          {formatYardSizeRange(quote.yard_size_range)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.contactSectionImageWrapper}>
                  <Image
                    className={styles.contactSectionImage}
                    src={heroImageUrl}
                    alt=""
                    fill={true}
                    priority={true}
                  />
                </div>
              </div>

              <div className={styles.termsSection}>
                <h3>Terms and Conditions</h3>
                <div className={styles.termsContent}>
                  <p>
                    By signing below, you agree to the following terms and
                    conditions:
                  </p>
                  <div
                    dangerouslySetInnerHTML={{ __html: company.quote_terms }}
                  />
                </div>

                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                  />
                  <label htmlFor="terms-checkbox" className={styles.termsLabel}>
                    I have read and accept the terms and conditions
                  </label>
                </div>

                <div className={styles.signatureSection}>
                  <h4>Signature</h4>
                  <p className={styles.signatureInstruction}>
                    Please sign in the box below using your mouse or finger
                  </p>
                  <div className={styles.signatureCanvas}>
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        className: styles.signaturePad,
                      }}
                      onEnd={() => setHasSignature(true)}
                    />
                  </div>
                  <div className={styles.signatureActions}>
                    <div className={styles.dateSection}>
                      <label>Date</label>
                      <input
                        type="text"
                        value={new Date().toLocaleDateString()}
                        readOnly
                        className={styles.input}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className={styles.secondaryButton}
                    >
                      Clear Signature
                    </button>
                  </div>
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.bottomButtonsWrapper}>
                <button
                  type="button"
                  onClick={handleBack}
                  className={styles.backButton}
                  aria-label="Go back to previous step"
                >
                  Go Back
                </button>
                <button
                  className={`${styles.primaryButton} ${styles.submitButton}`}
                  onClick={handleSubmit}
                  disabled={isSubmitting || !termsAccepted || !hasSignature}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Agreement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Completion */}
      {currentStep === 4 && (
        <div className={styles.quoteStep}>
          <div className={styles.quoteStepContent}>
            <div className={styles.contentArea}>
              <div className={styles.completionHeader}>
                <h2>Thank You, {quote.customer.first_name}!</h2>
              </div>

              {/* What's Next */}
              <div className={styles.summaryItem}>
                <div
                  className={styles.summaryContent}
                  dangerouslySetInnerHTML={{
                    __html: company.quote_thanks_content,
                  }}
                />
                <div className={styles.buttonWrapper}>
                  <Link href={company.website} className={styles.primaryButton}>
                    Return To Website
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <FooterSection links={footer_links} branding={footer_branding} />
    </div>
  );
}
