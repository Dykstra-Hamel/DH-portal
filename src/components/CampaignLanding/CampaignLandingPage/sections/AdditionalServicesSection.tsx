/**
 * Additional Services Section Component
 *
 * Additional services list with image and CTA
 */

import { useMemo } from 'react';
import styles from '../CampaignLandingPage.module.scss';
import { processTextWithVariables, type VariableContext } from '@/lib/campaign-text-processing';

interface AdditionalServicesSectionProps {
  additionalServices: {
    heading: string;
    imageUrl: string | null;
  };
  addons: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
  }>;
  customer: VariableContext['customer'];
  pricing: VariableContext['pricing'];
  company: VariableContext['company'];
  branding?: VariableContext['branding'];
  serviceName?: string;
  buttonText: string;
  onCtaClick: () => void;
}

export default function AdditionalServicesSection({
  additionalServices,
  addons,
  customer,
  pricing,
  company,
  branding,
  serviceName,
  buttonText,
  onCtaClick,
}: AdditionalServicesSectionProps) {
  // Create variable context for text processing
  const variableContext = useMemo(
    () => ({
      customer,
      pricing,
      company,
      branding,
      serviceName,
    }),
    [customer, pricing, company, branding, serviceName]
  );

  // Process heading with variables
  const processedHeading = useMemo(
    () => processTextWithVariables(additionalServices.heading, variableContext),
    [additionalServices.heading, variableContext]
  );
  const scrollToFaq = () => {
    const faqSection = document.getElementById('faq-section');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className={styles.additionalServicesSection}>
      <div className={styles.additionalServicesContainer}>
        {/* Left column - Content */}
        <div className={styles.additionalServicesContent}>
          <h2 className={styles.additionalServicesHeading}>
            {processedHeading}
          </h2>

          <ul className={styles.servicesList}>
            {addons.map((addon) => (
              <li key={addon.id} className={styles.serviceItem}>
                <svg
                  className={styles.checkIcon}
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <g clipPath="url(#clip0_2258_2297)">
                    <path
                      d="M18.1678 8.33332C18.5484 10.2011 18.2772 12.1428 17.3994 13.8348C16.5216 15.5268 15.0902 16.8667 13.3441 17.6311C11.5979 18.3955 9.64252 18.5381 7.80391 18.0353C5.9653 17.5325 4.35465 16.4145 3.24056 14.8678C2.12646 13.3212 1.57626 11.4394 1.68171 9.53615C1.78717 7.63294 2.54189 5.8234 3.82004 4.4093C5.09818 2.9952 6.82248 2.06202 8.70538 1.76537C10.5883 1.46872 12.516 1.82654 14.167 2.77916"
                      stroke="var(--accent-color)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.5 9.16659L10 11.6666L18.3333 3.33325"
                      stroke="var(--accent-color)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_2258_2297">
                      <rect width="20" height="20" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                <div>
                  {addon.name}
                  {addon.description && <p>{addon.description}</p>}
                </div>
              </li>
            ))}
          </ul>

          <div className={styles.additionalServicesActions}>
            <button className={styles.additionalServicesCta} onClick={onCtaClick}>
              {buttonText}
            </button>
            <button className={styles.additionalServicesLink} onClick={scrollToFaq}>
              View Add-On FAQ&apos;s
            </button>
          </div>
        </div>

        {/* Right column - Image */}
        <div className={styles.additionalServicesImage}>
          {additionalServices.imageUrl ? (
            <img src={additionalServices.imageUrl} alt="Additional Services" />
          ) : (
            <div className={styles.imagePlaceholder} />
          )}
        </div>
      </div>
    </section>
  );
}
