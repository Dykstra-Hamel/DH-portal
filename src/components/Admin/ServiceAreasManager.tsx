'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ServiceAreaMap from '@/components/Widget/ServiceAreaMap';
import { getCompanyCoordinates, createCachedGeocodeResult } from '@/lib/geocoding';
import { adminAPI } from '@/lib/api-client';
import styles from './ServiceAreasManager.module.scss';

interface ServiceAreasManagerProps {
  companyId: string;
}

interface Company {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  widget_config?: any;
}

export default function ServiceAreasManager({ companyId }: ServiceAreasManagerProps) {
  const [serviceAreaInput, setServiceAreaInput] = useState('');
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [showServiceAreaMap, setShowServiceAreaMap] = useState(true);
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zipCodes, setZipCodes] = useState<string[]>([]);

  // Track if we've already geocoded to prevent re-centering after initial load
  const hasGeocodedRef = useRef(false);
  // Track if we've passed the initial center to the map
  const hasPassedCenterRef = useRef(false);
  // Store the initial center to pass only once
  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // Create stable callback for ServiceAreaMap to prevent infinite loop
  const handleAreasChange = useCallback((areas: any[]) => {
    setServiceAreas(areas);
  }, []);

  // Geocode company address - wrapped in useCallback to match WidgetConfig
  const geocodeCompanyAddress = useCallback(async (company: Company) => {
    // Only geocode once per component mount
    if (hasGeocodedRef.current) return;

    try {
      const coordinates = await getCompanyCoordinates(company);
      setMapCenter({ lat: coordinates.lat, lng: coordinates.lng });
      hasGeocodedRef.current = true; // Mark as geocoded

      // Cache the result in widget_config if it's not already cached
      if (!company.widget_config?.geocodedAddress) {
        const cachedResult = createCachedGeocodeResult(coordinates);
        // Update the company config to include the cached geocode result
        try {
          await adminAPI.updateCompany(company.id, {
            widget_config: {
              ...company.widget_config,
              geocodedAddress: cachedResult,
            },
          });
        } catch (error) {
          console.error('Failed to cache geocoded address:', error);
          // Non-critical error, don't block the UI
        }
      }
    } catch (error) {
      console.error('Error geocoding company address:', error);
      // setMapCenter will remain null, ServiceAreaMap will use fallback
    }
  }, []);

  // Set initial center only once when mapCenter is first available
  useEffect(() => {
    if (mapCenter && !hasPassedCenterRef.current) {
      setInitialCenter(mapCenter);
      hasPassedCenterRef.current = true;
    }
  }, [mapCenter]);

  // Fetch Google API key on mount
  useEffect(() => {
    const fetchGoogleApiKey = async () => {
      try {
        const response = await fetch('/api/google-places-key');
        if (response.ok) {
          const data = await response.json();
          setGoogleApiKey(data.apiKey || '');
        }
      } catch (error) {
        console.error('Error fetching Google API key:', error);
      }
    };
    fetchGoogleApiKey();
  }, []);

  // Load service areas and geocode company address
  useEffect(() => {
    // Reset flags when companyId changes
    hasGeocodedRef.current = false;
    hasPassedCenterRef.current = false;
    setInitialCenter(undefined);

    const loadData = async () => {
      if (!companyId) return;

      try {
        setLoading(true);

        // Fetch company details using adminAPI (same as WidgetConfig)
        const companies = await adminAPI.getCompanies();
        const company = companies.find((c: Company) => c.id === companyId);

        if (company) {
          // Geocode company address for map centering (only happens once per company)
          geocodeCompanyAddress(company);
        }

        // Load service areas
        const response = await fetch(`/api/service-areas/${companyId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const areas = data.serviceAreas || [];
            // Separate geographic areas from zip codes
            const geographic = areas.filter((a: any) => a.type !== 'zip_code');
            const zipCodeAreas = areas.filter((a: any) => a.type === 'zip_code');
            setServiceAreas(geographic);
            // Extract zip codes from zip code areas
            const allZipCodes = zipCodeAreas.flatMap((a: any) => a.zipCodes || []);
            setZipCodes(allZipCodes);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setServiceAreas([]);
        setZipCodes([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId, geocodeCompanyAddress]);

  const saveServiceAreas = async (areas: any[]) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/service-areas/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceAreas: areas }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServiceAreas(areas);
        } else {
          throw new Error(data.error || 'Failed to save service areas');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server responded with ${response.status}`
        );
      }
    } catch (error) {
      console.error('Error saving service areas:', error);
      alert('Failed to save service areas. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addZipCode = () => {
    if (serviceAreaInput.trim() && !zipCodes.includes(serviceAreaInput.trim())) {
      const newZipCodes = [...zipCodes, serviceAreaInput.trim()];
      setZipCodes(newZipCodes);
      setServiceAreaInput('');
      // Save zip codes to widget config
      saveZipCodes(newZipCodes);
    }
  };

  const removeZipCode = (zipCode: string) => {
    const newZipCodes = zipCodes.filter(z => z !== zipCode);
    setZipCodes(newZipCodes);
    // Save zip codes to widget config
    saveZipCodes(newZipCodes);
  };

  const saveZipCodes = async (zipCodeList: string[]) => {
    try {
      // Get current widget config
      const response = await fetch(`/api/companies/${companyId}/widget-config`);
      if (response.ok) {
        const { widgetConfig } = await response.json();

        // Update widget config with new zip codes
        const updateResponse = await fetch(`/api/companies/${companyId}/widget-config`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            widget_config: {
              ...widgetConfig,
              service_areas: zipCodeList,
            },
          }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to save zip codes');
        }
      }
    } catch (error) {
      console.error('Error saving zip codes:', error);
      alert('Failed to save zip codes. Please try again.');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading service areas...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Service Areas</h2>
          <p>Define where you provide service using geographic areas or zip codes.</p>
        </div>
      </div>

      <div className={styles.serviceAreaTabs}>
        <button
          type="button"
          className={`${styles.tabButton} ${showServiceAreaMap ? styles.active : ''}`}
          onClick={() => setShowServiceAreaMap(true)}
        >
          Geographic Areas
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${!showServiceAreaMap ? styles.active : ''}`}
          onClick={() => setShowServiceAreaMap(false)}
        >
          Zip Codes
        </button>
      </div>

      {!showServiceAreaMap ? (
        <div className={styles.zipCodeSection}>
          <div className={styles.serviceAreaInput}>
            <input
              type="text"
              value={serviceAreaInput}
              onChange={e => setServiceAreaInput(e.target.value)}
              placeholder="Enter zip code (e.g., 12345)"
              onKeyDown={e => e.key === 'Enter' && addZipCode()}
            />
            <button onClick={addZipCode} type="button">
              Add
            </button>
          </div>
          <div className={styles.serviceAreas}>
            {zipCodes.map(zipCode => (
              <span key={zipCode} className={styles.serviceArea}>
                {zipCode}
                <button
                  type="button"
                  onClick={() => removeZipCode(zipCode)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {zipCodes.length === 0 && (
            <p className={styles.emptyState}>
              No zip codes configured. Add zip codes to restrict service to specific areas.
            </p>
          )}
        </div>
      ) : (
        <div className={styles.geographicSection}>
          {googleApiKey ? (
            <ServiceAreaMap
              companyId={companyId}
              existingAreas={serviceAreas}
              onAreasChange={handleAreasChange}
              onSave={saveServiceAreas}
              googleMapsApiKey={googleApiKey}
              defaultCenter={initialCenter}
            />
          ) : (
            <div className={styles.missingApiKey}>
              <p>
                Google Maps API key is required for geographic service areas.
              </p>
              <p>
                Please add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to your environment
                variables.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
