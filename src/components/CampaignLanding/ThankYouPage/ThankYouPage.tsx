'use client';

/**
 * Thank You Page Component
 *
 * Full-page version shown when campaign has already been redeemed
 * Matches Figma design with customizable sections
 */

import { useEffect } from 'react';
import HeaderSection from '../CampaignLandingPage/sections/HeaderSection';
import FooterSection from '../CampaignLandingPage/sections/FooterSection';
import { formatBusinessHoursForDisplay } from '@/lib/format-business-hours';
import styles from './ThankYouPage.module.scss';

interface ThankYouPageProps {
  campaign: {
    id: string;
    campaign_id: string;
    name: string;
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
    website: string[];
  };
  redemption: {
    isRedeemed: boolean;
    redeemedAt: string | null;
    requestedDate: string | null;
    requestedTime: string | null;
  };
  thankYou: {
    greeting: string;
    content: string | null;
    showExpect: boolean;
    expectHeading: string;
    expectColumns: Array<{
      imageUrl: string | null;
      heading: string | null;
      content: string | null;
    }>;
    ctaText: string;
    ctaUrl: string | null;
  };
  branding: {
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    phoneNumber: string | null;
    email: string | null;
    companyName: string;
    fontPrimaryName: string | null;
    fontPrimaryUrl: string | null;
  };
  header: {
    primaryButtonText: string;
    secondaryButtonText: string;
    showCta: boolean;
  };
  footer: {
    tagline: string;
    links: Array<{ label: string; url: string }>;
    termsUrl?: string | null;
    privacyUrl?: string | null;
  };
  businessHours?: {
    [day: string]: {
      start: string;
      end: string;
      closed: boolean;
    };
  } | null;
}

const timeLabels: Record<string, string> = {
  morning: 'Morning (8am - 12pm)',
  afternoon: 'Afternoon (12pm - 4pm)',
  evening: 'Evening (4pm - 8pm)',
  anytime: 'Anytime',
};

// Variable replacement helper
const replaceVariables = (
  text: string,
  customer: ThankYouPageProps['customer'],
  company: ThankYouPageProps['company']
): string => {
  return text
    .replace(/{first_name}/g, customer.first_name)
    .replace(/{last_name}/g, customer.last_name)
    .replace(/{email}/g, customer.email)
    .replace(/{phone_number}/g, customer.phone_number)
    .replace(/{company_name}/g, company.name)
    .replace(/{service_address}/g, customer.service_address?.street_address || '')
    .replace(/{city}/g, customer.service_address?.city || '')
    .replace(/{state}/g, customer.service_address?.state || '')
    .replace(/{zip_code}/g, customer.service_address?.zip_code || '');
};

