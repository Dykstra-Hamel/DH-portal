/**
 * Letter Section Component
 *
 * Personalized letter content with floating price card
 */

import styles from '../CampaignLandingPage.module.scss';
import PriceCard from '../components/PriceCard';

interface LetterSectionProps {
  letter: {
    content: string | null;
    signatureText: string;
    imageUrl: string | null;
  };
  pricing: {
    displayPrice: string;
    originalPrice: string | null;
    savings: string | null;
  };
  customer: {
    first_name: string;
    last_name: string;
    service_address: {
      street_address: string;
      city: string;
      state: string;
    } | null;
  };
  campaign: {
    discount: {
      discount_type: 'percentage' | 'fixed';
      discount_value: number;
    } | null;
  };
  branding: {
    phoneNumber: string | null;
  };
  onCtaClick: () => void;
}

export default function LetterSection({
  letter,
  pricing,
  customer,
  campaign,
  branding,
  onCtaClick,
}: LetterSectionProps) {
  // Replace placeholders in letter content
  const processedContent = letter.content
    ?.replace(/\{customer_first_name\}/g, customer.first_name)
    .replace(/\{customer_last_name\}/g, customer.last_name)
    .replace(/\{service_address\}/g, customer.service_address?.street_address || 'your property')
    .replace(/\{city\}/g, customer.service_address?.city || '')
    .replace(/\{state\}/g, customer.service_address?.state || '');

  return (
    <section className={styles.letterSection}>
      <div className={styles.letterContainer}>
        {/* Letter content */}
        <div className={styles.letterContent}>
          <div className={styles.letterText}>
            {processedContent ? (
              <div dangerouslySetInnerHTML={{ __html: processedContent }} />
            ) : (
              <p>Dear {customer.first_name},</p>
            )}
          </div>

          {letter.imageUrl && (
            <div className={styles.letterImage}>
              <img src={letter.imageUrl} alt="Letter visual" />
            </div>
          )}

          <div className={styles.letterSignature}>
            <p>{letter.signatureText}</p>
          </div>

          <div className={styles.letterCta}>
            <p>
              Or call us at <span className={styles.phoneLink}>{branding.phoneNumber || '(888) 888-8888'}</span> to upgrade
              over the phone.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
