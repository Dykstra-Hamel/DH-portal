'use client';

import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ImageLightbox.module.scss';

interface ImageLightboxProps {
  images: Array<{ id: string; url: string; name: string }>;
  currentIndex: number;
  onClose: () => void;
  onNavigate?: (index: number) => void;
}

export function ImageLightbox({ images, currentIndex, onClose, onNavigate }: ImageLightboxProps) {
  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0 && onNavigate) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1 && onNavigate) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, onClose, onNavigate]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handlePrevious = () => {
    if (currentIndex > 0 && onNavigate) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1 && onNavigate) {
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <div className={styles.lightbox} onClick={onClose}>
      <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        {hasMultiple && currentIndex > 0 && (
          <button
            className={`${styles.navButton} ${styles.navButtonLeft}`}
            onClick={handlePrevious}
            aria-label="Previous image"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        <div className={styles.imageWrapper}>
          <img
            src={currentImage.url}
            alt={currentImage.name}
            className={styles.image}
          />
        </div>

        {hasMultiple && currentIndex < images.length - 1 && (
          <button
            className={`${styles.navButton} ${styles.navButtonRight}`}
            onClick={handleNext}
            aria-label="Next image"
          >
            <ChevronRight size={32} />
          </button>
        )}

        <div className={styles.imageInfo}>
          <span className={styles.imageName}>{currentImage.name}</span>
          {hasMultiple && (
            <span className={styles.imageCounter}>
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
