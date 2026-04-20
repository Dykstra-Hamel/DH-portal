'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useCompany } from '@/contexts/CompanyContext';
import {
  DEFAULT_MAP_PLOT_DATA,
  getMapLatitude,
  getMapLongitude,
  MapPlotData,
} from '@/components/FieldMap/MapPlot/types';
import { MapAddressStep } from './steps/MapAddressStep';
import { HousePhotoStep } from './steps/HousePhotoStep';
import {
  MapPlotStep,
  getPlottedPestTypes,
  getPlottedPests,
} from './steps/MapPlotStep';
import { QuoteBuildStep } from './steps/QuoteBuildStep';
import type { QuoteLineItem, AvailableDiscount } from './steps/QuoteBuildStep';
import { ReviewStep } from './steps/ReviewStep';
import styles from './ServiceWizard.module.scss';

const STEP_LABELS = ['Address', 'Photos', 'Map', 'Quote', 'Review'];
const STEP_COUNT = STEP_LABELS.length;

interface ServiceWizardProps {
  stopId?: string;
}

export function ServiceWizard({ stopId }: ServiceWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, getAvatarUrl } = useUser();
  const { selectedCompany } = useCompany();

  const companyIdParam = searchParams.get('companyId') ?? null;
  const routeStopId = searchParams.get('routeStopId') ?? null;

  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const inspectorName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'Inspector';
  const inspectorAvatarUrl = getAvatarUrl() ?? null;
  const inspectorTitle = profile?.title ?? null;
  const companyName = selectedCompany?.name ?? 'DH Portal';

  const initialStep = stopId ? 1 : 0;
  const [maxStepReached, setMaxStepReached] = useState(initialStep);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [mapPlotData, setMapPlotData] = useState<MapPlotData>(() => ({
    ...DEFAULT_MAP_PLOT_DATA,
  }));
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(Boolean(stopId));
  const [brandPrimaryColor, setBrandPrimaryColor] = useState<
    string | undefined
  >(undefined);

  const [pestIconMap, setPestIconMap] = useState<Record<string, string>>({});

  // Fetch brand primary color for stamp icons
  useEffect(() => {
    const companyId = selectedCompany?.id;
    fetch(`/api/companies/${companyId}/field-map-branding`)
      .then(r => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            primary_color?: string | null;
            quote_accent_color_preference?: string | null;
            secondary_color?: string | null;
          } | null
        ) => {
          if (!data) return;
          const isReversed = data.quote_accent_color_preference === 'secondary';
          const primary = isReversed
            ? data.secondary_color
            : data.primary_color;
          if (primary) setBrandPrimaryColor(primary);
        }
      )
      .catch(() => {});
  }, [selectedCompany?.id]);

  // Fetch pest icon map as soon as company is known
  useEffect(() => {
    if (!selectedCompany?.id) return;
    fetch(`/api/pest-options/${encodeURIComponent(selectedCompany.id)}`)
      .then(r => r.json())
      .then(
        (data: {
          success: boolean;
          data: { id: string; icon_svg: string }[];
        }) => {
          if (data.success && Array.isArray(data.data)) {
            const iconMap: Record<string, string> = {};
            for (const opt of data.data) {
              if (opt.id && opt.icon_svg) iconMap[opt.id] = opt.icon_svg;
            }
            setPestIconMap(iconMap);
          }
        }
      )
      .catch(() => {});
  }, [selectedCompany?.id]);

  // Mount effect: fetch stop data, populate clientInfo, auto-resume if lead exists
  useEffect(() => {
    if (!stopId) return;

    const resolvedCompanyId = selectedCompany?.id ?? companyIdParam ?? '';

    async function loadStopData() {
      try {
        const qs = new URLSearchParams();
        if (resolvedCompanyId) qs.set('companyId', resolvedCompanyId);
        const res = await fetch(
          `/api/field-map/service/${stopId}?${qs.toString()}`
        );
        if (!res.ok) return;
        const stopData = await res.json();

        setClientInfo({
          name: stopData.clientName ?? '',
          email: stopData.clientEmail ?? '',
          phone: stopData.clientPhone ?? '',
          address: stopData.address ?? '',
        });

        // Set map center from DB coordinates if available, else geocode
        if (stopData.lat != null && stopData.lng != null) {
          setMapPlotData(prev => ({
            ...prev,
            addressInput: stopData.address ?? '',
            centerLat: stopData.lat,
            centerLng: stopData.lng,
            zoom: 20,
            heading: 0,
            tilt: 0,
            backgroundMode: 'satellite',
          }));
        } else if (stopData.address) {
          setIsGeocoding(true);
          try {
            const geoRes = await fetch(
              `/api/internal/geocode?address=${encodeURIComponent(stopData.address)}`
            );
            const geoData = await geoRes.json();
            if (geoData.success && geoData.coordinates) {
              setMapPlotData(prev => ({
                ...prev,
                addressInput: stopData.address ?? '',
                centerLat: geoData.coordinates.latitude,
                centerLng: geoData.coordinates.longitude,
                zoom: 20,
                heading: 0,
                tilt: 0,
                backgroundMode: 'satellite',
              }));
            }
          } finally {
            setIsGeocoding(false);
          }
        } else {
          setMapPlotData(prev => ({
            ...prev,
            addressInput: stopData.address ?? '',
          }));
        }

        // If an existing lead is linked, restore state and fast-forward
        if (stopData.leadId) {
          const [leadRes, quoteRes] = await Promise.all([
            fetch(`/api/leads/${stopData.leadId}`),
            fetch(`/api/leads/${stopData.leadId}/quote`),
          ]);

          if (leadRes.ok && quoteRes.ok) {
            const lead = await leadRes.json();
            const quoteData = await quoteRes.json();

            if (lead.map_plot_data) {
              setMapPlotData({
                ...DEFAULT_MAP_PLOT_DATA,
                ...lead.map_plot_data,
                addressInput: stopData.address ?? '',
              });
            }

            const lineItems: any[] = (quoteData?.data?.line_items ?? [])
              .slice()
              .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
            const quoteStatus: string =
              quoteData?.data?.quote_status ?? 'draft';

            if (quoteData?.data?.applied_discount) {
              setAppliedDiscount(quoteData.data.applied_discount as AvailableDiscount);
            }

            if (lineItems.length > 0) {
              setQuoteLineItems(
                lineItems.map((item: any): QuoteLineItem => {
                  const catalogItemId =
                    item.service_plan_id ??
                    item.addon_service_id ??
                    item.bundle_plan_id ??
                    item.product_id ??
                    undefined;
                  const catalogItemKind: QuoteLineItem['catalogItemKind'] =
                    item.service_plan_id
                      ? 'plan'
                      : item.addon_service_id
                        ? 'addon'
                        : item.bundle_plan_id
                          ? 'bundle'
                          : item.product_id
                            ? 'product'
                            : undefined;
                  return {
                    id: item.id,
                    type: catalogItemId ? 'plan-addon' : 'custom',
                    catalogItemKind,
                    catalogItemId,
                    catalogItemName: item.plan_name,
                    customName: item.plan_name,
                    coveredPestIds: [],
                    coveredPestLabels: [],
                    initialCost: item.initial_price ?? null,
                    recurringCost: item.recurring_price ?? null,
                    frequency: item.billing_frequency ?? null,
                    parentLineItemId: item.parent_line_item_id ?? undefined,
                    quantity: item.quantity ?? null,
                    isRecommended: item.is_recommended === null ? undefined : item.is_recommended,
                  };
                })
              );
              if (quoteStatus !== 'draft') {
                setCurrentStep(4);
                setMaxStepReached(4);
              } else {
                setCurrentStep(3);
                setMaxStepReached(3);
              }
            } else if (quoteData?.data?.id) {
              // Quote record exists but no items → user already reached the Quote step
              setCurrentStep(3);
              setMaxStepReached(3);
            } else {
              // No quote record at all — resume at Map step
              setCurrentStep(2);
              setMaxStepReached(2);
            }

            setLeadId(stopData.leadId);
            if (quoteData?.data?.id) setQuoteId(quoteData.data.id);
          }
        }
      } catch {
        // Graceful fallback: stay on step 1
      } finally {
        setIsLoadingResume(false);
      }
    }

    loadStopData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [quoteLineItems, setQuoteLineItems] = useState<QuoteLineItem[]>([]);
  const [appliedDiscount, setAppliedDiscount] =
    useState<AvailableDiscount | null>(null);
  const [notes, setNotes] = useState('');
  const [returnToReviewAfterMapEdit, setReturnToReviewAfterMapEdit] =
    useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [stepSaveError, setStepSaveError] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const selectedAddressFromComponents =
    mapPlotData.addressComponents &&
    typeof mapPlotData.addressComponents.formatted_address === 'string'
      ? mapPlotData.addressComponents.formatted_address
      : '';
  const selectedAddress =
    selectedAddressFromComponents || mapPlotData.addressInput || '';
  const inspectionAddress = selectedAddress || clientInfo.address;
  const pestTypes = getPlottedPestTypes(mapPlotData);
  const plottedPests = getPlottedPests(mapPlotData);

  const mapMeasurements = useMemo(
    () => ({
      byOutline: mapPlotData.outlines
        .filter(o => o.sqft != null || o.linearFt != null)
        .map(o => ({
          id: o.id,
          type: o.type,
          sqft: o.sqft ?? 0,
          linearFt: o.linearFt ?? 0,
        })),
    }),
    [mapPlotData.outlines]
  );

  const handleMapChange = useCallback((data: MapPlotData) => {
    setMapPlotData(data);
  }, []);

  // Debounced background save while plotting on the map step
  useEffect(() => {
    if (currentStep !== 2 || !leadId) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      fetch('/api/field-map/save-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          clientPhone: clientInfo.phone,
          address: inspectionAddress,
          pestTypes,
          mapPlotData,
          companyId: selectedCompany?.id ?? '',
          leadId,
          stopId: stopId ?? undefined,
          routeStopId: routeStopId ?? undefined,
        }),
      }).catch(() => {});
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapPlotData, currentStep, leadId]);

  // Debounced background save while editing quote line items
  useEffect(() => {
    if (currentStep !== 3 || !leadId) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      fetch('/api/field-map/save-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          companyId: selectedCompany?.id ?? '',
          quoteLineItems,
          discountTarget: appliedDiscount?.applies_to_price ?? 'initial',
          discountAmount: appliedDiscount?.discount_value ?? null,
          discountType:
            appliedDiscount?.discount_type === 'percentage' ? '%' : '$',
          discountId: appliedDiscount?.id ?? null,
        }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.quoteId && !quoteId) setQuoteId(data.quoteId);
        })
        .catch(() => {});
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteLineItems, appliedDiscount, currentStep, leadId]);

  function canAdvance(): boolean {
    switch (currentStep) {
      case 0:
        return (
          getMapLatitude(mapPlotData) !== null &&
          getMapLongitude(mapPlotData) !== null
        );
      case 1:
        return mapPlotData.housePhotos.length >= 1;
      case 2:
        return mapPlotData.isViewSet;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  }

  function advanceStep(target: number) {
    setCurrentStep(target);
    setMaxStepReached(prev => Math.max(prev, target));
  }

  async function handleNext() {
    setStepSaveError(null);

    // After Address step (new inspection only) — validate customer name
    if (currentStep === 0 && !stopId) {
      if (!clientInfo.name.trim()) {
        setStepSaveError('Customer name is required before continuing.');
        return;
      }
    }

    // After Photos step — create lead and store house photo(s)
    if (currentStep === 1) {
      setIsSavingStep(true);
      try {
        const res = await fetch('/api/field-map/save-inspection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: clientInfo.name,
            clientEmail: clientInfo.email,
            clientPhone: clientInfo.phone,
            address: inspectionAddress,
            pestTypes: [],
            mapPlotData,
            companyId: selectedCompany?.id ?? '',
            leadId: leadId ?? undefined,
            stopId: stopId ?? undefined,
            routeStopId: routeStopId ?? undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to save');
        setLeadId(data.leadId);
      } catch (err) {
        setStepSaveError(err instanceof Error ? err.message : 'Failed to save');
        setIsSavingStep(false);
        return;
      }
      setIsSavingStep(false);
      advanceStep(currentStep + 1);
      return;
    }

    // After Map step — update lead with map data and pest types
    if (currentStep === 2) {
      setIsSavingStep(true);
      try {
        const res = await fetch('/api/field-map/save-inspection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: clientInfo.name,
            clientEmail: clientInfo.email,
            clientPhone: clientInfo.phone,
            address: inspectionAddress,
            pestTypes,
            mapPlotData,
            companyId: selectedCompany?.id ?? '',
            leadId: leadId ?? undefined,
            stopId: stopId ?? undefined,
            routeStopId: routeStopId ?? undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to save inspection');
        setLeadId(data.leadId);

        // Create an empty draft quote as a breadcrumb that step 3 was reached
        if (!returnToReviewAfterMapEdit && !quoteId) {
          const qRes = await fetch('/api/field-map/save-quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: data.leadId,
              companyId: selectedCompany?.id ?? '',
              quoteLineItems: [],
              discountTarget: appliedDiscount?.applies_to_price ?? 'initial',
              discountAmount: appliedDiscount?.discount_value ?? null,
              discountType:
                appliedDiscount?.discount_type === 'percentage' ? '%' : '$',
              quoteStatus: 'draft',
            }),
          });
          const qData = await qRes.json();
          if (qRes.ok && qData.quoteId) setQuoteId(qData.quoteId);
        }
      } catch (err) {
        setStepSaveError(
          err instanceof Error ? err.message : 'Failed to save inspection'
        );
        setIsSavingStep(false);
        return;
      }
      setIsSavingStep(false);

      if (returnToReviewAfterMapEdit) {
        advanceStep(4);
        setReturnToReviewAfterMapEdit(false);
        return;
      }
      advanceStep(currentStep + 1);
      return;
    }

    // After Quote step — save quote (creates/updates quote + line items)
    if (currentStep === 3) {
      if (!leadId) {
        setStepSaveError('No lead found. Please go back to the photos step.');
        return;
      }
      // Cancel any pending debounced auto-save to prevent a race condition
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      setIsSavingStep(true);
      try {
        const res = await fetch('/api/field-map/save-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            companyId: selectedCompany?.id ?? '',
            quoteLineItems,
            discountTarget: appliedDiscount?.applies_to_price ?? 'initial',
            discountAmount: appliedDiscount?.discount_value ?? null,
            discountType:
              appliedDiscount?.discount_type === 'percentage' ? '%' : '$',
            discountId: appliedDiscount?.id ?? null,
            quoteStatus: 'quoted',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to save quote');
        setQuoteId(data.quoteId);
      } catch (err) {
        setStepSaveError(
          err instanceof Error ? err.message : 'Failed to save quote'
        );
        setIsSavingStep(false);
        return;
      }
      setIsSavingStep(false);
      advanceStep(currentStep + 1);
      return;
    }

    if (currentStep < STEP_COUNT - 1) advanceStep(currentStep + 1);
  }

  function handleBack() {
    if (currentStep === 2 && returnToReviewAfterMapEdit) {
      setCurrentStep(4);
      setReturnToReviewAfterMapEdit(false);
      return;
    }
    const firstStep = stopId ? 1 : 0;
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
            isNewInspection={!stopId}
            clientName={clientInfo.name}
            clientEmail={clientInfo.email}
            clientPhone={clientInfo.phone}
            onClientNameChange={v =>
              setClientInfo(prev => ({ ...prev, name: v }))
            }
            onClientEmailChange={v =>
              setClientInfo(prev => ({ ...prev, email: v }))
            }
            onClientPhoneChange={v =>
              setClientInfo(prev => ({ ...prev, phone: v }))
            }
            companyId={selectedCompany?.id ?? ''}
          />
        );
      case 1:
        return (
          <div className={styles.stepScrollable}>
            <HousePhotoStep
              photoUrls={mapPlotData.housePhotos}
              onChange={urls =>
                setMapPlotData(prev => ({ ...prev, housePhotos: urls }))
              }
              companyId={selectedCompany?.id ?? ''}
            />
          </div>
        );
      case 2:
        return (
          <div className={styles.stepFull}>
            <MapPlotStep
              address={inspectionAddress}
              initialData={mapPlotData}
              onChange={handleMapChange}
              onBack={handleBack}
              onNext={handleNext}
              canNext={canAdvance()}
              companyId={selectedCompany?.id ?? ''}
              onPestOptionsLoaded={setPestIconMap}
            />
          </div>
        );
      case 3:
        return (
          <div className={styles.stepScrollable}>
            <QuoteBuildStep
              lineItems={quoteLineItems}
              onChange={setQuoteLineItems}
              plottedPests={plottedPests}
              companyId={selectedCompany?.id ?? ''}
              mapMeasurements={mapMeasurements}
              pestIconMap={pestIconMap}
              selectedDiscount={appliedDiscount}
              onDiscountChange={setAppliedDiscount}
            />
          </div>
        );
      case 4:
        return (
          <ReviewStep
            clientName={clientInfo.name}
            clientEmail={clientInfo.email}
            clientPhone={clientInfo.phone}
            address={inspectionAddress}
            pestTypes={pestTypes}
            quoteLineItems={quoteLineItems}
            notes={notes}
            mapPlotData={mapPlotData}
            inspectorName={inspectorName}
            inspectorAvatarUrl={inspectorAvatarUrl}
            inspectorTitle={inspectorTitle}
            companyName={companyName}
            companyId={selectedCompany?.id ?? ''}
            leadId={leadId}
            quoteId={quoteId}
            pestIconMap={pestIconMap}
            plottedPests={plottedPests}
            onBack={handleBack}
          />
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

  if (isLoadingResume) {
    return (
      <div className={styles.wizard}>
        <div className={styles.geocodingState}>
          <div className={styles.geocodingSpinner} />
          <p>Loading your inspection&hellip;</p>
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
          onClick={() => setShowExitConfirm(true)}
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M13 1L1 13M1 1L13 13"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className={styles.headerGrid}>
          <div className={styles.headerInfo}>
            <p className={styles.headerTitle}>
              {clientInfo.name || 'New Inspection'}
            </p>
            {inspectionAddress && (
              <p className={styles.headerSub}>{inspectionAddress}</p>
            )}
          </div>
          <div className={styles.stepTrack}>
            {STEP_LABELS.map((label, i) => {
              const isDone = i < maxStepReached;
              const isActive = i === maxStepReached;
              const isViewing = i === currentStep && i < maxStepReached;
              const isClickable = i <= maxStepReached;
              return (
                <div key={i} className={styles.stepTrackItem}>
                  {i > 0 && <div className={styles.stepLine} />}
                  {isClickable ? (
                    <button
                      type="button"
                      className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : isDone ? styles.stepLabelDone : ''} ${isViewing ? styles.stepLabelViewing : ''}`}
                      onClick={() => setCurrentStep(i)}
                    >
                      {isDone && <Check size={11} strokeWidth={2.5} />}
                      {label}
                    </button>
                  ) : (
                    <div className={styles.stepLabel}>{label}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className={styles.stepContent}>
        {isSavingStep ? (
          <div className={styles.geocodingState}>
            <div className={styles.geocodingSpinner} />
            <p>
              {currentStep === 0 && 'Saving address\u2026'}
              {currentStep === 1 && 'Saving photos\u2026'}
              {currentStep === 2 && 'Saving inspection\u2026'}
              {currentStep === 3 && 'Saving quote\u2026'}
            </p>
          </div>
        ) : (
          renderStepContent()
        )}
      </div>

      {/* Address step footer */}
      {currentStep === 0 && (
        <div className={styles.footer}>
          {stepSaveError && (
            <p className={styles.stepSaveError}>{stepSaveError}</p>
          )}
          <button
            type="button"
            className={styles.prevBtn}
            onClick={handleBack}
            aria-label="Previous step"
          >
            <ArrowLeft size={18} className={styles.prevArrow} />
            Previous
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
      {currentStep !== 0 && currentStep !== 2 && !isLastStep && (
        <div className={styles.footer}>
          {stepSaveError && (
            <p className={styles.stepSaveError}>{stepSaveError}</p>
          )}
          <button
            type="button"
            className={styles.prevBtn}
            onClick={handleBack}
            aria-label="Previous step"
          >
            <ArrowLeft size={18} className={styles.prevArrow} />
            Previous
          </button>
          <button
            type="button"
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={!canAdvance() || isSavingStep}
          >
            {isSavingStep ? 'Saving\u2026' : isLastStep ? 'Finish' : 'Continue'}
          </button>
        </div>
      )}
      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowExitConfirm(false)}
        >
          <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>
            <p className={styles.modalTitle}>Leave this service?</p>
            <p className={styles.modalBody}>
              Your progress has been saved and will be here when you return.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setShowExitConfirm(false)}
              >
                Keep Working
              </button>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={() => router.back()}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
