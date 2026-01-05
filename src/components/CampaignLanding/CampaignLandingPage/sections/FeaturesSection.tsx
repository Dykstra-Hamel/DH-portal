/**
 * Features Section Component
 *
 * Image with feature bullets and CTA
 */

import { useMemo } from 'react';
import Image from 'next/image';
import styles from '../CampaignLandingPage.module.scss';
import { processTextWithVariables, type VariableContext } from '@/lib/campaign-text-processing';

interface FeaturesSectionProps {
  features: {
    heading: string;
    bullets: string[];
    imageUrl: string | null;
  };
  customer: VariableContext['customer'];
  pricing: VariableContext['pricing'];
  company: VariableContext['company'];
  branding?: VariableContext['branding'];
  serviceName?: string;
  buttonText: string;
  onCtaClick: () => void;
}

export default function FeaturesSection({
  features,
  customer,
  pricing,
  company,
  branding,
  serviceName,
  buttonText,
  onCtaClick,
}: FeaturesSectionProps) {
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

  // Decode HTML entities for rendering as JSX
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Process heading with variables
  const processedHeading = useMemo(
    () => decodeHtmlEntities(processTextWithVariables(features.heading, variableContext)),
    [features.heading, variableContext]
  );

  // Process each bullet with variables
  const processedBullets = useMemo(
    () => features.bullets.map((bullet) =>
      decodeHtmlEntities(processTextWithVariables(bullet, variableContext))
    ),
    [features.bullets, variableContext]
  );

  const scrollToFaq = () => {
    const faqSection = document.getElementById('faq-section');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Render price parts with accent color styling
  const renderPriceParts = (text: string, keyPrefix: string | number) => {
    // Split by <br> tags first to handle line breaks
    const lines = text.split('<br>');

    return lines.flatMap((line, lineIndex) => {
      const parts = line.split('$').map((part, index) => {
        if (index === 0) return <span key={`${keyPrefix}-line${lineIndex}-${index}`}>{part}</span>;

        // Extract price pattern like "44/mo"
        const pricePattern = part.match(/^(\d+)(\/mo)/);
        if (pricePattern) {
          return (
            <span key={`${keyPrefix}-line${lineIndex}-${index}`}>
              <span className={styles.priceHighlight}>
                <sup>$</sup>
                {pricePattern[1]}
                <span className={styles.priceUnit}>{pricePattern[2]}</span>
              </span>
              {part.slice(pricePattern[0].length)}
            </span>
          );
        }

        return <span key={`${keyPrefix}-line${lineIndex}-${index}`}>${part}</span>;
      });

      // Add line break between lines (but not after the last line)
      if (lineIndex < lines.length - 1) {
        return [...parts, <br key={`${keyPrefix}-br${lineIndex}`} />];
      }
      return parts;
    });
  };

  // Render heading with styled prices and original price strikethrough
  const renderHeadingWithStyles = () => {
    const originalPrice = pricing.originalPrice?.trim();
    const headingSegments =
      originalPrice && processedHeading
        ? processedHeading.split(new RegExp(`(${escapeRegExp(originalPrice)})`, 'g')).filter(Boolean)
        : [processedHeading];

    return headingSegments.map((segment, idx) => {
      if (originalPrice && segment === originalPrice) {
        return (
          <span key={`orig-${idx}`} className={styles.strikethrough}>
            {segment}
          </span>
        );
      }

      return renderPriceParts(segment, `seg-${idx}`);
    });
  };

  return (
    <section className={styles.featuresSection}>
      <div className={styles.featuresContainer}>
        {/* Left column - Image */}
        <div className={styles.featuresImage}>
          {features.imageUrl ? (
            <Image
              src={features.imageUrl}
              alt="Features"
              width={1516}
              height={1134}
              quality={80}
            />
          ) : (
            <div className={styles.imagePlaceholder} />
          )}
        </div>

        {/* Right column - Content */}
        <div className={styles.featuresContent}>
          <h2 className={styles.featuresHeading}>{renderHeadingWithStyles()}</h2>

          <ul className={styles.featuresList}>
            {processedBullets.map((bullet, index) => (
              <li key={index} className={styles.featureItem}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <g clipPath="url(#clip0_2251_2371)">
                    <path
                      d="M18.1678 8.33332C18.5484 10.2011 18.2772 12.1428 17.3994 13.8348C16.5216 15.5268 15.0902 16.8667 13.3441 17.6311C11.5979 18.3955 9.64252 18.5381 7.80391 18.0353C5.9653 17.5325 4.35465 16.4145 3.24056 14.8678C2.12646 13.3212 1.57626 11.4394 1.68171 9.53615C1.78717 7.63294 2.54189 5.8234 3.82004 4.4093C5.09818 2.9952 6.82248 2.06202 8.70538 1.76537C10.5883 1.46872 12.516 1.82654 14.167 2.77916"
                      stroke="var(--accent-color)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.5 9.16671L10 11.6667L18.3333 3.33337"
                      stroke="var(--accent-color)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_2251_2371">
                      <rect width="20" height="20" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className={styles.featuresActions}>
            <button className={styles.featuresCta} onClick={onCtaClick}>
              {buttonText}
            </button>
            <button className={styles.featuresLink} onClick={scrollToFaq}>
              View Program FAQ&apos;s
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
