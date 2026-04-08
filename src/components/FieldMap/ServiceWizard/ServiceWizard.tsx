'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useCompany } from '@/contexts/CompanyContext';
import { DEFAULT_MAP_PLOT_DATA, getMapLatitude, getMapLongitude, MapPlotData } from '@/components/FieldMap/MapPlot/types';
import { MapAddressStep } from './steps/MapAddressStep';
import { MapPlotStep, getPlottedPestTypes } from './steps/MapPlotStep';
import { PlanSelectStep } from './steps/PlanSelectStep';
import type { ServicePlan } from './steps/PlanSelectStep';
import { PricingStep } from './steps/PricingStep';
import type { PricingValues } from './steps/PricingStep';
import { ReviewStep } from './steps/ReviewStep';
import { ActionStep } from './steps/ActionStep';
import styles from './ServiceWizard.module.scss';

const STEP_LABELS = ['Address', 'Map & Plot', 'Select Plan', 'Pricing', 'Review', 'Finalize'];
const STEP_COUNT = STEP_LABELS.length;

interface ServiceWizardProps {
  stopId?: string;
}

export function ServiceWizard({ stopId }: ServiceWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useUser();
  const { selectedCompany } = useCompany();

  const clientName = searchParams.get('clientName') ?? '';
  const clientEmail = searchParams.get('clientEmail') ?? '';
  const address = searchParams.get('address') ?? '';

  // When launched from a service order the address is already known — skip step 0
  const hasPrefilledAddress = Boolean(stopId && address);

  const inspectorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Inspector';
  const companyName = selectedCompany?.name ?? 'DH Portal';

  const [currentStep, setCurrentStep] = useState(() => (hasPrefilledAddress ? 1 : 0));
  const [mapPlotData, setMapPlotData] = useState<MapPlotData>(() => ({
    ...DEFAULT_MAP_PLOT_DATA,
    addressInput: address,
  }));
  const [isGeocoding, setIsGeocoding] = useState(hasPrefilledAddress);

  // When skipping the address step, geocode the pre-filled address to get coordinates
  useEffect(() => {
    if (!hasPrefilledAddress) return;
    setIsGeocoding(true);
    fetch(`/api/internal/geocode?address=${encodeURIComponent(address)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.coordinates) {
          setMapPlotData(prev => ({
            ...prev,
            centerLat: data.coordinates.latitude,
            centerLng: data.coordinates.longitude,
            zoom: 20,
            heading: 0,
            tilt: 0,
            backgroundMode: 'satellite',
          }));
        }
      })
      .finally(() => setIsGeocoding(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [pricing, setPricing] = useState<PricingValues>({
    initialPrice: null,
    recurringPrice: null,
    billingFrequency: null,
  });
  const [notes, setNotes] = useState('');

  const selectedAddressFromComponents =
    mapPlotData.addressComponents && typeof mapPlotData.addressComponents.formatted_address === 'string'
      ? mapPlotData.addressComponents.formatted_address
      : '';
  const selectedAddress = selectedAddressFromComponents || mapPlotData.addressInput || '';
  const inspectionAddress = selectedAddress || address;
  const pestTypes = getPlottedPestTypes(mapPlotData);

  const handleMapChange = useCallback((data: MapPlotData) => {
    setMapPlotData(data);
  }, []);

  function canAdvance(): boolean {
    switch (currentStep) {
      case 0:
        return getMapLatitude(mapPlotData) !== null && getMapLongitude(mapPlotData) !== null;
      case 1:
        return mapPlotData.isViewSet;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (currentStep < STEP_COUNT - 1) setCurrentStep(s => s + 1);
  }

  function handleBack() {
    const firstStep = hasPrefilledAddress ? 1 : 0;
    if (currentStep > firstStep) {
      setCurrentStep(s => s - 1);
    } else {
      router.back();
    }
  }

  const isLastStep = currentStep === STEP_COUNT - 1;

  function renderStepContent() {
    switch (currentStep) {
      case 0:
        return (
          <MapAddressStep
            mapPlotData={mapPlotData}
            onChange={handleMapChange}
          />
        );
      case 1:
        return (
          <div className={styles.stepFull}>
            <MapPlotStep
              address={inspectionAddress}
              initialData={mapPlotData}
              onChange={handleMapChange}
              onBack={handleBack}
              onNext={handleNext}
              canNext={canAdvance()}
            />
          </div>
        );
      case 2:
        return (
          <div className={styles.stepScrollable}>
            <PlanSelectStep
              pestTypes={pestTypes}
              selectedPlanId={selectedPlan?.id ?? null}
              onSelect={plan => {
                setSelectedPlan(plan);
                setPricing({
                  initialPrice: plan.initial_price,
                  recurringPrice: plan.recurring_price,
                  billingFrequency: plan.billing_frequency,
                });
              }}
            />
          </div>
        );
      case 3:
        return (
          <div className={styles.stepScrollable}>
            <PricingStep
              plan={selectedPlan}
              pricing={pricing}
              onChange={setPricing}
            />
          </div>
        );
      case 4:
        return (
          <div className={styles.stepScrollable}>
            <ReviewStep
              clientName={clientName}
              address={inspectionAddress}
              pestTypes={pestTypes}
              plan={selectedPlan}
              pricing={pricing}
              notes={notes}
              onNotesChange={setNotes}
              mapPlotData={mapPlotData}
            />
          </div>
        );
      case 5:
        return (
          <div className={styles.stepScrollable}>
            <ActionStep
              clientName={clientName}
              clientEmail={clientEmail}
              address={inspectionAddress}
              pestTypes={pestTypes}
              plan={selectedPlan}
              pricing={pricing}
              notes={notes}
              mapPlotData={mapPlotData}
              inspectorName={inspectorName}
              companyName={companyName}
              companyId={selectedCompany?.id ?? ''}
            />
          </div>
        );
      default:
        return null;
    }
  }

  if (isGeocoding) {
    return (
      <div className={styles.wizard}>
        <div className={styles.geocodingState}>
          <div className={styles.geocodingSpinner} />
          <p>Loading map&hellip;</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wizard}>
      {/* Header */}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={handleBack}
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <p className={styles.headerTitle}>{clientName || 'New Inspection'}</p>
          {inspectionAddress && <p className={styles.headerSub}>{inspectionAddress}</p>}
        </div>
      </div>

      {/* Step track */}
      <div className={styles.stepTrack}>
        {Array.from({ length: STEP_COUNT }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_COUNT - 1 ? 1 : 0 }}>
            <div
              className={`${styles.stepDot} ${i === currentStep ? styles.stepDotActive : i < currentStep ? styles.stepDotDone : ''}`}
            />
            {i < STEP_COUNT - 1 && <div className={styles.stepLine} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className={styles.stepContent}>
        {renderStepContent()}
      </div>

      {/* Address step footer */}
      {currentStep === 0 && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.prevBtn}
            onClick={handleBack}
            aria-label="Previous step"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={!canAdvance()}
          >
            Continue
          </button>
        </div>
      )}

      {/* Footer — hidden on map step (toolbar is inside canvas) and finalize step */}
      {currentStep !== 0 && currentStep !== 1 && currentStep !== STEP_COUNT - 1 && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.prevBtn}
            onClick={handleBack}
            aria-label="Previous step"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={!canAdvance()}
          >
            {isLastStep ? 'Finish' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}
