/**
 * Hero Section Component
 *
 * Two-column hero with content left, image collage right
 */

import { useCallback, useMemo } from 'react';
import styles from '../CampaignLandingPage.module.scss';
import { processTextWithVariables, type VariableContext } from '@/lib/campaign-text-processing';

interface HeroSectionProps {
  hero: {
    title: string;
    subtitle: string;
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

  // Process text fields with variables
  const processHeroTextWithOriginalPriceStyling = useCallback(
    (text: string) => {
      if (!text) return '';

      const styledText =
        pricing.originalPrice && text.includes('{original_price}')
          ? text.replace(
              /\{original_price\}/g,
              `<span class="${styles.strikethrough}">{original_price}</span>`
            )
          : text;

      return processTextWithVariables(styledText, variableContext);
    },
    [pricing.originalPrice, variableContext]
  );

  const processedTitle = useMemo(
    () => processTextWithVariables(hero.title, variableContext),
    [hero.title, variableContext]
  );

  const processedSubtitle = useMemo(
    () => processHeroTextWithOriginalPriceStyling(hero.subtitle),
    [hero.subtitle, processHeroTextWithOriginalPriceStyling]
  );

  const processedDescription = useMemo(
    () =>
      hero.description
        ? processHeroTextWithOriginalPriceStyling(hero.description)
        : null,
    [hero.description, processHeroTextWithOriginalPriceStyling]
  );

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderPriceParts = (text: string, keyPrefix: string | number) =>
    text.split('$').map((part, index) => {
      if (index === 0) return <span key={`${keyPrefix}-${index}`}>{part}</span>;

      // Extract price pattern like "44/mo"
      const pricePattern = part.match(/^(\d+)(\/mo)/);
      if (pricePattern) {
        return (
          <span key={`${keyPrefix}-${index}`}>
            <span className={styles.priceHighlight}>
              <sup>$</sup>
              {pricePattern[1]}
              <span className={styles.priceUnit}>{pricePattern[2]}</span>
            </span>
            {part.substring(pricePattern[0].length)}
          </span>
        );
      }
      return <span key={`${keyPrefix}-${index}`}>${part}</span>;
    });

  const renderTitleWithStyles = () => {
    const originalPrice = pricing.originalPrice?.trim();
    const titleSegments =
      originalPrice && processedTitle
        ? processedTitle.split(new RegExp(`(${escapeRegExp(originalPrice)})`, 'g')).filter(Boolean)
        : [processedTitle];

    return titleSegments.map((segment, idx) => {
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

  // Extract price components for highlighting
  const priceMatch = pricing.displayPrice.match(/\$(\d+)\/mo/);
  const priceAmount = priceMatch ? priceMatch[1] : null;

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContainer}>
        {/* Left column - Content */}
        <div className={styles.heroContent}>
          <div
            className={styles.heroBadge}
            dangerouslySetInnerHTML={{ __html: processedSubtitle }}
          />

          <h1 className={styles.heroTitle}>{renderTitleWithStyles()}</h1>

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
              <img
                src={hero.buttonIconUrl}
                alt="Badge"
                className={styles.heroButtonIcon}
              />
            )}
          </div>
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
