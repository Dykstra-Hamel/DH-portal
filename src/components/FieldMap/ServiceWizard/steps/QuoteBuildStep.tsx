'use client';

import { useEffect, useId, useState } from 'react';
import { CircleOff } from 'lucide-react';
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
}

export interface PlottedPest {
  id: string;
  label: string;
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
  if (item.coveredPestLabels.length > 0) return item.coveredPestLabels.join(', ') + ' Treatment';
  return 'Custom Service';
}

export function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
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
  const totalInitial = lineItems.reduce((sum, item) => sum + (item.initialCost ?? 0), 0);
  const totalRecurring = lineItems.reduce((sum, item) => sum + (item.recurringCost ?? 0), 0);

  const freqMap = new Map<string, number>();
  for (const item of lineItems) {
    if ((item.recurringCost ?? 0) === 0) continue;
    const key = item.frequency ?? 'unspecified';
    freqMap.set(key, (freqMap.get(key) ?? 0) + (item.recurringCost ?? 0));
  }
  const recurringByFrequency = Array.from(freqMap.entries()).map(([frequency, total]) => ({ frequency, total }));

  return { totalInitial, totalRecurring, recurringByFrequency };
}

function parseCost(raw: string): number | null {
  const val = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(val) ? val : null;
}

// ── Props ──────────────────────────────────────────────────────────────────

interface QuoteBuildStepProps {
  lineItems: QuoteLineItem[];
  onChange: (items: QuoteLineItem[]) => void;
  plottedPests: PlottedPest[];
  companyId: string;
}

// ── Line item card ─────────────────────────────────────────────────────────

interface LineItemCardProps {
  item: QuoteLineItem;
  index: number;
  baseId: string;
  catalog: CatalogItem[];
  plottedPests: PlottedPest[];
  onUpdate: (patch: Partial<QuoteLineItem>) => void;
  onRemove: () => void;
}