export default function ThankYouPage({
  campaign,
  customer,
  company,
  redemption,
  thankYou,
  branding,
  header,
  footer,
  businessHours,
}: ThankYouPageProps) {
  // Load brand primary font dynamically
  useEffect(() => {
    if (branding.fontPrimaryName && branding.fontPrimaryUrl) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = branding.fontPrimaryUrl;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [branding.fontPrimaryName, branding.fontPrimaryUrl]);

  const greeting = replaceVariables(thankYou.greeting, customer, company);
  const content = thankYou.content
    ? replaceVariables(thankYou.content, customer, company)
    : null;

  // Determine CTA URL: use configured URL or fallback to company website
  const ctaUrl = thankYou.ctaUrl || (company.website && company.website[0]) || '#';

  const handleCtaClick = () => {
    if (ctaUrl && ctaUrl !== '#') {
      window.open(ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={styles.thankYouPage}
      style={{
        '--brand-primary': branding.primaryColor,
        '--brand-secondary': branding.secondaryColor,
        '--accent-color': branding.primaryColor,
        '--font-primary': branding.fontPrimaryName
          ? `"${branding.fontPrimaryName}", sans-serif`
          : '"Inter Tight", sans-serif',
      } as React.CSSProperties}
    >
      {/* Header Section */}
      {header.showCta && (
        <HeaderSection
          logo={branding.logoUrl}
          companyName={branding.companyName}
          primaryButtonText={header.primaryButtonText}
          secondaryButtonText={
            branding.phoneNumber
              ? `Call ${branding.phoneNumber}`
              : header.secondaryButtonText
          }
          phoneNumber={branding.phoneNumber}
          onPrimaryClick={() => {}} // No action on thank you page
          hidePrimaryButton={true}
          removeBackground={true}
        />
      )}

      {/* Main Content */}
      <div className={styles.container}>
        {/* Greeting Section */}
        <div className={styles.greetingSection}>
          <h1 className={styles.greeting}>{greeting}</h1>
          {content && (
            <div
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>

        {/* 3-Column Info Section */}
        <div className={styles.infoSection}>
          {/* Contact Details */}
          <div className={styles.infoColumn}>
            <h3 className={styles.infoHeading}>Contact Details</h3>
            <div className={styles.infoContent}>
              <p>
                <strong>{customer.first_name} {customer.last_name}</strong>
              </p>
              <p>{customer.email}</p>
              <p>{customer.phone_number}</p>
            </div>
          </div>

          {/* Service Address */}
          <div className={styles.infoColumn}>
            <h3 className={styles.infoHeading}>Service Address</h3>
            <div className={styles.infoContent}>
              {customer.service_address ? (
                <>
                  <p>{customer.service_address.street_address}</p>
                  <p>
                    {customer.service_address.city}, {customer.service_address.state}{' '}
                    {customer.service_address.zip_code}
                  </p>
                </>
              ) : (
                <p>No address provided</p>
              )}
            </div>
          </div>

          {/* Requested Service Timeframe */}
          <div className={styles.infoColumn}>
            <h3 className={styles.infoHeading}>Requested Service Timeframe</h3>
            <div className={styles.infoContent}>
              {redemption.requestedDate ? (
                <p>
                  {new Date(redemption.requestedDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              ) : null}
              {redemption.requestedTime ? (
                <p>
                  {timeLabels[redemption.requestedTime] || redemption.requestedTime}
                </p>
              ) : null}
              {!redemption.requestedDate && !redemption.requestedTime && (
                <p>Not specified</p>
              )}
            </div>
          </div>
        </div>

        {/* What To Expect Section */}
        {thankYou.showExpect && thankYou.expectColumns.length > 0 && (
          <div className={styles.expectSection}>
            <h2 className={styles.expectHeading}>{thankYou.expectHeading}</h2>
            <div
              className={styles.expectColumns}
              style={{
                gridTemplateColumns: `repeat(${thankYou.expectColumns.length}, 1fr)`,
              }}
            >
              {thankYou.expectColumns.map((column, index) => (
                <div key={index} className={styles.expectColumn}>
                  {column.imageUrl && (
                    <div className={styles.expectImage}>
                      <img src={column.imageUrl} alt={column.heading || ''} />
                    </div>
                  )}
                  {column.heading && (
                    <h3 className={styles.expectColumnHeading}>{column.heading}</h3>
                  )}
                  {column.content && (
                    <div
                      className={styles.expectColumnContent}
                      dangerouslySetInnerHTML={{ __html: column.content }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Office Hours Section */}
        {businessHours && (() => {
          const formattedHours = formatBusinessHoursForDisplay(businessHours);

          if (formattedHours.length === 0) return null;

          return (
            <div className={styles.officeHoursSection}>
              <h3 className={styles.officeHoursHeading}>Office Hours</h3>
              <div className={styles.officeHoursList}>
                {formattedHours.map((item, index) => (
                  <div key={index} className={styles.officeHourRow}>
                    <span className={styles.officeHourDays}>{item.days}:</span>
                    <span className={styles.officeHourTime}>{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* CTA Button */}
        <div className={styles.ctaSection}>
          <button
            className={styles.ctaButton}
            onClick={handleCtaClick}
            disabled={ctaUrl === '#'}
          >
            {thankYou.ctaText}
          </button>
        </div>
      </div>

      {/* Footer Section */}
      <FooterSection
        footer={footer}
        branding={branding}
        serviceName={campaign.name}
        hideOffers={true}
      />
    </div>
  );
}
