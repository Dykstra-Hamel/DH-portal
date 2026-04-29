import { useState, useEffect, useMemo } from 'react';
import { MapPinned } from 'lucide-react';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { authenticatedFetch } from '@/lib/api-client';
import { generateHomeSizeOptions, generateYardSizeOptions } from '@/lib/pricing-calculations';
import { CompanyPricingSettings } from '@/types/pricing';
import {
  AddressAutocomplete,
  AddressComponents,
} from '@/components/Common/AddressAutocomplete/AddressAutocomplete';
import { StreetViewImage } from '@/components/Common/StreetViewImage/StreetViewImage';
import { ServiceAddressData } from '@/lib/service-addresses';
import styles from './ServiceLocationCard.module.scss';
import cardStyles from '../InfoCard/InfoCard.module.scss';

interface ServiceLocationCardProps {
  serviceAddress: {
    id?: string;
    street_address?: string | null;
    apartment_unit?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    home_size_range?: string | null;
    yard_size_range?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    hasStreetView?: boolean | null;
    address_type?: string | null;
  } | null;
  leadId?: string;
  leadServiceAddressId?: string | null;
  leadPropertyType?: 'residential' | 'commercial' | null;
  startExpanded?: boolean;
  showSizeInputs?: boolean;
  pricingSettings?: CompanyPricingSettings;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
  onRequestUndo?: (undoHandler: () => Promise<void>) => void;
  onPropertyTypeUpdated?: (value: 'residential' | 'commercial') => void;
  editable?: boolean;
  onAddressSelect?: (addressComponents: AddressComponents) => void;
  onSaveAddress?: () => void;
  onCancelAddress?: () => void;
  hasAddressChanges?: boolean;
  isSavingAddress?: boolean;
  serviceLocationData?: ServiceAddressData;
  onServiceLocationChange?: (field: keyof ServiceAddressData, value: string) => void;
  hasCompleteUnchangedAddress?: boolean;
  currentFormattedAddress?: string;
  onExpand?: () => void;
  onCollapse?: () => void;
  forceCollapse?: boolean;
  isCompact?: boolean;
  inSidebar?: boolean;
  unwrapped?: boolean;
}

