'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './StreetViewImage.module.scss';

interface StreetViewImageProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  width?: number;
  height?: number;
  className?: string;
  fallbackToSatellite?: boolean;
  showPlaceholder?: boolean;
  hasStreetView?: boolean;
}

export function StreetViewImage({
  address,
  latitude,
  longitude,
  width = 600,
  height = 400,
  className = "",
  fallbackToSatellite = true,
  showPlaceholder = false,
  hasStreetView = undefined
}: StreetViewImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageType, setImageType] = useState<'streetview' | 'satellite' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateImageUrl = async () => {
      // If showPlaceholder is true, show placeholder instead of fetching
      if (showPlaceholder || (!address && (!latitude || !longitude))) {
        setImageUrl(null);
        setImageType(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        setError('Google Maps API key not configured');
        return;
      }

      setIsLoading(true);
      setError(null);

      // Determine if we should try Street View first
      // If hasStreetView is explicitly false, skip straight to satellite
      // If hasStreetView is true or undefined, try Street View first
      const shouldTryStreetView = hasStreetView !== false && latitude && longitude;

      try {

        if (shouldTryStreetView) {
          // Try Street View first - either we know it's available or we'll check dynamically
          const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?` +
            `location=${latitude},${longitude}&` +
            `size=${width}x${height}&` +
            `key=${apiKey}&` +
            `fov=80&` +
            `heading=0&` +
            `pitch=0`;

          // Test if Street View image loads successfully
          const testImage = new window.Image();
          testImage.onload = () => {
            // Street View loaded successfully
            setImageUrl(streetViewUrl);
            setImageType('streetview');
            setIsLoading(false);
          };
          testImage.onerror = () => {
            // Street View failed, fall back to satellite if enabled
            if (fallbackToSatellite && latitude && longitude) {
              const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
                `center=${latitude},${longitude}&` +
                `zoom=18&` +
                `size=${width}x${height}&` +
                `maptype=satellite&` +
                `markers=color:red%7C${latitude},${longitude}&` +
                `key=${apiKey}`;

              setImageUrl(satelliteUrl);
              setImageType('satellite');
            } else {
              setError('Street View not available for this location');
              setImageUrl(null);
              setImageType(null);
            }
            setIsLoading(false);
          };
          testImage.src = streetViewUrl;

          // Don't set loading to false here - wait for image load/error
          return;
        } else if (fallbackToSatellite && latitude && longitude) {
          // Use satellite view directly - hasStreetView was explicitly false
          const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
            `center=${latitude},${longitude}&` +
            `zoom=18&` +
            `size=${width}x${height}&` +
            `maptype=satellite&` +
            `markers=color:red%7C${latitude},${longitude}&` +
            `key=${apiKey}`;

          setImageUrl(satelliteUrl);
          setImageType('satellite');
        } else {
          // No valid coordinates or fallback disabled
          setError('Location coordinates not available');
          setImageUrl(null);
          setImageType(null);
        }
      } catch (err) {
        setError('Failed to load location image');
        console.error('Error generating location image:', err);
        setIsLoading(false);
      } finally {
        // Only set loading to false if we're not waiting for image load test
        if (!shouldTryStreetView) {
          setIsLoading(false);
        }
      }
    };

    generateImageUrl();
  }, [address, latitude, longitude, width, height, fallbackToSatellite, showPlaceholder, hasStreetView]);

  const handleImageError = () => {

    // Image loading failed - show error state
    setError(`Failed to load ${imageType} image`);
    setImageUrl(null);
    setImageType(null);
  };

  if (isLoading) {
    return (
      <div className={`${styles.imageContainer} ${styles.loading} ${className}`}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <span>Loading location image...</span>
        </div>
      </div>
    );
  }

  // Show placeholder if no address/coordinates or showPlaceholder is true
  if (!imageUrl && !isLoading && !error) {
    return (
      <div className={`${styles.imageContainer} ${styles.placeholder} ${className}`}>
        <div className={styles.placeholderContent}>
          <div className={styles.placeholderIcon}>🗺️</div>
          <span>Street view will appear after selecting an address</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.imageContainer} ${styles.error} ${className}`}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>🗺️</div>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`${styles.imageContainer} ${styles.placeholder} ${className}`}>
        <div className={styles.placeholderContent}>
          <div className={styles.placeholderIcon}>🗺️</div>
          <span>Street view will appear after selecting an address</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.imageContainer} ${className}`}>
      <div className={styles.imageWrapper}>
        <Image
          src={imageUrl}
          alt={`${imageType === 'streetview' ? 'Street view' : 'Satellite view'} of ${address || 'location'}`}
          width={width}
          height={height}
          className={styles.locationImage}
          unoptimized // Google Maps images are already optimized
          onError={handleImageError}
          onLoad={() => {
            setIsLoading(false);
            setError(null);
          }}
        />
      </div>
    </div>
  );
}