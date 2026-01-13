'use client';

/**
 * Header Section Component
 *
 * Top header with logo and CTA buttons
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Phone } from 'lucide-react';
import styles from './quotecontent.module.scss';

interface HeaderSectionProps {
  logo: string | undefined;
  companyName: string;
  buttonText: string;
  phoneNumber: string | null;
  removeBackground?: boolean;
}

export default function HeaderSection({
  logo,
  companyName,
  buttonText,
  phoneNumber,
  removeBackground = false,
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
    <header
      className={styles.header}
      style={
        removeBackground
          ? ({ '--header-bg-opacity': '0' } as React.CSSProperties)
          : undefined
      }
    >
      <div className={styles.headerContainer}>
        <div className={styles.headerLogo}>
          {logo ? (
            <Image
              src={logo}
              alt={companyName}
              width={150}
              height={50}
              style={{ objectFit: 'contain' }}
            />
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
              <Phone size={20} />
            </button>
          ) : (
            <button className={styles.headerButton} onClick={handlePhoneClick}>
              <Phone size={20} /> {buttonText}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
