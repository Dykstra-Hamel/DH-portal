/**
 * Hero Section Component
 *
 * Two-column hero with content left, image collage right
 */

import { useMemo } from 'react';
import styles from '../CampaignLandingPage.module.scss';
import { processTextWithVariables, type VariableContext } from '@/lib/campaign-text-processing';

interface HeroSectionProps {
  hero: {
    title: string;
    subtitle: string;
    description: string | null;
    buttonText: string;
    imageUrl: string | null; // Changed from imageUrls array to single image
  };
  pricing: {
    displayPrice: string;
    originalPrice: string | null;
    savings: string | null;
  };
  customer: VariableContext['customer'];
  company: VariableContext['company'];
  branding?: VariableContext['branding'];
  serviceName?: string;
  onCtaClick: () => void;
}

export default function HeroSection({
  hero,
  pricing,
  customer,
  company,
  branding,
  serviceName,
  onCtaClick,
}: HeroSectionProps) {
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

  // Process text fields with variables
  const processedTitle = useMemo(
    () => processTextWithVariables(hero.title, variableContext),
    [hero.title, variableContext]
  );

  const processedSubtitle = useMemo(
    () => processTextWithVariables(hero.subtitle, variableContext),
    [hero.subtitle, variableContext]
  );

  const processedDescription = useMemo(
    () => (hero.description ? processTextWithVariables(hero.description, variableContext) : null),
    [hero.description, variableContext]
  );

  // Extract price components for highlighting
  const priceMatch = pricing.displayPrice.match(/\$(\d+)\/mo/);
  const priceAmount = priceMatch ? priceMatch[1] : null;

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContainer}>
        {/* Left column - Content */}
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>{processedSubtitle}</div>

          <h1 className={styles.heroTitle}>
            {/* Parse the processed title to highlight the price */}
            {processedTitle.split('$').map((part, index) => {
              if (index === 0) return <span key={index}>{part}</span>;

              // Extract price pattern like "44/mo"
              const pricePattern = part.match(/^(\d+)(\/mo)/);
              if (pricePattern) {
                return (
                  <span key={index}>
                    <span className={styles.priceHighlight}>
                      <sup>$</sup>{pricePattern[1]}
                      <span className={styles.priceUnit}>{pricePattern[2]}</span>
                    </span>
                    {part.substring(pricePattern[0].length)}
                  </span>
                );
              }
              return <span key={index}>${part}</span>;
            })}
          </h1>

          {processedDescription && (
            <p className={styles.heroDescription}>{processedDescription}</p>
          )}

          <button className={styles.heroCta} onClick={onCtaClick}>
            {hero.buttonText}
          </button>
        </div>

        {/* Right column - Single Hero Image */}
        <div className={styles.heroImage}>
          {hero.imageUrl ? (
            <img src={hero.imageUrl} alt="Campaign hero" className={styles.heroImageDisplay} />
          ) : (
            <div className={styles.imagePlaceholder}>
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="200" height="200" fill="#E5E7EB" />
                <path
                  d="M100 60L120 100H80L100 60Z"
                  fill="#9CA3AF"
                />
                <circle cx="100" cy="130" r="20" fill="#9CA3AF" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
