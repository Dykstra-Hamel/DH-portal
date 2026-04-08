'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, LocateFixed } from 'lucide-react';
import { AddressAutocomplete, type AddressComponents } from '@/components/Common/AddressAutocomplete/AddressAutocomplete';
import {
  DEFAULT_ELEMENT_STAMP_TYPE,
  DEFAULT_OBJECT_STAMP_TYPE,
  DEFAULT_PEST_STAMP_TYPE,
  type MapPlotData,
} from '@/components/FieldMap/MapPlot/types';
import styles from '../ServiceWizard.module.scss';

interface MapAddressStepProps {
  mapPlotData: MapPlotData;
  onChange: (next: MapPlotData) => void;
}

export function MapAddressStep({ mapPlotData, onChange }: MapAddressStepProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(!mapPlotData.addressComponents);
  const autoAttemptedRef = useRef(false);
  const selectedFormattedAddress =
    mapPlotData.addressComponents && typeof mapPlotData.addressComponents.formatted_address === 'string'
      ? mapPlotData.addressComponents.formatted_address
      : null;

  const applyAddressSelection = useCallback(
    (addressComponents: AddressComponents, addressInput: string) => {
      const normalizedAddressComponents = addressComponents as MapPlotData['addressComponents'];
      const lat = typeof addressComponents.latitude === 'number' ? addressComponents.latitude : null;
      const lng = typeof addressComponents.longitude === 'number' ? addressComponents.longitude : null;

      onChange({
        ...mapPlotData,
        addressInput,
        addressComponents: normalizedAddressComponents,
        centerLat: lat,
        centerLng: lng,
        zoom: 20,
        heading: 0,
        tilt: 0,
        isViewSet: false,
        drawTool: 'outline',
        selectedStampType: DEFAULT_PEST_STAMP_TYPE,
        selectedPestType: DEFAULT_PEST_STAMP_TYPE,
        selectedObjectType: DEFAULT_OBJECT_STAMP_TYPE,
        selectedElementType: DEFAULT_ELEMENT_STAMP_TYPE,
        stamps: [],
        outlines: [],
        activeOutlineId: null,
        updatedAt: new Date().toISOString(),
        gridRefWidth: null,
        gridRefHeight: null,
      });
    },
    [mapPlotData, onChange]
  );

  const tryUseCurrentAddress = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Location is unavailable on this device. Use manual address entry.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch('/api/internal/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Could not resolve your current address.');
          }

          const payload = await response.json();
          const components = payload.addressComponents as AddressComponents | undefined;
          if (!components || !components.formatted_address) {
            throw new Error('Could not resolve your current address. Enter it manually.');
          }

          const street = `${components.street_number ? `${components.street_number} ` : ''}${components.route ?? ''}`.trim();
          applyAddressSelection(components, street || components.formatted_address);
          setManualMode(false);
        } catch (error: any) {
          setLocationError(error?.message || 'Could not resolve your current address.');
          setManualMode(true);
        } finally {
          setIsLocating(false);
        }
      },
      error => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Enter address manually.');
        } else {
          setLocationError('Could not access your location. Enter address manually.');
        }
        setManualMode(true);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [applyAddressSelection]);

  useEffect(() => {
    if (autoAttemptedRef.current || mapPlotData.addressComponents) return;
    autoAttemptedRef.current = true;
    void tryUseCurrentAddress();
  }, [mapPlotData.addressComponents, tryUseCurrentAddress]);

  return (
    <div className={styles.stepScrollable}>
      <div className={styles.section}>
        <h2 className={styles.stepTitle}>Map Address</h2>
        <p className={styles.stepDesc}>
          We&apos;ll try your current location first, or you can enter the address manually.
        </p>
      </div>

      <div className={styles.mapAddressActions}>
        <button
          type="button"
          className={styles.mapAddressBtnPrimary}
          onClick={() => void tryUseCurrentAddress()}
          disabled={isLocating}
        >
          <LocateFixed size={16} />
          {isLocating ? 'Locating...' : 'Use Current Address'}
        </button>
        <button
          type="button"
          className={styles.mapAddressBtn}
          onClick={() => setManualMode(true)}
        >
          <Keyboard size={16} />
          Enter Address Manually
        </button>
      </div>

      {selectedFormattedAddress && (
        <div className={styles.mapAddressSelected}>
          <p className={styles.mapAddressSelectedLabel}>Selected Address</p>
          <p className={styles.mapAddressSelectedValue}>
            {selectedFormattedAddress}
          </p>
        </div>
      )}

      {manualMode && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Manual Address</label>
          <AddressAutocomplete
            value={mapPlotData.addressInput}
            onChange={value =>
              onChange({
                ...mapPlotData,
                addressInput: value,
                addressComponents: null,
                centerLat: null,
                centerLng: null,
                isViewSet: false,
                stamps: [],
                outlines: [],
                activeOutlineId: null,
                updatedAt: new Date().toISOString(),
              })
            }
            onAddressSelect={components => {
              const street = `${components.street_number ? `${components.street_number} ` : ''}${components.route ?? ''}`.trim();
              applyAddressSelection(components, street || components.formatted_address || mapPlotData.addressInput);
            }}
            placeholder="Start typing address..."
          />
        </div>
      )}

      {locationError && <p className={styles.errorState}>{locationError}</p>}
      <p className={styles.fieldHint}>
        After an address is selected, tap <strong>Next</strong> to set the view (satellite or blank grid).
      </p>
    </div>
  );
}
