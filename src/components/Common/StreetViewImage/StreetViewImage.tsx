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

      try {
        if (!latitude || !longitude) {
          setError('Location coordinates not available');
          setImageUrl(null);
          setImageType(null);
          setIsLoading(false);
          return;
        }

        // Check Street View availability using Metadata API
        const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?` +
          `location=${latitude},${longitude}&` +
          `key=${apiKey}`;

        const metadataResponse = await fetch(metadataUrl);
        const metadata = await metadataResponse.json();

        // If Street View is available, use it
        if (metadata.status === 'OK') {
          const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?` +
            `size=${width}x${height}&` +
            `location=${latitude},${longitude}&` +
            `key=${apiKey}`;

          setImageUrl(streetViewUrl);
          setImageType('streetview');
        } else if (fallbackToSatellite) {
          // Street View not available, fallback to satellite
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
          // No Street View and fallback disabled
          setError('Street view not available for this location');
          setImageUrl(null);
          setImageType(null);
        }
      } catch (err) {
        setError('Failed to load location image');
        console.error('Error generating location image:', err);
      } finally {
        setIsLoading(false);
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