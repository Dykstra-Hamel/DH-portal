/**
 * Hero Section Component
 *
 * Two-column hero with content left, image collage right
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './quotecontent.module.scss';

interface HeroSectionProps {
  hero: {
    title: string;
    subtitle: string;
    buttonText: string;
    imageUrl: string | null; // Changed from imageUrls array to single image
  };
  companyId: string;
}

export default function HeroSection({ hero, companyId }: HeroSectionProps) {
  const [reviewData, setReviewData] = useState<{
    rating: number;
    reviewCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/google-places/reviews/${companyId}`);
        if (response.ok) {
          const data = await response.json();
          // Only show if we have valid review data (not static/fallback)
          if (data.rating > 0 && data.reviewCount > 0 && !data.isStatic) {
            setReviewData({
              rating: data.rating,
              reviewCount: data.reviewCount,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [companyId]);

  const scrollToSection = () => {
    const section = document.getElementById('pestProtectionPlans');
    if (section) {
      const offset = 70; // Account for fixed header
      const targetY =
        section.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(targetY, 0), behavior: 'smooth' });
    }
  };

  return (
    <section id="hero-section" className={styles.heroSection}>
      <div className={styles.heroContainer}>
        {/* Left column - Content */}
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{hero.title}</h1>
          <p
            className={styles.heroSubtitle}
            dangerouslySetInnerHTML={{ __html: hero.subtitle || '' }}
          ></p>

          {/* Review Badge */}
          {!isLoading && reviewData && (
            <div className={styles.reviewBadge}>
              <div className={styles.reviewLeft}>
                <span className={styles.reviewStar}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="15"
                    viewBox="0 0 16 15"
                    fill="none"
                  >
                    <path
                      d="M7.39115 0.687438C7.58677 0.297732 7.68458 0.10288 7.81736 0.0406241C7.93289 -0.0135414 8.06711 -0.0135414 8.18264 0.0406241C8.31542 0.10288 8.41323 0.297732 8.60885 0.687438L10.4648 4.38467C10.5225 4.49972 10.5514 4.55725 10.5936 4.60191C10.631 4.64145 10.6758 4.6735 10.7255 4.69626C10.7818 4.72196 10.8463 4.73124 10.9754 4.7498L15.1268 5.34648C15.564 5.40931 15.7825 5.44073 15.8837 5.54572C15.9717 5.63707 16.0131 5.7626 15.9963 5.88735C15.9771 6.03074 15.8188 6.1823 15.5024 6.48543L12.4995 9.36148C12.4059 9.45113 12.3591 9.49596 12.3289 9.5493C12.3022 9.59652 12.285 9.64841 12.2784 9.70207C12.2709 9.76267 12.282 9.82599 12.304 9.95264L13.0126 14.0149C13.0873 14.4434 13.1247 14.6576 13.0545 14.7848C12.9934 14.8954 12.8848 14.9729 12.7589 14.9959C12.6142 15.0223 12.4186 14.9211 12.0273 14.7187L8.31604 12.7995C8.2004 12.7397 8.14258 12.7098 8.08167 12.6981C8.02774 12.6877 7.97226 12.6877 7.91833 12.6981C7.85742 12.7098 7.7996 12.7397 7.68397 12.7995L3.97268 14.7187C3.5814 14.9211 3.38577 15.0223 3.24111 14.9959C3.11525 14.9729 3.00665 14.8954 2.94555 14.7848C2.87533 14.6576 2.91269 14.4434 2.98742 14.0149L3.69596 9.95264C3.71805 9.82599 3.72909 9.76267 3.72162 9.70207C3.715 9.64841 3.69785 9.59652 3.67111 9.5493C3.6409 9.49596 3.5941 9.45113 3.50049 9.36148L0.497648 6.48543C0.181157 6.1823 0.0229124 6.03074 0.00365595 5.88735C-0.0130982 5.7626 0.0282924 5.63707 0.116304 5.54572C0.21746 5.44073 0.43604 5.40931 0.873199 5.34648L5.02459 4.7498C5.15369 4.73124 5.21824 4.72196 5.27446 4.69626C5.32423 4.6735 5.36905 4.64145 5.40641 4.60191C5.44861 4.55725 5.47749 4.49972 5.53524 4.38467L7.39115 0.687438Z"
                      fill="#F8AF2D"
                    />
                  </svg>
                </span>
                <span className={styles.reviewRating}>
                  {reviewData.rating.toFixed(1)}/5
                </span>
                <span className={styles.reviewLabel}>Customer Rating</span>
              </div>
              <div className={styles.reviewDivider}></div>
              <div className={styles.reviewRight}>
                <Image
                  src="/images/google-g.png"
                  alt="Google"
                  width={20}
                  height={20}
                  className={styles.googleLogo}
                />
                <span className={styles.reviewCount}>
                  {reviewData.reviewCount.toLocaleString()} Reviews
                </span>
              </div>
            </div>
          )}

          <div className={styles.heroCtaContainer}>
            <button className={styles.heroCta} onClick={scrollToSection}>
              {hero.buttonText}
            </button>
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
                <path d="M100 60L120 100H80L100 60Z" fill="#9CA3AF" />
                <circle cx="100" cy="130" r="20" fill="#9CA3AF" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
