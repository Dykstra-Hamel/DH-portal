/**
 * Hero Section Component
 *
 * Two-column hero with content left, image collage right
 */

import { useCallback, useMemo } from 'react';
import Image from 'next/image';
import styles from '../CampaignLandingPage.module.scss';
import { processTextWithVariables, type VariableContext } from '@/lib/campaign-text-processing';

interface HeroSectionProps {
  hero: {
    title: string;
    subtitle: string;
    subheading: string | null;
    description: string | null;
    buttonText: string;
    imageUrl: string | null; // Changed from imageUrls array to single image
    buttonIconUrl: string | null;
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

  // Process text fields with variables and price styling
  const processHeroTextWithOriginalPriceStyling = useCallback(
    (text: string) => {
      if (!text) return '';

      let styledText = text;

      if (pricing.originalPrice && styledText.includes('{original_price}')) {
        styledText = styledText.replace(
          /\{original_price\}/g,
          `<span class="${styles.strikethrough}">{original_price}</span>`
        );
      }

      if (styledText.includes('{display_price}')) {
        styledText = styledText.replace(
          /\{display_price\}/g,
          `<span class="${styles.priceHighlight}">{display_price}</span>`
        );
      }

      return processTextWithVariables(styledText, variableContext);
    },
    [pricing.originalPrice, variableContext]
  );

  const processedTitle = useMemo(
    () => processHeroTextWithOriginalPriceStyling(hero.title),
    [hero.title, processHeroTextWithOriginalPriceStyling]
  );

  const processedSubtitle = useMemo(
    () => processHeroTextWithOriginalPriceStyling(hero.subtitle),
    [hero.subtitle, processHeroTextWithOriginalPriceStyling]
  );

  const processedSubheading = useMemo(
    () => hero.subheading ? processHeroTextWithOriginalPriceStyling(hero.subheading) : null,
    [hero.subheading, processHeroTextWithOriginalPriceStyling]
  );

  const processedDescription = useMemo(
    () =>
      hero.description
        ? processHeroTextWithOriginalPriceStyling(hero.description)
        : null,
    [hero.description, processHeroTextWithOriginalPriceStyling]
  );

  return (
    <section id="hero-section" className={styles.heroSection}>
      <div className={styles.heroContainer}>
        {/* Left column - Content */}
        <div className={styles.heroContent}>
          <div
            className={styles.heroBadge}
            dangerouslySetInnerHTML={{ __html: processedSubtitle }}
          />

          <h1
            className={styles.heroTitle}
            dangerouslySetInnerHTML={{ __html: processedTitle }}
          />

          {processedSubheading && (
            <h2
              className={styles.heroSubheading}
              dangerouslySetInnerHTML={{ __html: processedSubheading }}
            />
          )}

          {processedDescription && (
            <p
              className={styles.heroDescription}
              dangerouslySetInnerHTML={{ __html: processedDescription }}
            />
          )}

          <div className={styles.heroCtaContainer}>
            <button className={styles.heroCta} onClick={onCtaClick}>
              {hero.buttonText}
            </button>
            {hero.buttonIconUrl && (
              <Image
                src={hero.buttonIconUrl}
                alt="Badge"
                width={270}
                height={270}
                className={styles.heroButtonIcon}
              />
            )}
          </div>
        </div>

        {/* Right column - Single Hero Image */}
        <div className={styles.heroImage}>
          {hero.imageUrl ? (
            <Image
              src={hero.imageUrl}
              alt="Campaign hero"
              width={522}
              height={418}
              quality={85}
              className={styles.heroImageDisplay}
              priority={true}
            />
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
