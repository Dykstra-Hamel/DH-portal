'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { MapPlotData } from '@/components/FieldMap/MapPlot/types';
import type { MapPestStampType } from '@/components/FieldMap/MapPlot/types';
import { MapPlotCanvas } from '@/components/FieldMap/MapPlot/MapPlotCanvas/MapPlotCanvas';
import { MapStampGlyph } from '@/components/FieldMap/MapPlot/glyphs';
import VideoLightbox from '@/components/Quote/QuoteContent/VideoLightbox';
import type { QuoteLineItem, AvailableDiscount } from './QuoteBuildStep';
import type { ChecklistResponseGroup } from './SalesChecklistStep';
import {
  formatCurrency,
  formatLineItemLabel,
  getQuoteTotals,
  getPestStampType,
} from './QuoteBuildStep';
import qcStyles from '@/components/Quote/QuoteContent/quotecontent.module.scss';
import styles from './ReviewStep.module.scss';
import {
  TimeOption,
  DEFAULT_TIME_OPTIONS,
  getEnabledTimeOptions,
} from '@/lib/time-options';
import {
  toMonthlyEquivalent,
  calculateFeaturedPlanPrice,
} from '@/lib/pricing-calculations';
import type { CompanyPricingSettings } from '@/types/pricing';
import QuoteServicePanel from '@/components/Quote/QuoteServicePanel/QuoteServicePanel';

// ── FAQ item (same as PlanDetails) ────────────────────────────────────────

