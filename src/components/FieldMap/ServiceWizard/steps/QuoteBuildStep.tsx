'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import {
  MAP_ELEMENT_STAMP_OPTIONS,
  MAP_PEST_STAMP_OPTIONS,
  isMapPestStampType,
} from '@/components/FieldMap/MapPlot/types';
import type { MapStampType } from '@/components/FieldMap/MapPlot/types';
import { MapStampGlyph } from '@/components/FieldMap/MapPlot/glyphs';
import { SearchableSelect } from '@/components/Common/SearchableSelect/SearchableSelect';
import styles from './QuoteBuildStep.module.scss';
import type {
  CompanyPricingSettings,
  ServicePlanPricing,
} from '@/types/pricing';
import {
  generateHomeSizeOptions,
  generateYardSqftOptions,
  findSizeOptionByValue,
  toMonthlyEquivalent,
} from '@/lib/pricing-calculations';

// ── Types ──────────────────────────────────────────────────────────────────

export interface QuoteLineItem {
  id: string;
  type: 'plan-addon' | 'custom';
  // Catalog item (plan-addon type)
  catalogItemKind?: 'plan' | 'addon' | 'bundle' | 'product';
  catalogItemId?: string;
  catalogItemName?: string;
  // Custom type
  customName?: string;
  coveredPestIds: string[];
  coveredPestLabels: string[];
  // Pricing
  initialCost: number | null;
  recurringCost: number | null;
  frequency: string | null;
  // Section placement
  isPrimary?: boolean; // true → Service Quote, false → Additional Recommendations
  // Advanced pricing
  selectedVariantLabel?: string | null;
  quantity?: number | null;
  percentageJobCost?: number | null;
  percentagePricingNote?: string | null;
  is_custom_priced?: boolean;
  custom_initial_price?: number | null;
  // Parent plan association (for add-ons)
  parentLineItemId?: string | null;
  // For recommended add-ons: true = inspector highlighted, false = auto-added but not highlighted
  // undefined = not a recommended add-on slot (inspector manually added from Additional Recommendations)
  isRecommended?: boolean;
  // DB-persisted selection state; undefined for freshly-built in-memory items
  isSelected?: boolean;
}

export interface PlottedPest {
  id: string;
  label: string;
  stampType?: MapStampType;
}

interface CatalogVariant {
  label: string;
  initial_price?: number;
  recurring_price?: number;
  price_per_unit?: number;
  minimum_price?: number;
  billing_frequency?: string;
  treatment_frequency?: string;
}

interface CatalogPercentagePricing {
  percentage: number;
  years?: number;
  minimum?: number;
}

interface CatalogItem {
  id: string;
  name: string;
  kind: 'plan' | 'addon' | 'bundle';
  initialPrice: number | null;
  recurringPrice: number | null;
  billingFrequency: string | null;
  treatmentFrequency: string | null;
  planCategory: string | null;
  pestCoverageIds: string[];
  description: string | null;
  pestCoverageNames: string[];
  productIds: string[];
  // Advanced pricing
  minimumPrice: number | null;
  pricingType:
    | 'flat'
    | 'per_sqft'
    | 'per_linear_foot'
    | 'per_acre'
    | 'per_hour'
    | 'per_room';
  pricePerUnit: number | null;
  pricingUnit: 'sqft' | 'linear_feet' | 'acres' | null;
  additionalUnitPrice: number | null;
  variants: CatalogVariant[];
  percentagePricing: CatalogPercentagePricing | null;
  homeSizePricing: ServicePlanPricing['home_size_pricing'] | null;
  yardSqftPricing: ServicePlanPricing['yard_sqft_pricing'] | null;
  eligibilityMode: 'all' | 'specific';
  eligiblePlanIds: string[];
  recommendedAddonIds: string[];
}