function LineItemCard({ item, index, baseId, catalog, plottedPests, onUpdate, onRemove }: LineItemCardProps) {
  const plans = catalog.filter(c => c.kind === 'plan');
  const addons = catalog.filter(c => c.kind === 'addon');
  const bundles = catalog.filter(c => c.kind === 'bundle');

  function selectCatalogItem(ci: CatalogItem) {
    const isOneTime = ci.planCategory === 'one-time' || ci.billingFrequency === 'one-time';
    onUpdate({
      catalogItemId: ci.id,
      catalogItemKind: ci.kind,
      catalogItemName: ci.name,
      initialCost: ci.initialPrice,
      recurringCost: ci.recurringPrice,
      frequency: isOneTime ? 'one-time' : (ci.billingFrequency ?? 'monthly'),
      coveredPestIds: ci.pestCoverageIds,
      coveredPestLabels: [],
    });
  }

  function handleCatalogSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) {
      onUpdate({ catalogItemId: undefined, catalogItemKind: undefined, catalogItemName: undefined, coveredPestIds: [], coveredPestLabels: [] });
      return;
    }
    const ci = catalog.find(c => c.id === id);
    if (ci) selectCatalogItem(ci);
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
        <button type="button" className={styles.removeBtn} onClick={onRemove}>Remove</button>
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
          onClick={() => onUpdate({ type: 'custom', catalogItemId: undefined, catalogItemKind: undefined, catalogItemName: undefined, coveredPestIds: [], coveredPestLabels: [] })}
        >
          Custom
        </button>
      </div>

      {/* Plans & Addons content */}
      {item.type === 'plan-addon' && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor={`${baseId}-catalog-${item.id}`}>
            Select Service
          </label>
          <select
            id={`${baseId}-catalog-${item.id}`}
            className={styles.selectInput}
            value={item.catalogItemId ?? ''}
            onChange={handleCatalogSelect}
          >
            <option value="">— Select —</option>
            {plans.length > 0 && (
              <optgroup label="Service Plans">
                {plans.map(ci => (
                  <option key={ci.id} value={ci.id}>{ci.name}</option>
                ))}
              </optgroup>
            )}
            {addons.length > 0 && (
              <optgroup label="Add-Ons">
                {addons.map(ci => (
                  <option key={ci.id} value={ci.id}>{ci.name}</option>
                ))}
              </optgroup>
            )}
            {bundles.length > 0 && (
              <optgroup label="Bundles">
                {bundles.map(ci => (
                  <option key={ci.id} value={ci.id}>{ci.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      )}

      {/* Custom content — name + pest checkboxes */}
      {item.type === 'custom' && (
        <>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor={`${baseId}-name-${item.id}`}>
              Service Name <span className={styles.fieldRequired}>*</span>
            </label>
            <div className={styles.nameInputWrap}>
              <input
                id={`${baseId}-name-${item.id}`}
                type="text"
                className={styles.nameInput}
                value={item.customName ?? ''}
                onChange={e => onUpdate({ customName: e.target.value.slice(0, 60) })}
                placeholder="e.g. Rodent Exclusion"
                maxLength={60}
                required
              />
              <span className={styles.charCount}>{(item.customName ?? '').length}/60</span>
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

      {/* Pricing */}
      <div className={styles.pricingRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor={`${baseId}-init-${item.id}`}>
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
              onChange={e => onUpdate({ initialCost: parseCost(e.target.value) })}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor={`${baseId}-rec-${item.id}`}>
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
              onChange={e => onUpdate({ recurringCost: parseCost(e.target.value) })}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor={`${baseId}-freq-${item.id}`}>
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
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function QuoteBuildStep({ lineItems, onChange, plottedPests, companyId }: QuoteBuildStepProps) {
  const baseId = useId();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  useEffect(() => {
    if (!companyId) return;

    Promise.all([
      fetch(`/api/service-plans/${companyId}`).then(r => r.ok ? r.json() : { plans: [] }),
      fetch(`/api/add-on-services/${companyId}`).then(r => r.ok ? r.json() : { data: [] }),
      fetch(`/api/admin/bundle-plans?companyId=${companyId}`).then(r => r.ok ? r.json() : { data: [] }),
    ]).then(([plansRes, addonsRes, bundlesRes]) => {
      const plans: CatalogItem[] = (plansRes.plans ?? []).map((p: any) => ({
        id: p.id,
        name: p.plan_name,
        kind: 'plan' as const,
        initialPrice: p.initial_price ?? null,
        recurringPrice: p.recurring_price ?? null,
        billingFrequency: p.billing_frequency ?? null,
        planCategory: p.plan_category ?? null,
        pestCoverageIds: (p.pest_coverage ?? []).map((c: any) => c.pest_id as string),
      }));

      // Add-ons don't have a pest_coverage table — coverage is always empty
      const addons: CatalogItem[] = (addonsRes.data ?? addonsRes.addons ?? []).map((a: any) => ({
        id: a.id,
        name: a.addon_name,
        kind: 'addon' as const,
        initialPrice: a.initial_price ?? null,
        recurringPrice: a.recurring_price ?? null,
        billingFrequency: a.billing_frequency ?? null,
        planCategory: null,
        pestCoverageIds: [],
      }));

      // Bundles reference plan IDs in bundled_service_plans JSONB — resolve coverage
      // from the plans we already fetched above
      const planCoverageMap = new Map<string, string[]>(
        plans.map(p => [p.id, p.pestCoverageIds])
      );
      const bundles: CatalogItem[] = (bundlesRes.data ?? bundlesRes.bundles ?? []).map((b: any) => {
        const bundledIds: string[] = Array.isArray(b.bundled_service_plans)
          ? b.bundled_service_plans.filter((x: any) => typeof x === 'string')
          : [];
        const pestIds = [...new Set(bundledIds.flatMap(id => planCoverageMap.get(id) ?? []))];
        return {
          id: b.id,
          name: b.bundle_name,
          kind: 'bundle' as const,
          initialPrice: b.custom_initial_price ?? null,
          recurringPrice: b.custom_recurring_price ?? null,
          billingFrequency: b.billing_frequency ?? null,
          planCategory: null,
          pestCoverageIds: pestIds,
        };
      });

      setCatalog([...plans, ...addons, ...bundles]);
    }).catch(() => {});
  }, [companyId]);

  // All covered pest IDs: plan-addon items carry the plan's pest_coverage IDs
  // (written at selection time), custom items carry manually-checked IDs.
  const coveredPestIds = new Set(lineItems.flatMap(i => i.coveredPestIds));

  const { totalInitial, totalRecurring, recurringByFrequency } = getQuoteTotals(lineItems);

  function addItem() {
    onChange([...lineItems, makeLineItem()]);
  }

  function updateItem(id: string, patch: Partial<QuoteLineItem>) {
    onChange(lineItems.map(item => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    onChange(lineItems.filter(item => item.id !== id));
  }

  return (
    <div className={styles.root}>
      {/* Line items */}
      {lineItems.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No line items yet</p>
          <p className={styles.emptyHint}>Add a line item to start building the quote.</p>
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
              plottedPests={plottedPests}
              onUpdate={patch => updateItem(item.id, patch)}
              onRemove={() => removeItem(item.id)}
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
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                      <path d="M6.5 2L3 5.5L1.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
            <span className={styles.totalsValue}>{formatCurrency(totalInitial)}</span>
          </div>
          {recurringByFrequency.map(({ frequency, total }) => (
            <div key={frequency} className={styles.totalsRow}>
              <span className={styles.totalsLabel}>Recurring / {frequency}</span>
              <span className={styles.totalsValue}>{formatCurrency(total)}</span>
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
