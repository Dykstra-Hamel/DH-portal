'use client';

/**
 * Header Section Component
 *
 * Top header with logo and CTA buttons
 */

import { useState, useEffect } from 'react';
import styles from '../CampaignLandingPage.module.scss';

interface HeaderSectionProps {
  logo: string | null;
  companyName: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  phoneNumber: string | null;
  onPrimaryClick: () => void;
}

const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
  >
    <path
      d="M18.7801 7.89332C20.0824 8.1474 21.2793 8.78433 22.2175 9.72256C23.1557 10.6608 23.7927 11.8577 24.0467 13.16M18.7801 2.55998C21.4858 2.86057 24.0089 4.07222 25.9351 5.99599C27.8613 7.91977 29.0761 10.4413 29.3801 13.1467M13.6827 18.3774C12.0806 16.7753 10.8156 14.9638 9.88757 13.031C9.80775 12.8647 9.76784 12.7816 9.73717 12.6764C9.62821 12.3026 9.70648 11.8436 9.93316 11.527C9.99695 11.4379 10.0732 11.3617 10.2256 11.2093C10.6917 10.7432 10.9248 10.5101 11.0772 10.2757C11.6518 9.39185 11.6518 8.25241 11.0772 7.36856C10.9248 7.13419 10.6917 6.90112 10.2256 6.43498L9.96574 6.17515C9.25715 5.46656 8.90286 5.11227 8.52235 4.91981C7.76561 4.53705 6.87192 4.53705 6.11517 4.91981C5.73466 5.11227 5.38037 5.46656 4.67178 6.17515L4.4616 6.38533C3.75543 7.09149 3.40235 7.44458 3.13269 7.92462C2.83346 8.45729 2.61831 9.28462 2.62013 9.89558C2.62177 10.4462 2.72857 10.8225 2.94218 11.5751C4.09014 15.6196 6.25611 19.4361 9.44008 22.62C12.6241 25.804 16.4405 27.97 20.4851 29.118C21.2377 29.3316 21.614 29.4384 22.1646 29.44C22.7755 29.4418 23.6028 29.2267 24.1355 28.9274C24.6156 28.6578 24.9686 28.3047 25.6748 27.5985L25.885 27.3884C26.5936 26.6798 26.9479 26.3255 27.1403 25.945C27.5231 25.1882 27.5231 24.2945 27.1403 23.5378C26.9479 23.1573 26.5936 22.803 25.885 22.0944L25.6252 21.8346C25.159 21.3684 24.9259 21.1353 24.6916 20.983C23.8077 20.4083 22.6683 20.4083 21.7844 20.983C21.5501 21.1353 21.317 21.3684 20.8508 21.8346C20.6984 21.987 20.6222 22.0632 20.5331 22.127C20.2166 22.3537 19.7575 22.4319 19.3837 22.323C19.2786 22.2923 19.1954 22.2524 19.0292 22.1726C17.0963 21.2446 15.2848 19.9795 13.6827 18.3774Z"
      stroke="var(--accent-color)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function HeaderSection({
  logo,
  companyName,
  primaryButtonText,
  secondaryButtonText,
  phoneNumber,
  onPrimaryClick,
}: HeaderSectionProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePhoneClick = () => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.headerLogo}>
          {logo ? (
            <img src={logo} alt={companyName} />
          ) : (
            <span className={styles.companyName}>{companyName}</span>
          )}
        </div>

        <div className={styles.headerActions}>
          {isMobile ? (
            // Mobile: Show only phone icon
            <button
              className={styles.headerPhoneIcon}
              onClick={handlePhoneClick}
              aria-label="Call us"
            >
              <PhoneIcon />
            </button>
          ) : (
            // Desktop: Show both buttons
            <>
              <button className={styles.headerPrimaryButton} onClick={onPrimaryClick}>
                {primaryButtonText}
              </button>
              <button className={styles.headerSecondaryButton} onClick={handlePhoneClick}>
                {secondaryButtonText}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
