'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lead } from '@/types/lead';
import { Quote } from '@/types/quote';
import {
  QuoteBuildStep,
  type QuoteLineItem as BuilderLineItem,
  type PlottedPest,
  type AvailableDiscount,
} from '@/components/FieldMap/ServiceWizard/steps/QuoteBuildStep';
import type { SelectedPest } from '../LeadPestPicker';
import styles from './LeadQuoteBuilder.module.scss';

interface LeadQuoteBuilderProps {
  lead: Lead;
  selectedPests: SelectedPest[];
  quote: Quote | null;
  isQuoteLoading?: boolean;
  broadcastQuoteUpdate: (quote: Quote) => Promise<void>;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
  onEditPests?: () => void;
  onReady?: () => void;
  onLineItemsSaved?: (itemCount: number) => void;
}

interface DbLineItem {
  id: string;
  service_plan_id?: string | null;
  addon_service_id?: string | null;
  bundle_plan_id?: string | null;
  product_id?: string | null;
  plan_name: string;
  initial_price: number;
  recurring_price: number;
  billing_frequency: string;
  is_optional: boolean;
  is_selected: boolean;
  is_recommended?: boolean | null;
  display_order: number;
  parent_line_item_id?: string | null;
  quantity?: number | null;
}

function dbItemToBuilderItem(db: DbLineItem): BuilderLineItem {
  let kind: BuilderLineItem['catalogItemKind'] | undefined;
  let id: string | undefined;
  if (db.service_plan_id) {
    kind = 'plan';
    id = db.service_plan_id;
  } else if (db.addon_service_id) {
    kind = 'addon';
    id = db.addon_service_id;
  } else if (db.bundle_plan_id) {
    kind = 'bundle';
    id = db.bundle_plan_id;
  } else if (db.product_id) {
    kind = 'product';
    id = db.product_id;
  }

  // Child specialty-line rows carry the parent's service_plan_id in the DB,
  // so the kind derivation above wrongly classifies them as 'plan'.
  // Correct by detecting the parent relationship.
  if (db.parent_line_item_id && kind === 'plan') {
    kind = 'specialty-line';
    id = undefined; // parent's service_plan_id is not the specialty line's own ID;
                    // clearing it lets openEditModal fall through to the name-based lookup
  }

  const isPlanAddon = kind != null;
  return {
    id: db.id,
    type: isPlanAddon ? 'plan-addon' : 'custom',
    catalogItemKind: kind,
    catalogItemId: id,
    catalogItemName: db.plan_name,
    customName: isPlanAddon ? undefined : db.plan_name,
    coveredPestIds: [],
    coveredPestLabels: [],
    initialCost: db.initial_price,
    recurringCost: db.recurring_price,
    frequency: db.billing_frequency,
    isPrimary: kind === 'plan' || kind === 'bundle',
    quantity: db.quantity ?? null,
    isRecommended: db.is_recommended ?? undefined,
    isSelected: db.is_selected,
    parentLineItemId: db.parent_line_item_id ?? null,
  };
}

export function LeadQuoteBuilder({
  lead,
  selectedPests,
  quote,
  isQuoteLoading = false,
  broadcastQuoteUpdate,
  onShowToast,
  onEditPests,
  onReady,
  onLineItemsSaved,
}: LeadQuoteBuilderProps) {
  const [lineItems, setLineItems] = useState<BuilderLineItem[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<AvailableDiscount | null>(null);
  const [isBuilderReady, setIsBuilderReady] = useState(false);
  const hydratedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lineItemsRef = useRef<BuilderLineItem[]>([]);
  const onReadyRef = useRef(onReady);
  const hasFiredReadyRef = useRef(false);
  const onShowToastRef = useRef(onShowToast);
  const onLineItemsSavedRef = useRef(onLineItemsSaved);
  useEffect(() => {
    onReadyRef.current = onReady;
    onShowToastRef.current = onShowToast;
    onLineItemsSavedRef.current = onLineItemsSaved;
    lineItemsRef.current = lineItems;
  });

  const isLoading = isQuoteLoading || !isBuilderReady;

  useEffect(() => {
    if (!isLoading && !hasFiredReadyRef.current) {
      hasFiredReadyRef.current = true;
      onReadyRef.current?.();
    }
  }, [isLoading]);

  const handleBuilderReady = useCallback(() => setIsBuilderReady(true), []);

  // Hydrate once from the initial quote fetch. Skip if the user has already
  // made edits (late-arriving quote shouldn't overwrite in-progress work).
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!quote) return;
    hydratedRef.current = true;
    if (quote.line_items && quote.line_items.length > 0) {
      const dbItems = quote.line_items as unknown as DbLineItem[];
      const ordered = [...dbItems].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
      );
      setLineItems(ordered.map(dbItemToBuilderItem));
    }
    if (quote.applied_discount) {
      setAppliedDiscount(quote.applied_discount as unknown as AvailableDiscount);
    }
  }, [quote]);

  const plottedPests: PlottedPest[] = useMemo(
    () => selectedPests.map(p => ({ id: p.id, label: p.label })),
    [selectedPests]
  );

  const pestIconMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of selectedPests) {
      if (p.iconSvg) map[p.id] = p.iconSvg;
    }
    return map;
  }, [selectedPests]);

  const scheduleSave = useCallback(
    (items: BuilderLineItem[], discount: AvailableDiscount | null, delayMs: number) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/field-map/save-quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: lead.id,
              companyId: lead.company_id,
              quoteLineItems: items,
              discountTarget: discount?.applies_to_price ?? 'initial',
              discountAmount: discount?.discount_value ?? null,
              discountType:
                discount?.discount_type === 'percentage' ? '%' : '$',
              discountId: discount?.id ?? null,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Save failed');

          // Re-fetch the quote so broadcast matches authoritative state
          const qRes = await fetch(`/api/leads/${lead.id}/quote`);
          const qData = await qRes.json();
          if (qData.success && qData.data) {
            await broadcastQuoteUpdate(qData.data);
          }

          onLineItemsSavedRef.current?.(items.length);
        } catch (err) {
          console.error('Failed to save quote line items', err);
          onShowToastRef.current?.('Failed to save quote changes', 'error');
        }
      }, delayMs);
    },
    [lead.id, lead.company_id, broadcastQuoteUpdate]
  );

  const handleChange = useCallback(
    (items: BuilderLineItem[]) => {
      hydratedRef.current = true;
      setLineItems(items);
      scheduleSave(items, appliedDiscount, 1500);
    },
    [appliedDiscount, scheduleSave]
  );

  const handleDiscountChange = useCallback(
    (discount: AvailableDiscount | null) => {
      hydratedRef.current = true;
      setAppliedDiscount(discount);
      scheduleSave(lineItemsRef.current, discount, 300);
    },
    [scheduleSave]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return (
    <div className={styles.root}>
      {isLoading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} aria-hidden="true" />
          <span className={styles.loadingText}>Loading quote…</span>
        </div>
      )}
      <div style={{ display: isLoading ? 'none' : 'block' }}>
        <QuoteBuildStep
          lineItems={lineItems}
          onChange={handleChange}
          plottedPests={plottedPests}
          companyId={lead.company_id}
          pestIconMap={pestIconMap}
          selectedDiscount={appliedDiscount}
          onDiscountChange={handleDiscountChange}
          onEditPests={onEditPests}
          pricingReadOnly
          onReady={handleBuilderReady}
        />
      </div>
    </div>
  );
}
