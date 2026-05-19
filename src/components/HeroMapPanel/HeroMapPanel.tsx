'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPlotData } from '@/components/FieldMap/MapPlot/types';
import { MapPlotCanvas } from '@/components/FieldMap/MapPlot/MapPlotCanvas/MapPlotCanvas';
import styles from './HeroMapPanel.module.scss';

interface HeroMapPanelProps {
  mapPlotData?: MapPlotData | null;
  satelliteImageUrl?: string | null;
  companyId: string;
  brandPrimary?: string | null;
}

export function HeroMapPanel({
  mapPlotData,
  satelliteImageUrl,
  companyId,
  brandPrimary,
}: HeroMapPanelProps) {
  const [showMapView, setShowMapView] = useState(false);

  const housePhoto = mapPlotData?.housePhotos?.[0] ?? null;
  const hasMapData = !!mapPlotData;

  if (housePhoto || hasMapData) {
    return (
      <div className={styles.heroMapWrap}>
        {hasMapData && (
          <div
            className={styles.heroMapLayer}
            style={{ opacity: showMapView || !housePhoto ? 1 : 0 }}
          >
            <MapPlotCanvas
              mapPlotData={mapPlotData!}
              onChange={() => {}}
              isReadOnly
              companyId={companyId}
              stampColor={brandPrimary ?? undefined}
            />
          </div>
        )}
        {housePhoto && (
          <div
            className={`${styles.heroPhotoLayer} ${!showMapView ? styles.heroPhotoLayerVisible : ''}`}
          >
            <Image src={housePhoto} alt="House photo" fill style={{ objectFit: 'cover' }} />
          </div>
        )}
        {housePhoto && !showMapView && hasMapData && (
          <button
            type="button"
            className={styles.heroViewToggleBtn}
            onClick={() => setShowMapView(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 22 22"
              fill="none"
            >
              <path
                d="M21 11C21 16.5228 16.5228 21 11 21M21 11C21 5.47715 16.5228 1 11 1M21 11H17M11 21C5.47715 21 1 16.5228 1 11M11 21V17M1 11C1 5.47715 5.47715 1 11 1M1 11H5M11 1V5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Switch To Pest Findings Map
          </button>
        )}
        {housePhoto && showMapView && (
          <button
            type="button"
            className={styles.heroCloseMapBtn}
            onClick={() => setShowMapView(false)}
          >
            Close Map
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="34"
              height="34"
              viewBox="0 0 36 36"
              fill="none"
            >
              <path
                d="M23.1 12.9L12.9 23.1M12.9 12.9L23.1 23.1M35 18C35 27.3888 27.3888 35 18 35C8.61116 35 1 27.3888 1 18C1 8.61116 8.61116 1 18 1C27.3888 1 35 8.61116 35 18Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }

  if (satelliteImageUrl) {
    return (
      <div className={styles.heroMapWrap}>
        <Image
          src={satelliteImageUrl}
          alt="Satellite view of service address"
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
    );
  }

  return null;
}
