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

  // Decode HTML entities for rendering as JSX
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const processedTitle = useMemo(
    () => decodeHtmlEntities(processTextWithVariables(hero.title, variableContext)),
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

  // Wrap any * characters in <sup> elements
  const renderWithSuperscript = (text: string, keyPrefix: string | number) => {
    if (!text.includes('*')) return <span key={keyPrefix}>{text}</span>;
    const parts = text.split('*');
    return (
      <span key={keyPrefix}>
        {parts.map((part, i) => (
          <span key={`${keyPrefix}-star${i}`}>
            {part}
            {i < parts.length - 1 && <sup>*</sup>}
          </span>
        ))}
      </span>
    );
  };

  const renderPriceParts = (text: string, keyPrefix: string | number) => {
    // Split by <br> tags first to handle line breaks
    const lines = text.split('<br>');

    return lines.flatMap((line, lineIndex) => {
      const parts = line.split('$').map((part, index) => {
        if (index === 0) return renderWithSuperscript(part, `${keyPrefix}-line${lineIndex}-${index}`);

        // Extract price pattern like "44/mo"
        const pricePattern = part.match(/^(\d+)(\/mo)/);
        if (pricePattern) {
          const remainder = part.substring(pricePattern[0].length);
          return (
            <span key={`${keyPrefix}-line${lineIndex}-${index}`}>
              <span className={styles.priceHighlight}>
                <sup>$</sup>
                {pricePattern[1]}
                <span className={styles.priceUnit}>{pricePattern[2]}</span>
              </span>
              {renderWithSuperscript(remainder, `${keyPrefix}-line${lineIndex}-${index}-rest`)}
            </span>
          );
        }
        return <span key={`${keyPrefix}-line${lineIndex}-${index}`}><sup>$</sup>{renderWithSuperscript(part, `${keyPrefix}-line${lineIndex}-${index}-after`)}</span>;
      });

      // Add line break between lines (but not after the last line)
      if (lineIndex < lines.length - 1) {
        return [...parts, <br key={`${keyPrefix}-br${lineIndex}`} />];
      }
      return parts;
    });
  };

  // Get original price amount without the $ sign
  const originalPriceAmount = pricing.originalPrice?.replace(/^\$/, '').trim() || '';

  const renderTitleWithStyles = () => {
    const originalPrice = pricing.originalPrice?.trim();
    const titleSegments =
      originalPrice && processedTitle
        ? processedTitle.split(new RegExp(`(${escapeRegExp(originalPrice)})`, 'g')).filter(Boolean)
        : [processedTitle];

    return titleSegments.map((segment, idx) => {
      if (originalPrice && segment === originalPrice) {
        // Render $ and amount as two separate elements:
        // $ = red, superscript, no strikethrough
        // amount = red, strikethrough
        return (
          <span key={`orig-${idx}`}>
            <sup className={styles.strikethroughDollar}>$</sup>
            <span className={styles.strikethroughValue}>{originalPriceAmount}</span>
          </span>
        );
      }

      return renderPriceParts(segment, `seg-${idx}`);
    });
  };

  return (
    <section id="hero-section" className={styles.heroSection}>
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
