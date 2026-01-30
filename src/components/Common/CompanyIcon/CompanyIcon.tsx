'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './CompanyIcon.module.scss';

interface CompanyIconProps {
  companyName: string;
  iconUrl?: string | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showTooltip?: boolean;
}

const BuildingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: '100%', height: '100%' }}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

export function CompanyIcon({
  companyName,
  iconUrl,
  size = 'medium',
  className = '',
  showTooltip = true,
}: CompanyIconProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const iconRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset error state when iconUrl changes
    setImageError(false);
  }, [iconUrl]);

  useEffect(() => {
    if (isHovered && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [isHovered]);

  const handleImageError = () => {
    console.log('CompanyIcon image error:', {
      iconUrl,
      companyName,
    });
    setImageError(true);
  };

  // Only show image if URL is valid and not empty
  const isValidUrl = iconUrl && iconUrl.trim().length > 0 && iconUrl.startsWith('http');
  const showImage = isValidUrl && !imageError;

  const sizeMap = {
    small: 24,
    medium: 32,
    large: 40,
  };

  const pixelSize = sizeMap[size];

  return (
    <>
      <div className={styles.tooltipContainer}>
        <div
          ref={iconRef}
          className={`${styles.companyIcon} ${styles[size]} ${showImage ? styles.hasImage : ''} ${className}`}
          onMouseEnter={() => showTooltip && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {showImage ? (
            <Image
              src={iconUrl}
              alt={companyName}
              className={styles.iconImage}
              onError={handleImageError}
              fill
              loading="lazy"
            />
          ) : (
            <div className={styles.iconPlaceholder}>
              <BuildingIcon />
            </div>
          )}
        </div>
      </div>
      {showTooltip && isHovered && (
        <div
          className={styles.tooltip}
          style={{
            position: 'fixed',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {companyName}
          <div className={styles.tooltipArrow} />
        </div>
      )}
    </>
  );
}
