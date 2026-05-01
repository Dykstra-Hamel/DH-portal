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

interface CustomerResult {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  address?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  serviceAddressId?: string | null;
}

interface MapAddressStepProps {
  mapPlotData: MapPlotData;
  onChange: (next: MapPlotData) => void;
  isNewInspection?: boolean;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  onClientNameChange?: (v: string) => void;
  onClientEmailChange?: (v: string) => void;
  onClientPhoneChange?: (v: string) => void;
  onServiceAddressIdChange?: (id: string | null) => void;
  companyId?: string;
}

export function MapAddressStep({
  mapPlotData,
  onChange,
  isNewInspection,
  clientName = '',
  clientEmail = '',
  clientPhone = '',
  onClientNameChange,
  onClientEmailChange,
  onClientPhoneChange,
  onServiceAddressIdChange,
  companyId,
}: MapAddressStepProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(!mapPlotData.addressComponents);
  const autoAttemptedRef = useRef(false);

  // Customer search state
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isResolvingCustomerAddress, setIsResolvingCustomerAddress] = useState(false);
  const [customerAddressError, setCustomerAddressError] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

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
          onServiceAddressIdChange?.(null);
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

  // Close results dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCustomers = useCallback(async (q: string) => {
    if (!companyId || q.length < 2) {
      setCustomerResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Try PestPac first
      const pestpacRes = await fetch(
        `/api/pestpac/clients/search?q=${encodeURIComponent(q)}&companyId=${companyId}`
      );

      if (pestpacRes.ok) {
        const data = await pestpacRes.json();
        const results: CustomerResult[] = (data.clients ?? []).map((c: any) => {
          const addr = c.primaryAddress;
          const street = addr?.street ?? null;
          const city = addr?.city ?? null;
          const state = addr?.state ?? null;
          const zip = addr?.zip ?? null;
          const display = addr
            ? [street, city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
            : null;
          return {
            id: c.clientId,
            displayName: c.displayName,
            email: c.email ?? null,
            phone: c.phone ?? null,
            address: display,
            street,
            city,
            state,
            zip,
            latitude: typeof addr?.latitude === 'number' ? addr.latitude : null,
            longitude: typeof addr?.longitude === 'number' ? addr.longitude : null,
          };
        });
        setCustomerResults(results);
        setShowResults(results.length > 0);
        return;
      }

      // PestPac not enabled or failed — fall back to local DB
      const dbRes = await fetch(
        `/api/customers/search?q=${encodeURIComponent(q)}&companyId=${companyId}&limit=10`
      );
      if (dbRes.ok) {
        const data = await dbRes.json();
        const results: CustomerResult[] = (data.customers ?? []).map((c: any) => {
          // The customers/search route returns the primary service_address
          // nested under primary_service_address[0].service_address. Prefer
          // those structured fields when present; fall back to the customer's
          // own address columns otherwise.
          const psa = Array.isArray(c.primary_service_address)
            ? c.primary_service_address[0]
            : null;
          const sa = psa?.service_address ?? null;
          const street = sa?.street_address ?? c.address ?? null;
          const city = sa?.city ?? c.city ?? null;
          const state = sa?.state ?? c.state ?? null;
          const zip = sa?.zip_code ?? c.zip_code ?? null;
          const display = [street, city, [state, zip].filter(Boolean).join(' ')]
            .filter(Boolean)
            .join(', ') || null;
          return {
            id: c.id,
            displayName: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || 'Unknown',
            email: c.email ?? null,
            phone: c.phone ?? null,
            address: display,
            street,
            city,
            state,
            zip,
            latitude: null,
            longitude: null,
            serviceAddressId: sa?.id ?? null,
          };
        });
        setCustomerResults(results);
        setShowResults(results.length > 0);
      }
    } catch {
      // Silent fail — manual entry still available
    } finally {
      setIsSearching(false);
    }
  }, [companyId]);

  const handleCustomerQueryChange = (value: string) => {
    setCustomerQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => searchCustomers(value), 400);
  };

  const selectCustomer = async (result: CustomerResult) => {
    onClientNameChange?.(result.displayName);
    onClientEmailChange?.(result.email ?? '');
    onClientPhoneChange?.(result.phone ?? '');
    onServiceAddressIdChange?.(result.serviceAddressId ?? null);
    setCustomerQuery(result.displayName);
    setShowResults(false);
    setCustomerAddressError(null);

    const street = (result.street ?? '').trim();
    const city = (result.city ?? '').trim();
    const state = (result.state ?? '').trim();
    const zip = (result.zip ?? '').trim();
    const addressLine = [street, city, [state, zip].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ');

    if (!addressLine) return;

    const synthesizeAddressComponents = (lat: number, lng: number): AddressComponents => ({
      formatted_address: addressLine,
      route: street || undefined,
      locality: city || undefined,
      administrative_area_level_1: state || undefined,
      postal_code: zip || undefined,
      latitude: lat,
      longitude: lng,
    });

    if (typeof result.latitude === 'number' && typeof result.longitude === 'number') {
      applyAddressSelection(
        synthesizeAddressComponents(result.latitude, result.longitude),
        street || addressLine
      );
      setManualMode(false);
      return;
    }

    setIsResolvingCustomerAddress(true);
    try {
      const res = await fetch(`/api/internal/geocode?address=${encodeURIComponent(addressLine)}`);
      const data = await res.json();
      if (data.success && data.coordinates) {
        applyAddressSelection(
          synthesizeAddressComponents(data.coordinates.latitude, data.coordinates.longitude),
          street || addressLine
        );
        setManualMode(false);
      } else {
        setCustomerAddressError(
          'Could not locate this customer on the map. Enter the address manually below.'
        );
        onChange({ ...mapPlotData, addressInput: addressLine });
        setManualMode(true);
      }
    } catch {
      setCustomerAddressError(
        'Could not locate this customer on the map. Enter the address manually below.'
      );
      onChange({ ...mapPlotData, addressInput: addressLine });
      setManualMode(true);
    } finally {
      setIsResolvingCustomerAddress(false);
    }
  };

  return (
    <div className={styles.stepScrollable}>
      <div className={styles.section}>
        <h2 className={styles.mapAddressStepTitle}>Map Address</h2>
        <p className={styles.mapAddressStepDesc}>
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

      {isResolvingCustomerAddress && (
        <p className={styles.fieldHint}>Looking up address&hellip;</p>
      )}
      {customerAddressError && (
        <p className={styles.errorState}>{customerAddressError}</p>
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
              // Brand-new address — clear any prior customer service-address
              // selection so the backend creates/finds a fresh one from these
              // components.
              onServiceAddressIdChange?.(null);
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

      {/* ── Customer Information (new inspections only) ── */}
      {isNewInspection && (
        <div className={styles.customerInfoSection}>
          <h3 className={styles.customerInfoTitle}>Customer Information</h3>

          {/* Search */}
          <div className={styles.fieldGroup} ref={searchContainerRef}>
            <label className={styles.fieldLabel}>Search Existing Customers</label>
            <div className={styles.customerSearchWrapper}>
              <input
                type="text"
                className={styles.customerSearchInput}
                value={customerQuery}
                onChange={e => handleCustomerQueryChange(e.target.value)}
                onFocus={() => { if (customerResults.length > 0) setShowResults(true); }}
                placeholder="Search by name, email, or phone…"
                autoComplete="off"
              />
              {isSearching && <span className={styles.customerSearchSpinner} />}
              {showResults && customerResults.length > 0 && (
                <ul className={styles.customerSearchResults}>
                  {customerResults.map(r => (
                    <li
                      key={r.id}
                      className={styles.customerSearchResultItem}
                      onMouseDown={() => selectCustomer(r)}
                    >
                      <span className={styles.customerResultName}>{r.displayName}</span>
                      {(r.email || r.phone) && (
                        <span className={styles.customerResultMeta}>
                          {[r.email, r.phone].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Manual fields */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="new-insp-name">
              Full Name <span className={styles.customerRequiredMark}>*</span>
            </label>
            <input
              id="new-insp-name"
              type="text"
              className={styles.customerTextInput}
              value={clientName}
              onChange={e => onClientNameChange?.(e.target.value)}
              placeholder="Customer full name"
              autoComplete="name"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="new-insp-email">Email</label>
            <input
              id="new-insp-email"
              type="email"
              className={styles.customerTextInput}
              value={clientEmail}
              onChange={e => onClientEmailChange?.(e.target.value)}
              placeholder="customer@email.com"
              autoComplete="email"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="new-insp-phone">Phone</label>
            <input
              id="new-insp-phone"
              type="tel"
              className={styles.customerTextInput}
              value={clientPhone}
              onChange={e => onClientPhoneChange?.(e.target.value)}
              placeholder="(555) 555-5555"
              autoComplete="tel"
            />
          </div>
        </div>
      )}
    </div>
  );
}