export function ServiceLocationCard({
  serviceAddress,
  leadId,
  leadServiceAddressId,
  leadPropertyType,
  startExpanded = false,
  showSizeInputs = false,
  pricingSettings,
  onShowToast,
  onRequestUndo,
  onPropertyTypeUpdated,
  editable = false,
  onAddressSelect,
  onSaveAddress,
  onCancelAddress,
  hasAddressChanges = false,
  isSavingAddress = false,
  serviceLocationData,
  onServiceLocationChange,
  hasCompleteUnchangedAddress = false,
  currentFormattedAddress = '',
  onExpand,
  onCollapse,
  forceCollapse = false,
  isCompact = false,
  inSidebar = false,
  unwrapped = false,
}: ServiceLocationCardProps) {
  const [selectedHomeSizeOption, setSelectedHomeSizeOption] = useState<string>('');
  const [selectedYardSizeOption, setSelectedYardSizeOption] = useState<string>('');

  const [isSavingPropertyType, setIsSavingPropertyType] = useState(false);

  // Derive the displayed value directly from DB props — never store it in
  // local state. Only trust service_address.address_type when the address is
  // the one actually linked to the lead (so the value matches what the
  // property_type cascade writes to). Otherwise fall back to lead.property_type.
  // Anything other than residential/commercial (industrial, mixed_use, etc.)
  // defaults to residential per product spec.
  const selectedPropertyType = useMemo<'residential' | 'commercial' | ''>(() => {
    const isLinkedAddress =
      !!leadServiceAddressId &&
      !!serviceAddress?.id &&
      serviceAddress.id === leadServiceAddressId;
    if (isLinkedAddress) {
      const at = serviceAddress?.address_type;
      if (at === 'residential' || at === 'commercial') return at;
      if (at) return 'residential';
    }
    if (leadPropertyType === 'residential' || leadPropertyType === 'commercial') {
      return leadPropertyType;
    }
    return '';
  }, [
    leadServiceAddressId,
    serviceAddress?.id,
    serviceAddress?.address_type,
    leadPropertyType,
  ]);

  const handleUpdatePropertyType = async (
    value: 'residential' | 'commercial'
  ) => {
    if (isSavingPropertyType || !leadId) return;

    setIsSavingPropertyType(true);

    try {
      await authenticatedFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_type: value }),
      });
      onShowToast?.('Property type updated', 'success');
      onPropertyTypeUpdated?.(value);
    } catch {
      onShowToast?.('Failed to update property type', 'error');
    } finally {
      setIsSavingPropertyType(false);
    }
  };

  const propertyTypeControl = (
    <div className={styles.callDetailItem}>
      <span className={cardStyles.dataLabel}>Property Type</span>
      <div
        className={styles.propertyTypeGroup}
        role="radiogroup"
        aria-label="Property Type"
      >
        <button
          type="button"
          role="radio"
          aria-checked={selectedPropertyType === 'residential'}
          className={`${styles.propertyTypeBtn} ${
            selectedPropertyType === 'residential' ? styles.propertyTypeBtnActive : ''
          }`}
          onClick={() => handleUpdatePropertyType('residential')}
          disabled={isSavingPropertyType}
        >
          Residential
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={selectedPropertyType === 'commercial'}
          className={`${styles.propertyTypeBtn} ${
            selectedPropertyType === 'commercial' ? styles.propertyTypeBtnActive : ''
          }`}
          onClick={() => handleUpdatePropertyType('commercial')}
          disabled={isSavingPropertyType}
        >
          Commercial
        </button>
      </div>
    </div>
  );

  // Generate size options only if pricing settings are provided
  const homeSizeOptions = useMemo(() => {
    if (!pricingSettings) return [];
    return generateHomeSizeOptions(pricingSettings);
  }, [pricingSettings]);

  const yardSizeOptions = useMemo(() => {
    if (!pricingSettings) return [];
    return generateYardSizeOptions(pricingSettings);
  }, [pricingSettings]);

  // Pre-populate size options from service address
  useEffect(() => {
    if (serviceAddress?.home_size_range && selectedHomeSizeOption === '') {
      setSelectedHomeSizeOption(serviceAddress.home_size_range);
    }
    if (serviceAddress?.yard_size_range && selectedYardSizeOption === '') {
      setSelectedYardSizeOption(serviceAddress.yard_size_range);
    }
  }, [serviceAddress?.home_size_range, serviceAddress?.yard_size_range, selectedHomeSizeOption, selectedYardSizeOption]);

  // Fallback geocoding: If address exists but coordinates are missing, geocode and update
  useEffect(() => {
    const geocodeAndUpdateAddress = async () => {
      // Only geocode if we have an ID, valid address, but missing coordinates
      if (
        serviceAddress?.id &&
        serviceAddress.street_address &&
        serviceAddress.city &&
        serviceAddress.state &&
        (!serviceAddress.latitude || !serviceAddress.longitude)
      ) {
        try {
          const geocodeResponse = await fetch('/api/internal/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              street: serviceAddress.street_address,
              city: serviceAddress.city,
              state: serviceAddress.state,
              zip: serviceAddress.zip_code,
            }),
          });

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.success && geocodeData.coordinates) {
              // Update the service address with coordinates in the database
              await authenticatedFetch(`/api/service-addresses/${serviceAddress.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  latitude: geocodeData.coordinates.lat,
                  longitude: geocodeData.coordinates.lng,
                  hasStreetView: geocodeData.coordinates.hasStreetView || false,
                }),
              });

              // Update local state so the street view image shows immediately
              if (onServiceLocationChange) {
                onServiceLocationChange('latitude', geocodeData.coordinates.lat.toString());
                onServiceLocationChange('longitude', geocodeData.coordinates.lng.toString());
              }
            }
          }
        } catch (error) {
          // Geocoding failed silently - will retry on next load
        }
      }
    };

    geocodeAndUpdateAddress();
  }, [serviceAddress?.id, serviceAddress?.street_address, serviceAddress?.city, serviceAddress?.state, serviceAddress?.latitude, serviceAddress?.longitude, serviceAddress?.zip_code]);

  const handleUpdateServiceAddressSize = async (
    field: 'home_size_range' | 'yard_size_range',
    value: string
  ) => {
    if (!serviceAddress?.id || !value) return;

    const fieldLabel = field === 'home_size_range' ? 'Home size' : 'Yard size';
    const oldValue = serviceAddress[field] || '';

    try {
      await authenticatedFetch(`/api/service-addresses/${serviceAddress.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      onShowToast?.(`${fieldLabel} updated successfully`, 'success');

      // Provide undo handler
      if (onRequestUndo) {
        const undoHandler = async () => {
          try {
            // Revert in database
            await authenticatedFetch(`/api/service-addresses/${serviceAddress.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ [field]: oldValue || null }),
            });

            // Revert UI state
            if (field === 'home_size_range') {
              setSelectedHomeSizeOption(oldValue);
            } else {
              setSelectedYardSizeOption(oldValue);
            }

            onShowToast?.('Change undone', 'success');
          } catch (error) {
            onShowToast?.('Failed to undo change', 'error');
          }
        };

        onRequestUndo(undoHandler);
      }
    } catch (error) {
      onShowToast?.(`Failed to update ${fieldLabel.toLowerCase()}`, 'error');
    }
  };

  const filterNone = (value: string | null | undefined): string => {
    if (!value || value.trim() === '' || value.toLowerCase() === 'none') {
      return 'Not provided';
    }
    return value;
  };

  // Render read-only mode (original behavior)
  if (!editable) {
    const readOnlyBody = (
        <div className={styles.cardContent}>
          {serviceAddress ? (
            <div className={styles.callInsightsGrid}>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Street Address</span>
                <span className={cardStyles.dataText}>
                  {filterNone(serviceAddress.street_address)}
                  {serviceAddress.apartment_unit &&
                    serviceAddress.apartment_unit.toLowerCase() !== 'none' &&
                    `, ${serviceAddress.apartment_unit}`}
                </span>
              </div>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>City</span>
                <span className={cardStyles.dataText}>
                  {filterNone(serviceAddress.city)}
                </span>
              </div>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>State</span>
                <span className={cardStyles.dataText}>
                  {filterNone(serviceAddress.state)}
                </span>
              </div>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Zip Code</span>
                <span className={cardStyles.dataText}>
                  {filterNone(serviceAddress.zip_code)}
                </span>
              </div>

              {showSizeInputs && pricingSettings && (
                <>
                  <div className={styles.callDetailItem}>
                    <span className={cardStyles.dataLabel}>Size of Home</span>
                    <select
                      className={styles.selectInput}
                      value={selectedHomeSizeOption}
                      onChange={async e => {
                        const rangeValue = e.target.value;
                        setSelectedHomeSizeOption(rangeValue);
                        await handleUpdateServiceAddressSize('home_size_range', rangeValue);
                      }}
                    >
                      <option value="">Select home size</option>
                      {homeSizeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.callDetailItem}>
                    <span className={cardStyles.dataLabel}>Yard Size</span>
                    <select
                      className={styles.selectInput}
                      value={selectedYardSizeOption}
                      onChange={async e => {
                        const rangeValue = e.target.value;
                        setSelectedYardSizeOption(rangeValue);
                        await handleUpdateServiceAddressSize('yard_size_range', rangeValue);
                      }}
                    >
                      <option value="">Select yard size</option>
                      {yardSizeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {(serviceAddress?.id || leadId) && propertyTypeControl}
            </div>
          ) : (
            <div className={cardStyles.lightText}>
              No service location available
            </div>
          )}
        </div>
    );

    if (unwrapped) return readOnlyBody;

    return (
      <InfoCard
        title="Service Location"
        icon={<MapPinned size={20} />}
        startExpanded={startExpanded}
        onExpand={onExpand}
        onCollapse={onCollapse}
        forceCollapse={forceCollapse}
        isCompact={isCompact}
        inSidebar={inSidebar}
      >
        {readOnlyBody}
      </InfoCard>
    );
  }

  // Render editable mode
  const editableBody = (
      <div className={styles.cardContent}>
        <div className={styles.serviceLocationGrid}>
          {/* Row 1: City, State, Zip (3 columns) */}
          <div className={`${styles.gridRow} ${styles.threeColumns}`}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>City</label>
              <input
                type="text"
                className={styles.textInput}
                value={serviceLocationData?.city || ''}
                onChange={e =>
                  onServiceLocationChange?.('city', e.target.value)
                }
                placeholder="Anytown"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>State</label>
              <input
                type="text"
                className={styles.textInput}
                value={serviceLocationData?.state || ''}
                onChange={e =>
                  onServiceLocationChange?.('state', e.target.value)
                }
                placeholder="CA"
                maxLength={2}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Zip</label>
              <input
                type="text"
                className={styles.textInput}
                value={serviceLocationData?.zip_code || ''}
                onChange={e =>
                  onServiceLocationChange?.('zip_code', e.target.value)
                }
                placeholder="12345"
              />
            </div>
          </div>

          {/* Row 2: Address (1 column - full width) */}
          <div className={`${styles.gridRow} ${styles.oneColumn}`}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Address</label>
              <AddressAutocomplete
                value={serviceLocationData?.street_address || ''}
                onChange={value =>
                  onServiceLocationChange?.('street_address', value)
                }
                onAddressSelect={onAddressSelect || (() => {})}
                placeholder="324 Winston Churchill Drive, Suite #34"
                hideDropdown={hasCompleteUnchangedAddress}
              />
            </div>
          </div>

          {/* Row 3: Size of Home, Yard Size (2 columns) */}
          {showSizeInputs && pricingSettings && (
            <div className={`${styles.gridRow} ${styles.twoColumns}`}>
              <div className={styles.formField}>
                <div className={styles.fieldHeader}>
                  <label className={styles.fieldLabel}>Size of Home</label>
                </div>
                <select
                  className={styles.selectInput}
                  value={selectedHomeSizeOption}
                  onChange={async e => {
                    const rangeValue = e.target.value;
                    setSelectedHomeSizeOption(rangeValue);
                    await handleUpdateServiceAddressSize('home_size_range', rangeValue);
                  }}
                >
                  <option value="">Select home size</option>
                  {homeSizeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <div className={styles.fieldHeader}>
                  <label className={styles.fieldLabel}>Yard Size</label>
                </div>
                <select
                  className={styles.selectInput}
                  value={selectedYardSizeOption}
                  onChange={async e => {
                    const rangeValue = e.target.value;
                    setSelectedYardSizeOption(rangeValue);
                    await handleUpdateServiceAddressSize('yard_size_range', rangeValue);
                  }}
                >
                  <option value="">Select yard size</option>
                  {yardSizeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {(serviceAddress?.id || leadId) && (
            <div className={`${styles.gridRow} ${styles.oneColumn}`}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Property Type</label>
                <div
                  className={styles.propertyTypeGroup}
                  role="radiogroup"
                  aria-label="Property Type"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedPropertyType === 'residential'}
                    className={`${styles.propertyTypeBtn} ${
                      selectedPropertyType === 'residential'
                        ? styles.propertyTypeBtnActive
                        : ''
                    }`}
                    onClick={() => handleUpdatePropertyType('residential')}
                    disabled={isSavingPropertyType}
                  >
                    Residential
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedPropertyType === 'commercial'}
                    className={`${styles.propertyTypeBtn} ${
                      selectedPropertyType === 'commercial'
                        ? styles.propertyTypeBtnActive
                        : ''
                    }`}
                    onClick={() => handleUpdatePropertyType('commercial')}
                    disabled={isSavingPropertyType}
                  >
                    Commercial
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Street View Image (1 column - full width) */}
          <div className={`${styles.gridRow} ${styles.oneColumn}`}>
            <div className={styles.streetViewContainer}>
              <StreetViewImage
                address={currentFormattedAddress}
                latitude={serviceLocationData?.latitude}
                longitude={serviceLocationData?.longitude}
                width={600}
                height={240}
                className={styles.streetViewImage}
                showPlaceholder={
                  !currentFormattedAddress && !serviceLocationData?.latitude
                }
                fallbackToSatellite={true}
              />
            </div>
          </div>
        </div>

        {/* Save/Cancel Address Changes */}
        {hasAddressChanges && (
          <div className={styles.addressActions}>
            <div className={styles.actionButtons}>
              <button
                className={`${styles.button} ${styles.cancelButton}`}
                onClick={onCancelAddress}
                disabled={isSavingAddress}
              >
                Cancel
              </button>
              <button
                className={`${styles.button} ${styles.saveButton}`}
                onClick={onSaveAddress}
                disabled={!hasAddressChanges || isSavingAddress}
              >
                {isSavingAddress ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
  );

  if (unwrapped) return editableBody;

  return (
    <InfoCard
      title="Service Location"
      icon={<MapPinned size={20} />}
      startExpanded={startExpanded}
      onExpand={onExpand}
      onCollapse={onCollapse}
      forceCollapse={forceCollapse}
      isCompact={isCompact}
      inSidebar={inSidebar}
    >
      {editableBody}
    </InfoCard>
  );
}
