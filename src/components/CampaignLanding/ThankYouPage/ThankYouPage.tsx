'use client';

/**
 * Thank You Page Component
 *
 * Full-page version shown when campaign has already been redeemed
 */

import { formatDiscount } from '@/lib/campaign-utils';
import styles from './ThankYouPage.module.scss';

interface ThankYouPageProps {
  campaign: {
    id: string;
    campaign_id: string;
    name: string;
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
  };
  branding: {
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    phoneNumber: string | null;
    email: string | null;
    companyName: string;
  };
}

const timeLabels: Record<string, string> = {
  morning: 'Morning (8am - 12pm)',
  afternoon: 'Afternoon (12pm - 4pm)',
  evening: 'Evening (4pm - 8pm)',
  anytime: 'Anytime',
};

export default function ThankYouPage({
  campaign,
  customer,
  company,
  redemption,
  branding,
}: ThankYouPageProps) {
  return (
    <div
      className={styles.thankYouPage}
      style={{
        '--brand-primary': branding.primaryColor,
        '--brand-secondary': branding.secondaryColor,
      } as React.CSSProperties}
    >
      <div className={styles.container}>
        {branding.logoUrl && (
          <div className={styles.logo}>
            <img src={branding.logoUrl} alt={branding.companyName} />
          </div>
        )}

        <div className={styles.completionHeader}>
          <div className={styles.checkmark}>✓</div>
          <h1>Thank You, {customer.first_name}!</h1>
          <p>Your campaign offer has already been redeemed.</p>
          {redemption.redeemedAt && (
            <p className={styles.redeemedDate}>
              Redeemed on {new Date(redemption.redeemedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <h3>What&apos;s Next?</h3>
            <ul>
              <li>Our team will review your request</li>
              <li>You&apos;ll receive a confirmation email within 24 hours</li>
              <li>We&apos;ll contact you to schedule your service</li>
            </ul>
          </div>

          {campaign.discount && (
            <div className={styles.summaryCard}>
              <h3>Your Discount:</h3>
              <p className={styles.discountSummary}>
                {formatDiscount(campaign.discount)}
              </p>
            </div>
          )}

          <div className={styles.summaryCard}>
            <h3>Contact Details:</h3>
            <p>
              <strong>Name:</strong> {customer.first_name} {customer.last_name}
            </p>
            <p>
              <strong>Email:</strong> {customer.email}
            </p>
            <p>
              <strong>Phone:</strong> {customer.phone_number}
            </p>
            {customer.service_address && (
              <>
                <p>
                  <strong>Service Address:</strong>
                </p>
                <p>{customer.service_address.street_address}</p>
                <p>
                  {customer.service_address.city}, {customer.service_address.state}{' '}
                  {customer.service_address.zip_code}
                </p>
              </>
            )}
          </div>

          {(redemption.requestedDate || redemption.requestedTime) && (
            <div className={styles.summaryCard}>
              <h3>Requested Service Time:</h3>
              {redemption.requestedDate && (
                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(redemption.requestedDate).toLocaleDateString()}
                </p>
              )}
              {redemption.requestedTime && (
                <p>
                  <strong>Time:</strong>{' '}
                  {timeLabels[redemption.requestedTime] || redemption.requestedTime}
                </p>
              )}
            </div>
          )}

          <div className={styles.summaryCard}>
            <h3>Questions? Contact us:</h3>
            <p>
              <strong>Company:</strong> {branding.companyName}
            </p>
            {branding.phoneNumber && (
              <p>
                <strong>Phone:</strong> {branding.phoneNumber}
              </p>
            )}
            {branding.email && (
              <p>
                <strong>Email:</strong> {branding.email}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
