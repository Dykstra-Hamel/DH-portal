'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { ChevronDown, CircleOff } from 'lucide-react';
import { MAP_ELEMENT_STAMP_OPTIONS } from '@/components/FieldMap/MapPlot/types';
import { SearchableSelect } from '@/components/Common/SearchableSelect/SearchableSelect';
import styles from './QuoteBuildStep.module.scss';

// ── Types ──────────────────────────────────────────────────────────────────

export interface QuoteLineItem {
  id: string;
  type: 'plan-addon' | 'custom';
  // Catalog item (plan-addon type)
  catalogItemKind?: 'plan' | 'addon' | 'bundle';
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
}

export interface PlottedPest {
  id: string;
  label: string;
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
  planCategory: string | null;
  pestCoverageIds: string[];
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
  const totalInitial = lineItems.reduce(
    (sum, item) => sum + (item.initialCost ?? 0),
    0
  );
  const totalRecurring = lineItems.reduce(
    (sum, item) => sum + (item.recurringCost ?? 0),
    0
  );

  const freqMap = new Map<string, number>();
  for (const item of lineItems) {
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

// ── Props ──────────────────────────────────────────────────────────────────

interface MapMeasurements {
  byOutline: Array<{
    id: string;
    type: string;
    sqft: number;
    linearFt: number;
  }>;
}

interface QuoteBuildStepProps {
  lineItems: QuoteLineItem[];
  onChange: (items: QuoteLineItem[]) => void;
  plottedPests: PlottedPest[];
  companyId: string;
  mapMeasurements?: MapMeasurements;
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
  onToggleAddon: (addon: CatalogItem, selected: boolean, variantLabel?: string) => void;
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
  const serviceCatalog = useMemo(() => [...plans, ...bundles], [plans, bundles]);

  const catalogOptions = useMemo(() => {
    const filtered = pestFilter
      ? serviceCatalog.filter(ci => ci.pestCoverageIds.includes(pestFilter))
      : serviceCatalog;
    const opts = [{ value: '', label: '— Select —' }];
    filtered.forEach(ci => opts.push({ value: ci.id, label: ci.name }));
    return opts;
  }, [serviceCatalog, pestFilter]);

  const isServiceSelected = !!item.catalogItemId && item.catalogItemKind !== 'addon';

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
      variant?.billing_frequency ?? selectedCatalogItem.billingFrequency ?? 'monthly';
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
      ? selectedCatalogItem.variants.find(v => v.label === item.selectedVariantLabel)
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
      const rate = selectedCatalogItem.initialPrice ?? 0;
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
    onUpdate({
      catalogItemId: ci.id,
      catalogItemKind: ci.kind,
      catalogItemName: ci.name,
      isPrimary: ci.kind !== 'addon', // plans/bundles → Primary, addons → Secondary
      initialCost: ci.initialPrice,
      recurringCost: ci.recurringPrice,
      frequency: isOneTime ? 'one-time' : (ci.billingFrequency ?? 'monthly'),
      coveredPestIds: ci.pestCoverageIds,
      coveredPestLabels: [],
      // Reset advanced pricing state on new selection
      selectedVariantLabel: null,
      quantity: null,
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
          <label className={styles.fieldLabel}>
            Select Service
          </label>
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
                  onClick={() => setPestFilter(prev => prev === pest.id ? null : pest.id)}
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

      {/* Primary / Secondary toggle switch */}
      <div className={styles.sectionToggleWrap}>
        <span className={styles.sectionToggleText}>
          {item.isPrimary !== false ? 'Primary Service' : 'Secondary Service'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={item.isPrimary !== false}
          aria-label="Toggle primary or secondary section"
          className={`${styles.sectionToggleSwitch} ${item.isPrimary !== false ? styles.sectionToggleSwitchOn : ''}`}
          onClick={() => onUpdate({ isPrimary: item.isPrimary === false })}
        />
      </div>

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
          Frequency
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
                const displayInitial = activeVariant?.initial_price ?? addon.initialPrice;
                const displayRecurring = activeVariant?.recurring_price ?? addon.recurringPrice;
                const displayFreq = activeVariant?.billing_frequency ?? addon.billingFrequency;

                return (
                  <div key={addon.id} className={styles.addonPickerRow}>
                    <label className={styles.addonPickerItem}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleAddon(addon, !isChecked, selectedVariant || undefined)}
                        className={styles.addonPickerCheckbox}
                      />
                      <span className={styles.addonPickerName}>{addon.name}</span>
                      {!hasAddonVariants && ((displayInitial ?? 0) > 0 || (displayRecurring ?? 0) > 0) && (
                        <span className={styles.addonPickerPrice}>
                          {(displayRecurring ?? 0) > 0
                            ? `$${displayRecurring!.toFixed(0)}/${displayFreq ?? 'mo'}`
                            : `$${displayInitial!.toFixed(0)}`}
                        </span>
                      )}
                      {hasAddonVariants && selectedVariant && ((displayInitial ?? 0) > 0 || (displayRecurring ?? 0) > 0) && (
                        <span className={styles.addonPickerPrice}>
                          {(displayRecurring ?? 0) > 0
                            ? `$${displayRecurring!.toFixed(0)}/${displayFreq ?? 'mo'}`
                            : `$${displayInitial!.toFixed(0)}`}
                        </span>
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
}: QuoteBuildStepProps) {
  const baseId = useId();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

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
    ])
      .then(([plansRes, addonsRes, bundlesRes]) => {
        const plans: CatalogItem[] = (plansRes.plans ?? []).map((p: any) => ({
          id: p.id,
          name: p.plan_name,
          kind: 'plan' as const,
          initialPrice: p.initial_price ?? null,
          recurringPrice: p.recurring_price ?? null,
          billingFrequency: p.billing_frequency ?? null,
          planCategory: p.plan_category ?? null,
          pestCoverageIds: (p.pest_coverage ?? []).map(
            (c: any) => c.pest_id as string
          ),
          minimumPrice: p.minimum_price ?? null,
          pricingType: 'flat' as const,
          pricePerUnit: p.price_per_unit ?? null,
          pricingUnit: p.pricing_unit ?? null,
          additionalUnitPrice: null,
          variants: Array.isArray(p.variants) ? p.variants : [],
          percentagePricing: null,
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
          planCategory: null,
          pestCoverageIds: [],
          minimumPrice: a.minimum_price ?? null,
          pricingType: (a.pricing_type ?? 'flat') as CatalogItem['pricingType'],
          pricePerUnit: a.price_per_unit ?? null,
          pricingUnit: null,
          additionalUnitPrice: a.additional_unit_price ?? null,
          variants: Array.isArray(a.variants) ? a.variants : [],
          percentagePricing: a.percentage_pricing ?? null,
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
            planCategory: null,
            pestCoverageIds: pestIds,
            minimumPrice: null,
            pricingType: 'flat' as const,
            pricePerUnit: null,
            pricingUnit: null,
            additionalUnitPrice: null,
            variants: [],
            percentagePricing: null,
          };
        });

        setCatalog([...plans, ...addons, ...bundles]);
      })
      .catch(() => {});
  }, [companyId]);

  // All covered pest IDs: plan-addon items carry the plan's pest_coverage IDs
  // (written at selection time), custom items carry manually-checked IDs.
  const coveredPestIds = new Set(lineItems.flatMap(i => i.coveredPestIds));

  const { totalInitial, totalRecurring, recurringByFrequency } =
    getQuoteTotals(lineItems);

  const addonCatalog = useMemo(
    () => catalog.filter(c => c.kind === 'addon'),
    [catalog]
  );

  const selectedAddonIds = useMemo(
    () => new Set(lineItems.filter(i => i.catalogItemKind === 'addon').map(i => i.catalogItemId!)),
    [lineItems]
  );

  // Derive addon variant selections from line items so they persist across step navigation
  const addonVariantSelections = useMemo(() => {
    const map: Record<string, string> = {};
    lineItems.forEach(item => {
      if (item.catalogItemKind === 'addon' && item.catalogItemId && item.selectedVariantLabel) {
        map[item.catalogItemId] = item.selectedVariantLabel;
      }
    });
    return map;
  }, [lineItems]);

  function handleAddonVariantChange(addonId: string, variantLabel: string) {
    const addonItem = catalog.find(c => c.id === addonId);
    if (!addonItem) return;
    // If this addon is already selected as a line item, update it
    if (selectedAddonIds.has(addonId)) {
      updateAddonVariant(addonItem, variantLabel);
    }
  }

  function addItem() {
    onChange([...lineItems, makeLineItem()]);
  }

  function updateItem(id: string, patch: Partial<QuoteLineItem>) {
    onChange(
      lineItems.map(item => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function removeItem(id: string) {
    onChange(lineItems.filter(item => item.id !== id));
  }

  function toggleAddon(addon: CatalogItem, selected: boolean, variantLabel?: string) {
    if (selected) {
      const variant = variantLabel
        ? addon.variants.find(v => v.label === variantLabel)
        : null;
      const resolvedInitial =
        variant?.initial_price != null ? variant.initial_price : addon.initialPrice;
      const resolvedRecurring =
        variant?.recurring_price != null ? variant.recurring_price : addon.recurringPrice;
      const resolvedFrequency =
        variant?.billing_frequency ?? addon.billingFrequency ?? 'monthly';
      const isOneTime = resolvedFrequency === 'one-time';
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
        percentageJobCost: null,
        percentagePricingNote: null,
        is_custom_priced: false,
        custom_initial_price: null,
      };
      onChange([...lineItems, newItem]);
    } else {
      onChange(lineItems.filter(i => i.catalogItemId !== addon.id));
    }
  }

  function updateAddonVariant(addon: CatalogItem, variantLabel: string) {
    const variant = variantLabel
      ? addon.variants.find(v => v.label === variantLabel)
      : null;
    const resolvedInitial =
      variant?.initial_price != null ? variant.initial_price : addon.initialPrice;
    const resolvedRecurring =
      variant?.recurring_price != null ? variant.recurring_price : addon.recurringPrice;
    const resolvedFrequency =
      variant?.billing_frequency ?? addon.billingFrequency ?? 'monthly';
    onChange(
      lineItems.map(i =>
        i.catalogItemId === addon.id
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

  return (
    <div className={styles.root}>
      {/* Line items */}
      {lineItems.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No line items yet</p>
          <p className={styles.emptyHint}>
            Add a line item to start building the quote.
          </p>
        </div>
      ) : (
        <div className={styles.lineItemsList}>
          {lineItems.map((item, index) => (
            <LineItemCard
              key={item.id}
              item={item}
              index={index}
              baseId={baseId}
              catalog={catalog}
              addonCatalog={addonCatalog}
              selectedAddonIds={selectedAddonIds}
              addonVariantSelections={addonVariantSelections}
              plottedPests={plottedPests}
              mapMeasurements={mapMeasurements}
              onUpdate={patch => updateItem(item.id, patch)}
              onRemove={() => removeItem(item.id)}
              onToggleAddon={toggleAddon}
              onUpdateAddon={updateAddonVariant}
              onAddonVariantChange={handleAddonVariantChange}
            />
          ))}
        </div>
      )}

      {/* Add button */}
      <button type="button" className={styles.addBtn} onClick={addItem}>
        <span className={styles.addPlus}>+</span>
        Add Line Item
      </button>

      {/* Pest Concern Coverage */}
      {plottedPests.length > 0 && lineItems.length > 0 && (
        <div className={styles.coverageSection}>
          <span className={styles.sectionLabel}>Pest Concern Coverage</span>
          <div className={styles.pestTags}>
            {plottedPests.map(pest => {
              const covered = coveredPestIds.has(pest.id);
              return (
                <span
                  key={pest.id}
                  className={`${styles.pestTag} ${covered ? styles.pestTagCovered : styles.pestTagUncovered}`}
                >
                  {covered ? (
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6.5 2L3 5.5L1.5 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <CircleOff size={8} aria-hidden="true" />
                  )}
                  {pest.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Totals */}
      {lineItems.length > 0 && (
        <div className={styles.totalsCard}>
          <span className={styles.totalsTitle}>Quote Total</span>
          <div className={styles.totalsRow}>
            <span className={styles.totalsLabel}>Initial</span>
            <span className={styles.totalsValue}>
              {formatCurrency(totalInitial)}
            </span>
          </div>
          {recurringByFrequency.map(({ frequency, total }) => (
            <div key={frequency} className={styles.totalsRow}>
              <span className={styles.totalsLabel}>
                Recurring / {frequency}
              </span>
              <span className={styles.totalsValue}>
                {formatCurrency(total)}
              </span>
            </div>
          ))}
          {totalRecurring === 0 && totalInitial === 0 && (
            <div className={styles.totalsRow}>
              <span className={styles.totalsLabel}>Recurring</span>
              <span className={styles.totalsValue}>{formatCurrency(0)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