interface Product {
  id: string;
  product_name: string;
  unit_price: number;
  recurring_price: number;
  unit_type: string;
  default_quantity: number;
  min_quantity: number;
  max_quantity: number | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const FREQUENCY_OPTIONS = [
  { value: 'one-time', label: 'One-Time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi-monthly', label: 'Bi-Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'bi-annually', label: 'Bi-Annually' },
  { value: 'annually', label: 'Annually' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function makeLineItem(): QuoteLineItem {
  return {
    id: crypto.randomUUID(),
    type: 'plan-addon',
    isPrimary: true,
    coveredPestIds: [],
    coveredPestLabels: [],
    initialCost: null,
    recurringCost: null,
    frequency: 'monthly',
  };
}

export function formatLineItemLabel(item: QuoteLineItem): string {
  if (item.type === 'plan-addon') return item.catalogItemName || 'Service';
  if (item.customName?.trim()) return item.customName.trim();
  if (item.coveredPestLabels.length > 0)
    return item.coveredPestLabels.join(', ') + ' Treatment';
  return 'Custom Service';
}

export function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
}

export interface RecurringByFrequency {
  frequency: string;
  total: number;
}

export function getQuoteTotals(lineItems: QuoteLineItem[]): {
  totalInitial: number;
  totalRecurring: number;
  recurringByFrequency: RecurringByFrequency[];
} {
  // Exclude addons where isSelected === false (auto-added but not confirmed by inspector).
  // They store a computed cost for display but should not contribute to totals until selected.
  const billableItems = lineItems.filter(item => item.isSelected !== false);

  const totalInitial = billableItems.reduce(
    (sum, item) => sum + (item.initialCost ?? 0),
    0
  );
  const totalRecurring = billableItems.reduce(
    (sum, item) => sum + (item.recurringCost ?? 0),
    0
  );

  const freqMap = new Map<string, number>();
  for (const item of billableItems) {
    if ((item.recurringCost ?? 0) === 0) continue;
    const key = item.frequency ?? 'unspecified';
    freqMap.set(key, (freqMap.get(key) ?? 0) + (item.recurringCost ?? 0));
  }
  const recurringByFrequency = Array.from(freqMap.entries()).map(
    ([frequency, total]) => ({ frequency, total })
  );

  return { totalInitial, totalRecurring, recurringByFrequency };
}

function parseCost(raw: string): number | null {
  const val = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(val) ? val : null;
}

export function getPestColor(pestId: string): string {
  const option = MAP_PEST_STAMP_OPTIONS.find(o => o.type === pestId);
  return option?.color ?? '#3b82f6';
}

export function getPestStampType(pestId: string): MapStampType {
  return isMapPestStampType(pestId as MapStampType)
    ? (pestId as MapStampType)
    : 'dynamic-pest';
}

// ── Props ──────────────────────────────────────────────────────────────────

interface MapMeasurements {
  byOutline: Array<{
    id: string;
    type: string;
    sqft: number;
    linearFt: number;
  }>;
}

export interface AvailableDiscount {
  id: string;
  discount_name: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  applies_to_price: 'initial' | 'recurring' | 'both';
  recurring_discount_type: 'percentage' | 'fixed_amount' | null;
  recurring_discount_value: number | null;
  applies_to_plans: 'all' | 'specific';
  eligible_plan_ids: string[];
  time_restriction_type: 'none' | 'seasonal' | 'limited_time';
  seasonal_start_month: number | null;
  seasonal_start_day: number | null;
  seasonal_end_month: number | null;
  seasonal_end_day: number | null;
  limited_time_start: string | null;
  limited_time_end: string | null;
  is_active: boolean;
}

interface QuoteBuildStepProps {
  lineItems: QuoteLineItem[];
  onChange: (items: QuoteLineItem[]) => void;
  plottedPests: PlottedPest[];
  companyId: string;
  mapMeasurements?: MapMeasurements;
  pestIconMap?: Record<string, string>;
  selectedDiscount?: AvailableDiscount | null;
  onDiscountChange?: (discount: AvailableDiscount | null) => void;
}

// ── Line item card ─────────────────────────────────────────────────────────

interface LineItemCardProps {
  item: QuoteLineItem;
  index: number;
  baseId: string;
  catalog: CatalogItem[];
  addonCatalog: CatalogItem[];
  selectedAddonIds: Set<string>;
  addonVariantSelections: Record<string, string>;
  plottedPests: PlottedPest[];
  mapMeasurements?: MapMeasurements;
  onUpdate: (patch: Partial<QuoteLineItem>) => void;
  onRemove: () => void;
  onToggleAddon: (
    addon: CatalogItem,
    selected: boolean,
    variantLabel?: string,
    jobCost?: number | null
  ) => void;
  onUpdateAddon: (addon: CatalogItem, variantLabel: string) => void;
  onAddonVariantChange: (addonId: string, variantLabel: string) => void;
}

function LineItemCard({
  item,
  index,
  baseId,
  catalog,
  addonCatalog,
  selectedAddonIds,
  addonVariantSelections,
  plottedPests,
  mapMeasurements,
  onUpdate,
  onRemove,
  onToggleAddon,
  onUpdateAddon,
  onAddonVariantChange,
}: LineItemCardProps) {
  const plans = catalog.filter(c => c.kind === 'plan');
  const bundles = catalog.filter(c => c.kind === 'bundle');

  const [pestFilter, setPestFilter] = useState<string | null>(null);
  const [isAddonPickerOpen, setIsAddonPickerOpen] = useState(true);

  // Only plans + bundles appear in the service picker; add-ons are handled separately
  const serviceCatalog = useMemo(
    () => [...plans, ...bundles],
    [plans, bundles]
  );

  const catalogOptions = useMemo(() => {
    const filtered = pestFilter
      ? serviceCatalog.filter(ci => ci.pestCoverageIds.includes(pestFilter))
      : serviceCatalog;
    const opts = [{ value: '', label: '— Select —' }];
    filtered.forEach(ci => opts.push({ value: ci.id, label: ci.name }));
    return opts;
  }, [serviceCatalog, pestFilter]);

  const isServiceSelected =
    !!item.catalogItemId && item.catalogItemKind !== 'addon';

  // Find the selected catalog item to drive advanced pricing UI
  const selectedCatalogItem = item.catalogItemId
    ? (catalog.find(c => c.id === item.catalogItemId) ?? null)
    : null;
  const hasVariants = (selectedCatalogItem?.variants?.length ?? 0) > 0;
  const isPerHour = selectedCatalogItem?.pricingType === 'per_hour';
  const isPerRoom = selectedCatalogItem?.pricingType === 'per_room';
  const isPerUnit =
    ['per_sqft', 'per_linear_foot', 'per_acre'].includes(
      selectedCatalogItem?.pricingType ?? ''
    ) ||
    (selectedCatalogItem?.kind === 'plan' &&
      selectedCatalogItem?.pricingUnit != null);
  const hasPercentagePricing = selectedCatalogItem?.percentagePricing != null;

  const PER_UNIT_LABEL: Record<string, string> = {
    per_sqft: 'Square Feet',
    per_linear_foot: 'Linear Feet',
    per_acre: 'Acres',
    sqft: 'Square Feet',
    linear_feet: 'Linear Feet',
    acres: 'Acres',
  };

  function getPerUnitLabel(): string {
    if (!selectedCatalogItem) return 'Units';
    if (
      selectedCatalogItem.kind === 'plan' &&
      selectedCatalogItem.pricingUnit
    ) {
      return PER_UNIT_LABEL[selectedCatalogItem.pricingUnit] ?? 'Units';
    }
    return PER_UNIT_LABEL[selectedCatalogItem.pricingType] ?? 'Units';
  }

  function handleVariantChange(label: string) {
    if (!selectedCatalogItem) return;
    const variant = selectedCatalogItem.variants.find(v => v.label === label);
    // For per-unit items, keep initialCost null until qty is entered
    if (isPerUnit) {
      onUpdate({ selectedVariantLabel: label || null });
      return;
    }
    const resolvedPrice =
      variant?.initial_price != null
        ? variant.initial_price
        : selectedCatalogItem.initialPrice;
    const resolvedRecurring =
      variant?.recurring_price != null
        ? variant.recurring_price
        : selectedCatalogItem.recurringPrice;
    const resolvedFrequency =
      variant?.treatment_frequency ??
      variant?.billing_frequency ??
      selectedCatalogItem.treatmentFrequency ??
      selectedCatalogItem.billingFrequency ??
      null;
    onUpdate({
      selectedVariantLabel: label || null,
      initialCost: resolvedPrice,
      recurringCost: resolvedRecurring,
      frequency: resolvedFrequency,
    });
  }

  function handleQuantityChange(qty: number) {
    if (!selectedCatalogItem) return;
    let computed = 0;
    const activeVariant = item.selectedVariantLabel
      ? selectedCatalogItem.variants.find(
          v => v.label === item.selectedVariantLabel
        )
      : null;
    const min =
      activeVariant?.minimum_price != null
        ? activeVariant.minimum_price
        : selectedCatalogItem.minimumPrice;

    if (isPerUnit) {
      // Effective rate: prefer variant's price_per_unit, fall back to catalog pricePerUnit
      const effectiveRate =
        activeVariant?.price_per_unit ?? selectedCatalogItem.pricePerUnit ?? 0;
      computed = qty * effectiveRate;
    } else if (isPerHour) {
      const rate = activeVariant?.price_per_unit ?? selectedCatalogItem.pricePerUnit ?? selectedCatalogItem.initialPrice ?? 0;
      computed = qty * rate;
    } else if (isPerRoom) {
      const rate = selectedCatalogItem.initialPrice ?? 0;
      const additionalRate = selectedCatalogItem.additionalUnitPrice ?? 0;
      computed = qty <= 0 ? 0 : rate + Math.max(0, qty - 1) * additionalRate;
    }

    const final = min != null ? Math.max(computed, min) : computed;
    onUpdate({ quantity: qty, initialCost: final });
  }

  function handleJobCostChange(jobCost: number) {
    if (!selectedCatalogItem?.percentagePricing) return;
    const {
      percentage,
      years = 1,
      minimum = 0,
    } = selectedCatalogItem.percentagePricing;
    const computed = Math.max((percentage / 100) * jobCost * years, minimum);
    const note = `${percentage}% of $${jobCost.toLocaleString('en-US')}${years > 1 ? ` × ${years} yrs` : ''} = $${computed.toFixed(2)}`;
    onUpdate({
      percentageJobCost: jobCost,
      percentagePricingNote: note,
      is_custom_priced: true,
      custom_initial_price: computed,
      initialCost: computed,
    });
  }

  function selectCatalogItem(ci: CatalogItem) {
    const isOneTime =
      ci.planCategory === 'one-time' || ci.billingFrequency === 'one-time';

    // Auto-initialize quantity from map measurements for per-unit pricing
    let autoQuantity: number | null = null;
    let autoInitialCost: number | null = ci.initialPrice;
    const outlines = mapMeasurements?.byOutline ?? [];
    if (outlines.length > 0) {
      const wantsSqft =
        ci.pricingType === 'per_sqft' || ci.pricingUnit === 'sqft';
      const wantsLinFt =
        ci.pricingType === 'per_linear_foot' ||
        ci.pricingUnit === 'linear_feet';
      if (wantsSqft || wantsLinFt) {
        const total = outlines.reduce(
          (sum, o) => sum + (wantsSqft ? o.sqft : o.linearFt),
          0
        );
        if (total > 0) {
          autoQuantity = total;
          const rate = ci.pricePerUnit ?? 0;
          const raw = total * rate;
          autoInitialCost =
            ci.minimumPrice != null ? Math.max(raw, ci.minimumPrice) : raw;
        }
      }
    }

    onUpdate({
      catalogItemId: ci.id,
      catalogItemKind: ci.kind,
      catalogItemName: ci.name,
      initialCost: autoInitialCost,
      recurringCost: ci.recurringPrice,
      frequency: isOneTime
        ? 'one-time'
        : (ci.treatmentFrequency ?? ci.billingFrequency ?? null),
      coveredPestIds: ci.pestCoverageIds,
      coveredPestLabels: [],
      // Reset advanced pricing state on new selection
      selectedVariantLabel: null,
      quantity: autoQuantity,
      percentageJobCost: null,
      percentagePricingNote: null,
      is_custom_priced: false,
      custom_initial_price: null,
    });
  }

  function togglePest(pest: PlottedPest, checked: boolean) {
    if (checked) {
      onUpdate({
        coveredPestIds: [...item.coveredPestIds, pest.id],
        coveredPestLabels: [...item.coveredPestLabels, pest.label],
      });
    } else {
      onUpdate({
        coveredPestIds: item.coveredPestIds.filter(id => id !== pest.id),
        coveredPestLabels: item.coveredPestLabels.filter(l => l !== pest.label),
      });
    }
  }

  return (
    <div className={styles.lineItemCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardNum}>Service {index + 1}</span>
        <button type="button" className={styles.removeBtn} onClick={onRemove}>
          Remove
        </button>
      </div>

      {/* Type toggle */}
      <div className={styles.typeToggle}>
        <button
          type="button"
          className={`${styles.typeBtn} ${item.type === 'plan-addon' ? styles.typeBtnActive : ''}`}
          onClick={() => onUpdate({ type: 'plan-addon' })}
        >
          Plans &amp; Addons
        </button>
        <button
          type="button"
          className={`${styles.typeBtn} ${item.type === 'custom' ? styles.typeBtnActive : ''}`}
          onClick={() =>
            onUpdate({
              type: 'custom',
              catalogItemId: undefined,
              catalogItemKind: undefined,
              catalogItemName: undefined,
              coveredPestIds: [],
              coveredPestLabels: [],
            })
          }
        >
          Custom
        </button>
      </div>

      {/* Plans & Addons content */}
      {item.type === 'plan-addon' && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Select Service</label>
          {plottedPests.length > 0 && (
            <div className={styles.pestFilterRow}>
              <button
                type="button"
                className={`${styles.pestFilterChip} ${pestFilter === null ? styles.pestFilterChipActive : ''}`}
                onClick={() => setPestFilter(null)}
              >
                All
              </button>
              {plottedPests.map(pest => (
                <button
                  key={pest.id}
                  type="button"
                  className={`${styles.pestFilterChip} ${pestFilter === pest.id ? styles.pestFilterChipActive : ''}`}
                  onClick={() =>
                    setPestFilter(prev => (prev === pest.id ? null : pest.id))
                  }
                >
                  {pest.label}
                </button>
              ))}
            </div>
          )}
          <SearchableSelect
            value={item.catalogItemId ?? ''}
            options={catalogOptions}
            onChange={id => {
              if (!id) {
                onUpdate({
                  catalogItemId: undefined,
                  catalogItemKind: undefined,
                  catalogItemName: undefined,
                  coveredPestIds: [],
                  coveredPestLabels: [],
                });
                return;
              }
              const ci = catalog.find(c => c.id === id);
              if (ci) selectCatalogItem(ci);
            }}
            placeholder="— Select —"
            searchPlaceholder="Search services..."
          />
        </div>
      )}

      {/* Custom content — name + pest checkboxes */}
      {item.type === 'custom' && (
        <>
          <div className={styles.fieldGroup}>
            <label
              className={styles.fieldLabel}
              htmlFor={`${baseId}-name-${item.id}`}
            >
              Service Name <span className={styles.fieldRequired}>*</span>
            </label>
            <div className={styles.nameInputWrap}>
              <input
                id={`${baseId}-name-${item.id}`}
                type="text"
                className={styles.nameInput}
                value={item.customName ?? ''}
                onChange={e =>
                  onUpdate({ customName: e.target.value.slice(0, 60) })
                }
                placeholder="e.g. Rodent Exclusion"
                maxLength={60}
                required
              />
              <span className={styles.charCount}>
                {(item.customName ?? '').length}/60
              </span>
            </div>
          </div>

          {plottedPests.length > 0 ? (
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Covers</span>
              <div className={styles.pestChecklist}>
                {plottedPests.map(pest => (
                  <label key={pest.id} className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={item.coveredPestIds.includes(pest.id)}
                      onChange={e => togglePest(pest, e.target.checked)}
                    />
                    <span>{pest.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <p className={styles.noPestsHint}>
              No pests plotted — go back to the Map step to add pest stamps.
            </p>
          )}
        </>
      )}

      {/* Variant selector */}
      {item.type === 'plan-addon' && hasVariants && (
        <div className={styles.fieldGroup}>
          <label
            className={styles.fieldLabel}
            htmlFor={`${baseId}-variant-${item.id}`}
          >
            Option
          </label>
          <select
            id={`${baseId}-variant-${item.id}`}
            className={styles.selectInput}
            value={item.selectedVariantLabel ?? ''}
            onChange={e => handleVariantChange(e.target.value)}
          >
            <option value="">— Select option —</option>
            {(selectedCatalogItem?.variants ?? []).map(v => (
              <option key={v.label} value={v.label}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quantity input for per_unit (per_sqft, per_linear_foot, per_acre, plan with pricing_unit) */}
      {item.type === 'plan-addon' && isPerUnit && (
        <div className={styles.fieldGroup}>
          <label
            className={styles.fieldLabel}
            htmlFor={`${baseId}-qty-${item.id}`}
          >
            {getPerUnitLabel()}
          </label>
          {(() => {
            const pricingType = selectedCatalogItem?.pricingType;
            const pricingUnit = selectedCatalogItem?.pricingUnit;
            const wantsSqFt =
              pricingType === 'per_sqft' || pricingUnit === 'sqft';
            const wantsLinFt =
              pricingType === 'per_linear_foot' ||
              pricingUnit === 'linear_feet';
            const unitLabel = wantsSqFt ? 'sq ft' : 'linear ft';
            const suggestions = (mapMeasurements?.byOutline ?? []).filter(o =>
              wantsSqFt ? o.sqft > 0 : wantsLinFt ? o.linearFt > 0 : false
            );
            if (!suggestions.length) return null;
            return (
              <div className={styles.mapSuggestions}>
                {suggestions.map(o => {
                  const label =
                    MAP_ELEMENT_STAMP_OPTIONS.find(e => e.type === o.type)
                      ?.label ?? o.type;
                  const value = wantsSqFt ? o.sqft : o.linearFt;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className={styles.mapSuggestion}
                      onClick={() => handleQuantityChange(value)}
                    >
                      {label}: {value.toLocaleString()} {unitLabel}
                    </button>
                  );
                })}
              </div>
            );
          })()}
          <input
            id={`${baseId}-qty-${item.id}`}
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            className={styles.textInput}
            value={item.quantity ?? ''}
            onChange={e => {
              const v = parseFloat(e.target.value);
              if (Number.isFinite(v) && v >= 0) handleQuantityChange(v);
            }}
            placeholder="0"
          />
          {selectedCatalogItem &&
            (() => {
              const hintVariant = item.selectedVariantLabel
                ? selectedCatalogItem.variants.find(
                    v => v.label === item.selectedVariantLabel
                  )
                : null;
              const effectiveRate =
                hintVariant?.price_per_unit ?? selectedCatalogItem.pricePerUnit;
              const qty = item.quantity ?? 0;
              if (effectiveRate == null) return null;
              const raw = qty * effectiveRate;
              const min =
                hintVariant?.minimum_price != null
                  ? hintVariant.minimum_price
                  : selectedCatalogItem.minimumPrice;
              const final = min != null ? Math.max(raw, min) : raw;
              return (
                <span className={styles.pricingHint}>
                  {qty} × {formatCurrency(effectiveRate)} ={' '}
                  {formatCurrency(raw)}
                  {min != null &&
                    raw < min &&
                    ` → floors to ${formatCurrency(min)}`}{' '}
                  = {formatCurrency(final)}
                </span>
              );
            })()}
        </div>
      )}

      {/* Quantity input for per_hour and per_room */}
      {item.type === 'plan-addon' && !isPerUnit && (isPerHour || isPerRoom) && (
        <div className={styles.fieldGroup}>
          <label
            className={styles.fieldLabel}
            htmlFor={`${baseId}-qty-${item.id}`}
          >
            {isPerHour ? 'Hours' : 'Rooms'}
          </label>
          <input
            id={`${baseId}-qty-${item.id}`}
            type="number"
            inputMode="decimal"
            min="0"
            step={isPerHour ? '0.5' : '1'}
            className={styles.textInput}
            value={item.quantity ?? ''}
            onChange={e => {
              const v = parseFloat(e.target.value);
              if (Number.isFinite(v) && v >= 0) handleQuantityChange(v);
            }}
            placeholder={isPerHour ? '0.0' : '1'}
          />
          {isPerRoom && selectedCatalogItem && (
            <span className={styles.pricingHint}>
              First room: {formatCurrency(selectedCatalogItem.initialPrice)}
              {selectedCatalogItem.additionalUnitPrice != null &&
                ` · Each additional: ${formatCurrency(selectedCatalogItem.additionalUnitPrice)}`}
            </span>
          )}
        </div>
      )}

      {/* Percentage pricing input */}
      {item.type === 'plan-addon' && hasPercentagePricing && (
        <div className={styles.fieldGroup}>
          <label
            className={styles.fieldLabel}
            htmlFor={`${baseId}-jobcost-${item.id}`}
          >
            Job Total ($)
          </label>
          <div className={styles.currencyWrap}>
            <span className={styles.currencySign}>$</span>
            <input
              id={`${baseId}-jobcost-${item.id}`}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={styles.numberInput}
              value={item.percentageJobCost ?? ''}
              onChange={e => {
                const v = parseCost(e.target.value);
                if (v != null) handleJobCostChange(v);
              }}
              placeholder="0.00"
            />
          </div>
          {item.percentagePricingNote && (
            <span className={styles.pricingHint}>
              {item.percentagePricingNote}
            </span>
          )}
        </div>
      )}

      {/* Pricing */}
      <div className={styles.pricingRow}>
        <div className={styles.fieldGroup}>
          <label
            className={styles.fieldLabel}
            htmlFor={`${baseId}-init-${item.id}`}
          >
            Initial Price
          </label>
          <div className={styles.currencyWrap}>
            <span className={styles.currencySign}>$</span>
            <input
              id={`${baseId}-init-${item.id}`}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={styles.numberInput}
              value={item.initialCost ?? ''}
              onChange={e =>
                onUpdate({ initialCost: parseCost(e.target.value) })
              }
              placeholder="0.00"
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label
            className={styles.fieldLabel}
            htmlFor={`${baseId}-rec-${item.id}`}
          >
            Recurring Price
          </label>
          <div className={styles.currencyWrap}>
            <span className={styles.currencySign}>$</span>
            <input
              id={`${baseId}-rec-${item.id}`}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={styles.numberInput}
              value={item.recurringCost ?? ''}
              onChange={e =>
                onUpdate({ recurringCost: parseCost(e.target.value) })
              }
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label
          className={styles.fieldLabel}
          htmlFor={`${baseId}-freq-${item.id}`}
        >
          Treatment Frequency
        </label>
        <select
          id={`${baseId}-freq-${item.id}`}
          className={styles.selectInput}
          value={item.frequency ?? ''}
          onChange={e => onUpdate({ frequency: e.target.value || null })}
        >
          <option value="">— Select —</option>
          {FREQUENCY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Add-on picker — shown after a plan/bundle is selected */}
      {isServiceSelected && addonCatalog.length > 0 && (
        <div className={styles.addonPickerSection}>
          <button
            type="button"
            className={styles.addonPickerToggle}
            onClick={() => setIsAddonPickerOpen(prev => !prev)}
          >
            <span className={styles.addonPickerLabel}>Available Add-Ons</span>
            <ChevronDown
              size={14}
              className={`${styles.addonPickerChevron} ${isAddonPickerOpen ? styles.addonPickerChevronOpen : ''}`}
              aria-hidden="true"
            />
          </button>
          {isAddonPickerOpen && (
            <div className={styles.addonPickerList}>
              {addonCatalog.map(addon => {
                const isChecked = selectedAddonIds.has(addon.id);
                const hasAddonVariants = (addon.variants?.length ?? 0) > 0;
                const selectedVariant = addonVariantSelections[addon.id] ?? '';

                // Resolve displayed price from selected variant or base prices
                const activeVariant = selectedVariant
                  ? addon.variants.find(v => v.label === selectedVariant)
                  : null;
                const displayInitial =
                  activeVariant?.initial_price ?? addon.initialPrice;
                const displayRecurring =
                  activeVariant?.recurring_price ?? addon.recurringPrice;
                const displayFreq =
                  activeVariant?.billing_frequency ?? addon.billingFrequency;

                return (
                  <div key={addon.id} className={styles.addonPickerRow}>
                    <label className={styles.addonPickerItem}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          onToggleAddon(
                            addon,
                            !isChecked,
                            selectedVariant || undefined,
                            addon.percentagePricing
                              ? item.initialCost
                              : undefined
                          )
                        }
                        className={styles.addonPickerCheckbox}
                      />
                      <span className={styles.addonPickerName}>
                        {addon.name}
                      </span>
                      {addon.percentagePricing ? (
                        <>
                          <span className={styles.addonPickerPctLabel}>
                            {addon.percentagePricing.percentage}%
                            {addon.percentagePricing.years &&
                            addon.percentagePricing.years > 1
                              ? ` × ${addon.percentagePricing.years}yr`
                              : ''}
                          </span>
                          {item.initialCost != null &&
                            (() => {
                              const {
                                percentage,
                                years = 1,
                                minimum = 0,
                              } = addon.percentagePricing!;
                              const computed = Math.max(
                                (percentage / 100) * item.initialCost! * years,
                                minimum
                              );
                              return (
                                <span className={styles.addonPickerPrice}>
                                  ${computed.toFixed(0)}
                                </span>
                              );
                            })()}
                        </>
                      ) : (
                        <>
                          {!hasAddonVariants &&
                            ((displayInitial ?? 0) > 0 ||
                              (displayRecurring ?? 0) > 0) && (
                              <span className={styles.addonPickerPrice}>
                                {(displayRecurring ?? 0) > 0
                                  ? `$${displayRecurring!.toFixed(0)}/${displayFreq ?? 'mo'}`
                                  : `$${displayInitial!.toFixed(0)}`}
                              </span>
                            )}
                          {hasAddonVariants &&
                            selectedVariant &&
                            ((displayInitial ?? 0) > 0 ||
                              (displayRecurring ?? 0) > 0) && (
                              <span className={styles.addonPickerPrice}>
                                {(displayRecurring ?? 0) > 0
                                  ? `$${displayRecurring!.toFixed(0)}/${displayFreq ?? 'mo'}`
                                  : `$${displayInitial!.toFixed(0)}`}
                              </span>
                            )}
                        </>
                      )}
                    </label>
                    {hasAddonVariants && (
                      <select
                        className={styles.addonVariantSelect}
                        value={selectedVariant}
                        onChange={e => {
                          const newVariant = e.target.value;
                          onAddonVariantChange(addon.id, newVariant);
                          if (isChecked) onUpdateAddon(addon, newVariant);
                        }}
                      >
                        <option value="">— Select option —</option>
                        {addon.variants.map(v => (
                          <option key={v.label} value={v.label}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function QuoteBuildStep({
  lineItems,
  onChange,
  plottedPests,
  companyId,
  mapMeasurements,
  pestIconMap = {},
  selectedDiscount,
  onDiscountChange,
}: QuoteBuildStepProps) {
  const baseId = useId();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pricingSettings, setPricingSettings] =
    useState<CompanyPricingSettings | null>(null);

  // Modal state
  const [pestModal, setPestModal] = useState<PlottedPest | null>(null);
  const [modalServiceId, setModalServiceId] = useState<string | null>(null);
  const [modalAddonIds, setModalAddonIds] = useState<Set<string>>(new Set());
  const [modalAddonQuantities, setModalAddonQuantities] = useState<Record<string, number>>({});
  const [modalProductQtys, setModalProductQtys] = useState<
    Record<string, number>
  >({});
  const [modalInitialPrice, setModalInitialPrice] = useState<number | null>(
    null
  );
  const [modalRecurringPrice, setModalRecurringPrice] = useState<number | null>(
    null
  );
  const [modalFrequency, setModalFrequency] = useState<string | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number | null>(null);
  const [modalVariantLabel, setModalVariantLabel] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const modalBodyRef = useRef<HTMLDivElement>(null);
  const [modalTopShadow, setModalTopShadow] = useState(false);
  const [modalBottomShadow, setModalBottomShadow] = useState(false);

  // Searchable dropdown state (used when pestModal.id === '__all__')
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const serviceDropdownTriggerRef = useRef<HTMLDivElement>(null);
  const serviceDropdownMenuRef = useRef<HTMLDivElement>(null);
  const [serviceDropdownRect, setServiceDropdownRect] = useState<DOMRect | null>(null);

  // Reset all modal sub-state when a new pest modal opens (skip when editing — pre-populated)
  useEffect(() => {
    if (editingItemId) return;
    setModalServiceId(null);
    setModalAddonIds(new Set());
    setModalAddonQuantities({});
    setModalProductQtys({});
    setModalInitialPrice(null);
    setModalRecurringPrice(null);
    setModalFrequency(null);
    setModalQuantity(null);
    setModalVariantLabel(null);
    setServiceSearch('');
    setServiceDropdownOpen(false);
  }, [pestModal, editingItemId]);

  // Close service dropdown on click outside or scroll/resize
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = serviceDropdownRef.current?.contains(target);
      const insideMenu = serviceDropdownMenuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) {
        setServiceDropdownOpen(false);
      }
    };
    const handleScroll = (e: Event) => {
      // Don't close when scrolling inside the dropdown menu itself
      if (serviceDropdownMenuRef.current?.contains(e.target as Node)) return;
      setServiceDropdownOpen(false);
    };
    const handleResize = () => setServiceDropdownOpen(false);
    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update trigger rect when dropdown opens so the portal menu stays aligned
  useEffect(() => {
    if (serviceDropdownOpen && serviceDropdownTriggerRef.current) {
      setServiceDropdownRect(serviceDropdownTriggerRef.current.getBoundingClientRect());
    }
  }, [serviceDropdownOpen]);

  // Sync modal prices when a service chip is selected
  useEffect(() => {
    if (!modalServiceId) {
      setModalInitialPrice(null);
      setModalRecurringPrice(null);
      setModalFrequency(null);
      setModalQuantity(null);
      setModalProductQtys({});
      return;
    }
    // When editing, openEditModal pre-populates all values — don't overwrite them
    if (editingItemId) return;
    const service = catalog.find(c => c.id === modalServiceId);
    if (!service) return;
    const isOneTime =
      service.planCategory === 'one-time' ||
      service.billingFrequency === 'one-time';
    const isPerUnit =
      ['per_sqft', 'per_linear_foot', 'per_acre'].includes(
        service.pricingType
      ) ||
      (service.kind === 'plan' && service.pricingUnit != null);
    const isPerHour = service.pricingType === 'per_hour';
    const isPerRoom = service.pricingType === 'per_room';
    const needsQty = isPerUnit || isPerHour || isPerRoom;
    setModalInitialPrice(needsQty ? null : service.initialPrice);
    setModalRecurringPrice(service.recurringPrice);
    setModalFrequency(
      isOneTime
        ? 'one-time'
        : (service.treatmentFrequency ?? service.billingFrequency ?? null)
    );
    setModalQuantity(null);
    setModalProductQtys({});
    setModalVariantLabel(null);
  }, [modalServiceId, catalog, editingItemId]);

  useEffect(() => {
    if (!companyId) return;

    Promise.all([
      fetch(`/api/service-plans/${companyId}`).then(r =>
        r.ok ? r.json() : { plans: [] }
      ),
      fetch(`/api/add-on-services/${companyId}`).then(r =>
        r.ok ? r.json() : { data: [] }
      ),
      fetch(`/api/admin/bundle-plans?companyId=${companyId}`).then(r =>
        r.ok ? r.json() : { data: [] }
      ),
      fetch(`/api/admin/products/${companyId}`).then(r =>
        r.ok ? r.json() : { data: [] }
      ),
      fetch(`/api/companies/${companyId}/pricing-settings`).then(r =>
        r.ok ? r.json() : { data: null }
      ),
    ])
      .then(([plansRes, addonsRes, bundlesRes, productsRes, pricingRes]) => {
        setProducts(productsRes.data ?? []);
        if (pricingRes.data) setPricingSettings(pricingRes.data);

        const plans: CatalogItem[] = (plansRes.plans ?? []).map((p: any) => ({
          id: p.id,
          name: p.plan_name,
          kind: 'plan' as const,
          initialPrice: p.initial_price ?? null,
          recurringPrice: p.recurring_price ?? null,
          billingFrequency: p.billing_frequency ?? null,
          treatmentFrequency: p.treatment_frequency ?? null,
          planCategory: p.plan_category ?? null,
          pestCoverageIds: (p.pest_coverage ?? []).map(
            (c: any) => c.pest_id as string
          ),
          description: p.plan_description ?? null,
          pestCoverageNames: (p.pest_coverage ?? []).map(
            (c: any) => c.pest_name as string
          ),
          productIds: p.plan_product_ids ?? [],
          minimumPrice: p.minimum_price ?? null,
          pricingType: 'flat' as const,
          pricePerUnit: p.price_per_unit ?? null,
          pricingUnit: p.pricing_unit ?? null,
          additionalUnitPrice: null,
          variants: Array.isArray(p.variants) ? p.variants : [],
          percentagePricing: null,
          homeSizePricing: p.home_size_pricing ?? null,
          yardSqftPricing: p.yard_sqft_pricing ?? null,
          eligibilityMode: 'all' as const,
          eligiblePlanIds: [],
          recommendedAddonIds: p.recommended_addon_ids ?? [],
        }));

        // Add-ons don't have a pest_coverage table — coverage is always empty
        const addons: CatalogItem[] = (
          addonsRes.data ??
          addonsRes.addons ??
          []
        ).map((a: any) => ({
          id: a.id,
          name: a.addon_name,
          kind: 'addon' as const,
          initialPrice: a.initial_price ?? null,
          recurringPrice: a.recurring_price ?? null,
          billingFrequency: a.billing_frequency ?? null,
          treatmentFrequency: a.treatment_frequency ?? null,
          planCategory: null,
          pestCoverageIds: [],
          description: null,
          pestCoverageNames: [],
          productIds: [],
          minimumPrice: a.minimum_price ?? null,
          pricingType: (a.pricing_type ?? 'flat') as CatalogItem['pricingType'],
          pricePerUnit: a.price_per_unit ?? null,
          pricingUnit: null,
          additionalUnitPrice: a.additional_unit_price ?? null,
          variants: Array.isArray(a.variants) ? a.variants : [],
          percentagePricing: a.percentage_pricing ?? null,
          homeSizePricing: null,
          yardSqftPricing: null,
          eligibilityMode: (a.eligibility_mode ?? 'all') as 'all' | 'specific',
          eligiblePlanIds: a.eligible_plan_ids ?? [],
          recommendedAddonIds: [],
        }));

        // Bundles reference plan IDs in bundled_service_plans JSONB — resolve coverage
        // from the plans we already fetched above
        const planCoverageMap = new Map<string, string[]>(
          plans.map(p => [p.id, p.pestCoverageIds])
        );
        const bundles: CatalogItem[] = (
          bundlesRes.data ??
          bundlesRes.bundles ??
          []
        ).map((b: any) => {
          const bundledIds: string[] = Array.isArray(b.bundled_service_plans)
            ? b.bundled_service_plans.filter((x: any) => typeof x === 'string')
            : [];
          const pestIds = [
            ...new Set(bundledIds.flatMap(id => planCoverageMap.get(id) ?? [])),
          ];
          return {
            id: b.id,
            name: b.bundle_name,
            kind: 'bundle' as const,
            initialPrice: b.custom_initial_price ?? null,
            recurringPrice: b.custom_recurring_price ?? null,
            billingFrequency: b.billing_frequency ?? null,
            treatmentFrequency: null,
            planCategory: null,
            pestCoverageIds: pestIds,
            description: null,
            pestCoverageNames: [],
            productIds: [],
            minimumPrice: null,
            pricingType: 'flat' as const,
            pricePerUnit: null,
            pricingUnit: null,
            additionalUnitPrice: null,
            variants: [],
            percentagePricing: null,
            homeSizePricing: null,
            yardSqftPricing: null,
            eligibilityMode: 'all' as const,
            eligiblePlanIds: [],
            recommendedAddonIds: [],
          };
        });

        setCatalog([...plans, ...addons, ...bundles]);
      })
      .catch(() => {});
  }, [companyId]);

  const [availableDiscounts, setAvailableDiscounts] = useState<
    AvailableDiscount[]
  >([]);

  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/companies/${encodeURIComponent(companyId)}/discounts`)
      .then(r => r.json())
      .then((data: { success: boolean; discounts: AvailableDiscount[] }) => {
        if (data.success) setAvailableDiscounts(data.discounts);
      })
      .catch(() => {});
  }, [companyId]);

  // Reconcile coveredPestIds for line items loaded from DB (they come back with [])
  useEffect(() => {
    if (catalog.length === 0) return;
    const needsReconcile = lineItems.some(
      i => i.catalogItemId && i.coveredPestIds.length === 0
    );
    if (!needsReconcile) return;
    const updated = lineItems.map(item => {
      if (!item.catalogItemId || item.coveredPestIds.length > 0) return item;
      const ci = catalog.find(c => c.id === item.catalogItemId);
      if (!ci) return item;
      return { ...item, coveredPestIds: ci.pestCoverageIds };
    });
    onChange(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]); // Intentionally omit lineItems/onChange — only runs when catalog first loads

  // All covered pest IDs: plan-addon items carry the plan's pest_coverage IDs
  // (written at selection time), custom items carry manually-checked IDs.
  const coveredPestIds = new Set(lineItems.flatMap(i => i.coveredPestIds));

  const { totalInitial, totalRecurring, recurringByFrequency } =
    getQuoteTotals(lineItems);

  const totalMonthlyRecurring = recurringByFrequency.reduce(
    (sum, { frequency, total }) => sum + toMonthlyEquivalent(frequency, total),
    0
  );

  const addonCatalog = useMemo(
    () => catalog.filter(c => c.kind === 'addon'),
    [catalog]
  );

  const filteredDiscounts = useMemo(() => {
    const planIds = new Set(
      lineItems.map(i => i.catalogItemId).filter(Boolean) as string[]
    );
    const today = new Date();
    return availableDiscounts.filter(d => {
      if (!d.is_active) return false;
      if (
        d.applies_to_plans === 'specific' &&
        !d.eligible_plan_ids.some(id => planIds.has(id))
      )
        return false;
      if (d.time_restriction_type === 'limited_time') {
        const start = d.limited_time_start
          ? new Date(d.limited_time_start)
          : null;
        const end = d.limited_time_end ? new Date(d.limited_time_end) : null;
        if (start && today < start) return false;
        if (end && today > end) return false;
      }
      if (d.time_restriction_type === 'seasonal') {
        const sm = d.seasonal_start_month,
          sd = d.seasonal_start_day;
        const em = d.seasonal_end_month,
          ed = d.seasonal_end_day;
        if (sm && sd && em && ed) {
          const m = today.getMonth() + 1,
            dy = today.getDate();
          const afterStart = m > sm || (m === sm && dy >= sd);
          const beforeEnd = m < em || (m === em && dy <= ed);
          const inRange =
            sm <= em ? afterStart && beforeEnd : afterStart || beforeEnd;
          if (!inRange) return false;
        }
      }
      return true;
    });
  }, [availableDiscounts, lineItems]);

  const discountedInitialSavings = useMemo(() => {
    if (!selectedDiscount) return 0;
    const appliesToInitial =
      selectedDiscount.applies_to_price === 'initial' ||
      selectedDiscount.applies_to_price === 'both';
    if (!appliesToInitial) return 0;
    return selectedDiscount.discount_type === 'percentage'
      ? (totalInitial * selectedDiscount.discount_value) / 100
      : Math.min(selectedDiscount.discount_value, totalInitial);
  }, [selectedDiscount, totalInitial]);

  // Per-card addon selection helpers (scoped to a parent line item)
  function getCardAddonIds(parentItemId: string): Set<string> {
    return new Set(
      lineItems
        .filter(
          i =>
            i.catalogItemKind === 'addon' && i.parentLineItemId === parentItemId
        )
        .map(i => i.catalogItemId!)
    );
  }

  function getCardAddonVariants(parentItemId: string): Record<string, string> {
    const map: Record<string, string> = {};
    lineItems.forEach(i => {
      if (
        i.catalogItemKind === 'addon' &&
        i.parentLineItemId === parentItemId &&
        i.catalogItemId &&
        i.selectedVariantLabel
      ) {
        map[i.catalogItemId] = i.selectedVariantLabel;
      }
    });
    return map;
  }

  function handleAddonVariantChange(
    addonId: string,
    variantLabel: string,
    parentItemId: string
  ) {
    const addonItem = catalog.find(c => c.id === addonId);
    if (!addonItem) return;
    const isSelected = lineItems.some(
      i =>
        i.catalogItemKind === 'addon' &&
        i.catalogItemId === addonId &&
        i.parentLineItemId === parentItemId
    );
    if (isSelected) {
      updateAddonVariant(addonItem, variantLabel, parentItemId);
    }
  }

  function addItem() {
    onChange([...lineItems, makeLineItem()]);
  }

  function updateItem(id: string, patch: Partial<QuoteLineItem>) {
    const updatedItems = lineItems.map(item =>
      item.id === id ? { ...item, ...patch } : item
    );

    // When parent initialCost changes, recompute all percentage-priced child addons
    if ('initialCost' in patch && patch.initialCost != null) {
      const newParentCost = patch.initialCost;
      const cascaded = updatedItems.map(item => {
        if (item.parentLineItemId !== id) return item;
        const catalogAddon = addonCatalog.find(a => a.id === item.catalogItemId);
        if (!catalogAddon?.percentagePricing) return item;
        const { percentage, years = 1, minimum = 0 } = catalogAddon.percentagePricing;
        const computed = Math.max((percentage / 100) * newParentCost * years, minimum);
        return {
          ...item,
          initialCost: computed,
          percentageJobCost: newParentCost,
          percentagePricingNote: `${percentage}% of $${newParentCost.toLocaleString('en-US')}${years > 1 ? ` × ${years} yrs` : ''} = $${computed.toFixed(2)}`,
          is_custom_priced: true,
          custom_initial_price: computed,
        };
      });
      onChange(cascaded);
    } else {
      onChange(updatedItems);
    }
  }

  function removeItem(id: string) {
    // Also remove any addons that belong to this plan
    onChange(
      lineItems.filter(item => item.id !== id && item.parentLineItemId !== id)
    );
  }

  function toggleAddon(
    addon: CatalogItem,
    selected: boolean,
    parentItemId: string,
    variantLabel?: string,
    jobCost?: number | null
  ) {
    if (selected) {
      const variant = variantLabel
        ? addon.variants.find(v => v.label === variantLabel)
        : null;
      let resolvedInitial =
        variant?.initial_price != null
          ? variant.initial_price
          : addon.initialPrice;
      const resolvedRecurring =
        variant?.recurring_price != null
          ? variant.recurring_price
          : addon.recurringPrice;
      const resolvedFrequency =
        variant?.billing_frequency ?? addon.billingFrequency ?? 'monthly';
      const isOneTime = resolvedFrequency === 'one-time';

      let percentageJobCost: number | null = null;
      let percentagePricingNote: string | null = null;
      let is_custom_priced = false;
      let custom_initial_price: number | null = null;

      if (addon.percentagePricing && jobCost != null && jobCost > 0) {
        const { percentage, years = 1, minimum = 0 } = addon.percentagePricing;
        const computed = Math.max(
          (percentage / 100) * jobCost * years,
          minimum
        );
        const note = `${percentage}% of $${jobCost.toLocaleString('en-US')}${years > 1 ? ` × ${years} yrs` : ''} = $${computed.toFixed(2)}`;
        resolvedInitial = computed;
        percentageJobCost = jobCost;
        percentagePricingNote = note;
        is_custom_priced = true;
        custom_initial_price = computed;
      }

      const newItem: QuoteLineItem = {
        id: crypto.randomUUID(),
        type: 'plan-addon',
        catalogItemId: addon.id,
        catalogItemKind: 'addon',
        catalogItemName: addon.name,
        isPrimary: false,
        coveredPestIds: addon.pestCoverageIds,
        coveredPestLabels: [],
        initialCost: resolvedInitial,
        recurringCost: resolvedRecurring,
        frequency: isOneTime ? 'one-time' : resolvedFrequency,
        selectedVariantLabel: variantLabel ?? null,
        quantity: null,
        percentageJobCost,
        percentagePricingNote,
        is_custom_priced,
        custom_initial_price,
        parentLineItemId: parentItemId,
      };
      onChange([...lineItems, newItem]);
    } else {
      onChange(
        lineItems.filter(
          i =>
            !(
              i.catalogItemId === addon.id &&
              i.parentLineItemId === parentItemId
            )
        )
      );
    }
  }

  function updateAddonVariant(
    addon: CatalogItem,
    variantLabel: string,
    parentItemId: string
  ) {
    const variant = variantLabel
      ? addon.variants.find(v => v.label === variantLabel)
      : null;
    const resolvedInitial =
      variant?.initial_price != null
        ? variant.initial_price
        : addon.initialPrice;
    const resolvedRecurring =
      variant?.recurring_price != null
        ? variant.recurring_price
        : addon.recurringPrice;
    const resolvedFrequency =
      variant?.billing_frequency ?? addon.billingFrequency ?? 'monthly';
    onChange(
      lineItems.map(i =>
        i.catalogItemId === addon.id && i.parentLineItemId === parentItemId
          ? {
              ...i,
              selectedVariantLabel: variantLabel || null,
              initialCost: resolvedInitial,
              recurringCost: resolvedRecurring,
              frequency: resolvedFrequency,
            }
          : i
      )
    );
  }

  // ── Modal derived values ─────────────────────────────────────────────────

  const modalSelectedService = useMemo(
    () =>
      modalServiceId
        ? (catalog.find(c => c.id === modalServiceId) ?? null)
        : null,
    [modalServiceId, catalog]
  );

  // Addons eligible for the currently selected service plan
  const modalEligibleAddons = useMemo(() => {
    if (!modalSelectedService) return [];
    return addonCatalog.filter(
      a =>
        a.eligibilityMode === 'all' ||
        a.eligiblePlanIds.includes(modalSelectedService.id)
    );
  }, [addonCatalog, modalSelectedService]);

  // Subset tagged as recommended for this plan
  const modalRecommendedAddons = useMemo(
    () =>
      modalEligibleAddons.filter(a =>
        modalSelectedService?.recommendedAddonIds.includes(a.id)
      ),
    [modalEligibleAddons, modalSelectedService]
  );

  // Remaining eligible addons not in the recommended set
  const modalAdditionalAddons = useMemo(
    () =>
      modalEligibleAddons.filter(
        a => !modalSelectedService?.recommendedAddonIds.includes(a.id)
      ),
    [modalEligibleAddons, modalSelectedService]
  );

  // Initialize modal shadow state when a service is selected

  useEffect(() => {
    const el = modalBodyRef.current;
    if (!el) return;
    setModalTopShadow(el.scrollTop > 0);
    setModalBottomShadow(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }, [modalSelectedService]);

  const modalServiceChips = useMemo(() => {
    if (!pestModal) return [];
    // When editing, only show the single selected plan as a chip
    if (editingItemId) {
      const editingItem = lineItems.find(i => i.id === editingItemId);
      if (editingItem?.catalogItemId) {
        const ci = catalog.find(c => c.id === editingItem.catalogItemId);
        return ci ? [ci] : [];
      }
      return [];
    }
    // "Add Additional Service" — show all plans/bundles with no pest filter
    if (pestModal.id === '__all__') {
      return catalog.filter(c => c.kind === 'plan' || c.kind === 'bundle');
    }
    return catalog.filter(
      c =>
        (c.kind === 'plan' || c.kind === 'bundle') &&
        c.pestCoverageIds.includes(pestModal.id)
    );
  }, [catalog, pestModal, editingItemId, lineItems]);

  const filteredServiceChips = useMemo(() => {
    if (!serviceSearch.trim()) return modalServiceChips;
    const q = serviceSearch.toLowerCase();
    return modalServiceChips.filter(s => s.name.toLowerCase().includes(q));
  }, [modalServiceChips, serviceSearch]);

  const modalIsPerUnit = useMemo(() => {
    if (!modalSelectedService) return false;
    return (
      ['per_sqft', 'per_linear_foot', 'per_acre'].includes(
        modalSelectedService.pricingType
      ) ||
      (modalSelectedService.kind === 'plan' &&
        modalSelectedService.pricingUnit != null)
    );
  }, [modalSelectedService]);

  const modalIsPerHour = modalSelectedService?.pricingType === 'per_hour';
  const modalIsPerRoom = modalSelectedService?.pricingType === 'per_room';
  const modalNeedsQty = modalIsPerUnit || modalIsPerHour || modalIsPerRoom;

  // true for flat/per_hour/per_room (not per-unit) AND for per_sqft plans
  const modalWantsSqFt =
    !modalIsPerUnit ||
    modalSelectedService?.pricingType === 'per_sqft' ||
    modalSelectedService?.pricingUnit === 'sqft';

  const modalWantsLinFt =
    modalSelectedService?.pricingType === 'per_linear_foot' ||
    modalSelectedService?.pricingUnit === 'linear_feet';

  const modalUsesYardSqft =
    modalSelectedService?.kind === 'plan' &&
    !!modalSelectedService?.yardSqftPricing;

  const sqftSuggestions = useMemo(
    () =>
      (mapMeasurements?.byOutline ?? []).filter(
        o => o.type === (modalUsesYardSqft ? 'yard' : 'house') && o.sqft > 0
      ),
    [mapMeasurements, modalUsesYardSqft]
  );
  const linFtSuggestions = useMemo(
    () =>
      (mapMeasurements?.byOutline ?? []).filter(
        o => o.type === 'house' && o.linearFt > 0
      ),
    [mapMeasurements]
  );

  const modalLinkedProducts = useMemo(() => {
    if (!modalSelectedService) return [];
    return products.filter(p => modalSelectedService.productIds.includes(p.id));
  }, [products, modalSelectedService]);

  const PER_UNIT_LABEL_MODAL: Record<string, string> = {
    per_sqft: 'Square Feet',
    per_linear_foot: 'Linear Feet',
    per_acre: 'Acres',
    sqft: 'Square Feet',
    linear_feet: 'Linear Feet',
    acres: 'Acres',
  };

  function getModalPerUnitLabel(): string {
    if (!modalSelectedService) return 'Units';
    if (
      modalSelectedService.kind === 'plan' &&
      modalSelectedService.pricingUnit
    ) {
      return PER_UNIT_LABEL_MODAL[modalSelectedService.pricingUnit] ?? 'Units';
    }
    return PER_UNIT_LABEL_MODAL[modalSelectedService.pricingType] ?? 'Units';
  }

  function handleModalQuantityChange(qty: number) {
    if (!modalSelectedService) return;
    let computed = 0;
    const min = modalSelectedService.minimumPrice;

    if (modalIsPerUnit) {
      const rate = modalSelectedService.pricePerUnit ?? 0;
      computed = qty * rate;
    } else if (modalIsPerHour) {
      const rate = modalSelectedService.initialPrice ?? 0;
      computed = qty * rate;
    } else if (modalIsPerRoom) {
      const rate = modalSelectedService.initialPrice ?? 0;
      const additionalRate = modalSelectedService.additionalUnitPrice ?? 0;
      computed = qty <= 0 ? 0 : rate + Math.max(0, qty - 1) * additionalRate;
    }

    const final = min != null ? Math.max(computed, min) : computed;
    setModalQuantity(qty);
    setModalInitialPrice(final);
  }

  function computeModalPriceFromSqft(sqft: number) {
    setModalQuantity(sqft);
    if (!modalSelectedService || !pricingSettings) return;

    let options;
    if (modalUsesYardSqft && modalSelectedService.yardSqftPricing) {
      const planPricing = {
        yard_sqft_pricing: modalSelectedService.yardSqftPricing,
      } as ServicePlanPricing;
      options = generateYardSqftOptions(pricingSettings, planPricing);
    } else {
      const planPricing: ServicePlanPricing | undefined =
        modalSelectedService.homeSizePricing
          ? ({
              home_size_pricing: modalSelectedService.homeSizePricing,
            } as ServicePlanPricing)
          : undefined;
      options = generateHomeSizeOptions(pricingSettings, planPricing);
    }

    const match = findSizeOptionByValue(sqft, options);
    if (!match) return;

    const activeVariant = modalVariantLabel
      ? modalSelectedService.variants?.find(v => v.label === modalVariantLabel) ?? null
      : null;
    const baseInitial = activeVariant?.initial_price ?? modalSelectedService.initialPrice ?? 0;
    const baseRecurring = activeVariant?.recurring_price ?? modalSelectedService.recurringPrice ?? 0;
    const min = activeVariant?.minimum_price ?? modalSelectedService.minimumPrice;

    const rawInitial = baseInitial + match.initialIncrease;
    const rawRecurring = baseRecurring + match.recurringIncrease;
    const finalInitial = min != null ? Math.max(rawInitial, min) : rawInitial;

    setModalInitialPrice(finalInitial);
    setModalRecurringPrice(rawRecurring);
  }

  // Auto-populate home-size fields from map when a new service is selected
  // Skips when editing — quantity is already pre-populated from saved line item
  useEffect(() => {
    if (editingItemId) return;
    if (!modalSelectedService) return;

    if (modalWantsLinFt && linFtSuggestions.length > 0) {
      const total = linFtSuggestions.reduce((s, o) => s + o.linearFt, 0);
      if (total > 0) handleModalQuantityChange(total);
    } else if (modalWantsSqFt && sqftSuggestions.length > 0) {
      // sqftSuggestions already filters by 'yard' when modalUsesYardSqft
      const total = sqftSuggestions.reduce((s, o) => s + o.sqft, 0);
      if (total > 0) {
        if (modalIsPerUnit) handleModalQuantityChange(total);
        else computeModalPriceFromSqft(total);
      }
    }
  }, [modalServiceId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleModalBodyScroll() {
    const el = modalBodyRef.current;
    if (!el) return;
    setModalTopShadow(el.scrollTop > 0);
    setModalBottomShadow(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }

  function closeModal() {
    setPestModal(null);
    setEditingItemId(null);
  }

  function openEditModal(primaryItemId: string) {
    const primary = lineItems.find(i => i.id === primaryItemId);
    if (!primary) return;

    const childAddons = lineItems.filter(
      i => i.catalogItemKind === 'addon' && i.parentLineItemId === primaryItemId
    );
    const childProducts = lineItems.filter(
      i =>
        i.catalogItemKind === 'product' && i.parentLineItemId === primaryItemId
    );

    // Pre-check only inspector-selected add-ons:
    // - recommended add-ons the inspector highlighted (isRecommended === true)
    // - non-recommended add-ons (isRecommended === undefined)
    // Auto-added recommended add-ons (isRecommended === false) remain unchecked
    const addonIds = new Set(
      childAddons
        .filter(a => a.isRecommended !== false)
        .map(a => a.catalogItemId!)
        .filter(Boolean)
    );

    const productQtys: Record<string, number> = {};
    for (const p of childProducts) {
      if (p.catalogItemId && p.quantity) {
        productQtys[p.catalogItemId] = p.quantity;
      }
    }

    const addonQtys: Record<string, number> = {};
    for (const a of childAddons) {
      if (a.catalogItemId && a.quantity != null) {
        addonQtys[a.catalogItemId] = a.quantity;
      }
    }

    setEditingItemId(primaryItemId);
    setModalServiceId(primary.catalogItemId ?? null);
    setModalAddonIds(addonIds);
    setModalAddonQuantities(addonQtys);
    setModalProductQtys(productQtys);
    setModalInitialPrice(primary.initialCost);
    setModalRecurringPrice(primary.recurringCost);
    setModalFrequency(primary.frequency);
    setModalQuantity(primary.quantity ?? null);
    setModalVariantLabel(primary.selectedVariantLabel ?? null);
    setPestModal({ id: '__all__', label: 'Edit Service' });
  }

  function handleModalSave() {
    if (!modalServiceId || !pestModal) {
      closeModal();
      return;
    }
    const service = catalog.find(c => c.id === modalServiceId);
    if (!service) {
      closeModal();
      return;
    }

    // If editing, filter out the old primary + all its children
    const baseItems = editingItemId
      ? lineItems.filter(
          i => i.id !== editingItemId && i.parentLineItemId !== editingItemId
        )
      : lineItems;

    const newItems: QuoteLineItem[] = [];
    const isOneTime =
      service.planCategory === 'one-time' ||
      service.billingFrequency === 'one-time';

    const primaryItem: QuoteLineItem = {
      id: crypto.randomUUID(),
      type: 'plan-addon',
      catalogItemId: service.id,
      catalogItemKind: service.kind,
      catalogItemName: service.name,
      isPrimary: true,
      coveredPestIds: service.pestCoverageIds,
      coveredPestLabels: service.pestCoverageNames,
      initialCost: modalInitialPrice,
      recurringCost: modalRecurringPrice,
      frequency:
        modalFrequency ??
        (isOneTime
          ? 'one-time'
          : (service.treatmentFrequency ?? service.billingFrequency ?? null)),
      quantity: modalQuantity,
      selectedVariantLabel: modalVariantLabel,
      percentageJobCost: null,
      percentagePricingNote: null,
      is_custom_priced: false,
      custom_initial_price: null,
    };
    newItems.push(primaryItem);

    // Recommended add-on line items — add ALL of them, flagging which ones the inspector selected
    const recommendedIdSet = new Set(service.recommendedAddonIds);
    for (const addonId of service.recommendedAddonIds) {
      const addon = addonCatalog.find(a => a.id === addonId);
      if (!addon) continue;
      const resolvedFrequency = addon.billingFrequency ?? 'monthly';
      const isAddonOneTime = resolvedFrequency === 'one-time';

      // Compute percentage pricing using parent plan's cost as the job cost
      let resolvedInitial = addon.initialPrice ?? null;
      let addonPercentageJobCost: number | null = null;
      let addonPercentagePricingNote: string | null = null;
      let addonIsCustomPriced = false;
      let addonCustomInitialPrice: number | null = null;

      if (addon.percentagePricing && (primaryItem.initialCost ?? 0) > 0) {
        const { percentage, years = 1, minimum = 0 } = addon.percentagePricing;
        const jobCost = primaryItem.initialCost!;
        const computed = Math.max((percentage / 100) * jobCost * years, minimum);
        resolvedInitial = computed;
        addonPercentageJobCost = jobCost;
        addonPercentagePricingNote = `${percentage}% of $${jobCost.toLocaleString('en-US')}${years > 1 ? ` × ${years} yrs` : ''} = $${computed.toFixed(2)}`;
        addonIsCustomPriced = true;
        addonCustomInitialPrice = computed;
      }

      // Override cost for per-unit types when a quantity was entered in the modal
      const addonQty = modalAddonQuantities[addonId] ?? null;
      if (addonQty != null && addon.pricingType !== 'flat' && !addon.percentagePricing) {
        const pt = addon.pricingType;
        if (pt === 'per_room') {
          const first = addon.initialPrice ?? 0;
          const additional = addon.additionalUnitPrice ?? 0;
          const raw = addonQty <= 0 ? 0 : first + Math.max(0, addonQty - 1) * additional;
          resolvedInitial = addon.minimumPrice != null ? Math.max(raw, addon.minimumPrice) : raw;
        } else {
          const rate = addon.pricePerUnit ?? 0;
          const raw = addonQty * rate;
          resolvedInitial = addon.minimumPrice != null ? Math.max(raw, addon.minimumPrice) : raw;
        }
      }

      newItems.push({
        id: crypto.randomUUID(),
        type: 'plan-addon',
        catalogItemId: addon.id,
        catalogItemKind: 'addon',
        catalogItemName: addon.name,
        isPrimary: false,
        coveredPestIds: addon.pestCoverageIds,
        coveredPestLabels: [],
        initialCost: resolvedInitial,
        recurringCost: addon.recurringPrice,
        frequency: isAddonOneTime ? 'one-time' : resolvedFrequency,
        selectedVariantLabel: null,
        quantity: addonQty,
        percentageJobCost: addonPercentageJobCost,
        percentagePricingNote: addonPercentagePricingNote,
        is_custom_priced: addonIsCustomPriced,
        custom_initial_price: addonCustomInitialPrice,
        parentLineItemId: primaryItem.id,
        isRecommended: modalAddonIds.has(addonId), // true = inspector highlighted, false = auto-added
        isSelected: false, // all recommended addons start unselected
      });
    }

    // Non-recommended add-on line items (inspector selected from Additional Recommendations)
    for (const addonId of modalAddonIds) {
      if (recommendedIdSet.has(addonId)) continue; // already handled above
      const addon = addonCatalog.find(a => a.id === addonId);
      if (!addon) continue;
      const resolvedFrequency = addon.billingFrequency ?? 'monthly';
      const isAddonOneTime = resolvedFrequency === 'one-time';

      // Compute percentage pricing using parent plan's cost as the job cost
      let resolvedInitial = addon.initialPrice ?? null;
      let addonPercentageJobCost: number | null = null;
      let addonPercentagePricingNote: string | null = null;
      let addonIsCustomPriced = false;
      let addonCustomInitialPrice: number | null = null;

      if (addon.percentagePricing && (primaryItem.initialCost ?? 0) > 0) {
        const { percentage, years = 1, minimum = 0 } = addon.percentagePricing;
        const jobCost = primaryItem.initialCost!;
        const computed = Math.max((percentage / 100) * jobCost * years, minimum);
        resolvedInitial = computed;
        addonPercentageJobCost = jobCost;
        addonPercentagePricingNote = `${percentage}% of $${jobCost.toLocaleString('en-US')}${years > 1 ? ` × ${years} yrs` : ''} = $${computed.toFixed(2)}`;
        addonIsCustomPriced = true;
        addonCustomInitialPrice = computed;
      }

      // Override cost for per-unit types when a quantity was entered in the modal
      const addonQty = modalAddonQuantities[addonId] ?? null;
      if (addonQty != null && addon.pricingType !== 'flat' && !addon.percentagePricing) {
        const pt = addon.pricingType;
        if (pt === 'per_room') {
          const first = addon.initialPrice ?? 0;
          const additional = addon.additionalUnitPrice ?? 0;
          const raw = addonQty <= 0 ? 0 : first + Math.max(0, addonQty - 1) * additional;
          resolvedInitial = addon.minimumPrice != null ? Math.max(raw, addon.minimumPrice) : raw;
        } else {
          const rate = addon.pricePerUnit ?? 0;
          const raw = addonQty * rate;
          resolvedInitial = addon.minimumPrice != null ? Math.max(raw, addon.minimumPrice) : raw;
        }
      }

      newItems.push({
        id: crypto.randomUUID(),
        type: 'plan-addon',
        catalogItemId: addon.id,
        catalogItemKind: 'addon',
        catalogItemName: addon.name,
        isPrimary: false,
        coveredPestIds: addon.pestCoverageIds,
        coveredPestLabels: [],
        initialCost: resolvedInitial,
        recurringCost: addon.recurringPrice,
        frequency: isAddonOneTime ? 'one-time' : resolvedFrequency,
        selectedVariantLabel: null,
        quantity: addonQty,
        percentageJobCost: addonPercentageJobCost,
        percentagePricingNote: addonPercentagePricingNote,
        is_custom_priced: addonIsCustomPriced,
        custom_initial_price: addonCustomInitialPrice,
        parentLineItemId: primaryItem.id,
        // isRecommended left undefined — non-recommended inspector addition
        isSelected: true,
      });
    }

    // Product line items
    for (const [productId, qty] of Object.entries(modalProductQtys)) {
      if (qty <= 0) continue;
      const product = products.find(p => p.id === productId);
      if (!product) continue;
      newItems.push({
        id: crypto.randomUUID(),
        type: 'custom',
        customName: product.product_name,
        catalogItemKind: 'product',
        catalogItemId: product.id,
        isPrimary: false,
        coveredPestIds: [],
        coveredPestLabels: [],
        initialCost: qty * product.unit_price,
        recurringCost:
          product.recurring_price > 0 ? qty * product.recurring_price : null,
        frequency:
          product.recurring_price > 0 ? (modalFrequency ?? 'monthly') : null,
        quantity: qty,
        parentLineItemId: primaryItem.id,
      });
    }

    if (editingItemId) {
      const editIdx = lineItems.findIndex(i => i.id === editingItemId);
      const before = baseItems.filter(
        i => lineItems.findIndex(li => li.id === i.id) < editIdx
      );
      const after = baseItems.filter(
        i => lineItems.findIndex(li => li.id === i.id) > editIdx
      );
      onChange([...before, ...newItems, ...after]);
    } else {
      onChange([...baseItems, ...newItems]);
    }
    setEditingItemId(null);
    setPestModal(null);
    setModalServiceId(null);
    setModalAddonIds(new Set());
    setModalAddonQuantities({});
    setModalProductQtys({});
    setModalInitialPrice(null);
    setModalRecurringPrice(null);
    setModalFrequency(null);
    setModalQuantity(null);
    setModalVariantLabel(null);
  }

  // Only render plan/bundle/custom items as compact summary cards; addons and products
  // are managed through the modal and should not appear at the top level.
  const serviceCards = lineItems.filter(
    i => i.catalogItemKind !== 'addon' && i.catalogItemKind !== 'product'
  );

  // ── Drag-to-reorder (pointer events — works on touch + mouse) ────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragStateRef = useRef<{ from: number; to: number } | null>(null);
  const cardRefsArr = useRef<(HTMLDivElement | null)[]>([]);
  // Ghost element that follows the pointer during drag
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const pointerOffsetRef = useRef({ x: 0, y: 0 });
  const [ghostItem, setGhostItem] = useState<{
    item: QuoteLineItem;
    width: number;
    x: number;
    y: number;
  } | null>(null);

  function findClosestCardIndex(clientY: number): number {
    let closest = dragStateRef.current?.from ?? 0;
    let closestDist = Infinity;
    cardRefsArr.current.forEach((card, i) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(clientY - mid);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    return closest;
  }

  function reorderAndCommit(from: number, to: number) {
    if (from === to) return;
    const reordered = [...serviceCards];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const usedIds = new Set<string>();
    const next: QuoteLineItem[] = [];
    for (const card of reordered) {
      next.push(card);
      usedIds.add(card.id);
      for (const child of lineItems.filter(
        i => i.parentLineItemId === card.id
      )) {
        next.push(child);
        usedIds.add(child.id);
      }
    }
    for (const item of lineItems) {
      if (!usedIds.has(item.id)) next.push(item);
    }
    onChange(next);
  }

  function onHandlePointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    index: number
  ) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const card = cardRefsArr.current[index];
    if (card) {
      const rect = card.getBoundingClientRect();
      pointerOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setGhostItem({
        item: serviceCards[index],
        width: rect.width,
        x: rect.left,
        y: rect.top,
      });
    }
    dragStateRef.current = { from: index, to: index };
    setDragIndex(index);
    setDragOverIndex(index);
  }

  function onHandlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStateRef.current) return;
    // Move ghost directly via DOM — no React re-render needed
    if (ghostRef.current) {
      ghostRef.current.style.left = `${e.clientX - pointerOffsetRef.current.x}px`;
      ghostRef.current.style.top = `${e.clientY - pointerOffsetRef.current.y}px`;
    }
    const closest = findClosestCardIndex(e.clientY);
    if (closest !== dragStateRef.current.to) {
      dragStateRef.current.to = closest;
      setDragOverIndex(closest);
    }
  }

  function onHandlePointerUp() {
    const ds = dragStateRef.current;
    if (ds) reorderAndCommit(ds.from, ds.to);
    dragStateRef.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
    setGhostItem(null);
  }

  return (
    <div className={styles.root}>
      {/* ── Pest Concern Coverage (top) ── */}
      {plottedPests.length > 0 && (
        <div className={styles.coverageSection}>
          <div className={styles.pestIconRow}>
            {plottedPests.map(pest => {
              const covered = coveredPestIds.has(pest.id);
              const iconSvg = pestIconMap[pest.id] ?? null;
              const stampType = pest.stampType ?? getPestStampType(pest.id);
              const color = getPestColor(pest.id);
              return (
                <button
                  key={pest.id}
                  type="button"
                  className={`${styles.pestIconBtn} ${covered ? styles.pestIconBtnCovered : styles.pestIconBtnUncovered}`}
                  onClick={() => {
                    const coveringItem = lineItems.find(
                      i => i.isPrimary && i.coveredPestIds.includes(pest.id)
                    );
                    if (coveringItem) {
                      openEditModal(coveringItem.id);
                    } else {
                      setPestModal(pest);
                    }
                  }}
                >
                  <div
                    className={`${styles.pestIconCircle} ${covered ? styles.pestIconCircleCovered : styles.pestIconCircleUncovered}`}
                    style={{ color }}
                  >
                    {iconSvg && (
                      <span
                        className={styles.pestIconSvg}
                        dangerouslySetInnerHTML={{ __html: iconSvg }}
                      />
                    )}
                    {!iconSvg && <MapStampGlyph type={stampType} size={24} />}
                    {covered && (
                      <span
                        className={styles.coveredBadge}
                        aria-label="Covered"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M9.75 0C7.82164 0 5.93657 0.571828 4.33319 1.64317C2.72982 2.71451 1.48013 4.23726 0.742179 6.01884C0.00422452 7.80042 -0.188858 9.76082 0.187348 11.6521C0.563554 13.5434 1.49215 15.2807 2.85571 16.6443C4.21928 18.0079 5.95656 18.9365 7.84787 19.3127C9.73919 19.6889 11.6996 19.4958 13.4812 18.7578C15.2627 18.0199 16.7855 16.7702 17.8568 15.1668C18.9282 13.5634 19.5 11.6784 19.5 9.75C19.4973 7.16498 18.4692 4.68661 16.6413 2.85872C14.8134 1.03084 12.335 0.00272983 9.75 0ZM14.0306 8.03063L8.78063 13.2806C8.71097 13.3504 8.62826 13.4057 8.53721 13.4434C8.44616 13.4812 8.34857 13.5006 8.25 13.5006C8.15144 13.5006 8.05385 13.4812 7.9628 13.4434C7.87175 13.4057 7.78903 13.3504 7.71938 13.2806L5.46938 11.0306C5.32865 10.8899 5.24959 10.699 5.24959 10.5C5.24959 10.301 5.32865 10.1101 5.46938 9.96937C5.61011 9.82864 5.80098 9.74958 6 9.74958C6.19903 9.74958 6.3899 9.82864 6.53063 9.96937L8.25 11.6897L12.9694 6.96937C13.0391 6.89969 13.1218 6.84442 13.2128 6.8067C13.3039 6.76899 13.4015 6.74958 13.5 6.74958C13.5986 6.74958 13.6961 6.76899 13.7872 6.8067C13.8782 6.84442 13.9609 6.89969 14.0306 6.96937C14.1003 7.03906 14.1556 7.12178 14.1933 7.21283C14.231 7.30387 14.2504 7.40145 14.2504 7.5C14.2504 7.59855 14.231 7.69613 14.1933 7.78717C14.1556 7.87822 14.1003 7.96094 14.0306 8.03063Z"
                            fill="#16A34A"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                  <span className={styles.pestIconLabel}>{pest.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Line items */}
      {serviceCards.length === 0 ? (
        <div className={styles.emptyState}>
          {plottedPests.length > 0 ? (
            <p className={styles.emptyTitle}>
              Tap A Pest Icon Above To Start Quoting
            </p>
          ) : (
            <>
              <p className={styles.emptyTitle}>No line items yet</p>
              <p className={styles.emptyHint}>
                Add a line item to start building the quote.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className={styles.lineItemsList}>
          {serviceCards.map((item, index) => {
            const children = lineItems.filter(
              i => i.parentLineItemId === item.id && i.isSelected !== false
            );
            const aggInitial =
              (item.initialCost ?? 0) +
              children.reduce((s, c) => s + (c.initialCost ?? 0), 0);
            const aggRecurring =
              (item.recurringCost ?? 0) +
              children.reduce((s, c) => s + (c.recurringCost ?? 0), 0);
            const freq = item.frequency;

            // Icon logic: find plotted pests covered by this item
            const coveredPlotted = plottedPests.filter(p =>
              item.coveredPestIds.includes(p.id)
            );
            const singlePest =
              coveredPlotted.length === 1 ? coveredPlotted[0] : null;

            const isDragging = dragIndex === index;
            const isDragOver = dragOverIndex === index && dragIndex !== index;

            return (
              <div
                key={item.id}
                ref={el => {
                  cardRefsArr.current[index] = el;
                }}
                className={`${styles.lineItemSummaryCard} ${isDragging ? styles.lineItemDragging : ''} ${isDragOver ? styles.lineItemDragOver : ''}`}
              >
                <div
                  className={styles.lineItemDragHandle}
                  aria-hidden="true"
                  onPointerDown={e => onHandlePointerDown(e, index)}
                  onPointerMove={onHandlePointerMove}
                  onPointerUp={onHandlePointerUp}
                >
                  <svg
                    width="14"
                    height="22"
                    viewBox="0 0 14 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="3" cy="3" r="2" fill="currentColor" />
                    <circle cx="11" cy="3" r="2" fill="currentColor" />
                    <circle cx="3" cy="11" r="2" fill="currentColor" />
                    <circle cx="11" cy="11" r="2" fill="currentColor" />
                    <circle cx="3" cy="19" r="2" fill="currentColor" />
                    <circle cx="11" cy="19" r="2" fill="currentColor" />
                  </svg>
                </div>
                <div className={styles.lineItemSummaryIcon}>
                  {singlePest ? (
                    (() => {
                      const iconSvg = pestIconMap[singlePest.id] ?? null;
                      const stampType =
                        singlePest.stampType ?? getPestStampType(singlePest.id);
                      const color = getPestColor(singlePest.id);
                      return iconSvg ? (
                        <span
                          className={styles.pestIconSvg}
                          style={{ color }}
                          dangerouslySetInnerHTML={{ __html: iconSvg }}
                        />
                      ) : (
                        <MapStampGlyph type={stampType} size={28} />
                      );
                    })()
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="34"
                      height="36"
                      viewBox="0 0 34 36"
                      fill="none"
                      className={styles.shieldIcon}
                    >
                      <path
                        d="M31.1667 0H2.83333C2.08189 0 1.36122 0.303427 0.829864 0.84353C0.298511 1.38363 0 2.11617 0 2.87999V12.96C0 22.4495 4.51917 28.2005 8.31052 31.3541C12.3941 34.7489 16.4564 35.9009 16.6334 35.9495C16.8769 36.0168 17.1337 36.0168 17.3772 35.9495C17.5543 35.9009 21.6112 34.7489 25.7001 31.3541C29.4808 28.2005 34 22.4495 34 12.96V2.87999C34 2.11617 33.7015 1.38363 33.1701 0.84353C32.6388 0.303427 31.9181 0 31.1667 0ZM25.0892 12.5388L15.1725 22.6187C15.0409 22.7526 14.8847 22.8588 14.7127 22.9313C14.5407 23.0038 14.3564 23.0411 14.1702 23.0411C13.984 23.0411 13.7997 23.0038 13.6277 22.9313C13.4557 22.8588 13.2995 22.7526 13.1679 22.6187L8.91792 18.2987C8.65209 18.0285 8.50275 17.6621 8.50275 17.28C8.50275 16.8978 8.65209 16.5314 8.91792 16.2612C9.18374 15.991 9.54428 15.8392 9.92021 15.8392C10.2961 15.8392 10.6567 15.991 10.9225 16.2612L14.1667 19.5641L23.081 10.5012C23.2127 10.3674 23.3689 10.2613 23.5409 10.1888C23.7129 10.1164 23.8972 10.0792 24.0833 10.0792C24.2695 10.0792 24.4538 10.1164 24.6258 10.1888C24.7977 10.2613 24.954 10.3674 25.0856 10.5012C25.2172 10.635 25.3217 10.7938 25.3929 10.9686C25.4641 11.1434 25.5008 11.3308 25.5008 11.52C25.5008 11.7092 25.4641 11.8965 25.3929 12.0713C25.3217 12.2461 25.2172 12.405 25.0856 12.5388H25.0892Z"
                        fill="#2478F5"
                      />
                    </svg>
                  )}
                </div>
                <div className={styles.lineItemSummaryInfo}>
                  <span className={styles.lineItemSummaryName}>
                    {formatLineItemLabel(item)}
                  </span>
                </div>
                <div className={styles.lineItemSummaryPricing}>
                  <span>Initial: {formatCurrency(aggInitial)}</span>
                  {aggRecurring > 0 && freq && freq !== 'one-time' && (
                    <span>
                      Recurring: {formatCurrency(aggRecurring)}
                      <span className={styles.lineItemPricingFrequency}>
                        /{freq}
                      </span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.lineItemDeleteBtn}
                  onClick={() => removeItem(item.id)}
                  aria-label="Delete service"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  className={styles.lineItemEditBtn}
                  onClick={() => openEditModal(item.id)}
                  aria-label="Edit service"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            );
          })}
          {/* Add Additional Service button — only shown when there are existing line items */}
          {lineItems.length > 0 && (
            <button
              type="button"
              className={styles.addAdditionalServiceBtn}
              onClick={() =>
                setPestModal({ id: '__all__', label: 'Add Service' })
              }
            >
              + Add Additional Service
            </button>
          )}
        </div>
      )}

      {/* Available Discounts */}
      {filteredDiscounts.length > 0 && (
        <div className={styles.discountSection}>
          <p className={styles.discountSectionTitle}>
            Discounts Available
            {selectedDiscount && (
              <>
                <span>&nbsp;-&nbsp;</span>
                <span className={styles.discountSectionValue}>
                  {selectedDiscount.discount_type === 'percentage'
                    ? `${selectedDiscount.discount_value}%`
                    : formatCurrency(selectedDiscount.discount_value)}
                </span>
              </>
            )}
          </p>
          <div className={styles.discountChips}>
            {filteredDiscounts.map(d => (
              <button
                key={d.id}
                type="button"
                className={`${styles.discountChip} ${selectedDiscount?.id === d.id ? styles.discountChipSelected : ''}`}
                onClick={() =>
                  onDiscountChange?.(selectedDiscount?.id === d.id ? null : d)
                }
              >
                {d.discount_name}
                {selectedDiscount?.id === d.id && (
                  <span className={styles.modalChipBadge} aria-hidden="true">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="27"
                      height="27"
                      viewBox="0 0 27 27"
                      fill="none"
                    >
                      <circle cx="13.5" cy="13.5" r="13.5" />
                      <path d="M13.75 4C11.8216 4 9.93657 4.57183 8.33319 5.64317C6.72982 6.71451 5.48013 8.23726 4.74218 10.0188C4.00422 11.8004 3.81114 13.7608 4.18735 15.6521C4.56355 17.5434 5.49215 19.2807 6.85571 20.6443C8.21928 22.0079 9.95656 22.9365 11.8479 23.3127C13.7392 23.6889 15.6996 23.4958 17.4812 22.7578C19.2627 22.0199 20.7855 20.7702 21.8568 19.1668C22.9282 17.5634 23.5 15.6784 23.5 13.75C23.4973 11.165 22.4692 8.68661 20.6413 6.85872C18.8134 5.03084 16.335 4.00273 13.75 4ZM18.0306 12.0306L12.7806 17.2806C12.711 17.3504 12.6283 17.4057 12.5372 17.4434C12.4462 17.4812 12.3486 17.5006 12.25 17.5006C12.1514 17.5006 12.0538 17.4812 11.9628 17.4434C11.8718 17.4057 11.789 17.3504 11.7194 17.2806L9.46938 15.0306C9.32865 14.8899 9.24959 14.699 9.24959 14.5C9.24959 14.301 9.32865 14.1101 9.46938 13.9694C9.61011 13.8286 9.80098 13.7496 10 13.7496C10.199 13.7496 10.3899 13.8286 10.5306 13.9694L12.25 15.6897L16.9694 10.9694C17.0391 10.8997 17.1218 10.8444 17.2128 10.8067C17.3039 10.769 17.4015 10.7496 17.5 10.7496C17.5986 10.7496 17.6961 10.769 17.7872 10.8067C17.8782 10.8444 17.9609 10.8997 18.0306 10.9694C18.1003 11.0391 18.1556 11.1218 18.1933 11.2128C18.231 11.3039 18.2504 11.4015 18.2504 11.5C18.2504 11.5985 18.231 11.6961 18.1933 11.7872C18.1556 11.8782 18.1003 11.9609 18.0306 12.0306Z" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      {
        <div className={styles.totalsSection}>
          <div className={styles.totalsCard}>
            <p className={styles.totalsTitle}>Quote Total</p>
            <div className={styles.totalsPricingRow}>
              <span className={styles.totalsInitialBlock}>
                <span className={styles.totalsInitialLabel}>Initial:</span>{' '}
                {selectedDiscount && discountedInitialSavings > 0 ? (
                  <>
                    <span className={styles.totalsInitialStrike}>
                      {formatCurrency(totalInitial)}
                    </span>
                    <span className={styles.totalsInitialSep}>
                      {' '}
                      &nbsp;-&nbsp;
                    </span>
                    <span className={styles.totalsInitialNow}>
                      Now{' '}
                      {formatCurrency(totalInitial - discountedInitialSavings)}
                    </span>
                  </>
                ) : (
                  <span className={styles.totalsInitialValue}>
                    {formatCurrency(totalInitial)}
                  </span>
                )}
              </span>
              <span className={styles.totalsDivider}>|</span>
              <span className={styles.totalsEzpayBlock}>
                <span className={styles.totalsEzpayLabel}>EZPay:</span>{' '}
                <span className={styles.totalsEzpayValue}>
                  {formatCurrency(totalMonthlyRecurring)}/mo
                </span>
              </span>
            </div>
            {selectedDiscount && discountedInitialSavings > 0 && (
              <p className={styles.totalsSavings}>
                Discounted Savings: {formatCurrency(discountedInitialSavings)}
              </p>
            )}
          </div>
        </div>
      }

      {/* ── Drag ghost element (follows pointer during drag) ── */}
      {ghostItem && (
        <div
          ref={ghostRef}
          className={styles.lineItemGhost}
          style={{
            position: 'fixed',
            left: ghostItem.x,
            top: ghostItem.y,
            width: ghostItem.width,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <div className={styles.lineItemDragHandle} aria-hidden="true">
            <svg
              width="14"
              height="22"
              viewBox="0 0 14 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="3" cy="3" r="2" fill="currentColor" />
              <circle cx="11" cy="3" r="2" fill="currentColor" />
              <circle cx="3" cy="11" r="2" fill="currentColor" />
              <circle cx="11" cy="11" r="2" fill="currentColor" />
              <circle cx="3" cy="19" r="2" fill="currentColor" />
              <circle cx="11" cy="19" r="2" fill="currentColor" />
            </svg>
          </div>
          <span className={styles.lineItemSummaryName}>
            {formatLineItemLabel(ghostItem.item)}
          </span>
        </div>
      )}

      {/* ── Pest Service Selection Modal ── */}
      {pestModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalSheetWrapper}>
            {/* Pest icon circle — overlaps top edge of the sheet */}
            <div className={styles.modalPestCircleWrapper}>
              <div
                className={styles.modalPestCircle}
                style={{
                  color:
                    pestModal.id === '__all__'
                      ? 'var(--blue-600)'
                      : getPestColor(pestModal.id),
                }}
              >
                {pestModal.id === '__all__' ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="34"
                    height="36"
                    viewBox="0 0 34 36"
                    fill="none"
                    className={styles.shieldIcon}
                  >
                    <path
                      d="M31.1667 0H2.83333C2.08189 0 1.36122 0.303427 0.829864 0.84353C0.298511 1.38363 0 2.11617 0 2.87999V12.96C0 22.4495 4.51917 28.2005 8.31052 31.3541C12.3941 34.7489 16.4564 35.9009 16.6334 35.9495C16.8769 36.0168 17.1337 36.0168 17.3772 35.9495C17.5543 35.9009 21.6112 34.7489 25.7001 31.3541C29.4808 28.2005 34 22.4495 34 12.96V2.87999C34 2.11617 33.7015 1.38363 33.1701 0.84353C32.6388 0.303427 31.9181 0 31.1667 0ZM25.0892 12.5388L15.1725 22.6187C15.0409 22.7526 14.8847 22.8588 14.7127 22.9313C14.5407 23.0038 14.3564 23.0411 14.1702 23.0411C13.984 23.0411 13.7997 23.0038 13.6277 22.9313C13.4557 22.8588 13.2995 22.7526 13.1679 22.6187L8.91792 18.2987C8.65209 18.0285 8.50275 17.6621 8.50275 17.28C8.50275 16.8978 8.65209 16.5314 8.91792 16.2612C9.18374 15.991 9.54428 15.8392 9.92021 15.8392C10.2961 15.8392 10.6567 15.991 10.9225 16.2612L14.1667 19.5641L23.081 10.5012C23.2127 10.3674 23.3689 10.2613 23.5409 10.1888C23.7129 10.1164 23.8972 10.0792 24.0833 10.0792C24.2695 10.0792 24.4538 10.1164 24.6258 10.1888C24.7977 10.2613 24.954 10.3674 25.0856 10.5012C25.2172 10.635 25.3217 10.7938 25.3929 10.9686C25.4641 11.1434 25.5008 11.3308 25.5008 11.52C25.5008 11.7092 25.4641 11.8965 25.3929 12.0713C25.3217 12.2461 25.2172 12.405 25.0856 12.5388H25.0892Z"
                      fill="#2478F5"
                    />
                  </svg>
                ) : pestIconMap[pestModal.id] ? (
                  <span
                    className={styles.modalPestIconSvg}
                    dangerouslySetInnerHTML={{
                      __html: pestIconMap[pestModal.id],
                    }}
                  />
                ) : (
                  <MapStampGlyph
                    type={getPestStampType(pestModal.id)}
                    size={36}
                  />
                )}
              </div>
            </div>

            <div
              className={styles.modalSheet}
              onClick={e => e.stopPropagation()}
            >
              <div
                className={`${styles.modalTopSticky} ${modalTopShadow ? styles.modalTopStickyShadow : ''}`}
              >
                <p className={styles.modalPestName}>
                  {pestModal.id === '__all__'
                    ? editingItemId
                      ? 'Edit Service'
                      : 'Add Service'
                    : pestModal.label}
                </p>

                {/* Service chip selector */}
                {modalServiceChips.length === 0 ? (
                  <p className={styles.modalNoServices}>
                    No services configured for this pest yet.
                  </p>
                ) : pestModal?.id === '__all__' ? (
                  /* Searchable dropdown for "Add Additional Service" */
                  <div className={styles.serviceDropdownWrapper} ref={serviceDropdownRef}>
                    <div
                      ref={serviceDropdownTriggerRef}
                      className={`${styles.serviceDropdownTrigger} ${serviceDropdownOpen ? styles.serviceDropdownTriggerOpen : ''}`}
                      onClick={() => setServiceDropdownOpen(o => !o)}
                    >
                      <span className={styles.serviceDropdownValue}>
                        {modalServiceId
                          ? modalServiceChips.find(s => s.id === modalServiceId)?.name
                          : 'Select a service...'}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0, transform: serviceDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                    {serviceDropdownOpen && serviceDropdownRect && createPortal(
                      <div
                        ref={serviceDropdownMenuRef}
                        className={styles.serviceDropdownMenu}
                        style={{
                          position: 'fixed',
                          top: serviceDropdownRect.bottom,
                          left: serviceDropdownRect.left,
                          width: serviceDropdownRect.width,
                          zIndex: 9999,
                        }}
                      >
                        <div className={styles.serviceDropdownSearch}>
                          <input
                            type="text"
                            value={serviceSearch}
                            onChange={e => setServiceSearch(e.target.value)}
                            placeholder="Search services..."
                            autoFocus
                            className={styles.serviceDropdownSearchInput}
                          />
                        </div>
                        <div className={styles.serviceDropdownList}>
                          {filteredServiceChips.length === 0 ? (
                            <p className={styles.serviceDropdownEmpty}>No results</p>
                          ) : (
                            filteredServiceChips.map(service => (
                              <button
                                key={service.id}
                                type="button"
                                className={`${styles.serviceDropdownItem} ${modalServiceId === service.id ? styles.serviceDropdownItemActive : ''}`}
                                onClick={() => {
                                  setModalServiceId(service.id);
                                  setServiceDropdownOpen(false);
                                  setServiceSearch('');
                                }}
                              >
                                {service.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                ) : (
                  /* Original chip grid for pest-filtered view (few options) */
                  <div className={styles.modalServiceChips}>
                    {modalServiceChips.map(service => {
                      const isActive = modalServiceId === service.id;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          className={`${styles.modalServiceChip} ${isActive ? styles.modalServiceChipActive : ''}`}
                          onClick={() => setModalServiceId(service.id)}
                        >
                          {isActive && (
                            <span
                              className={styles.modalChipBadge}
                              aria-hidden="true"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="27"
                                height="27"
                                viewBox="0 0 27 27"
                                fill="none"
                              >
                                <circle cx="13.5" cy="13.5" r="13.5" />
                                <path d="M13.75 4C11.8216 4 9.93657 4.57183 8.33319 5.64317C6.72982 6.71451 5.48013 8.23726 4.74218 10.0188C4.00422 11.8004 3.81114 13.7608 4.18735 15.6521C4.56355 17.5434 5.49215 19.2807 6.85571 20.6443C8.21928 22.0079 9.95656 22.9365 11.8479 23.3127C13.7392 23.6889 15.6996 23.4958 17.4812 22.7578C19.2627 22.0199 20.7855 20.7702 21.8568 19.1668C22.9282 17.5634 23.5 15.6784 23.5 13.75C23.4973 11.165 22.4692 8.68661 20.6413 6.85872C18.8134 5.03084 16.335 4.00273 13.75 4ZM18.0306 12.0306L12.7806 17.2806C12.711 17.3504 12.6283 17.4057 12.5372 17.4434C12.4462 17.4812 12.3486 17.5006 12.25 17.5006C12.1514 17.5006 12.0538 17.4812 11.9628 17.4434C11.8718 17.4057 11.789 17.3504 11.7194 17.2806L9.46938 15.0306C9.32865 14.8899 9.24959 14.699 9.24959 14.5C9.24959 14.301 9.32865 14.1101 9.46938 13.9694C9.61011 13.8286 9.80098 13.7496 10 13.7496C10.199 13.7496 10.3899 13.8286 10.5306 13.9694L12.25 15.6897L16.9694 10.9694C17.0391 10.8997 17.1218 10.8444 17.2128 10.8067C17.3039 10.769 17.4015 10.7496 17.5 10.7496C17.5986 10.7496 17.6961 10.769 17.7872 10.8067C17.8782 10.8444 17.9609 10.8997 18.0306 10.9694C18.1003 11.0391 18.1556 11.1218 18.1933 11.2128C18.231 11.3039 18.2504 11.4015 18.2504 11.5C18.2504 11.5985 18.231 11.6961 18.1933 11.7872C18.1556 11.8782 18.1003 11.9609 18.0306 12.0306Z" />
                              </svg>
                            </span>
                          )}
                          {service.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Prompt shown when no service is selected yet */}
                {!modalServiceId && (
                  <p className={styles.modalSelectPrompt}>Select A Service</p>
                )}
                <hr className={styles.modalDivider} />
              </div>

              {/* Selected service details */}
              {modalSelectedService && (
                <div
                  className={styles.modalBody}
                  ref={modalBodyRef}
                  onScroll={handleModalBodyScroll}
                >
                  <div className={styles.modalSection}>
                    <p className={styles.modalSectionTitle}>
                      Summary of {modalSelectedService.name}
                    </p>

                    {modalSelectedService.description && (
                      <p className={styles.modalDescription}>
                        {modalSelectedService.description}
                      </p>
                    )}

                    {modalSelectedService.pestCoverageNames.length > 0 && (
                      <p className={styles.modalCoveredPests}>
                        <strong>Covered Pests: </strong>
                        {[...modalSelectedService.pestCoverageNames]
                          .sort((a, b) => {
                            const aOther = a.toLowerCase().includes('other');
                            const bOther = b.toLowerCase().includes('other');
                            if (aOther && !bOther) return 1;
                            if (!aOther && bOther) return -1;
                            return a.localeCompare(b);
                          })
                          .join(', ')}
                      </p>
                    )}

                    {/* Variant selector — shown when plan has variants */}
                    {modalSelectedService.variants.length > 0 && (
                      <div className={styles.fieldGroup} style={{ marginBottom: '12px' }}>
                        <label className={styles.fieldLabel}>Variant</label>
                        <select
                          className={styles.selectInput}
                          value={modalVariantLabel ?? ''}
                          onChange={e => {
                            const label = e.target.value || null;
                            setModalVariantLabel(label);
                            const variant = modalSelectedService.variants.find(v => v.label === label);
                            if (variant) {
                              if (variant.initial_price !== undefined) setModalInitialPrice(variant.initial_price);
                              if (variant.recurring_price !== undefined) setModalRecurringPrice(variant.recurring_price);
                              const freq = variant.treatment_frequency ?? variant.billing_frequency;
                              if (freq) setModalFrequency(freq);
                            } else {
                              // Cleared — reset to plan defaults
                              setModalInitialPrice(modalSelectedService.initialPrice);
                              setModalRecurringPrice(modalSelectedService.recurringPrice);
                              const isOneTime = modalSelectedService.planCategory === 'one-time' || modalSelectedService.billingFrequency === 'one-time';
                              setModalFrequency(
                                isOneTime
                                  ? 'one-time'
                                  : (modalSelectedService.treatmentFrequency ?? modalSelectedService.billingFrequency ?? null)
                              );
                            }
                          }}
                        >
                          <option value="">— Plan Default —</option>
                          {modalSelectedService.variants.map(v => (
                            <option key={v.label} value={v.label}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Two-column measurement row — shown for all non-per-hour, non-per-room plans */}
                    {!modalIsPerHour && !modalIsPerRoom && (
                      <div className={styles.measurementRow}>
                        {/* Square Feet column */}
                        <div
                          className={`${styles.measurementField} ${!modalWantsSqFt ? styles.measurementFieldDisabled : ''}`}
                        >
                          <span className={styles.fieldLabel}>
                            {modalUsesYardSqft ? 'Yard Size' : 'Home Size'} —{' '}
                            <span className={styles.fieldLabelLowercase}>
                              Square Feet
                            </span>
                          </span>
                          {sqftSuggestions.length > 0 && (
                            <div className={styles.mapSuggestions}>
                              {sqftSuggestions.map(o => {
                                const label =
                                  MAP_ELEMENT_STAMP_OPTIONS.find(
                                    e => e.type === o.type
                                  )?.label ?? o.type;
                                return (
                                  <button
                                    key={o.id}
                                    type="button"
                                    className={styles.mapSuggestion}
                                    onClick={() =>
                                      modalIsPerUnit
                                        ? handleModalQuantityChange(o.sqft)
                                        : computeModalPriceFromSqft(o.sqft)
                                    }
                                  >
                                    {label}: {o.sqft.toLocaleString()} sq ft
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <div className={styles.measurementInputWrap}>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="1"
                              className={styles.measurementInput}
                              disabled={!modalWantsSqFt}
                              value={
                                modalWantsSqFt ? (modalQuantity ?? '') : ''
                              }
                              onChange={
                                modalWantsSqFt
                                  ? e => {
                                      const v = parseFloat(e.target.value);
                                      if (!Number.isFinite(v) || v < 0) return;
                                      if (modalIsPerUnit)
                                        handleModalQuantityChange(v);
                                      else computeModalPriceFromSqft(v);
                                    }
                                  : undefined
                              }
                              placeholder="0"
                            />
                            <span className={styles.measurementUnit}>SF</span>
                          </div>
                        </div>

                        {/* Linear Feet column */}
                        <div
                          className={`${styles.measurementField} ${!modalWantsLinFt ? styles.measurementFieldDisabled : ''}`}
                        >
                          <span className={styles.fieldLabel}>
                            Home Size —{' '}
                            <span className={styles.fieldLabelLowercase}>
                              Linear Feet
                            </span>
                          </span>
                          {linFtSuggestions.length > 0 && (
                            <div className={styles.mapSuggestions}>
                              {linFtSuggestions.map(o => {
                                const label =
                                  MAP_ELEMENT_STAMP_OPTIONS.find(
                                    e => e.type === o.type
                                  )?.label ?? o.type;
                                return (
                                  <button
                                    key={o.id}
                                    type="button"
                                    className={styles.mapSuggestion}
                                    onClick={() =>
                                      handleModalQuantityChange(o.linearFt)
                                    }
                                  >
                                    {label}: {o.linearFt.toLocaleString()}{' '}
                                    linear ft
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <div className={styles.measurementInputWrap}>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="1"
                              className={styles.measurementInput}
                              disabled={!modalWantsLinFt}
                              value={
                                modalWantsLinFt ? (modalQuantity ?? '') : ''
                              }
                              onChange={
                                modalWantsLinFt
                                  ? e => {
                                      const v = parseFloat(e.target.value);
                                      if (Number.isFinite(v) && v >= 0)
                                        handleModalQuantityChange(v);
                                    }
                                  : undefined
                              }
                              placeholder="0"
                            />
                            <span className={styles.measurementUnit}>LF</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Per-hour / per-room single input */}
                    {(modalIsPerHour || modalIsPerRoom) && (
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                          {modalIsPerRoom ? 'Rooms' : 'Hours'}
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step={modalIsPerHour ? '0.5' : '1'}
                          className={styles.textInput}
                          value={modalQuantity ?? ''}
                          onChange={e => {
                            const v = parseFloat(e.target.value);
                            if (Number.isFinite(v) && v >= 0)
                              handleModalQuantityChange(v);
                          }}
                          placeholder={modalIsPerHour ? '0.0' : '1'}
                        />
                      </div>
                    )}

                    {/* Pricing row */}
                    <div className={styles.modalPricingRow}>
                      <div className={styles.modalPricingField}>
                        <span className={styles.fieldLabel}>Initial Price</span>
                        <div className={styles.currencyWrap}>
                          <span className={styles.currencySign}>$</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            className={styles.numberInput}
                            value={modalInitialPrice ?? ''}
                            onChange={e =>
                              setModalInitialPrice(parseCost(e.target.value))
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className={styles.modalPricingField}>
                        <span className={styles.fieldLabel}>
                          Recurring Price
                        </span>
                        <div className={styles.currencyWrap}>
                          <span className={styles.currencySign}>$</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            className={styles.numberInput}
                            value={modalRecurringPrice ?? ''}
                            onChange={e =>
                              setModalRecurringPrice(parseCost(e.target.value))
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className={styles.modalPricingField}>
                        <span className={styles.fieldLabel}>Frequency</span>
                        <select
                          className={styles.selectInput}
                          value={modalFrequency ?? ''}
                          onChange={e =>
                            setModalFrequency(e.target.value || null)
                          }
                        >
                          <option value="">— Select —</option>
                          {FREQUENCY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Add-on chips — Recommended Options */}
                  {modalRecommendedAddons.length > 0 && (
                    <div className={styles.modalSection}>
                      <p className={styles.modalSectionTitle}>
                        Recommended Options
                      </p>
                      <p className={styles.modalSectionHint}>
                        These will show up on the customer quote screen
                      </p>
                      <div className={styles.modalAddonChips}>
                        {modalRecommendedAddons.map(addon => {
                          const isActive = modalAddonIds.has(addon.id);
                          return (
                            <button
                              key={addon.id}
                              type="button"
                              className={`${styles.modalAddonChip} ${isActive ? styles.modalAddonChipActive : ''}`}
                              onClick={() => {
                                setModalAddonIds(prev => {
                                  const next = new Set(prev);
                                  if (next.has(addon.id)) next.delete(addon.id);
                                  else next.add(addon.id);
                                  return next;
                                });
                              }}
                            >
                              {isActive && (
                                <span
                                  className={styles.modalChipBadge}
                                  aria-hidden="true"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="27"
                                    height="27"
                                    viewBox="0 0 27 27"
                                    fill="none"
                                  >
                                    <circle cx="13.5" cy="13.5" r="13.5" />
                                    <path d="M13.75 4C11.8216 4 9.93657 4.57183 8.33319 5.64317C6.72982 6.71451 5.48013 8.23726 4.74218 10.0188C4.00422 11.8004 3.81114 13.7608 4.18735 15.6521C4.56355 17.5434 5.49215 19.2807 6.85571 20.6443C8.21928 22.0079 9.95656 22.9365 11.8479 23.3127C13.7392 23.6889 15.6996 23.4958 17.4812 22.7578C19.2627 22.0199 20.7855 20.7702 21.8568 19.1668C22.9282 17.5634 23.5 15.6784 23.5 13.75C23.4973 11.165 22.4692 8.68661 20.6413 6.85872C18.8134 5.03084 16.335 4.00273 13.75 4ZM18.0306 12.0306L12.7806 17.2806C12.711 17.3504 12.6283 17.4057 12.5372 17.4434C12.4462 17.4812 12.3486 17.5006 12.25 17.5006C12.1514 17.5006 12.0538 17.4812 11.9628 17.4434C11.8718 17.4057 11.789 17.3504 11.7194 17.2806L9.46938 15.0306C9.32865 14.8899 9.24959 14.699 9.24959 14.5C9.24959 14.301 9.32865 14.1101 9.46938 13.9694C9.61011 13.8286 9.80098 13.7496 10 13.7496C10.199 13.7496 10.3899 13.8286 10.5306 13.9694L12.25 15.6897L16.9694 10.9694C17.0391 10.8997 17.1218 10.8444 17.2128 10.8067C17.3039 10.769 17.4015 10.7496 17.5 10.7496C17.5986 10.7496 17.6961 10.769 17.7872 10.8067C17.8782 10.8444 17.9609 10.8997 18.0306 10.9694C18.1003 11.0391 18.1556 11.1218 18.1933 11.2128C18.231 11.3039 18.2504 11.4015 18.2504 11.5C18.2504 11.5985 18.231 11.6961 18.1933 11.7872C18.1556 11.8782 18.1003 11.9609 18.0306 12.0306Z" />
                                  </svg>
                                </span>
                              )}
                              {addon.name}
                              {(() => {
                                const pt = addon.pricingType;
                                if (pt === 'per_hour') {
                                  const rate = addon.pricePerUnit;
                                  return rate != null ? <span className={styles.modalChipPrice}> {formatCurrency(rate)}/hr</span> : null;
                                }
                                if (pt === 'per_room') {
                                  const rate = addon.initialPrice;
                                  return rate != null ? <span className={styles.modalChipPrice}> from {formatCurrency(rate)}</span> : null;
                                }
                                if (pt === 'per_sqft') {
                                  const rate = addon.pricePerUnit;
                                  return rate != null ? <span className={styles.modalChipPrice}> {formatCurrency(rate)}/sq ft</span> : null;
                                }
                                if (pt === 'per_acre') {
                                  const rate = addon.pricePerUnit;
                                  return rate != null ? <span className={styles.modalChipPrice}> {formatCurrency(rate)}/acre</span> : null;
                                }
                                if (pt === 'per_linear_foot') {
                                  const rate = addon.pricePerUnit;
                                  return rate != null ? <span className={styles.modalChipPrice}> {formatCurrency(rate)}/linear ft</span> : null;
                                }
                                return addon.initialPrice != null && addon.initialPrice > 0
                                  ? <span className={styles.modalChipPrice}> +{formatCurrency(addon.initialPrice)}</span>
                                  : null;
                              })()}
                            </button>
                          );
                        })}
                      </div>
                      {/* Quantity inputs for selected per-unit recommended add-ons */}
                      {modalRecommendedAddons
                        .filter(a => modalAddonIds.has(a.id) && a.pricingType !== 'flat')
                        .map(addon => {
                          const pt = addon.pricingType;
                          const label =
                            pt === 'per_hour' ? 'Hours' :
                            pt === 'per_room' ? 'Rooms' :
                            pt === 'per_sqft' ? 'Square Feet' :
                            pt === 'per_acre' ? 'Acres' :
                            pt === 'per_linear_foot' ? 'Linear Feet' : 'Units';
                          return (
                            <div key={addon.id} className={styles.addonQuantityRow}>
                              <label className={styles.addonQuantityLabel}>
                                {addon.name} — {label}:
                              </label>
                              <input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step={pt === 'per_hour' ? '0.5' : '1'}
                                className={styles.textInput}
                                value={modalAddonQuantities[addon.id] ?? ''}
                                onChange={e => {
                                  const v = parseFloat(e.target.value);
                                  setModalAddonQuantities(prev => ({
                                    ...prev,
                                    [addon.id]: Number.isFinite(v) && v >= 0 ? v : 0,
                                  }));
                                }}
                                placeholder={pt === 'per_hour' ? '0.0' : '1'}
                              />
                              {(() => {
                                const qty = modalAddonQuantities[addon.id] ?? 0;
                                if (!qty) return null;
                                if (pt === 'per_room') {
                                  const first = addon.initialPrice ?? 0;
                                  const additional = addon.additionalUnitPrice ?? 0;
                                  const total = qty <= 0 ? 0 : first + Math.max(0, qty - 1) * additional;
                                  const min = addon.minimumPrice;
                                  const final = min != null ? Math.max(total, min) : total;
                                  return <span className={styles.pricingHint}>= {formatCurrency(final)}</span>;
                                }
                                const rate = addon.pricePerUnit ?? 0;
                                const raw = qty * rate;
                                const min = addon.minimumPrice;
                                const final = min != null ? Math.max(raw, min) : raw;
                                return <span className={styles.pricingHint}>{qty} × {formatCurrency(rate)} = {formatCurrency(final)}</span>;
                              })()}
                            </div>
                          );
                        })
                      }
                    </div>
                  )}

                  {/* Add-on chips — Additional Recommendations */}
                  {modalAdditionalAddons.length > 0 && (
                    <div className={styles.modalSection}>
                      <p className={styles.modalSectionTitle}>
                        Additional Recommendations
                      </p>
                      <div className={styles.modalAddonChips}>
                        {modalAdditionalAddons.map(addon => {
                          const isActive = modalAddonIds.has(addon.id);
                          return (
                            <button
                              key={addon.id}
                              type="button"
                              className={`${styles.modalAddonChip} ${isActive ? styles.modalAddonChipActive : ''}`}
                              onClick={() => {
                                setModalAddonIds(prev => {
                                  const next = new Set(prev);
                                  if (next.has(addon.id)) next.delete(addon.id);
                                  else next.add(addon.id);
                                  return next;
                                });
                              }}
                            >
                              {isActive && (
                                <span
                                  className={styles.modalChipBadge}
                                  aria-hidden="true"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="27"
                                    height="27"
                                    viewBox="0 0 27 27"
                                    fill="none"
                                  >
                                    <circle cx="13.5" cy="13.5" r="13.5" />
                                    <path d="M13.75 4C11.8216 4 9.93657 4.57183 8.33319 5.64317C6.72982 6.71451 5.48013 8.23726 4.74218 10.0188C4.00422 11.8004 3.81114 13.7608 4.18735 15.6521C4.56355 17.5434 5.49215 19.2807 6.85571 20.6443C8.21928 22.0079 9.95656 22.9365 11.8479 23.3127C13.7392 23.6889 15.6996 23.4958 17.4812 22.7578C19.2627 22.0199 20.7855 20.7702 21.8568 19.1668C22.9282 17.5634 23.5 15.6784 23.5 13.75C23.4973 11.165 22.4692 8.68661 20.6413 6.85872C18.8134 5.03084 16.335 4.00273 13.75 4ZM18.0306 12.0306L12.7806 17.2806C12.711 17.3504 12.6283 17.4057 12.5372 17.4434C12.4462 17.4812 12.3486 17.5006 12.25 17.5006C12.1514 17.5006 12.0538 17.4812 11.9628 17.4434C11.8718 17.4057 11.789 17.3504 11.7194 17.2806L9.46938 15.0306C9.32865 14.8899 9.24959 14.699 9.24959 14.5C9.24959 14.301 9.32865 14.1101 9.46938 13.9694C9.61011 13.8286 9.80098 13.7496 10 13.7496C10.199 13.7496 10.3899 13.8286 10.5306 13.9694L12.25 15.6897L16.9694 10.9694C17.0391 10.8997 17.1218 10.8444 17.2128 10.8067C17.3039 10.769 17.4015 10.7496 17.5 10.7496C17.5986 10.7496 17.6961 10.769 17.7872 10.8067C17.8782 10.8444 17.9609 10.8997 18.0306 10.9694C18.1003 11.0391 18.1556 11.1218 18.1933 11.2128C18.231 11.3039 18.2504 11.4015 18.2504 11.5C18.2504 11.5985 18.231 11.6961 18.1933 11.7872C18.1556 11.8782 18.1003 11.9609 18.0306 12.0306Z" />
                                  </svg>
                                </span>
                              )}
                              {addon.name}
                              {(() => {
                                const pt = addon.pricingType;
                                if (pt === 'per_hour') {
                                  const rate = addon.pricePerUnit;
                                  return rate != null ? <span className={styles.modalChipPrice}> {formatCurrency(rate)}/hr</span> : null;
                                }
                                if (pt === 'per_room') {
                                  const rate = addon.initialPrice;
                                  return rate != null ? <span className={styles.modalChipPrice}> from {formatCurrency(rate)}</span> : null;
                                }
                                if (pt === 'per_sqft') {
                                  const rate = addon.pricePerUnit;
                                  return rate != null ? <span className={styles.modalChipPrice}> {formatCurrency(rate)}/sq ft</span> : null;
                                }
                                if (pt === 'per_acre') {
                                  const rate = addon.pricePerUnit;
                                  return rate != null ? <span className={styles.modalChipPrice}> {formatCurrency(rate)}/acre</span> : null;
                                }
                                if (pt === 'per_linear_foot') {
                                  const rate = addon.pricePerUnit;
                                  return rate != null ? <span className={styles.modalChipPrice}> {formatCurrency(rate)}/linear ft</span> : null;
                                }
                                return addon.initialPrice != null && addon.initialPrice > 0
                                  ? <span className={styles.modalChipPrice}> +{formatCurrency(addon.initialPrice)}</span>
                                  : null;
                              })()}
                            </button>
                          );
                        })}
                      </div>
                      {/* Quantity inputs for selected per-unit additional add-ons */}
                      {modalAdditionalAddons
                        .filter(a => modalAddonIds.has(a.id) && a.pricingType !== 'flat')
                        .map(addon => {
                          const pt = addon.pricingType;
                          const label =
                            pt === 'per_hour' ? 'Hours' :
                            pt === 'per_room' ? 'Rooms' :
                            pt === 'per_sqft' ? 'Square Feet' :
                            pt === 'per_acre' ? 'Acres' :
                            pt === 'per_linear_foot' ? 'Linear Feet' : 'Units';
                          return (
                            <div key={addon.id} className={styles.addonQuantityRow}>
                              <label className={styles.addonQuantityLabel}>
                                {addon.name} — {label}:
                              </label>
                              <input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step={pt === 'per_hour' ? '0.5' : '1'}
                                className={styles.textInput}
                                value={modalAddonQuantities[addon.id] ?? ''}
                                onChange={e => {
                                  const v = parseFloat(e.target.value);
                                  setModalAddonQuantities(prev => ({
                                    ...prev,
                                    [addon.id]: Number.isFinite(v) && v >= 0 ? v : 0,
                                  }));
                                }}
                                placeholder={pt === 'per_hour' ? '0.0' : '1'}
                              />
                              {(() => {
                                const qty = modalAddonQuantities[addon.id] ?? 0;
                                if (!qty) return null;
                                if (pt === 'per_room') {
                                  const first = addon.initialPrice ?? 0;
                                  const additional = addon.additionalUnitPrice ?? 0;
                                  const total = qty <= 0 ? 0 : first + Math.max(0, qty - 1) * additional;
                                  const min = addon.minimumPrice;
                                  const final = min != null ? Math.max(total, min) : total;
                                  return <span className={styles.pricingHint}>= {formatCurrency(final)}</span>;
                                }
                                const rate = addon.pricePerUnit ?? 0;
                                const raw = qty * rate;
                                const min = addon.minimumPrice;
                                const final = min != null ? Math.max(raw, min) : raw;
                                return <span className={styles.pricingHint}>{qty} × {formatCurrency(rate)} = {formatCurrency(final)}</span>;
                              })()}
                            </div>
                          );
                        })
                      }
                    </div>
                  )}

                  {/* Recommended products */}
                  {modalLinkedProducts.length > 0 && (
                    <>
                      <div className={styles.modalSection}>
                        <p className={styles.modalSectionTitle}>
                          Recommended Products
                        </p>
                        <div className={styles.modalProductList}>
                          {modalLinkedProducts.map(product => {
                            const qty = modalProductQtys[product.id] ?? 0;
                            const total = qty * product.unit_price;
                            return (
                              <div
                                key={product.id}
                                className={styles.modalProductRow}
                              >
                                <span
                                  className={`${styles.modalProductName}${qty > 0 ? ` ${styles.modalProductNameActive}` : ''}`}
                                >
                                  {product.product_name}
                                </span>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  step="1"
                                  className={`${styles.modalProductQtyInput}${qty > 0 ? ` ${styles.modalProductQtyInputActive}` : ''}`}
                                  value={qty === 0 ? '' : qty}
                                  onChange={e => {
                                    const v = parseInt(e.target.value, 10);
                                    setModalProductQtys(prev => ({
                                      ...prev,
                                      [product.id]:
                                        Number.isFinite(v) && v >= 0 ? v : 0,
                                    }));
                                  }}
                                  placeholder="0"
                                />
                                <span
                                  className={`${styles.modalProductUnit}${qty > 0 ? ` ${styles.modalProductUnitActive}` : ''}`}
                                >
                                  {formatCurrency(product.unit_price)}
                                  <span className={styles.modalProductUnitType}>
                                    /{product.unit_type}
                                  </span>
                                </span>
                                <span
                                  className={`${styles.modalProductRecurring}${qty > 0 ? ` ${styles.modalProductRecurringActive}` : ''}`}
                                >
                                  {product.recurring_price > 0 ? (
                                    <>
                                      {formatCurrency(product.recurring_price)}
                                      <span
                                        className={
                                          styles.modalProductRecurringLabel
                                        }
                                      >
                                        /Per Service
                                      </span>
                                    </>
                                  ) : (
                                    <span
                                      className={
                                        styles.modalProductRecurringDash
                                      }
                                    >
                                      —
                                    </span>
                                  )}
                                </span>
                                <span
                                  className={`${styles.modalProductTotal}${qty > 0 ? ` ${styles.modalProductTotalActive}` : ''}`}
                                >
                                  {formatCurrency(total)}
                                </span>
                                {qty > 0 ? (
                                  <button
                                    type="button"
                                    className={styles.modalProductTrash}
                                    onClick={() =>
                                      setModalProductQtys(prev => ({
                                        ...prev,
                                        [product.id]: 0,
                                      }))
                                    }
                                    aria-label="Remove product"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                ) : (
                                  <div
                                    className={
                                      styles.modalProductTrashPlaceholder
                                    }
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Save & Close — only shown after a service is selected */}
              {modalServiceId && (
                <div
                  className={`${styles.modalFooter} ${modalBottomShadow ? styles.modalFooterShadow : ''}`}
                >
                  <button
                    type="button"
                    className={styles.modalSaveBtn}
                    onClick={handleModalSave}
                  >
                    Save &amp; Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
