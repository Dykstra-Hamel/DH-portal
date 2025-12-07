/**
 * Inline Redemption Card Component
 *
 * Displays a redemption form inline with the landing page for immediate campaign redemption
 */

'use client';

import { useState, useMemo } from 'react';
import styles from './InlineRedemptionCard.module.scss';
import { processTextWithVariables, type VariableContext } from '@/lib/campaign-text-processing';

interface InlineRedemptionCardProps {
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
  campaign: {
    id: string;
    campaign_id: string;
  };
  pricing: {
    displayPrice: string;
    originalPrice: string | null;
    savings: string | null;
    priceAmount: string;
    priceFrequency: string;
  };
  addons: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
  }>;
  landingPage?: {
    redemptionCard?: {
      heading?: string;
      disclaimer?: string;
    };
  };
  company?: VariableContext['company'];
  branding?: VariableContext['branding'];
  serviceName?: string;
  onRedeem: (data: {
    startDate: Date | null;
    serviceTime: string;
    phoneNumber: string;
    selectedAddonIds: string[];
  }) => Promise<void>;
}

export default function InlineRedemptionCard({
  customer,
  campaign,
  pricing,
  addons,
  landingPage,
  company,
  branding,
  serviceName,
  onRedeem,
}: InlineRedemptionCardProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [serviceTime, setServiceTime] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>(customer.phone_number || '');
  const [selectedAddonId, setSelectedAddonId] = useState<string>('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Create variable context for text processing
  const variableContext = useMemo(
    () => ({
      customer,
      pricing,
      company: company || { name: '' },
      branding: branding || {
        logoUrl: null,
        primaryColor: '#00B142',
        secondaryColor: '#484848',
        phoneNumber: null,
        email: null,
        companyName: '',
        accentColorPreference: 'primary' as const,
        fontPrimaryName: null,
        fontPrimaryUrl: null,
      },
      serviceName: serviceName || '',
    }),
    [customer, pricing, company, branding, serviceName]
  );

  // Process heading with variables
  const defaultHeading = `<span class="${styles.strikethrough}">{original_price}</span> <span class="${styles.highlight}">{display_price}</span> Initial Startup Fee* & Only {display_price} Thereafter`;
  const headingText = landingPage?.redemptionCard?.heading || defaultHeading;
  const processedHeading = useMemo(
    () => processTextWithVariables(headingText, variableContext),
    [headingText, variableContext]
  );

  // Process disclaimer with variables
  const defaultDisclaimer = 'Limited time offer. Subject to service availability. See terms for details.';
  const disclaimerText = landingPage?.redemptionCard?.disclaimer || defaultDisclaimer;
  const processedDisclaimer = useMemo(
    () => processTextWithVariables(disclaimerText, variableContext),
    [disclaimerText, variableContext]
  );

  const handleRedeemClick = async () => {
    setIsRedeeming(true);
    try {
      await onRedeem({
        startDate: startDate ? new Date(startDate) : null,
        serviceTime,
        phoneNumber,
        selectedAddonIds: selectedAddonId ? [selectedAddonId] : [],
      });
    } catch (error) {
      console.error('Redemption error:', error);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className={styles.redemptionCard}>
      <div
        className={styles.heading}
        dangerouslySetInnerHTML={{ __html: processedHeading }}
      />

      <h3 className={styles.subheading}>When do you want us to get started?</h3>

      <div className={styles.inputGrid}>
        {/* Start Date Input */}
        <div className={styles.inputField}>
          <svg
            className={styles.icon}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M16 14V16.2L17.6 17.2"
              stroke="#484848"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 2V6"
              stroke="#484848"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 7.5V6C21 5.46957 20.7893 4.96086 20.4142 4.58579C20.0391 4.21071 19.5304 4 19 4H5C4.46957 4 3.96086 4.21071 3.58579 4.58579C3.21071 4.96086 3 5.46957 3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H8.5"
              stroke="#484848"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 10H8"
              stroke="#484848"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 2V6"
              stroke="#484848"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 22C19.3137 22 22 19.3137 22 16C22 12.6863 19.3137 10 16 10C12.6863 10 10 12.6863 10 16C10 19.3137 12.6863 22 16 22Z"
              stroke="#484848"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Service Time Dropdown */}
        <div className={styles.inputField}>
          <svg
            className={styles.icon}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 6V12L15.644 13.822"
              stroke="#484848"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 19H22"
              stroke="#484848"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 16V22"
              stroke="#484848"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21.92 13.267C22.1842 11.1977 21.7946 9.09756 20.8058 7.26068C19.8171 5.4238 18.2786 3.94213 16.4058 3.02314C14.5331 2.10414 12.4198 1.79383 10.3619 2.13566C8.304 2.47749 6.40452 3.45434 4.92943 4.92943C3.45434 6.40452 2.47749 8.304 2.13566 10.3619C1.79383 12.4198 2.10414 14.5331 3.02314 16.4058C3.94213 18.2786 5.4238 19.8171 7.26068 20.8058C9.09756 21.7946 11.1977 22.1842 13.267 21.92"
              stroke="#484848"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <select
            value={serviceTime}
            onChange={(e) => setServiceTime(e.target.value)}
            className={serviceTime ? '' : styles.placeholder}
          >
            <option value="">Service Time</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="anytime">Anytime</option>
          </select>
        </div>
      </div>

      {/* Phone Number Input */}
      <div className={styles.phoneField}>
        <label htmlFor="phone-number">Best Contact Phone Number</label>
        <input
          id="phone-number"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Add-on Services Dropdown */}
      {addons.length > 0 && (
        <div className={styles.addonsField}>
          <label htmlFor="addons">I&apos;m Also Interested In:</label>
          <div className={styles.selectWrapper}>
            <select
              id="addons"
              value={selectedAddonId}
              onChange={(e) => setSelectedAddonId(e.target.value)}
              className={selectedAddonId ? '' : styles.placeholder}
            >
              <option value="">Choose an additional service</option>
              {addons.map((addon) => (
                <option key={addon.id} value={addon.id}>
                  {addon.name}
                </option>
              ))}
            </select>
            <svg
              className={styles.dropdownArrow}
              xmlns="http://www.w3.org/2000/svg"
              width="9"
              height="6"
              viewBox="0 0 9 6"
              fill="none"
            >
              <path d="M4.33008 6L-4.90665e-05 -8.15666e-07L8.66021 -5.85621e-08L4.33008 6Z" fill="#484848" />
            </svg>
          </div>
        </div>
      )}

      {/* Redeem Button */}
      <button
        className={styles.redeemButton}
        onClick={handleRedeemClick}
        disabled={isRedeeming}
      >
        {isRedeeming ? 'Redeeming...' : 'Redeem One-Time Offer'}
      </button>

      {/* Disclaimer */}
      <div
        className={styles.disclaimer}
        dangerouslySetInnerHTML={{ __html: processedDisclaimer }}
      />
    </div>
  );
}
