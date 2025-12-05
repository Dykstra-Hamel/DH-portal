'use client';

/**
 * Thank You Step Component
 *
 * Final step of redemption modal - confirmation and next steps
 */

import { formatDiscount } from '@/lib/campaign-utils';
import styles from '../RedemptionModal.module.scss';

interface ThankYouStepProps {
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
    name: string;
    discount: {
      id: string;
      discount_type: 'percentage' | 'fixed';
      discount_value: number;
      name: string;
    } | null;
  };
  company: {
    id: string;
    name: string;
    slug: string;
  };
  branding: {
    phoneNumber: string | null;
    email: string | null;
    companyName: string;
  };
  scheduleData: {
    date: string;
    time: string;
  };
  onClose: () => void;
}

const timeLabels: Record<string, string> = {
  morning: 'Morning (8am - 12pm)',
  afternoon: 'Afternoon (12pm - 4pm)',
  evening: 'Evening (4pm - 8pm)',
  anytime: 'Anytime',
};

export default function ThankYouStep({
  customer,
  campaign,
  company,
  branding,
  scheduleData,
  onClose,
}: ThankYouStepProps) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.completionHeader}>
        <div className={styles.checkmark}>✓</div>
        <h2>Thank You, {customer.first_name}!</h2>
        <p>Your campaign offer has been redeemed successfully.</p>
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
        <p>
          <strong>Name:</strong> {customer.first_name} {customer.last_name}
        </p>
        <p>
          <strong>Email:</strong> {customer.email}
        </p>
        <p>
          <strong>Phone:</strong> {customer.phone_number}
        </p>
        {customer.service_address ? (
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
        ) : (
          <p>
            <strong>Service Address:</strong> Not provided (will be collected when
            scheduling)
          </p>
        )}
      </div>

      {(scheduleData.date || scheduleData.time) && (
        <div className={styles.summaryItem}>
          <h4>Requested Service Time:</h4>
          {scheduleData.date && (
            <p>
              <strong>Date:</strong> {new Date(scheduleData.date).toLocaleDateString()}
            </p>
          )}
          {scheduleData.time && (
            <p>
              <strong>Time:</strong> {timeLabels[scheduleData.time] || scheduleData.time}
            </p>
          )}
        </div>
      )}

      <div className={styles.summaryItemCentered}>
        <h4>Questions? Contact us:</h4>
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

      <button className={styles.primaryButton} onClick={onClose}>
        Close
      </button>
    </div>
  );
}
