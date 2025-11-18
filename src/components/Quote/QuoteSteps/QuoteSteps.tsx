'use client';

import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { getClientDeviceData } from '@/lib/device-utils';
import styles from './quotesteps.module.scss';

interface Branding {
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  icon_logo_url: string;
  font_primary_name?: string;
  font_primary_url?: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  website: any;
}

interface Quote {
  id: string;
  primary_pest: string;
  additional_pests: string[];
  total_initial_price: number;
  total_recurring_price: number;
  line_items: any[];
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

// FAQ Item Component
interface FaqItemProps {
  faq: { question: string; answer: string };
}

function FaqItem({ faq }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${styles.dhFaqItem} ${isOpen ? styles.active : ''}`}>
      <div className={styles.dhFaqHeader} onClick={() => setIsOpen(!isOpen)}>
        <h4 className={styles.dhFaqQuestion}>{faq.question}</h4>
        <span
          className={styles.dhFaqIcon}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9L12 15L18 9"
              stroke="#515151"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      <div
        className={styles.dhFaqContent}
        style={{ maxHeight: isOpen ? '500px' : '0' }}
      >
        <div className={styles.dhFaqAnswer}>
          <p>{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function QuoteSteps({
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
  const [expandedPlanIndex, setExpandedPlanIndex] = useState<number>(-1);

  const signatureRef = useRef<SignatureCanvas>(null);

  // Check if multiple plans
  const isMultiplePlans = quote.line_items.length > 1;

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

        // Format the address for Google Maps API
        const addressString = `${quote.service_address.street_address}, ${quote.service_address.city}, ${quote.service_address.state} ${quote.service_address.zip_code}`;
        const encodedAddress = encodeURIComponent(addressString);

        // Check Street View availability
        const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodedAddress}&key=${apiKey}`;
        const metadataResponse = await fetch(metadataUrl);
        const metadata = await metadataResponse.json();

        if (metadata.status === 'OK') {
          // Street View is available
          const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=420x600&location=${encodedAddress}&key=${apiKey}`;
          setHeroImageUrl(streetViewUrl);
        } else {
          // Fallback to satellite view
          const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=18&size=420x600&maptype=satellite&key=${apiKey}`;
          setHeroImageUrl(satelliteUrl);
        }
      } catch (err) {
        // Keep default placeholder on error
      }
    };

    generateHeroImage();
  }, [quote.service_address]);

  // Apply branding colors and font via CSS variables
  const brandingStyle = {
    '--primary-color': branding?.primary_color || '#3b82f6',
    '--secondary-color': branding?.secondary_color || '#1e293b',
    '--primary-font': branding?.font_primary_name
      ? `"${branding.font_primary_name}", sans-serif`
      : 'Outfit, sans-serif',
  } as React.CSSProperties;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Abbreviate billing frequency
  const abbreviateFrequency = (frequency: string) => {
    const lowerFreq = frequency?.toLowerCase() || '';
    const abbreviations: Record<string, string> = {
      monthly: 'mo',
      quarterly: 'qtr',
      'semi-annually': 'semi',
      'semi-annual': 'semi',
      annually: 'yr',
      annual: 'yr',
    };
    return abbreviations[lowerFreq] || frequency;
  };

  // Get all pests covered
  const allPests = [
    quote.primary_pest,
    ...(quote.additional_pests || []),
  ].filter(Boolean);

  // Calculate original prices and discounts
  const calculateDiscounts = () => {
    let totalInitialDiscount = 0;
    let hasDiscounts = false;

    quote.line_items.forEach(item => {
      if (item.discount_amount > 0 || item.discount_percentage > 0) {
        hasDiscounts = true;
        const initialDiscount =
          (item.initial_price || 0) - (item.final_initial_price || 0);
        totalInitialDiscount += initialDiscount;
      }
    });

    return { totalInitialDiscount, hasDiscounts };
  };

  const { totalInitialDiscount, hasDiscounts } = calculateDiscounts();

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
    <div className={styles.dhFormWidget} style={brandingStyle}>
      {/* Step 1: Plan Comparison */}
      {currentStep === 1 && (
        <div className={styles.dhFormStep}>
          <div className={styles.dhFormStepContent}>
            <div className={styles.dhFormContentArea}>
              {branding?.logo_url && (
                <div className={styles.companyLogo}>
                  <img src={branding.logo_url} alt={company.name} />
                </div>
              )}

              <h2 className={styles.stepHeading}>
                Here&apos;s your custom quote, {quote.customer.first_name}.
              </h2>

              {/* Plans Container */}
              <div className={styles.plansContainer}>
                {quote.line_items.map((item, index) => {
                  const hasDiscount =
                    item.discount_amount > 0 || item.discount_percentage > 0;
                  const isExpanded = expandedPlanIndex === index;

                  return (
                    <div
                      key={index}
                      className={`${styles.dhPlanBox} ${
                        isMultiplePlans ? styles.collapsible : ''
                      } ${isExpanded ? styles.expanded : ''}`}
                    >
                      {/* Collapsible Header */}
                      {isMultiplePlans && (
                        <div
                          className={styles.dhPlanHeader}
                          onClick={() =>
                            setExpandedPlanIndex(isExpanded ? -1 : index)
                          }
                        >
                          <span className={styles.dhPlanHeaderTitle}>
                            {item.plan_name}
                          </span>
                          <div className={styles.dhPlanHeaderPricing}>
                            <span className={styles.dhPlanHeaderRecurring}>
                              $
                              {item.final_recurring_price ||
                                item.recurring_price ||
                                0}
                              /
                              {abbreviateFrequency(
                                item.billing_frequency || 'monthly'
                              )}
                            </span>
                            <span className={styles.dhPlanHeaderDivider}>
                              |
                            </span>
                            <span className={styles.dhPlanHeaderInitial}>
                              Initial: $
                              {item.final_initial_price ||
                                item.initial_price ||
                                0}
                            </span>
                          </div>
                          <span className={styles.dhPlanHeaderIcon}>
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                            >
                              <path
                                d="M5 7.5L10 12.5L15 7.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </div>
                      )}

                      {/* Plan Content */}
                      <div
                        className={styles.dhPlanContentWrapper}
                        style={{
                          maxHeight:
                            !isMultiplePlans || isExpanded ? '3000px' : '0',
                        }}
                      >
                        <div className={styles.dhPlanContent}>
                          {/* RECOMMENDED Badge */}
                          {item.is_recommended && (
                            <div className={styles.dhRecommendationBadge}>
                              <span className={styles.dhRecommendationText}>
                                RECOMMENDED
                              </span>
                            </div>
                          )}

                          {/* Plan Title - only show for single plans */}
                          {!isMultiplePlans && (
                            <h3 className={styles.dhPlanTitle}>
                              {item.plan_name}
                            </h3>
                          )}

                          {/* Plan Description */}
                          {item.plan_description && (
                            <p className={styles.dhPlanDescription}>
                              {item.plan_description}
                            </p>
                          )}

                          {/* Features List */}
                          {item.service_plan?.plan_features &&
                            item.service_plan.plan_features.length > 0 && (
                              <div className={styles.dhPlanIncluded}>
                                <h4>What&apos;s Included:</h4>
                                <ul className={styles.dhPlanFeaturesList}>
                                  {item.service_plan.plan_features.map(
                                    (feature: string, fIndex: number) => (
                                      <li
                                        key={fIndex}
                                        className={styles.dhPlanFeature}
                                      >
                                        <span
                                          className={styles.dhFeatureCheckmark}
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                          >
                                            <g clipPath="url(#clip0_6146_560)">
                                              <path
                                                d="M18.1678 8.33332C18.5484 10.2011 18.2772 12.1428 17.3994 13.8348C16.5216 15.5268 15.0902 16.8667 13.3441 17.6311C11.5979 18.3955 9.64252 18.5381 7.80391 18.0353C5.9653 17.5325 4.35465 16.4145 3.24056 14.8678C2.12646 13.3212 1.57626 11.4394 1.68171 9.53615C1.78717 7.63294 2.54189 5.8234 3.82004 4.4093C5.09818 2.9952 6.82248 2.06202 8.70538 1.76537C10.5883 1.46872 12.516 1.82654 14.167 2.77916"
                                                stroke="#00AE42"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M7.5 9.16659L10 11.6666L18.3333 3.33325"
                                                stroke="#00AE42"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </g>
                                            <defs>
                                              <clipPath id="clip0_6146_560">
                                                <rect
                                                  width="20"
                                                  height="20"
                                                  fill="white"
                                                />
                                              </clipPath>
                                            </defs>
                                          </svg>
                                        </span>
                                        {feature}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {/* Pricing Section */}
                          <div className={styles.dhPlanPricingSection}>
                            <div className={styles.dhPlanPriceContainer}>
                              {/* Left: Recurring Price */}
                              <div className={styles.dhPlanPriceLeft}>
                                <div className={styles.dhPlanPriceRecurring}>
                                  <span className={styles.dhPriceDollar}>
                                    $
                                  </span>
                                  {item.final_recurring_price ||
                                    item.recurring_price ||
                                    0}
                                  <div className={styles.dhPriceSuffix}>
                                    <span className={styles.dhPriceAsterisk}>
                                      *
                                    </span>
                                    <div className={styles.dhPriceFrequency}>
                                      /
                                      {abbreviateFrequency(
                                        item.billing_frequency || 'monthly'
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Initial Price */}
                              <div className={styles.dhPlanPriceRight}>
                                <div className={styles.dhPlanPriceInitial}>
                                  Initial Only{' '}
                                  <span className={styles.dhPriceDollar}>
                                    $
                                  </span>
                                  <span className={styles.dhPriceNumber}>
                                    {item.final_initial_price ||
                                      item.initial_price ||
                                      0}
                                  </span>
                                </div>
                                {hasDiscount && (
                                  <div className={styles.dhPlanPriceNormally}>
                                    Normally{' '}
                                    <span className={styles.dhPriceDollar}>
                                      $
                                    </span>
                                    <span className={styles.dhPlanPriceCrossed}>
                                      {item.initial_price || 0}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Plan FAQs */}
                        {item.service_plan?.plan_faqs &&
                          item.service_plan.plan_faqs.length > 0 && (
                            <div className={styles.dhPlanFaqs}>
                              <h3 className={styles.dhFaqsTitle}>
                                {item.plan_name} FAQs
                              </h3>
                              <div className={styles.dhFaqsContainer}>
                                {item.service_plan.plan_faqs.map(
                                  (faq: any, faqIndex: number) => (
                                    <FaqItem key={faqIndex} faq={faq} />
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.totalPricing}>
                <div className={styles.totalRow}>
                  <span>Total Initial Cost:</span>
                  <strong>{formatCurrency(quote.total_initial_price)}</strong>
                </div>
                <div className={styles.totalRow}>
                  <span>Total Recurring Cost:</span>
                  <strong>
                    {formatCurrency(quote.total_recurring_price)}/month
                  </strong>
                </div>
              </div>

              <button className={styles.primaryButton} onClick={handleNext}>
                Continue
              </button>
            </div>

            <div className={styles.dhPestHero}>
              <div className={styles.dhPestBgImage} />
              <img
                className={styles.dhPestHeroImage}
                src={heroImageUrl}
                alt="Pest Control Hero"
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
              <button
                type="button"
                onClick={handleBack}
                className={styles.backButton}
                aria-label="Go back to previous step"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                >
                  <path
                    d="M14 27C21.1797 27 27 21.1797 27 14C27 6.8203 21.1797 1 14 1C6.8203 1 1 6.8203 1 14C1 21.1797 6.8203 27 14 27Z"
                    stroke="#B2B2B2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M20 14.0001C20 14.2762 19.7761 14.5001 19.5 14.5001H9.70721L13.354 18.1462C13.5493 18.3416 13.5493 18.6583 13.354 18.8537C13.1586 19.0491 12.8419 19.0491 12.6465 18.8537L8.14664 14.3539C8.05275 14.2601 8 14.1328 8 14.0001C8 13.8674 8.05275 13.7402 8.14664 13.6464L12.6465 9.14652C12.8419 8.95116 13.1586 8.95116 13.354 9.14652C13.5493 9.34189 13.5493 9.65864 13.354 9.854L9.70721 13.5001H19.5C19.7761 13.5001 20 13.724 20 14.0001Z"
                    fill="#515151"
                    stroke="#B2B2B2"
                  />
                </svg>
              </button>

              {branding?.logo_url && (
                <div className={styles.companyLogo}>
                  <img src={branding.logo_url} alt={company.name} />
                </div>
              )}

              <h2 className={styles.stepHeading}>
                Great! When do you want us to get started?
              </h2>

              <div className={styles.schedulingSection}>
                <div className={styles.formGroupRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="start-date">Preferred Start Date:</label>
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
                      <option value="afternoon">Afternoon (12pm - 4pm)</option>
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
                        {quote.customer.first_name} {quote.customer.last_name}
                      </p>
                      <p>{quote.customer.email}</p>
                      <p>{quote.customer.phone}</p>
                    </div>
                  </div>

                  {quote.service_address && (
                    <div className={styles.infoColumn}>
                      <h3>Service Address</h3>
                      <div className={styles.infoContent}>
                        <p>{quote.service_address.street_address}</p>
                        {quote.service_address.apartment_unit && (
                          <p>{quote.service_address.apartment_unit}</p>
                        )}
                        <p>
                          {quote.service_address.city},{' '}
                          {quote.service_address.state}{' '}
                          {quote.service_address.zip_code}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button className={styles.primaryButton} onClick={handleNext}>
                Continue
              </button>
            </div>

            <div className={styles.dhPestHero}>
              <div className={styles.dhPestBgImage} />
              <img
                className={styles.dhPestHeroImage}
                src={heroImageUrl}
                alt="Pest Control Hero"
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
              <button
                type="button"
                onClick={handleBack}
                className={styles.backButton}
                aria-label="Go back to previous step"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                >
                  <path
                    d="M14 27C21.1797 27 27 21.1797 27 14C27 6.8203 21.1797 1 14 1C6.8203 1 1 6.8203 1 14C1 21.1797 6.8203 27 14 27Z"
                    stroke="#B2B2B2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M20 14.0001C20 14.2762 19.7761 14.5001 19.5 14.5001H9.70721L13.354 18.1462C13.5493 18.3416 13.5493 18.6583 13.354 18.8537C13.1586 19.0491 12.8419 19.0491 12.6465 18.8537L8.14664 14.3539C8.05275 14.2601 8 14.1328 8 14.0001C8 13.8674 8.05275 13.7402 8.14664 13.6464L12.6465 9.14652C12.8419 8.95116 13.1586 8.95116 13.354 9.14652C13.5493 9.34189 13.5493 9.65864 13.354 9.854L9.70721 13.5001H19.5C19.7761 13.5001 20 13.724 20 14.0001Z"
                    fill="#515151"
                    stroke="#B2B2B2"
                  />
                </svg>
              </button>

              {branding?.logo_url && (
                <div className={styles.companyLogo}>
                  <img src={branding.logo_url} alt={company.name} />
                </div>
              )}

              <h2 className={styles.stepHeading}>Review and Sign Agreement</h2>

              <div className={styles.termsSection}>
                <h3>Terms and Conditions</h3>
                <div className={styles.termsContent}>
                  <p>
                    By signing below, you agree to the following terms and
                    conditions:
                  </p>
                  <ul>
                    <li>
                      Services will be provided as outlined in the quote above
                    </li>
                    <li>Payment is due upon completion of initial service</li>
                    <li>
                      Recurring services will be billed{' '}
                      {quote.line_items[0]?.billing_frequency || 'monthly'}
                    </li>
                    <li>
                      You may cancel recurring services at any time with 30 days
                      notice
                    </li>
                    <li>
                      All services are guaranteed according to company policy
                    </li>
                    <li>
                      Additional treatments may be required for severe
                      infestations
                    </li>
                  </ul>
                </div>

                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                  />
                  <label htmlFor="terms-checkbox">
                    I have read and accept the terms and conditions
                  </label>
                </div>
              </div>

              <div className={styles.signatureSection}>
                <h3>Signature</h3>
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
                <button
                  type="button"
                  onClick={clearSignature}
                  className={styles.secondaryButton}
                >
                  Clear Signature
                </button>
              </div>

              <div className={styles.dateSection}>
                <label>Date:</label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString()}
                  readOnly
                  className={styles.input}
                />
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
              <img
                className={styles.dhPestHeroImage}
                src={heroImageUrl}
                alt="Pest Control Hero"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Completion */}
      {currentStep === 4 && (
        <div className={styles.dhFormStep}>
          <div className={styles.dhFormStepContent}>
            <div className={styles.dhFormContentArea}>
              {branding?.logo_url && (
                <div className={styles.companyLogo}>
                  <img src={branding.logo_url} alt={company.name} />
                </div>
              )}

              <div className={styles.completionHeader}>
                <div className={styles.checkmark}>✓</div>
                <h2>Thank You, {quote.customer.first_name}!</h2>
                <p>
                  Your quote has been accepted and we&apos;ve received your
                  signed agreement.
                </p>
              </div>

              {/* What's Next */}
              <div className={`${styles.summaryItem}`}>
                <h4>What&apos;s Next?</h4>
                <ul>
                  <li>Review your service details below</li>
                  <li>
                    Our team will review your quote and preferred date &amp;
                    time for service
                  </li>
                  <li>
                    You&apos;ll receive a confirmation email within 24 hours
                  </li>
                  <li>
                    We&apos;ll follow up soon to confirm your first appointment
                  </li>
                </ul>
              </div>

              {/* Contact Details */}
              <div className={styles.summaryItem}>
                <h4>Contact Details:</h4>
                <p>
                  {(quote.customer.first_name || quote.customer.last_name) && (
                    <>
                      <strong>Name:</strong> {quote.customer.first_name}{' '}
                      {quote.customer.last_name}
                      <br />
                    </>
                  )}
                  {quote.service_address && (
                    <>
                      <strong>Address:</strong>{' '}
                      {quote.service_address.street_address}
                      {quote.service_address.apartment_unit &&
                        `, ${quote.service_address.apartment_unit}`}
                      , {quote.service_address.city},{' '}
                      {quote.service_address.state}{' '}
                      {quote.service_address.zip_code}
                      <br />
                    </>
                  )}
                  {quote.customer.phone && (
                    <>
                      <strong>Phone:</strong> {quote.customer.phone}
                      <br />
                    </>
                  )}
                  {quote.customer.email && (
                    <>
                      <strong>Email:</strong> {quote.customer.email}
                    </>
                  )}
                </p>
              </div>

              {/* Requested Service Time */}
              {(preferredDate || preferredTime) && (
                <div className={styles.summaryItem}>
                  <h4>Requested Service Time:</h4>
                  <p>
                    {preferredDate && (
                      <span>
                        {new Date(preferredDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                    {preferredDate && preferredTime && ' - '}
                    {preferredTime && (
                      <span>
                        {preferredTime === 'morning' && 'Morning (8am - 12pm)'}
                        {preferredTime === 'afternoon' &&
                          'Afternoon (12pm - 4pm)'}
                        {preferredTime === 'evening' && 'Evening (4pm - 8pm)'}
                        {preferredTime === 'anytime' && 'Anytime'}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Service Plans - Same as Step 1 */}
              <div className={styles.plansContainer}>
                {quote.line_items.map((item, index) => {
                  const hasDiscount =
                    item.discount_amount > 0 || item.discount_percentage > 0;
                  const isExpanded = expandedPlanIndex === index;

                  return (
                    <div
                      key={index}
                      className={`${styles.dhPlanBox} ${
                        isMultiplePlans ? styles.collapsible : ''
                      } ${isExpanded ? styles.expanded : ''}`}
                    >
                      {/* Collapsible Header */}
                      {isMultiplePlans && (
                        <div
                          className={styles.dhPlanHeader}
                          onClick={() =>
                            setExpandedPlanIndex(isExpanded ? -1 : index)
                          }
                        >
                          <span className={styles.dhPlanHeaderTitle}>
                            {item.plan_name}
                          </span>
                          <div className={styles.dhPlanHeaderPricing}>
                            <span className={styles.dhPlanHeaderRecurring}>
                              $
                              {item.final_recurring_price ||
                                item.recurring_price ||
                                0}
                              /
                              {abbreviateFrequency(
                                item.billing_frequency || 'monthly'
                              )}
                            </span>
                            <span className={styles.dhPlanHeaderDivider}>
                              |
                            </span>
                            <span className={styles.dhPlanHeaderInitial}>
                              Initial: $
                              {item.final_initial_price ||
                                item.initial_price ||
                                0}
                            </span>
                          </div>
                          <span className={styles.dhPlanHeaderIcon}>
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                            >
                              <path
                                d="M5 7.5L10 12.5L15 7.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </div>
                      )}

                      {/* Plan Content */}
                      <div
                        className={styles.dhPlanContentWrapper}
                        style={{
                          maxHeight:
                            !isMultiplePlans || isExpanded ? '3000px' : '0',
                        }}
                      >
                        <div className={styles.dhPlanContent}>
                          {/* RECOMMENDED Badge */}
                          {item.is_recommended && (
                            <div className={styles.dhRecommendationBadge}>
                              <span className={styles.dhRecommendationText}>
                                RECOMMENDED
                              </span>
                            </div>
                          )}

                          {/* Plan Title - only show for single plans */}
                          {!isMultiplePlans && (
                            <h3 className={styles.dhPlanTitle}>
                              {item.plan_name}
                            </h3>
                          )}

                          {/* Plan Description */}
                          {item.plan_description && (
                            <p className={styles.dhPlanDescription}>
                              {item.plan_description}
                            </p>
                          )}

                          {/* Features List */}
                          {item.service_plan?.plan_features &&
                            item.service_plan.plan_features.length > 0 && (
                              <div className={styles.dhPlanIncluded}>
                                <h4>What&apos;s Included:</h4>
                                <ul className={styles.dhPlanFeaturesList}>
                                  {item.service_plan.plan_features.map(
                                    (feature: string, fIndex: number) => (
                                      <li
                                        key={fIndex}
                                        className={styles.dhPlanFeature}
                                      >
                                        <span
                                          className={styles.dhFeatureCheckmark}
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                          >
                                            <g clipPath="url(#clip0_6146_560)">
                                              <path
                                                d="M18.1678 8.33332C18.5484 10.2011 18.2772 12.1428 17.3994 13.8348C16.5216 15.5268 15.0902 16.8667 13.3441 17.6311C11.5979 18.3955 9.64252 18.5381 7.80391 18.0353C5.9653 17.5325 4.35465 16.4145 3.24056 14.8678C2.12646 13.3212 1.57626 11.4394 1.68171 9.53615C1.78717 7.63294 2.54189 5.8234 3.82004 4.4093C5.09818 2.9952 6.82248 2.06202 8.70538 1.76537C10.5883 1.46872 12.516 1.82654 14.167 2.77916"
                                                stroke="#00AE42"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M7.5 9.16659L10 11.6666L18.3333 3.33325"
                                                stroke="#00AE42"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </g>
                                            <defs>
                                              <clipPath id="clip0_6146_560">
                                                <rect
                                                  width="20"
                                                  height="20"
                                                  fill="white"
                                                />
                                              </clipPath>
                                            </defs>
                                          </svg>
                                        </span>
                                        {feature}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {/* Pricing Section */}
                          <div className={styles.dhPlanPricingSection}>
                            <div className={styles.dhPlanPriceContainer}>
                              {/* Left: Recurring Price */}
                              <div className={styles.dhPlanPriceLeft}>
                                <div className={styles.dhPlanPriceRecurring}>
                                  <span className={styles.dhPriceDollar}>
                                    $
                                  </span>
                                  {item.final_recurring_price ||
                                    item.recurring_price ||
                                    0}
                                  <div className={styles.dhPriceSuffix}>
                                    <span className={styles.dhPriceAsterisk}>
                                      *
                                    </span>
                                    <div className={styles.dhPriceFrequency}>
                                      /
                                      {abbreviateFrequency(
                                        item.billing_frequency || 'monthly'
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Initial Price */}
                              <div className={styles.dhPlanPriceRight}>
                                <div className={styles.dhPlanPriceInitial}>
                                  Initial Only{' '}
                                  <span className={styles.dhPriceDollar}>
                                    $
                                  </span>
                                  <span className={styles.dhPriceNumber}>
                                    {item.final_initial_price ||
                                      item.initial_price ||
                                      0}
                                  </span>
                                </div>
                                {hasDiscount && (
                                  <div className={styles.dhPlanPriceNormally}>
                                    Normally{' '}
                                    <span className={styles.dhPriceDollar}>
                                      $
                                    </span>
                                    <span className={styles.dhPlanPriceCrossed}>
                                      {item.initial_price || 0}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Plan FAQs */}
                        {item.service_plan?.plan_faqs &&
                          item.service_plan.plan_faqs.length > 0 && (
                            <div className={styles.dhPlanFaqs}>
                              <h3 className={styles.dhFaqsTitle}>
                                {item.plan_name} FAQs
                              </h3>
                              <div className={styles.dhFaqsContainer}>
                                {item.service_plan.plan_faqs.map(
                                  (faq: any, faqIndex: number) => (
                                    <FaqItem key={faqIndex} faq={faq} />
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.totalPricing}>
                <div className={styles.totalRow}>
                  <span>Total Initial Cost:</span>
                  <strong>{formatCurrency(quote.total_initial_price)}</strong>
                </div>
                <div className={styles.totalRow}>
                  <span>Total Recurring Cost:</span>
                  <strong>
                    {formatCurrency(quote.total_recurring_price)}/month
                  </strong>
                </div>
              </div>

              {/* Simplified Summary Section */}
              <div className={styles.completionSummary}>
                {/* Contact Info */}
                {(company.phone?.length > 0 || company.email?.length > 0) && (
                  <div
                    className={`${styles.summaryItem} ${styles.summaryItemCentered}`}
                  >
                    <h4>Questions? Contact us:</h4>
                    <p>
                      {company.phone?.length > 0 && (
                        <>
                          <strong>Phone:</strong> {company.phone}
                          {company.email?.length > 0 && <br />}
                        </>
                      )}
                      {company.email?.length > 0 && (
                        <>
                          <strong>Email:</strong> {company.email}
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.dhPestHero}>
              <div className={styles.dhPestBgImage} />
              <img
                className={styles.dhPestHeroImage}
                src={heroImageUrl}
                alt="Pest Control Hero"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
