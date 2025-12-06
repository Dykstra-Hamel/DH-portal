/**
 * Letter Section Component
 *
 * Personalized letter content with floating price card
 */

import { useMemo } from 'react';
import styles from '../CampaignLandingPage.module.scss';
import PriceCard from '../components/PriceCard';
import { processTextWithVariables } from '@/lib/campaign-text-processing';

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
    email?: string;
    phone_number?: string;
    service_address: {
      street_address: string;
      city: string;
      state: string;
      zip_code: string;
    } | null;
  };
  campaign: {
    discount: {
      discount_type: 'percentage' | 'fixed';
      discount_value: number;
    } | null;
  };
  company: {
    name: string;
  };
  branding: {
    phoneNumber: string | null;
  };
  serviceName?: string;
  onCtaClick: () => void;
}

export default function LetterSection({
  letter,
  pricing,
  customer,
  campaign,
  company,
  branding,
  serviceName,
  onCtaClick,
}: LetterSectionProps) {
  // Create variable context for text processing
  const variableContext = useMemo(
    () => ({
      customer,
      pricing,
      company,
      branding,
      serviceName,
      signature: letter.signatureText,
      signatureClassName: styles.letterSignature,
    }),
    [customer, pricing, company, branding, serviceName, letter.signatureText]
  );

  // Process letter content with variables, markdown links, and sanitization
  // Note: Signature should now be included in the letter content itself for full flexibility
  const processedContent = useMemo(
    () => (letter.content ? processTextWithVariables(letter.content, variableContext) : null),
    [letter.content, variableContext]
  );

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
        </div>
      </div>
    </section>
  );
}