function FaqItem({ faq }: { faq: { question: string; answer: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`${qcStyles.faqItem} ${isOpen ? qcStyles.active : ''}`}>
      <div className={qcStyles.faqHeader} onClick={() => setIsOpen(!isOpen)}>
        <p className={qcStyles.faqQuestion}>{faq.question}</p>
        <span
          className={qcStyles.faqIcon}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9L12 15L18 9"
              stroke="#515151"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      <div
        className={qcStyles.faqContent}
        style={{ maxHeight: isOpen ? '500px' : '0' }}
      >
        <div className={qcStyles.faqAnswer}>
          <p>{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}

// ── Branding ───────────────────────────────────────────────────────────────

interface BrandingData {
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  alternative_color_1: string | null;
  font_color: string | null;
  font_primary_name: string | null;
  font_primary_url: string | null;
  font_secondary_name: string | null;
  font_secondary_url: string | null;
  company_name: string;
  company_phone: string | null;
  quote_terms: string | null;
  quote_accent_color_preference: string | null;
  time_options?: TimeOption[];
}

function injectFont(name: string | null, url: string | null) {
  if (!name || !url) return;
  const id = `fm-review-font-${name.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function abbreviateFrequency(frequency: string | null): string {
  const abbr: Record<string, string> = {
    monthly: 'mo',
    quarterly: 'qtr',
    'semi-annually': 'semi',
    'semi-annual': 'semi',
    annually: 'yr',
    annual: 'yr',
    'bi-monthly': '2mo',
    'bi-annually': '6mo',
    'one-time': 'once',
  };
  return frequency ? (abbr[frequency.toLowerCase()] ?? frequency) : 'mo';
}

// ── Featured plan (for "Additional Services We Offer" section) ─────────────

interface FeaturedPlan {
  id: string;
  plan_name: string;
  initial_price: number | null;
  recurring_price: number | null;
  billing_frequency: string | null;
  description: string | null;
  plan_description?: string | null;
  plan_features?: string[] | null;
  plan_image_url?: string | null;
  plan_video_url?: string | null;
  plan_terms?: string | null;
  // Pricing configuration fields (from service_plans table)
  pricing_type?: string | null;
  price_per_unit?: number | null;
  minimum_price?: number | null;
  yard_sqft_pricing?: any;
  home_size_pricing?: any;
  yard_size_pricing?: any;
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ReviewStepProps {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  address: string;
  pestTypes: string[];
  quoteLineItems: QuoteLineItem[];
  notes: string;
  mapPlotData: MapPlotData;
  inspectorName: string;
  inspectorAvatarUrl?: string | null;
  inspectorTitle?: string | null;
  inspectorPhone?: string | null;
  inspectorEmail?: string | null;
  companyPhone?: string | null;
  companyName: string;
  companyId: string;
  leadId: string | null;
  quoteId: string | null;
  pestIconMap: Record<string, string>;
  plottedPests: Array<{
    id: string;
    label: string;
    stampType: MapPestStampType;
  }>;
  appliedDiscount?: AvailableDiscount | null;
  quoteSubtotalInitial?: number | null;
  quoteTotalInitial?: number | null;
  checklistResponses?: ChecklistResponseGroup[];
  onBack: () => void;
  onAddLineItem?: (item: QuoteLineItem) => void;
}

type ActionState =
  | 'idle'
  | 'sending'
  | 'sent'
  | 'scheduling'
  | 'scheduled'
  | 'error';

export function ReviewStep({
  clientName,
  clientEmail,
  clientPhone,
  address,
  pestTypes,
  quoteLineItems,
  notes,
  mapPlotData,
  inspectorName,
  inspectorAvatarUrl,
  inspectorTitle,
  inspectorPhone,
  inspectorEmail,
  companyPhone,
  companyName,
  companyId,
  leadId,
  quoteId,
  pestIconMap,
  plottedPests,
  appliedDiscount,
  quoteSubtotalInitial,
  quoteTotalInitial,
  checklistResponses,
  onBack,
  onAddLineItem,
}: ReviewStepProps) {
  const router = useRouter();
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [sigHasContent, setSigHasContent] = useState(false);

  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [brandingLoaded, setBrandingLoaded] = useState(false);
  // catalogDetails maps catalogItemId → full plan/addon data from the API
  const [catalogDetails, setCatalogDetails] = useState<Record<string, any>>({});
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(() => {
    const first = quoteLineItems.find(
      i => i.catalogItemKind !== 'addon' && i.catalogItemKind !== 'product'
    );
    return first?.id ?? null;
  });
  const planCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const contentWrapperRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [activeFaqTab, setActiveFaqTab] = useState(0);
  const [videoLightboxUrl, setVideoLightboxUrl] = useState<string | null>(null);

  const [localNotes, setLocalNotes] = useState(notes);
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [enteredEmail, setEnteredEmail] = useState('');
  const [showSigModal, setShowSigModal] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const housePhoto = mapPlotData.housePhotos?.[0] ?? null;
  const [signedBy, setSignedBy] = useState(clientName || '');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState('');

  // Preferred day-of-week/time
  const [preferredDayOfWeek, setPreferredDayOfWeek] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  // Terms
  const [termsViewed, setTermsViewed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsNudge, setTermsNudge] = useState(false);
  const termsBodyRef = useRef<HTMLDivElement | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number | null>(null);
  // Initialise from DB-persisted isSelected when available; fall back to isRecommended heuristic for new in-memory items.
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    () =>
      new Set(
        quoteLineItems
          .filter(i => {
            // For DB-loaded items isSelected is set; for fresh in-memory items fall back to isRecommended heuristic
            return i.isSelected ?? i.isRecommended === undefined;
          })
          .map(i => i.id)
      )
  );
  const [addonCatalog, setAddonCatalog] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [featuredPlans, setFeaturedPlans] = useState<FeaturedPlan[]>([]);
  const [additionalLineItems, setAdditionalLineItems] = useState<
    QuoteLineItem[]
  >([]);
  const [companyPricingSettings, setCompanyPricingSettings] =
    useState<CompanyPricingSettings | null>(null);

  // Total yard sq ft from map outlines (only 'yard'-type areas, not structures)
  const yardSqFt = mapPlotData.outlines
    .filter(o => o.type === 'yard')
    .reduce((sum, o) => sum + (o.sqft ?? 0), 0);

  // Total home sq ft from map outlines (only 'house'-type areas)
  const homeSqFt = mapPlotData.outlines
    .filter(o => o.type === 'house')
    .reduce((sum, o) => sum + (o.sqft ?? 0), 0);
  // ── Fetch branding ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) {
      setBrandingLoaded(true);
      return;
    }
    fetch(`/api/companies/${companyId}/field-map-branding`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: BrandingData | null) => {
        if (data) {
          setBranding(data);
          injectFont(data.font_primary_name, data.font_primary_url);
          injectFont(data.font_secondary_name, data.font_secondary_url);
        }
      })
      .catch(() => {})
      .finally(() => setBrandingLoaded(true));
  }, [companyId]);

  // ── Fetch company pricing settings (needed for accurate featured plan pricing) ──
  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/companies/${companyId}/pricing-settings`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (data?.data) setCompanyPricingSettings(data.data);
      })
      .catch(() => {});
  }, [companyId]);

  // ── Save yard_sq_ft to the quote so the public page can use it ─────────
  useEffect(() => {
    if (!quoteId || yardSqFt <= 0) return;
    fetch(`/api/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yard_sq_ft: Math.round(yardSqFt) }),
    }).catch(() => {});
  }, [quoteId, yardSqFt]);

  // ── Save home_sq_ft to the quote so the public page can use it ─────────
  useEffect(() => {
    if (!quoteId || homeSqFt <= 0) return;
    fetch(`/api/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home_sq_ft: Math.round(homeSqFt) }),
    }).catch(() => {});
  }, [quoteId, homeSqFt]);

  // ── Fetch featured plans for "Additional Services We Offer" section ────
  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/service-plans/${companyId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data?.plans) return;
        const quotedPlanIds = new Set(
          quoteLineItems
            .filter(i => i.catalogItemKind === 'plan' && i.catalogItemId)
            .map(i => i.catalogItemId as string)
        );
        const featured = (data.plans as FeaturedPlan[]).filter(
          (p: any) => p.is_featured && !quotedPlanIds.has(p.id)
        );
        // Pre-populate catalogDetails so plan cards can expand after being added
        const newDetails: Record<string, any> = {};
        featured.forEach((p: any) => {
          newDetails[p.id] = p;
        });
        setCatalogDetails(prev => ({ ...prev, ...newDetails }));
        setFeaturedPlans(featured);
      })
      .catch(() => {});
  }, [companyId]); // intentionally omits quoteLineItems — runs once on mount

  // ── Fetch full catalog details for expandable plan cards ───────────────
  useEffect(() => {
    if (!companyId) return;
    const planAddonItems = quoteLineItems.filter(
      i => i.type === 'plan-addon' && i.catalogItemId
    );
    if (planAddonItems.length === 0) return;

    const hasPlan = planAddonItems.some(i => i.catalogItemKind === 'plan');
    const hasBundle = planAddonItems.some(i => i.catalogItemKind === 'bundle');

    const fetches: Promise<any>[] = [];
    if (hasPlan)
      fetches.push(
        fetch(`/api/service-plans/${companyId}`).then(r =>
          r.ok ? r.json() : null
        )
      );
    else fetches.push(Promise.resolve(null));
    // Always fetch add-ons so we can show catalog-recommended ones even if
    // the inspector didn't select any
    fetches.push(
      fetch(`/api/add-on-services/${companyId}`).then(r =>
        r.ok ? r.json() : null
      )
    );
    if (hasBundle)
      fetches.push(
        fetch(`/api/admin/bundle-plans?companyId=${companyId}`).then(r =>
          r.ok ? r.json() : null
        )
      );
    else fetches.push(Promise.resolve(null));

    Promise.all(fetches)
      .then(([plansRes, addonsRes, bundlesRes]) => {
        const details: Record<string, any> = {};
        (plansRes?.plans ?? []).forEach((p: any) => {
          details[p.id] = p;
        });
        const addonList: any[] = addonsRes?.addons ?? addonsRes?.data ?? [];
        addonList.forEach((a: any) => {
          details[a.id] = a;
        });
        // Build a lookup map for all add-ons so recommended ones can be shown
        // even when not present in the quote line items
        const catalogMap: Record<string, any> = {};
        addonList.forEach((a: any) => {
          catalogMap[a.id] = a;
        });
        setAddonCatalog(catalogMap);
        (bundlesRes?.data ?? bundlesRes?.bundles ?? []).forEach((b: any) => {
          details[b.id] = b;
        });
        setCatalogDetails(details);
      })
      .catch(() => {})
      .finally(() => setCatalogLoaded(true));
  }, [companyId, quoteLineItems]);

  // If there are no plan-addon items, catalog is immediately loaded
  useEffect(() => {
    const hasPlanAddon = quoteLineItems.some(
      i => i.type === 'plan-addon' && i.catalogItemId
    );
    if (!hasPlanAddon) setCatalogLoaded(true);
  }, [quoteLineItems]);

  // ── Terms scroll-to-view ───────────────────────────────────────────────
  useEffect(() => {
    if (!showSigModal) return;
    const el = termsBodyRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight) {
      setTermsViewed(true);
      return;
    }
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10)
        setTermsViewed(true);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [showSigModal]);

  const isLoading = !brandingLoaded || !catalogLoaded;

  const effectiveLineItems = [...quoteLineItems, ...additionalLineItems];

  const selectedItems = effectiveLineItems.filter(i => {
    if (!selectedItemIds.has(i.id)) return false;
    if (i.catalogItemKind === 'specialty-line' && i.parentLineItemId) {
      return selectedItemIds.has(i.parentLineItemId);
    }
    return true;
  });

  const { totalInitial, totalRecurring, recurringByFrequency } = getQuoteTotals(
    selectedItems.map(i => ({ ...i, isSelected: true }))
  );
  const todayLabel = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const firstName = clientName.trim().split(' ')[0] || 'Customer';
  const multipleItems = effectiveLineItems.length > 1;

  function persistLineItemSelection(lineItemId: string, isSelected: boolean) {
    if (!quoteId) return;
    fetch(`/api/quotes/${quoteId}/line-items/${lineItemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_selected: isSelected,
        ...(appliedDiscount
          ? {
              discount_type: appliedDiscount.discount_type,
              discount_value: appliedDiscount.discount_value,
              applies_to_price: appliedDiscount.applies_to_price,
              recurring_discount_type: appliedDiscount.recurring_discount_type,
              recurring_discount_value:
                appliedDiscount.recurring_discount_value,
            }
          : {}),
      }),
    }).catch(() => {}); // fire-and-forget; UI already updated optimistically
  }

  function toggleItemSelected(id: string) {
    setSelectedItemIds(prev => {
      if (!prev.has(id)) {
        persistLineItemSelection(id, true);
        return new Set([...prev, id]);
      }
      // Prevent unchecking the last selected item
      if (prev.size <= 1) return prev;
      persistLineItemSelection(id, false);
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  // Mutually exclusive version for recommended addon groups — selecting one deselects the others.
  function toggleRecommendedAddon(id: string, siblingIds: string[]) {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      // Deselect all siblings
      siblingIds.forEach(sibId => {
        if (sibId !== id && next.has(sibId)) {
          persistLineItemSelection(sibId, false);
          next.delete(sibId);
        }
      });
      // Toggle the clicked one
      if (prev.has(id)) {
        persistLineItemSelection(id, false);
        next.delete(id);
      } else {
        persistLineItemSelection(id, true);
        next.add(id);
      }
      return next;
    });
  }

  function handleSaveEdit() {
    setIsEditing(false);
  }

  // Compute discount dollar amount as a percentage
  const discountDollarInitial =
    discountAmount != null ? (totalInitial * discountAmount) / 100 : 0;
  const discountDollarRecurring = 0;

  const adjustedInitial = Math.max(0, totalInitial - discountDollarInitial);
  const adjustedRecurring = Math.max(
    0,
    totalRecurring - discountDollarRecurring
  );

  // Compute discount dollar amount directly from the applied discount prop — no dependency
  // on DB-stored totals, so display is always correct regardless of whether the DB fields
  // have been written yet.
  const localDiscountDollar = (() => {
    if (!appliedDiscount) return 0;
    const { discount_type, discount_value, applies_to_price } = appliedDiscount;
    if (applies_to_price === 'recurring') return 0;
    if (discount_type === 'percentage')
      return (totalInitial * discount_value) / 100;
    return discount_value; // fixed_amount
  })();

  const displaySubtotal = totalInitial;
  const displayTotal = Math.max(0, totalInitial - localDiscountDollar);

  // Show discount row whenever a discount is actually applied to initial price
  const showDiscount = localDiscountDollar > 0;

  // Brand CSS vars
  const isReversed = branding?.quote_accent_color_preference === 'secondary';
  const brandPrimary = branding
    ? isReversed
      ? branding.secondary_color
      : branding.primary_color
    : null;
  const brandSecondary = branding
    ? isReversed
      ? branding.primary_color
      : branding.secondary_color
    : null;
  const brandingStyle: React.CSSProperties = branding
    ? ({
        '--brand-primary': brandPrimary,
        '--brand-secondary': brandSecondary,
        '--accent-color': brandPrimary,
        // Override blue-500/primary-color with the first alternative color if set,
        // then secondary color, then leave unset so CSS falls back to blue-500
        '--blue-500':
          branding.alternative_color_1 ?? brandSecondary ?? undefined,
        '--primary-color':
          branding.alternative_color_1 ?? brandSecondary ?? undefined,
        '--color-text': branding.font_color ?? undefined,
        '--primary-font': branding.font_primary_name ?? undefined,
        '--secondary-font':
          branding.font_secondary_name ??
          branding.font_primary_name ??
          undefined,
      } as React.CSSProperties)
    : {};

  // ── Save inspector notes to quote ────────────────────────────────────
  const saveNotes = useCallback(async () => {
    if (!leadId) return;
    try {
      await fetch(`/api/leads/${leadId}/quote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: localNotes }),
      });
    } catch {
      // Non-critical — continue even if save fails
    }
  }, [leadId, localNotes]);

  // ── API call ───────────────────────────────────────────────────────────
  const callSendQuoteApi = useCallback(
    async (emailOverride: string | null, sendEmail: boolean) => {
      const res = await fetch('/api/field-map/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          quoteId,
          companyId,
          sendEmail,
          clientEmail: emailOverride ?? clientEmail,
          clientName,
          inspectorName,
          companyName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send quote');
      return data;
    },
    [
      leadId,
      quoteId,
      companyId,
      clientEmail,
      clientName,
      inspectorName,
      companyName,
    ]
  );

  async function dispatchSendQuote(emailOverride: string | null) {
    setActionState('sending');
    setErrorMsg(null);
    try {
      await saveNotes();
      await callSendQuoteApi(emailOverride, true);
      setActionState('sent');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to connect to server'
      );
      setActionState('error');
    }
  }

  function handleSendQuote() {
    if (!clientEmail) {
      setEnteredEmail('');
      setErrorMsg(null);
      setShowEmailModal(true);
      return;
    }
    void dispatchSendQuote(null);
  }

  function handleConfirmEmailModal() {
    const trimmed = enteredEmail.trim();
    if (!trimmed) return;
    setShowEmailModal(false);
    void dispatchSendQuote(trimmed);
  }

  async function handleScheduleSubmit() {
    if (hasTerms && !termsAccepted) {
      setErrorMsg(
        'You must accept the terms and conditions before scheduling.'
      );
      return;
    }
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setErrorMsg('Customer signature is required before scheduling.');
      return;
    }
    if (!signedBy.trim()) {
      setErrorMsg('Enter the customer name for the signature.');
      return;
    }
    const sig = signatureRef.current.toDataURL();
    setSignatureData(sig);
    setShowSigModal(false);
    void handleSchedule(
      'later',
      undefined,
      sig,
      preferredDayOfWeek || null,
      preferredTime || null
    );
  }

  async function handleSchedule(
    option: 'now' | 'later' | 'someone_else',
    assignedTo?: string,
    sigOverride?: string,
    prefDayOfWeek?: string | null,
    prefTime?: string | null
  ) {
    setActionState('scheduling');
    setErrorMsg(null);
    await saveNotes();
    try {
      const res = await fetch('/api/field-map/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          quoteId,
          companyId,
          signatureData: sigOverride ?? signatureData,
          signedBy,
          scheduleOption: option,
          assignedTo,
          preferredDayOfWeek: prefDayOfWeek ?? null,
          preferredTime: prefTime ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to schedule');
        setActionState('error');
        return;
      }
      if (option === 'now') {
        router.push(
          `/tickets/scheduling${data.leadId ? `?leadId=${data.leadId}` : ''}`
        );
        return;
      }
      setScheduleSuccessMsg(
        option === 'someone_else'
          ? 'A lead has been created and assigned for scheduling.'
          : 'A lead has been created and marked ready to schedule.'
      );
      setActionState('scheduled');
    } catch {
      setErrorMsg('Failed to connect to server');
      setActionState('error');
    }
  }

  const isBusy = actionState === 'sending' || actionState === 'scheduling';

  // ── Terms content for unified schedule modal ───────────────────────────
  const companyTerms = branding?.quote_terms ?? null;
  const planTermsBlocks = effectiveLineItems
    .filter(i => i.catalogItemId && catalogDetails[i.catalogItemId]?.plan_terms)
    .map(i => ({
      name: i.catalogItemName ?? 'Plan',
      terms: catalogDetails[i.catalogItemId!].plan_terms as string,
    }));
  const addonTermsBlocks = effectiveLineItems
    .filter(
      i => i.catalogItemId && catalogDetails[i.catalogItemId]?.addon_terms
    )
    .map(i => ({
      name: i.catalogItemName ?? 'Add-on',
      terms: catalogDetails[i.catalogItemId!].addon_terms as string,
    }));
  const hasTerms = Boolean(
    companyTerms || planTermsBlocks.length > 0 || addonTermsBlocks.length > 0
  );

  // ── Helpers for plan card content ──────────────────────────────────────
  function getPlanContent(item: QuoteLineItem) {
    if (!item.catalogItemId) return null;
    return catalogDetails[item.catalogItemId] ?? null;
  }

  function planHasContent(item: QuoteLineItem): boolean {
    const d = getPlanContent(item);
    if (!d) return false;
    // plan fields
    if (d.plan_description || d.plan_image_url || d.plan_video_url) return true;
    if (Array.isArray(d.plan_features) && d.plan_features.length > 0)
      return true;
    // addon fields
    if (d.addon_description || d.addon_image_url) return true;
    if (Array.isArray(d.addon_features) && d.addon_features.length > 0)
      return true;
    // bundle fields
    if (d.bundle_description || d.bundle_image_url) return true;
    if (Array.isArray(d.bundle_features) && d.bundle_features.length > 0)
      return true;
    return false;
  }

  function getScrollParent(el: HTMLElement): HTMLElement {
    let node = el.parentElement;
    while (node && node !== document.body) {
      const { overflowY } = window.getComputedStyle(node);
      if (overflowY === 'auto' || overflowY === 'scroll') return node;
      node = node.parentElement;
    }
    return document.documentElement;
  }

  function toggleExpanded(id: string) {
    setExpandedItemId(prev => {
      if (prev === id) return null;

      const targetEl = planCardRefs.current.get(id);
      if (!targetEl) return id;

      const scrollParent = getScrollParent(targetEl);
      const containerTop =
        scrollParent === document.documentElement
          ? 0
          : scrollParent.getBoundingClientRect().top;

      // Capture positions NOW, before any layout changes from state change
      const targetViewportTop = targetEl.getBoundingClientRect().top;
      const scrollTop = scrollParent.scrollTop;

      let contentShift = 0;
      if (prev !== null) {
        const collapsingEl = planCardRefs.current.get(prev);
        if (collapsingEl) {
          const collapsingViewportTop =
            collapsingEl.getBoundingClientRect().top;
          // Only adjust if the collapsing card is above the target
          if (collapsingViewportTop < targetViewportTop) {
            contentShift =
              contentWrapperRefs.current.get(prev)?.scrollHeight ?? 0;
          }
        }
      }

      // Pre-computed absolute position in scroll container, accounting for collapse above
      const finalAbsolutePos =
        targetViewportTop - containerTop + scrollTop - contentShift;
      const scrollTarget = finalAbsolutePos - 16; // 16px breathing room above header

      const delay = prev !== null ? 420 : 50;
      setTimeout(() => {
        scrollParent.scrollTo({ top: scrollTarget, behavior: 'smooth' });
      }, delay);

      return id;
    });
  }

  // ── FAQ helpers ────────────────────────────────────────────────────────
  function getFaqsForItem(
    item: QuoteLineItem
  ): Array<{ question: string; answer: string }> {
    if (!item.catalogItemId) return [];
    const d = catalogDetails[item.catalogItemId];
    if (!d) return [];
    if (item.catalogItemKind === 'addon') return d.addon_faqs ?? [];
    return d.plan_faqs ?? [];
  }

  function getItemDisplayName(item: QuoteLineItem): string {
    if (!item.catalogItemId) return formatLineItemLabel(item);
    const d = catalogDetails[item.catalogItemId];
    if (!d) return item.catalogItemName || formatLineItemLabel(item);
    return (
      d.plan_name ??
      d.addon_name ??
      d.bundle_name ??
      item.catalogItemName ??
      formatLineItemLabel(item)
    );
  }

  // Collect all FAQ sources (plans + addons that have faqs)
  const faqSources = effectiveLineItems.filter(
    i => i.type === 'plan-addon' && getFaqsForItem(i).length > 0
  );
  const clampedFaqTab = Math.min(
    activeFaqTab,
    Math.max(0, faqSources.length - 1)
  );

  // ── Loading spinner ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className={styles.fullscreen}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
        }}
      >
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  // ── Success screens ────────────────────────────────────────────────────
  if (actionState === 'sent') {
    return (
      <div className={styles.fullscreen} style={brandingStyle}>
        <div className={styles.successPage}>
          <div className={styles.successIcon}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className={styles.successTitle}>Quote Sent!</h2>
          <p className={styles.successSub}>
            A lead has been created and the quote email is on its way.
          </p>
          <button
            type="button"
            className={styles.successBtn}
            onClick={() => router.push('/field-sales/dashboard')}
          >
            Back to Route
          </button>
        </div>
      </div>
    );
  }

  if (actionState === 'scheduled') {
    return (
      <div className={styles.fullscreen} style={brandingStyle}>
        <div className={styles.successPage}>
          <div className={styles.successIcon}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="18"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16 2v4M8 2v4M3 10h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M9 16l2 2 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className={styles.successTitle}>Ready to Schedule</h2>
          <p className={styles.successSub}>{scheduleSuccessMsg}</p>
          <button
            type="button"
            className={styles.successBtn}
            onClick={() => router.push('/field-sales/dashboard')}
          >
            Back to Route
          </button>
        </div>
      </div>
    );
  }

  async function handleAddFeaturedPlan(plan: FeaturedPlan) {
    if (!quoteId) return;

    // Calculate accurate price based on map measurements and pricing config
    const { initialPrice: calcInitial, recurringPrice: calcRecurring } =
      calculateFeaturedPlanPrice(plan, {
        yardSqFt: yardSqFt > 0 ? yardSqFt : null,
        homeSqFt: homeSqFt > 0 ? homeSqFt : null,
        companySettings: companyPricingSettings,
      });

    const newId = crypto.randomUUID();
    const newItem: QuoteLineItem = {
      id: newId,
      type: 'plan-addon',
      catalogItemKind: 'plan',
      catalogItemId: plan.id,
      catalogItemName: plan.plan_name,
      coveredPestIds: [],
      coveredPestLabels: [],
      initialCost: calcInitial,
      recurringCost: calcRecurring,
      frequency: plan.billing_frequency,
      isPrimary: true,
      isSelected: true,
    };

    // Optimistic UI: add immediately
    setAdditionalLineItems(prev => [...prev, newItem]);
    setSelectedItemIds(prev => new Set([...prev, newId]));
    setFeaturedPlans(prev => prev.filter(p => p.id !== plan.id));

    // DB write
    const displayOrder = quoteLineItems.length + additionalLineItems.length;
    const res = await fetch(`/api/quotes/${quoteId}/line-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_plan_id: plan.id,
        plan_name: plan.plan_name,
        initial_price: calcInitial,
        recurring_price: calcRecurring,
        billing_frequency: plan.billing_frequency ?? 'monthly',
        display_order: displayOrder,
      }),
    }).catch(() => null);

    if (!res || !res.ok) {
      // Rollback on failure
      setAdditionalLineItems(prev => prev.filter(i => i.id !== newId));
      setSelectedItemIds(prev => {
        const next = new Set(prev);
        next.delete(newId);
        return next;
      });
      setFeaturedPlans(prev => [...prev, plan]);
      return;
    }

    // On success: promote item to parent so back-navigation preserves it
    onAddLineItem?.(newItem);
    setAdditionalLineItems(prev => prev.filter(i => i.id !== newId));
  }

  // ── Render props for QuoteServicePanel ────────────────────────────────

  function renderPlanHeaderPestIcon(item: QuoteLineItem): React.ReactNode {
    if (!item.catalogItemId) return null;
    const catalogCoveredIds: string[] =
      item.coveredPestIds.length > 0
        ? item.coveredPestIds
        : (catalogDetails[item.catalogItemId ?? '']?.pest_coverage ?? []).map(
            (c: any) => c.pest_id as string
          );

    const coveredPlotted = plottedPests.filter(p =>
      catalogCoveredIds.includes(p.id)
    );
    const singlePest = coveredPlotted.length === 1 ? coveredPlotted[0] : null;

    if (!singlePest && coveredPlotted.length > 1) {
      return (
        <div className={styles.planHeaderPestIcon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="26"
            viewBox="0 0 34 36"
            fill="none"
            className={styles.planHeaderShieldIcon}
          >
            <path
              d="M31.1667 0H2.83333C2.08189 0 1.36122 0.303427 0.829864 0.84353C0.298511 1.38363 0 2.11617 0 2.87999V12.96C0 22.4495 4.51917 28.2005 8.31052 31.3541C12.3941 34.7489 16.4564 35.9009 16.6334 35.9495C16.8769 36.0168 17.1337 36.0168 17.3772 35.9495C17.5543 35.9009 21.6112 34.7489 25.7001 31.3541C29.4808 28.2005 34 22.4495 34 12.96V2.87999C34 2.11617 33.7015 1.38363 33.1701 0.84353C32.6388 0.303427 31.9181 0 31.1667 0ZM25.0892 12.5388L15.1725 22.6187C15.0409 22.7526 14.8847 22.8588 14.7127 22.9313C14.5407 23.0038 14.3564 23.0411 14.1702 23.0411C13.984 23.0411 13.7997 23.0038 13.6277 22.9313C13.4557 22.8588 13.2995 22.7526 13.1679 22.6187L8.91792 18.2987C8.65209 18.0285 8.50275 17.6621 8.50275 17.28C8.50275 16.8978 8.65209 16.5314 8.91792 16.2612C9.18374 15.991 9.54428 15.8392 9.92021 15.8392C10.2961 15.8392 10.6567 15.991 10.9225 16.2612L14.1667 19.5641L23.081 10.5012C23.2127 10.3674 23.3689 10.2613 23.5409 10.1888C23.7129 10.1164 23.8972 10.0792 24.0833 10.0792C24.2695 10.0792 24.4538 10.1164 24.6258 10.1888C24.7977 10.2613 24.954 10.3674 25.0856 10.5012C25.2172 10.635 25.3217 10.7938 25.3929 10.9686C25.4641 11.1434 25.5008 11.3308 25.5008 11.52C25.5008 11.7092 25.4641 11.8965 25.3929 12.0713C25.3217 12.2461 25.2172 12.405 25.0856 12.5388H25.0892Z"
              fill="#2478F5"
            />
          </svg>
        </div>
      );
    }
    if (coveredPlotted.length === 0) return null;
    const pestId = singlePest?.id ?? null;
    if (!pestId) return null;
    const plottedPest = singlePest ?? plottedPests.find(p => p.id === pestId);
    const iconSvg = pestIconMap[pestId] ?? null;
    const stampType = plottedPest?.stampType ?? getPestStampType(pestId);
    return (
      <div className={styles.planHeaderPestIcon}>
        {iconSvg ? (
          <span
            className={styles.planHeaderPestIconSvg}
            dangerouslySetInnerHTML={{ __html: iconSvg }}
          />
        ) : (
          <MapStampGlyph type={stampType} size={24} />
        )}
      </div>
    );
  }

  function renderRecommendedAddonsForItem(
    item: QuoteLineItem
  ): React.ReactNode {
    const recommendedLineItems = addonItems.filter(
      a => a.parentLineItemId === item.id && a.isRecommended !== undefined
    );
    if (recommendedLineItems.length === 0) return null;

    const planCatalogData = catalogDetails[item.catalogItemId ?? ''];
    const catalogOrder: string[] = planCatalogData?.recommended_addon_ids ?? [];
    const ordered =
      catalogOrder.length > 0
        ? ([
            ...catalogOrder
              .map(id => recommendedLineItems.find(a => a.catalogItemId === id))
              .filter(Boolean),
            ...recommendedLineItems.filter(
              a => !catalogOrder.includes(a.catalogItemId ?? '')
            ),
          ] as typeof recommendedLineItems)
        : recommendedLineItems;

    if (ordered.length === 0) return null;

    return (
      <div className={styles.planCardAddons}>
        <div className={styles.planCardAddonBtnGroup}>
          {ordered.map(addon => {
            const isChecked = selectedItemIds.has(addon.id);
            const recurringCost = addon.recurringCost ?? 0;
            const initialCost = addon.initialCost ?? 0;
            const abbr: Record<string, string> = {
              monthly: 'mo',
              quarterly: 'qtr',
              'semi-annually': 'semi',
              'semi-annual': 'semi',
              annually: 'yr',
              annual: 'yr',
              'bi-monthly': '2mo',
              'bi-annually': '6mo',
              'one-time': 'once',
            };
            const freqAbbr = addon.frequency
              ? (abbr[addon.frequency.toLowerCase()] ?? addon.frequency)
              : 'mo';
            const priceLabel =
              recurringCost > 0
                ? `$${recurringCost.toFixed(0)}/${freqAbbr}`
                : initialCost > 0
                  ? `$${initialCost.toFixed(0)}`
                  : '';
            return (
              <div key={addon.id} className={styles.planCardAddonBtnWrap}>
                {addon.isRecommended === true && (
                  <span className={styles.planCardAddonRecommendedLabel}>
                    Recommended
                  </span>
                )}
                <button
                  type="button"
                  className={`${styles.planCardAddonBtn}${isChecked ? ` ${styles.planCardAddonBtnSelected}` : ''}`}
                  onClick={() =>
                    toggleRecommendedAddon(
                      addon.id,
                      ordered.map(a => a.id)
                    )
                  }
                >
                  {isChecked && (
                    <span className={styles.planCardAddonBtnCheck}>
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
                  <span className={styles.planCardAddonBtnLabel}>
                    {formatLineItemLabel(addon)}
                  </span>
                </button>
                {priceLabel && (
                  <span className={styles.planCardAddonBtnPrice}>
                    {priceLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Totals helpers ─────────────────────────────────────────────────────
  const billingFrequency = recurringByFrequency[0]?.frequency ?? 'monthly';
  const planItems = effectiveLineItems.filter(
    i =>
      i.catalogItemKind !== 'addon' &&
      i.catalogItemKind !== 'product' &&
      i.catalogItemKind !== 'specialty-line'
  );
  const addonItems = effectiveLineItems.filter(
    i => i.catalogItemKind === 'addon'
  );
  const customItems = effectiveLineItems.filter(i => i.type === 'custom');

  // ── Main review page ───────────────────────────────────────────────────
  return (
    <>
      <div
        ref={scrollContainerRef}
        className={`${qcStyles.quoteContainer} ${styles.fullscreen}`}
        style={brandingStyle}
      >
        {/* ── Header with back button ── */}
        <div className={`${styles.reviewHeader}`}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={onBack}
            aria-label="Go back"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M19 12H5M5 12l7 7M5 12l7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className={styles.reviewHeaderLogo}>
            {branding?.logo_url ? (
              <div className={styles.heroLogoWrapper}>
                <Image
                  src={branding.logo_url}
                  alt={branding.company_name || companyName}
                  fill={true}
                  objectFit="contain"
                />
              </div>
            ) : (
              <span className={styles.reviewHeaderName}>
                {branding?.company_name || companyName}
              </span>
            )}
          </div>
        </div>

        {/* ── Hero ── */}
        <section
          className={`${qcStyles.heroSection} ${styles.heroSectionCompact}`}
        >
          <div className={qcStyles.heroContainer}>
            <div
              className={`${qcStyles.heroContent} ${qcStyles.heroContentCompact} ${styles.heroContentCentered}`}
            >
              {plottedPests.length > 0 && (
                <div className={styles.heroPests}>
                  <p className={styles.heroPestsLabel}>Pests identified</p>
                  <div className={styles.heroPestIconRow}>
                    {plottedPests.map(pest => {
                      const iconSvg = pestIconMap[pest.id] ?? null;
                      const stampType =
                        pest.stampType ?? getPestStampType(pest.id);
                      return (
                        <div key={pest.id} className={styles.heroPestIcon}>
                          <div className={styles.heroPestIconCircle}>
                            {iconSvg ? (
                              <span
                                className={styles.heroPestIconSvg}
                                dangerouslySetInnerHTML={{ __html: iconSvg }}
                              />
                            ) : (
                              <MapStampGlyph type={stampType} size={24} />
                            )}
                          </div>
                          <span className={styles.heroPestIconLabel}>
                            {pest.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Inspector + address card */}
              <div className={styles.inspectorCard}>
                <div className={styles.inspectorInfo}>
                  {inspectorAvatarUrl && (
                    <Image
                      src={inspectorAvatarUrl}
                      alt={inspectorName}
                      width={57}
                      height={57}
                      className={styles.inspectorAvatar}
                    />
                  )}
                  <div className={styles.inspectorText}>
                    <p className={styles.inspectorName}>{inspectorName}</p>
                    <p className={styles.inspectorTitle}>
                      {inspectorTitle || 'Lead Sales Inspector'}
                    </p>
                    {(inspectorPhone || companyPhone) && (
                      <p className={styles.inspectorPhone}>
                        {inspectorPhone || companyPhone}
                      </p>
                    )}
                    {inspectorEmail && (
                      <p className={styles.inspectorEmail}>
                        {inspectorEmail}
                      </p>
                    )}
                  </div>
                </div>
                <div className={styles.inspectorSeparator} />
                <div className={styles.inspectorAddress}>
                  <p className={styles.inspectorAddressLabel}>
                    Inspection
                    <span className={styles.addressLabelBreak}>
                      <br />
                    </span>{' '}
                    Address:
                  </p>
                  <div className={styles.inspectorAddressSeparator} />
                  <p className={styles.inspectorAddressValue}>
                    {(() => {
                      const comma = address.indexOf(',');
                      if (comma === -1) return address;
                      return (
                        <>
                          {address.slice(0, comma)}
                          <br />
                          {address.slice(comma + 1).trim()}
                        </>
                      );
                    })()}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`${qcStyles.heroImage} ${styles.heroMapWrap}`}
              style={
                {
                  '--blue-500': '#3b82f6',
                  '--primary-color': '#3b82f6',
                } as React.CSSProperties
              }
            >
              {/* Map layer — stays in normal flow so it drives container height */}
              <div
                className={styles.heroMapLayer}
                style={{ opacity: showMapView || !housePhoto ? 1 : 0 }}
              >
                <MapPlotCanvas
                  mapPlotData={mapPlotData}
                  onChange={() => {}}
                  isReadOnly
                  companyId={companyId}
                  stampColor={brandPrimary ?? undefined}
                />
              </div>
              {/* House photo — absolutely overlaid, crossfades over the map */}
              {housePhoto && (
                <div
                  className={`${styles.heroPhotoLayer} ${!showMapView ? styles.heroPhotoLayerVisible : ''}`}
                >
                  <Image
                    src={housePhoto}
                    alt="House photo"
                    fill
                    objectFit="cover"
                  />
                </div>
              )}
              {/* "Switch To Pest Findings Map" — shown in photo view */}
              {housePhoto && !showMapView && (
                <button
                  type="button"
                  className={styles.heroViewToggleBtn}
                  onClick={() => setShowMapView(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 22 22"
                    fill="none"
                  >
                    <path
                      d="M21 11C21 16.5228 16.5228 21 11 21M21 11C21 5.47715 16.5228 1 11 1M21 11H17M11 21C5.47715 21 1 16.5228 1 11M11 21V17M1 11C1 5.47715 5.47715 1 11 1M1 11H5M11 1V5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Switch To Pest Findings Map
                </button>
              )}
              {/* "Close Map" — shown in map view, top-right */}
              {housePhoto && showMapView && (
                <button
                  type="button"
                  className={styles.heroCloseMapBtn}
                  onClick={() => setShowMapView(false)}
                >
                  Close Map
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="34"
                    height="34"
                    viewBox="0 0 36 36"
                    fill="none"
                  >
                    <path
                      d="M23.1 12.9L12.9 23.1M12.9 12.9L23.1 23.1M35 18C35 27.3888 27.3888 35 18 35C8.61116 35 1 27.3888 1 18C1 8.61116 8.61116 1 18 1C27.3888 1 35 8.61116 35 18Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Content area ── */}
        <div className={qcStyles.contentArea}>
          <div className={qcStyles.contentAreaInner}>
            {/* ── Plan cards via QuoteServicePanel ── */}
            <QuoteServicePanel
              quoteLineItems={effectiveLineItems}
              selectedItemIds={selectedItemIds}
              onToggleItem={toggleItemSelected}
              expandedItemId={expandedItemId}
              onSetExpandedItem={id => {
                if (id === null) {
                  setExpandedItemId(null);
                } else {
                  toggleExpanded(id);
                }
              }}
              getContent={getPlanContent}
              onToggleRecommendedAddon={toggleRecommendedAddon}
              renderPlanHeaderExtra={renderPlanHeaderPestIcon}
              renderRecommendedAddons={renderRecommendedAddonsForItem}
              multipleItems={multipleItems}
              showTotals={false}
              showFaqs={false}
            />

            {/* ── Additional Services We Offer ── */}
            {featuredPlans.length > 0 && (
              <section className={styles.additionalServicesSection}>
                <h2 className={styles.additionalServicesHeading}>
                  Additional Services We Offer
                </h2>
                <div
                  className={qcStyles.plansContainer}
                  style={{ marginBottom: 0 }}
                >
                  {featuredPlans.map(plan => {
                    const detail = catalogDetails[plan.id];
                    const description = detail?.plan_description ?? null;
                    const features: string[] = detail?.plan_features ?? [];
                    const imageUrl = detail?.plan_image_url ?? null;
                    const videoUrl = detail?.plan_video_url ?? null;
                    const disclaimer = detail?.plan_disclaimer ?? null;
                    const hasContent = Boolean(
                      description || imageUrl || videoUrl || features.length > 0
                    );
                    const isExpanded = expandedItemId === plan.id;
                    // Calculate accurate price using map measurements
                    const {
                      initialPrice,
                      recurringPrice,
                      isExact: priceIsExact,
                    } = calculateFeaturedPlanPrice(plan, {
                      yardSqFt: yardSqFt > 0 ? yardSqFt : null,
                      homeSqFt: homeSqFt > 0 ? homeSqFt : null,
                      companySettings: companyPricingSettings,
                    });
                    // Treat as one-time when billing_frequency is explicitly 'one-time'
                    // OR when there is no recurring price (initial-only charge)
                    const isOneTime =
                      plan.billing_frequency === 'one-time' ||
                      recurringPrice === 0;

                    return (
                      <div
                        key={plan.id}
                        ref={el => {
                          if (el) planCardRefs.current.set(plan.id, el);
                          else planCardRefs.current.delete(plan.id);
                        }}
                        className={`${qcStyles.planCard} ${qcStyles.collapsible} ${isExpanded ? qcStyles.expanded : ''}`}
                      >
                        <div
                          className={qcStyles.planHeader}
                          onClick={
                            hasContent
                              ? () => toggleExpanded(plan.id)
                              : undefined
                          }
                          style={{ cursor: hasContent ? 'pointer' : 'default' }}
                        >
                          <label
                            className={qcStyles.addonCheckbox}
                            onClick={e => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => handleAddFeaturedPlan(plan)}
                            />
                            <span className={qcStyles.addonCheckboxCustom} />
                          </label>
                          <div>
                            <h3 className={qcStyles.planHeaderTitle}>
                              {plan.plan_name}
                            </h3>
                          </div>
                          <div className={qcStyles.addonHeaderRight}>
                            {(() => {
                              const prefix = priceIsExact ? '' : 'From\u00a0';
                              if (
                                isOneTime ||
                                (!isOneTime &&
                                  recurringPrice === 0 &&
                                  initialPrice > 0)
                              ) {
                                return (
                                  <span
                                    className={styles.additionalServicePrice}
                                  >
                                    {prefix}<sup>$</sup>
                                    <span
                                      className={
                                        styles.additionalServicePriceNumber
                                      }
                                    >
                                      {initialPrice.toFixed(0)}
                                    </span>
                                  </span>
                                );
                              }
                              if (recurringPrice > 0) {
                                return (
                                  <span
                                    className={styles.additionalServicePrice}
                                  >
                                    {prefix}<sup>$</sup>
                                    <span
                                      className={
                                        styles.additionalServicePriceNumber
                                      }
                                    >
                                      {recurringPrice.toFixed(0)}
                                    </span>
                                    /
                                    {abbreviateFrequency(
                                      plan.billing_frequency
                                    )}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                            {hasContent && (
                              <span className={qcStyles.planHeaderIcon}>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="32"
                                  height="32"
                                  viewBox="0 0 32 32"
                                  fill="none"
                                >
                                  <circle cx="16" cy="16" r="16" fill="#000" />
                                  <path
                                    d="M10 14L16 20L22 14"
                                    stroke="white"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            )}
                          </div>
                        </div>

                        {hasContent && (
                          <div
                            ref={el => {
                              if (el)
                                contentWrapperRefs.current.set(plan.id, el);
                              else contentWrapperRefs.current.delete(plan.id);
                            }}
                            className={qcStyles.planContentWrapper}
                            style={{ maxHeight: isExpanded ? '3000px' : '0' }}
                          >
                            <div className={qcStyles.planContent}>
                              {description && (
                                <p className={qcStyles.planDescription}>
                                  {description}
                                </p>
                              )}
                              <div className={qcStyles.planContentGrid}>
                                <div className={qcStyles.planContentLeft}>
                                  {features.length > 0 && (
                                    <div className={qcStyles.planIncluded}>
                                      <h4>What&apos;s Included:</h4>
                                      <ul className={qcStyles.featuresList}>
                                        {features.map((f, fi) => (
                                          <li
                                            key={fi}
                                            className={qcStyles.feature}
                                          >
                                            <span
                                              className={
                                                qcStyles.featureCheckmark
                                              }
                                            >
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                              >
                                                <g clipPath="url(#clip-fp)">
                                                  <path
                                                    d="M18.1678 8.33332C18.5484 10.2011 18.2772 12.1428 17.3994 13.8348C16.5216 15.5268 15.0902 16.8667 13.3441 17.6311C11.5979 18.3955 9.64252 18.5381 7.80391 18.0353C5.9653 17.5325 4.35465 16.4145 3.24056 14.8678C2.12646 13.3212 1.57626 11.4394 1.68171 9.53615C1.78717 7.63294 2.54189 5.8234 3.82004 4.4093C5.09818 2.9952 6.82248 2.06202 8.70538 1.76537C10.5883 1.46872 12.516 1.82654 14.167 2.77916"
                                                    stroke="#000"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  />
                                                  <path
                                                    d="M7.5 9.16659L10 11.6666L18.3333 3.33325"
                                                    stroke="#000"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  />
                                                </g>
                                                <defs>
                                                  <clipPath id="clip-fp">
                                                    <rect
                                                      width="20"
                                                      height="20"
                                                      fill="white"
                                                    />
                                                  </clipPath>
                                                </defs>
                                              </svg>
                                            </span>
                                            {f}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  <div className={qcStyles.pricingSection}>
                                    <div className={qcStyles.priceContainer}>
                                      {!isOneTime && recurringPrice > 0 && (
                                        <div className={qcStyles.priceLeft}>
                                          <div
                                            className={qcStyles.priceRecurring}
                                          >
                                            <sup>$</sup>
                                            {recurringPrice.toFixed(0)}
                                            <sup
                                              className={qcStyles.priceAsterisk}
                                            >
                                              *
                                            </sup>
                                            <span
                                              className={
                                                qcStyles.priceFrequency
                                              }
                                            >
                                              /
                                              {abbreviateFrequency(
                                                plan.billing_frequency
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                      {initialPrice > 0 && (
                                        <div
                                          className={
                                            isOneTime
                                              ? qcStyles.priceLeft
                                              : qcStyles.priceRight
                                          }
                                        >
                                          <div
                                            className={qcStyles.priceRecurring}
                                          >
                                            <sup>$</sup>
                                            {initialPrice.toFixed(0)}
                                            {!isOneTime && (
                                              <span
                                                className={
                                                  qcStyles.priceFrequency
                                                }
                                              >
                                                /Initial
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {disclaimer && (
                                    <div className={qcStyles.planDisclaimer}>
                                      <p
                                        dangerouslySetInnerHTML={{
                                          __html: disclaimer,
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className={qcStyles.planContentRight}>
                                  {imageUrl && (
                                    <div className={qcStyles.planImageWrapper}>
                                      <Image
                                        src={imageUrl}
                                        alt={plan.plan_name}
                                        fill
                                        className={qcStyles.planImage}
                                      />
                                    </div>
                                  )}
                                  {videoUrl && (
                                    <button
                                      type="button"
                                      className={styles.planVideoCallout}
                                      onClick={() =>
                                        setVideoLightboxUrl(videoUrl)
                                      }
                                      aria-label="Play plan video"
                                    >
                                      <span
                                        className={styles.planVideoCalloutText}
                                      >
                                        Watch Our Service Video
                                      </span>
                                      <span
                                        className={styles.planVideoCalloutPlay}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="31"
                                          height="36"
                                          viewBox="0 0 31 36"
                                          fill="none"
                                        >
                                          <path
                                            d="M30.75 17.7535L-1.67211e-06 35.5071L-1.20052e-07 1.77294e-05L30.75 17.7535Z"
                                            fill="white"
                                          />
                                        </svg>
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Total pricing — matching QuoteTotalPricing exactly ── */}
            {effectiveLineItems.length > 0 && (
              <div className={qcStyles.totalPricing}>
                <div className={styles.totalPricingHeader}>
                  <h3>Customized Quote Total</h3>
                </div>

                {/* Items list */}
                <div className={qcStyles.totalListWrapper}>
                  <div className={qcStyles.totalItemsList}>
                    {/* Plans & bundles */}
                    {(planItems.length > 0 || customItems.length > 0) && (
                      <div className={qcStyles.totalSectionLabel}>Services</div>
                    )}
                    {planItems.map(item => {
                      const isSelected = selectedItemIds.has(item.id);
                      const isOnly =
                        multipleItems &&
                        selectedItemIds.size === 1 &&
                        isSelected;
                      const childAddons = addonItems.filter(
                        a => a.parentLineItemId === item.id
                      );
                      const productChildren = effectiveLineItems.filter(
                        c =>
                          c.catalogItemKind === 'product' &&
                          c.parentLineItemId === item.id
                      );
                      const selectedAddonChildren = childAddons.filter(a =>
                        selectedItemIds.has(a.id)
                      );
                      const totalSpecialtyLineChildren =
                        effectiveLineItems.filter(
                          c =>
                            c.catalogItemKind === 'specialty-line' &&
                            c.parentLineItemId === item.id
                        );
                      const selectedTotalSpecialtyChildren = isSelected
                        ? totalSpecialtyLineChildren.filter(c =>
                            selectedItemIds.has(c.id)
                          )
                        : [];
                      const aggInitial =
                        (item.initialCost ?? 0) +
                        productChildren.reduce(
                          (s, c) => s + (c.initialCost ?? 0),
                          0
                        ) +
                        selectedAddonChildren.reduce(
                          (s, a) => s + (a.initialCost ?? 0),
                          0
                        ) +
                        selectedTotalSpecialtyChildren.reduce(
                          (s, c) => s + (c.initialCost ?? 0),
                          0
                        );
                      const aggRecurring =
                        (item.recurringCost ?? 0) +
                        productChildren.reduce(
                          (s, c) => s + (c.recurringCost ?? 0),
                          0
                        ) +
                        selectedAddonChildren.reduce(
                          (s, a) => s + (a.recurringCost ?? 0),
                          0
                        );
                      return (
                        <div key={item.id} className={qcStyles.totalItemGroup}>
                          <div
                            className={`${qcStyles.totalItem} ${!isSelected ? qcStyles.totalItemUnselected : ''}`}
                          >
                            <span className={qcStyles.totalItemLeft}>
                              {multipleItems ? (
                                <label
                                  className={`${qcStyles.addonCheckbox} ${isOnly ? qcStyles.addonCheckboxLastPlan : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleItemSelected(item.id)}
                                    disabled={isOnly}
                                  />
                                  <span
                                    className={`${qcStyles.addonCheckboxCustom} ${isOnly ? qcStyles.addonCheckboxDisabled : ''}`}
                                  />
                                </label>
                              ) : (
                                <span className={qcStyles.totalItemCheckmark}>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="13"
                                    height="11"
                                    viewBox="0 0 13 11"
                                    fill="none"
                                  >
                                    <path
                                      d="M1 7.04907L3.5 9.64154L11.8333 1"
                                      stroke="#0072DA"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              )}
                              {formatLineItemLabel(item)}
                            </span>
                            <span className={qcStyles.totalItemPrice}>
                              <>
                                {aggRecurring > 0 && (
                                  <span
                                    className={qcStyles.totalItemPriceRecurring}
                                  >
                                    <span
                                      className={qcStyles.totalItemPriceAmount}
                                    >
                                      ${aggRecurring.toFixed(0)}
                                    </span>
                                    <span
                                      className={qcStyles.totalItemPriceFreq}
                                    >
                                      /{abbreviateFrequency(item.frequency)}
                                    </span>
                                  </span>
                                )}
                                {aggInitial > 0 &&
                                  (aggRecurring === 0 ? (
                                    <span
                                      className={qcStyles.totalItemPriceAmount}
                                    >
                                      ${aggInitial.toFixed(0)}
                                    </span>
                                  ) : (
                                    <span
                                      className={qcStyles.totalItemPriceInitial}
                                    >
                                      <span
                                        className={
                                          qcStyles.totalItemPriceAmount
                                        }
                                      >
                                        ${aggInitial.toFixed(0)}
                                      </span>
                                      <span
                                        className={qcStyles.totalItemPriceFreq}
                                      >
                                        {' '}
                                        initial
                                      </span>
                                    </span>
                                  ))}
                              </>
                            </span>
                          </div>
                          {childAddons.map(addon => {
                            const addonSelected = selectedItemIds.has(addon.id);
                            const addonOnly =
                              multipleItems &&
                              selectedItemIds.size === 1 &&
                              addonSelected;
                            const isRecommendedAddon =
                              addon.isRecommended !== undefined;
                            const recommendedSiblingIds = isRecommendedAddon
                              ? childAddons
                                  .filter(a => a.isRecommended !== undefined)
                                  .map(a => a.id)
                              : [];
                            return (
                              <div
                                key={addon.id}
                                className={`${qcStyles.totalItem} ${styles.totalAddonItem} ${!addonSelected ? qcStyles.totalItemUnselected : ''}`}
                              >
                                <span className={qcStyles.totalItemLeft}>
                                  <label
                                    className={`${qcStyles.addonCheckbox} ${styles.totalAddonCheckbox} ${addonOnly ? qcStyles.addonCheckboxLastPlan : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={addonSelected}
                                      onChange={() =>
                                        isRecommendedAddon
                                          ? toggleRecommendedAddon(
                                              addon.id,
                                              recommendedSiblingIds
                                            )
                                          : toggleItemSelected(addon.id)
                                      }
                                      disabled={addonOnly}
                                    />
                                    <span
                                      className={`${qcStyles.addonCheckboxCustom} ${addonOnly ? qcStyles.addonCheckboxDisabled : ''}`}
                                    />
                                  </label>
                                  {formatLineItemLabel(addon)}
                                </span>
                                <span className={qcStyles.totalItemPrice}>
                                  <>
                                    {(addon.recurringCost ?? 0) > 0 && (
                                      <span
                                        className={
                                          qcStyles.totalItemPriceRecurring
                                        }
                                      >
                                        <span
                                          className={
                                            qcStyles.totalItemPriceAmount
                                          }
                                        >
                                          $
                                          {(addon.recurringCost ?? 0).toFixed(
                                            0
                                          )}
                                        </span>
                                        <span
                                          className={
                                            qcStyles.totalItemPriceFreq
                                          }
                                        >
                                          /
                                          {abbreviateFrequency(addon.frequency)}
                                        </span>
                                      </span>
                                    )}
                                    {(addon.initialCost ?? 0) > 0 &&
                                      ((addon.recurringCost ?? 0) === 0 ? (
                                        <span
                                          className={
                                            qcStyles.totalItemPriceAmount
                                          }
                                        >
                                          ${(addon.initialCost ?? 0).toFixed(0)}
                                        </span>
                                      ) : (
                                        <span
                                          className={
                                            qcStyles.totalItemPriceInitial
                                          }
                                        >
                                          <span
                                            className={
                                              qcStyles.totalItemPriceAmount
                                            }
                                          >
                                            $
                                            {(addon.initialCost ?? 0).toFixed(
                                              0
                                            )}
                                          </span>
                                          <span
                                            className={
                                              qcStyles.totalItemPriceFreq
                                            }
                                          >
                                            {' '}
                                            initial
                                          </span>
                                        </span>
                                      ))}
                                  </>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Discount-applied row */}
                {showDiscount && (
                  <div
                    className={`${qcStyles.totalRow} ${styles.discountAppliedRow}`}
                  >
                    <div>
                      {appliedDiscount?.discount_name
                        ? `${appliedDiscount.discount_name} - Discount Applied`
                        : 'Discount Applied'}
                    </div>
                    <strong>
                      {appliedDiscount?.discount_type !== 'percentage' && '$'}
                      {appliedDiscount?.discount_value}
                      {appliedDiscount?.discount_type === 'percentage' && '%'}
                    </strong>
                  </div>
                )}

                {/* Total Initial Cost row */}
                <div className={qcStyles.totalRow}>
                  <div>Total Initial Cost:</div>
                  <strong>
                    <span
                      className={showDiscount ? qcStyles.originalPriceText : ''}
                    >
                      {showDiscount && `$${displaySubtotal.toFixed(0)}`}
                    </span>
                    ${displayTotal.toFixed(0)}
                  </strong>
                </div>

                {/* Total Recurring Cost — all frequencies normalized to monthly */}
                {recurringByFrequency.length > 0 &&
                  (() => {
                    const totalMonthly = recurringByFrequency.reduce(
                      (sum, { frequency, total }) => {
                        const adjusted =
                          totalRecurring > 0 && discountDollarRecurring > 0
                            ? Math.max(
                                0,
                                total * (adjustedRecurring / totalRecurring)
                              )
                            : total;
                        return sum + toMonthlyEquivalent(frequency, adjusted);
                      },
                      0
                    );
                    return (
                      <div className={qcStyles.totalRow}>
                        <div>Monthly EZPay</div>
                        <span>
                          <strong>${totalMonthly.toFixed(0)}</strong>
                          <span className={qcStyles.totalRowFreq}>/mo</span>
                        </span>
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* ── FAQs ── */}
            {faqSources.length > 0 && (
              <div className={qcStyles.faqsSection}>
                {faqSources.length === 1 ? (
                  <>
                    <h2
                      className={`${qcStyles.faqsTitle} ${styles.faqsTitleOverride}`}
                    >
                      Frequently Asked Questions
                    </h2>
                    <div className={qcStyles.faqsContainer}>
                      {getFaqsForItem(faqSources[0]).map(
                        (
                          faq: { question: string; answer: string },
                          fi: number
                        ) => (
                          <FaqItem key={fi} faq={faq} />
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h2
                      className={`${qcStyles.faqsTitle} ${styles.faqsTitleOverride}`}
                    >
                      Frequently Asked Questions
                    </h2>
                    <div className={qcStyles.faqDropdownContainer}>
                      <label
                        htmlFor="rv-faq-select"
                        className={qcStyles.faqDropdownLabel}
                      >
                        Choose A Plan To View FAQs:
                      </label>
                      <select
                        id="rv-faq-select"
                        className={qcStyles.faqDropdown}
                        value={clampedFaqTab}
                        onChange={e => setActiveFaqTab(Number(e.target.value))}
                      >
                        {faqSources.map((item, ti) => (
                          <option key={ti} value={ti}>
                            {getItemDisplayName(item)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={qcStyles.faqsLayoutGrid}>
                      <div className={qcStyles.faqsSidebar}>
                        {faqSources.map((item, ti) => (
                          <button
                            key={ti}
                            className={`${qcStyles.faqTabButton} ${clampedFaqTab === ti ? qcStyles.faqTabButtonActive : ''}`}
                            onClick={() => setActiveFaqTab(ti)}
                          >
                            {getItemDisplayName(item)}
                          </button>
                        ))}
                      </div>
                      <div className={qcStyles.faqsContainer}>
                        {getFaqsForItem(faqSources[clampedFaqTab]).map(
                          (
                            faq: { question: string; answer: string },
                            fi: number
                          ) => (
                            <FaqItem key={fi} faq={faq} />
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Error */}
            {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

            <div className={styles.actionSpacer} />
          </div>
        </div>

        {/* ── Sticky action bar ── */}
        <div className={styles.stickyActions}>
          <div className={styles.stickyActionsInner}>
            <button
              type="button"
              className={styles.scheduleBtn}
              onClick={handleSendQuote}
              disabled={isBusy}
            >
              {actionState === 'sending' ? 'Sending…' : 'Send Quote'}
            </button>
            <button
              type="button"
              className={styles.sendBtn}
              onClick={() => {
                setErrorMsg(null);
                setTermsViewed(false);
                setTermsAccepted(false);
                setTermsNudge(false);
                setPreferredDayOfWeek('');
                setPreferredTime('');
                signatureRef.current?.clear();
                setSigHasContent(false);
                setShowSigModal(true);
              }}
              disabled={isBusy || !companyId}
            >
              {actionState === 'scheduling'
                ? 'Scheduling…'
                : 'Schedule Service'}
            </button>
          </div>
        </div>
      </div>

      {/* Video lightbox */}
      {videoLightboxUrl && (
        <VideoLightbox
          videoUrl={videoLightboxUrl}
          onClose={() => setVideoLightboxUrl(null)}
        />
      )}

      {/* Email capture modal */}
      {showEmailModal && (
        <div
          className={styles.sigOverlay}
          style={brandingStyle}
          onClick={e => {
            if (e.target === e.currentTarget) setShowEmailModal(false);
          }}
        >
          <div className={styles.emailModalSheet}>
            <div className={styles.sigHeader}>
              <h3 className={styles.sigTitle}>Send Quote</h3>
              <button
                type="button"
                className={styles.sigCloseBtn}
                onClick={() => setShowEmailModal(false)}
                aria-label="Close"
              >
                &#215;
              </button>
            </div>
            <p className={styles.sigSub}>
              No email is on file for this customer. Enter the address to send
              this quote to.
            </p>
            <div className={styles.emailModalBody}>
              <label className={styles.sigLabel} htmlFor="quoteEmailInput">
                Email Address
              </label>
              <input
                id="quoteEmailInput"
                type="email"
                className={styles.emailInput}
                value={enteredEmail}
                onChange={e => setEnteredEmail(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirmEmailModal();
                  }
                }}
                placeholder="customer@example.com"
                autoFocus
              />
            </div>
            <div className={styles.emailModalActions}>
              <button
                type="button"
                className={styles.emailModalCancel}
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.emailSendBtn}
                disabled={!enteredEmail.trim() || isBusy}
                onClick={handleConfirmEmailModal}
              >
                Send Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Schedule Service modal */}
      {showSigModal && (
        <div
          className={styles.sigOverlay}
          style={brandingStyle}
          onClick={e => {
            if (e.target === e.currentTarget) setShowSigModal(false);
          }}
        >
          <div className={styles.sigSheet}>
            {/* Header */}
            <div className={styles.sigHeader}>
              <h3 className={styles.sigTitle}>Schedule Service</h3>
              <button
                type="button"
                className={styles.sigCloseBtn}
                onClick={() => setShowSigModal(false)}
                aria-label="Close"
              >
                &#215;
              </button>
            </div>

            {/* Section 1: Preferred day & time */}
            <div className={styles.sigSection}>
              <p className={styles.sigSectionLabel}>Preferred Day &amp; Time</p>
              <div className={styles.sigDateRow}>
                <select
                  className={styles.sigDateInput}
                  value={preferredDayOfWeek}
                  onChange={e => setPreferredDayOfWeek(e.target.value)}
                >
                  <option value="">No preference</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                </select>
                <select
                  className={styles.sigTimeSelect}
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                >
                  <option value="">No preference</option>
                  {getEnabledTimeOptions(
                    branding?.time_options || DEFAULT_TIME_OPTIONS
                  ).map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 2: Terms & Conditions */}
            {hasTerms && (
              <div className={styles.sigSection}>
                <p className={styles.sigSectionLabel}>Terms &amp; Conditions</p>
                <div className={styles.termsBody} ref={termsBodyRef}>
                  {companyTerms && (
                    <div dangerouslySetInnerHTML={{ __html: companyTerms }} />
                  )}
                  {planTermsBlocks.map((b, i) => (
                    <div
                      key={`plan-t-${i}`}
                      className={styles.specificTermsBlock}
                    >
                      <h4>{b.name} &mdash; Terms and Conditions</h4>
                      <div dangerouslySetInnerHTML={{ __html: b.terms }} />
                    </div>
                  ))}
                  {addonTermsBlocks.map((b, i) => (
                    <div
                      key={`addon-t-${i}`}
                      className={styles.specificTermsBlock}
                    >
                      <h4>{b.name} &mdash; Terms and Conditions</h4>
                      <div dangerouslySetInnerHTML={{ __html: b.terms }} />
                    </div>
                  ))}
                </div>
                <div className={styles.termsCheckRow}>
                  <input
                    type="checkbox"
                    id="sched-terms"
                    checked={termsAccepted}
                    onChange={() => {
                      if (!termsViewed) {
                        setTermsNudge(true);
                        setTimeout(() => setTermsNudge(false), 2000);
                      } else {
                        setTermsAccepted(prev => !prev);
                      }
                    }}
                    className={
                      !termsViewed ? styles.termsCheckboxLocked : undefined
                    }
                  />
                  <label htmlFor="sched-terms">
                    I have read and accept the terms and conditions
                  </label>
                  {termsViewed && (
                    <span className={styles.viewedBadge}>&#10003; Viewed</span>
                  )}
                </div>
                {!termsViewed && termsNudge && (
                  <p className={styles.termsHint}>
                    Please view the full terms and conditions before accepting.
                  </p>
                )}
              </div>
            )}

            {/* Section 3: Signature */}
            <div className={styles.sigSection}>
              <div>
                <label className={styles.sigLabel} htmlFor="review-sig-name">
                  Customer Name
                </label>
                <input
                  id="review-sig-name"
                  type="text"
                  className={styles.sigNameInput}
                  value={signedBy}
                  onChange={e => setSignedBy(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div>
                <p className={styles.sigSectionLabel}>Customer Signature</p>
                <div className={styles.sigCanvasWrap}>
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      width: 640,
                      height: 160,
                      style: { width: '100%', height: 160, display: 'block' },
                    }}
                    backgroundColor="white"
                    onEnd={() => setSigHasContent(true)}
                  />
                </div>
                <button
                  type="button"
                  className={styles.sigClear}
                  onClick={() => {
                    signatureRef.current?.clear();
                    setSigHasContent(false);
                  }}
                >
                  Clear signature
                </button>
                <p className={styles.sigDate}>Date: {todayLabel}</p>
              </div>
            </div>

            {/* Error + footer */}
            {errorMsg && <p className={styles.sigError}>{errorMsg}</p>}
            <div className={styles.sigFooter}>
              <button
                type="button"
                className={styles.sigCancelBtn}
                onClick={() => setShowSigModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.sigConfirmBtn}
                onClick={handleScheduleSubmit}
                disabled={
                  isBusy || (hasTerms && !termsAccepted) || !sigHasContent
                }
              >
                {isBusy ? 'Scheduling\u2026' : 'Schedule Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
