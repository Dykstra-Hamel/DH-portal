'use client';

import styles from '../ServiceWizard.module.scss';
import type { ServicePlan } from './PlanSelectStep';
import type { PricingValues } from './PricingStep';
import { MapPlotData, getMapStampOption, isMapPestStampType } from '@/components/FieldMap/MapPlot/types';
import { MapPlotCanvas } from '@/components/FieldMap/MapPlot/MapPlotCanvas/MapPlotCanvas';

interface ReviewStepProps {
  clientName: string;
  address: string;
  pestTypes: string[];
  plan: ServicePlan | null;
  pricing: PricingValues;
  notes: string;
  onNotesChange: (notes: string) => void;
  mapPlotData: MapPlotData;
}

export function ReviewStep({
  clientName,
  address,
  pestTypes,
  plan,
  pricing,
  notes,
  onNotesChange,
  mapPlotData,
}: ReviewStepProps) {
  const initialPriceDisplay =
    pricing.initialPrice != null
      ? `$${pricing.initialPrice.toFixed(2)}`
      : plan?.initial_price != null
      ? `$${plan.initial_price.toFixed(2)}`
      : 'Not set';

  const recurringDisplay =
    pricing.recurringPrice != null
      ? `$${pricing.recurringPrice.toFixed(2)}${pricing.billingFrequency ? ` / ${pricing.billingFrequency}` : ''}`
      : plan?.recurring_price != null
      ? `$${plan.recurring_price.toFixed(2)}${plan.billing_frequency ? ` / ${plan.billing_frequency}` : ''}`
      : 'Not set';

  const stampCount = mapPlotData.stamps.length;
  const outlineCount = mapPlotData.outlines.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className={styles.reviewCard}>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Client</span>
          <span className={styles.reviewValue}>{clientName}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Address</span>
          <span className={styles.reviewValue}>{address}</span>
        </div>
      </div>

      {pestTypes.length > 0 && (
        <div className={styles.reviewCard}>
          <div className={styles.reviewRow}>
            <span className={styles.reviewLabel}>Pests plotted</span>
            <div className={styles.pestTags}>
              {pestTypes.map(t => (
                <span key={t} className={styles.pestTag}>{t}</span>
              ))}
            </div>
          </div>
          {(stampCount > 0 || outlineCount > 0) && (
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>Map data</span>
              <span className={styles.reviewValue}>
                {[
                  stampCount > 0 && `${stampCount} stamp${stampCount !== 1 ? 's' : ''}`,
                  outlineCount > 0 && `${outlineCount} outline${outlineCount !== 1 ? 's' : ''}`,
                ].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Pest stamp findings */}
      {mapPlotData.stamps.filter(s => isMapPestStampType(s.type) && (s.notes || (s.photoUrls && s.photoUrls.length > 0))).map(stamp => {
        const option = getMapStampOption(stamp.type);
        return (
          <div key={stamp.id} className={styles.reviewCard}>
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>{option.label} Finding</span>
            </div>
            {stamp.notes && (
              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.5 }}>
                {stamp.notes}
              </p>
            )}
            {stamp.photoUrls && stamp.photoUrls.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                {stamp.photoUrls.map(url => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt={`${option.label} photo`}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, display: 'block' }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.section}>
        <span className={styles.label}>Map Preview</span>
        <MapPlotCanvas
          mapPlotData={mapPlotData}
          onChange={() => {}}
          isReadOnly
        />
      </div>

      {plan && (
        <div className={styles.reviewCard}>
          <div className={styles.reviewRow}>
            <span className={styles.reviewLabel}>Plan</span>
            <span className={styles.reviewValue}>{plan.plan_name}</span>
          </div>
          <div className={styles.reviewRow}>
            <span className={styles.reviewLabel}>Initial price</span>
            <span className={styles.reviewValue}>{initialPriceDisplay}</span>
          </div>
          <div className={styles.reviewRow}>
            <span className={styles.reviewLabel}>Recurring</span>
            <span className={styles.reviewValue}>{recurringDisplay}</span>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <label className={styles.label} htmlFor="wizard-notes">
          Notes (optional)
        </label>
        <textarea
          id="wizard-notes"
          className={styles.textarea}
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="Any additional observations or instructions&hellip;"
        />
      </div>
    </div>
  );
}
