'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { MapPlotData } from '@/components/FieldMap/MapPlot/types';
import { MapPlotCanvas } from '@/components/FieldMap/MapPlot/MapPlotCanvas/MapPlotCanvas';
import VideoLightbox from '@/components/Quote/QuoteContent/VideoLightbox';
import type { QuoteLineItem } from './QuoteBuildStep';
import { formatCurrency, formatLineItemLabel, getQuoteTotals } from './QuoteBuildStep';
import qcStyles from '@/components/Quote/QuoteContent/quotecontent.module.scss';
import styles from './ReviewStep.module.scss';

// ── FAQ item (same as PlanDetails) ────────────────────────────────────────

function FaqItem({ faq }: { faq: { question: string; answer: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`${qcStyles.faqItem} ${isOpen ? qcStyles.active : ''}`}>
      <div className={qcStyles.faqHeader} onClick={() => setIsOpen(!isOpen)}>
        <p className={qcStyles.faqQuestion}>{faq.question}</p>
        <span className={qcStyles.faqIcon} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 9L12 15L18 9" stroke="#515151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      <div className={qcStyles.faqContent} style={{ maxHeight: isOpen ? '500px' : '0' }}>
        <div className={qcStyles.faqAnswer}><p>{faq.answer}</p></div>
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
    monthly: 'mo', quarterly: 'qtr', 'semi-annually': 'semi',
    'semi-annual': 'semi', annually: 'yr', annual: 'yr', 'bi-monthly': '2mo',
    'bi-annually': '6mo', 'one-time': 'once',
  };
  return frequency ? (abbr[frequency.toLowerCase()] ?? frequency) : 'mo';
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
  companyName: string;
  companyId: string;
  leadId: string | null;
  quoteId: string | null;
  onBack: () => void;
}

type ActionState = 'idle' | 'sending' | 'sent' | 'scheduling' | 'scheduled' | 'error';
type DiscountTarget = 'initial' | 'recurring' | 'both';

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
  companyName,
  companyId,
  leadId,
  quoteId,
  onBack,
}: ReviewStepProps) {
  const router = useRouter();
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [hasShadow, setHasShadow] = useState(false);

  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [brandingLoaded, setBrandingLoaded] = useState(false);
  // catalogDetails maps catalogItemId → full plan/addon data from the API
  const [catalogDetails, setCatalogDetails] = useState<Record<string, any>>({});
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [expandedAddonItems, setExpandedAddonItems] = useState<Set<string>>(new Set());
  const [activeFaqTab, setActiveFaqTab] = useState(0);
  const [videoLightboxUrl, setVideoLightboxUrl] = useState<string | null>(null);

  const [actionState, setActionState] = useState<ActionState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [enteredEmail, setEnteredEmail] = useState('');
  const [showSigModal, setShowSigModal] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const housePhoto = mapPlotData.housePhotos?.[0] ?? null;
  const [signedBy, setSignedBy] = useState(clientName || '');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState('');

  // Preferred date/time
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  // Terms
  const [termsViewed, setTermsViewed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsNudge, setTermsNudge] = useState(false);
  const termsBodyRef = useRef<HTMLDivElement | null>(null);
  const [discountTarget, setDiscountTarget] = useState<DiscountTarget>('initial');
  const [discountAmount, setDiscountAmount] = useState<number | null>(null);
  const [discountType, setDiscountType] = useState<'$' | '%'>('$');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    () => new Set(quoteLineItems.map(i => i.id))
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrices, setEditedPrices] = useState<Record<string, { initialCost: number; recurringCost: number }>>({});

  // ── Fetch branding ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) { setBrandingLoaded(true); return; }
    fetch(`/api/companies/${companyId}/field-map-branding`)
      .then(r => r.ok ? r.json() : null)
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

  // ── Fetch full catalog details for expandable plan cards ───────────────
  useEffect(() => {
    if (!companyId) return;
    const planAddonItems = quoteLineItems.filter(i => i.type === 'plan-addon' && i.catalogItemId);
    if (planAddonItems.length === 0) return;

    const hasPlan = planAddonItems.some(i => i.catalogItemKind === 'plan');
    const hasAddon = planAddonItems.some(i => i.catalogItemKind === 'addon');
    const hasBundle = planAddonItems.some(i => i.catalogItemKind === 'bundle');

    const fetches: Promise<any>[] = [];
    if (hasPlan) fetches.push(fetch(`/api/service-plans/${companyId}`).then(r => r.ok ? r.json() : null));
    else fetches.push(Promise.resolve(null));
    if (hasAddon) fetches.push(fetch(`/api/add-on-services/${companyId}`).then(r => r.ok ? r.json() : null));
    else fetches.push(Promise.resolve(null));
    if (hasBundle) fetches.push(fetch(`/api/admin/bundle-plans?companyId=${companyId}`).then(r => r.ok ? r.json() : null));
    else fetches.push(Promise.resolve(null));

    Promise.all(fetches).then(([plansRes, addonsRes, bundlesRes]) => {
      const details: Record<string, any> = {};
      (plansRes?.plans ?? []).forEach((p: any) => { details[p.id] = p; });
      (addonsRes?.addons ?? addonsRes?.data ?? []).forEach((a: any) => { details[a.id] = a; });
      (bundlesRes?.data ?? bundlesRes?.bundles ?? []).forEach((b: any) => { details[b.id] = b; });
      setCatalogDetails(details);
    }).catch(() => {}).finally(() => setCatalogLoaded(true));
  }, [companyId, quoteLineItems]);

  // If there are no plan-addon items, catalog is immediately loaded
  useEffect(() => {
    const hasPlanAddon = quoteLineItems.some(i => i.type === 'plan-addon' && i.catalogItemId);
    if (!hasPlanAddon) setCatalogLoaded(true);
  }, [quoteLineItems]);

  // ── Scroll-based header shadow ─────────────────────────────────────────
  // Depends on brandingLoaded+catalogLoaded so the effect re-runs once the
  // fullscreen div mounts (it doesn't exist while the spinner is showing)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleScroll = () => setHasShadow(el.scrollTop > 10);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [brandingLoaded, catalogLoaded]);

  // ── Terms scroll-to-view ───────────────────────────────────────────────
  useEffect(() => {
    if (!showSigModal) return;
    const el = termsBodyRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight) { setTermsViewed(true); return; }
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setTermsViewed(true);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [showSigModal]);

  const isLoading = !brandingLoaded || !catalogLoaded;

  const selectedItems = quoteLineItems.filter(i => selectedItemIds.has(i.id));

  // Apply edited prices over originals
  const effectiveItems = selectedItems.map(item => ({
    ...item,
    initialCost: editedPrices[item.id]?.initialCost ?? item.initialCost,
    recurringCost: editedPrices[item.id]?.recurringCost ?? item.recurringCost,
  }));

  const { totalInitial, totalRecurring, recurringByFrequency } = getQuoteTotals(effectiveItems);
  const todayLabel = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const firstName = clientName.trim().split(' ')[0] || 'Customer';
  const multipleItems = quoteLineItems.length > 1;

  function toggleItemSelected(id: string) {
    setSelectedItemIds(prev => {
      if (!prev.has(id)) return new Set([...prev, id]);
      // Prevent unchecking the last selected item
      if (prev.size <= 1) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleEditPrice(id: string, field: 'initialCost' | 'recurringCost', value: string) {
    const num = parseFloat(value);
    setEditedPrices(prev => ({
      ...prev,
      [id]: {
        initialCost: prev[id]?.initialCost ?? (quoteLineItems.find(i => i.id === id)?.initialCost ?? 0),
        recurringCost: prev[id]?.recurringCost ?? (quoteLineItems.find(i => i.id === id)?.recurringCost ?? 0),
        [field]: Number.isFinite(num) ? num : 0,
      },
    }));
  }

  function handleSaveEdit() {
    setIsEditing(false);
  }

  // Compute discount dollar amounts based on type ($ or %)
  const discountDollarInitial = discountAmount != null && (discountTarget === 'initial' || discountTarget === 'both')
    ? (discountType === '%' ? totalInitial * discountAmount / 100 : discountAmount)
    : 0;
  const discountDollarRecurring = discountAmount != null && (discountTarget === 'recurring' || discountTarget === 'both')
    ? (discountType === '%' ? totalRecurring * discountAmount / 100 : discountAmount)
    : 0;

  const adjustedInitial = Math.max(0, totalInitial - discountDollarInitial);
  const adjustedRecurring = Math.max(0, totalRecurring - discountDollarRecurring);

  // Brand CSS vars
  const isReversed = branding?.quote_accent_color_preference === 'secondary';
  const brandPrimary = branding ? (isReversed ? branding.secondary_color : branding.primary_color) : null;
  const brandSecondary = branding ? (isReversed ? branding.primary_color : branding.secondary_color) : null;
  const brandingStyle: React.CSSProperties = branding ? ({
    '--brand-primary': brandPrimary,
    '--brand-secondary': brandSecondary,
    '--accent-color': brandPrimary,
    // Override blue-500/primary-color with the first alternative color if set,
    // then secondary color, then leave unset so CSS falls back to blue-500
    '--blue-500': branding.alternative_color_1 ?? brandSecondary ?? undefined,
    '--primary-color': branding.alternative_color_1 ?? brandSecondary ?? undefined,
    '--color-text': branding.font_color ?? undefined,
    '--primary-font': branding.font_primary_name ?? undefined,
    '--secondary-font': branding.font_secondary_name ?? branding.font_primary_name ?? undefined,
  } as React.CSSProperties) : {};

  // ── API call ───────────────────────────────────────────────────────────
  const callSendQuoteApi = useCallback(async (emailOverride: string | null, sendEmail: boolean) => {
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
  }, [leadId, quoteId, companyId, clientEmail, clientName, inspectorName, companyName]);

  async function handleSendQuote() {
    if (!clientEmail && !showEmailInput) { setShowEmailInput(true); return; }
    setActionState('sending');
    setErrorMsg(null);
    try {
      await callSendQuoteApi(enteredEmail || null, true);
      setActionState('sent');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to connect to server');
      setActionState('error');
    }
  }

  async function handleScheduleSubmit() {
    if (hasTerms && !termsAccepted) {
      setErrorMsg('You must accept the terms and conditions before scheduling.');
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
    void handleSchedule('later', undefined, sig, preferredDate || null, preferredTime || null);
  }

  async function handleSchedule(
    option: 'now' | 'later' | 'someone_else',
    assignedTo?: string,
    sigOverride?: string,
    prefDate?: string | null,
    prefTime?: string | null,
  ) {
    setActionState('scheduling');
    setErrorMsg(null);
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
          preferredDate: prefDate ?? null,
          preferredTime: prefTime ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? 'Failed to schedule'); setActionState('error'); return; }
      if (option === 'now') { router.push(`/tickets/scheduling${data.leadId ? `?leadId=${data.leadId}` : ''}`); return; }
      setScheduleSuccessMsg(option === 'someone_else'
        ? 'A lead has been created and assigned for scheduling.'
        : 'A lead has been created and marked ready to schedule.');
      setActionState('scheduled');
    } catch {
      setErrorMsg('Failed to connect to server');
      setActionState('error');
    }
  }

  const isBusy = actionState === 'sending' || actionState === 'scheduling';

  // ── Terms content for unified schedule modal ───────────────────────────
  const companyTerms = branding?.quote_terms ?? null;
  const planTermsBlocks = quoteLineItems
    .filter(i => i.catalogItemId && catalogDetails[i.catalogItemId]?.plan_terms)
    .map(i => ({ name: i.catalogItemName ?? 'Plan', terms: catalogDetails[i.catalogItemId!].plan_terms as string }));
  const addonTermsBlocks = quoteLineItems
    .filter(i => i.catalogItemId && catalogDetails[i.catalogItemId]?.addon_terms)
    .map(i => ({ name: i.catalogItemName ?? 'Add-on', terms: catalogDetails[i.catalogItemId!].addon_terms as string }));
  const hasTerms = Boolean(companyTerms || planTermsBlocks.length > 0 || addonTermsBlocks.length > 0);

  const todayIso = new Date().toISOString().split('T')[0];

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
    if (Array.isArray(d.plan_features) && d.plan_features.length > 0) return true;
    // addon fields
    if (d.addon_description || d.addon_image_url) return true;
    if (Array.isArray(d.addon_features) && d.addon_features.length > 0) return true;
    // bundle fields
    if (d.bundle_description || d.bundle_image_url) return true;
    if (Array.isArray(d.bundle_features) && d.bundle_features.length > 0) return true;
    return false;
  }

  function toggleExpanded(id: string) {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAddonExpanded(id: string) {
    setExpandedAddonItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ── FAQ helpers ────────────────────────────────────────────────────────
  function getFaqsForItem(item: QuoteLineItem): Array<{ question: string; answer: string }> {
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
    return d.plan_name ?? d.addon_name ?? d.bundle_name ?? item.catalogItemName ?? formatLineItemLabel(item);
  }

  // Collect all FAQ sources (plans + addons that have faqs)
  const faqSources = quoteLineItems
    .filter(i => i.type === 'plan-addon' && getFaqsForItem(i).length > 0);
  const clampedFaqTab = Math.min(activeFaqTab, Math.max(0, faqSources.length - 1));

  // ── Loading spinner ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.fullscreen} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className={styles.successTitle}>Quote Sent!</h2>
          <p className={styles.successSub}>A lead has been created and the quote email is on its way.</p>
          <button type="button" className={styles.successBtn} onClick={() => router.push('/field-ops/field-map')}>
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 16l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className={styles.successTitle}>Ready to Schedule</h2>
          <p className={styles.successSub}>{scheduleSuccessMsg}</p>
          <button type="button" className={styles.successBtn} onClick={() => router.push('/field-ops/field-map')}>
            Back to Route
          </button>
        </div>
      </div>
    );
  }

  // ── Totals helpers ─────────────────────────────────────────────────────
  const billingFrequency = recurringByFrequency[0]?.frequency ?? 'monthly';
  const planItems = quoteLineItems.filter(i => i.catalogItemKind !== 'addon' || i.type === 'custom');
  const addonItems = quoteLineItems.filter(i => i.type === 'plan-addon' && i.catalogItemKind === 'addon');
  const customItems = quoteLineItems.filter(i => i.type === 'custom');

  // ── Main review page ───────────────────────────────────────────────────
  return (
    <>
      <div ref={scrollContainerRef} className={`${qcStyles.quoteContainer} ${styles.fullscreen}`} style={brandingStyle}>

        {/* ── Header with back button ── */}
        <div className={`${styles.reviewHeader} ${hasShadow ? styles.reviewHeaderScrolled : ''}`}>
          <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className={styles.reviewHeaderLogo}>
            {branding?.logo_url ? (
              <Image
                src={branding.logo_url}
                alt={branding.company_name || companyName}
                width={200}
                height={64}
                style={{ objectFit: 'contain', maxHeight: 64 }}
              />
            ) : (
              <span className={styles.reviewHeaderName}>{branding?.company_name || companyName}</span>
            )}
          </div>
          {/* spacer to keep logo centered */}
          <div style={{ width: 36, flexShrink: 0 }} />
        </div>

        {/* ── Hero ── */}
        <section className={`${qcStyles.heroSection} ${styles.heroSectionCompact}`}>
          <div className={qcStyles.heroContainer}>
            <div className={`${qcStyles.heroContent} ${styles.heroContentCentered}`}>
              <h1 className={qcStyles.heroTitle}>Your Quote Is Ready, {firstName}</h1>
              {pestTypes.length > 0 && (
                <div className={styles.heroPests}>
                  <p className={styles.heroPestsLabel}>Pests identified</p>
                  <div className={qcStyles.pestTags}>
                    {pestTypes.map(t => (
                      <span key={t} className={qcStyles.pestTag}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </span>
                    ))}
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
                    <p className={styles.inspectorTitle}>Lead Sales Inspector</p>
                  </div>
                </div>
                <div className={styles.inspectorSeparator} />
                <div className={styles.inspectorAddress}>
                  <p className={styles.inspectorAddressLabel}>Inspection<span className={styles.addressLabelBreak}><br /></span> Address:</p>
                  <div className={styles.inspectorAddressSeparator} />
                  <p className={styles.inspectorAddressValue}>
                    {(() => {
                      const comma = address.indexOf(',');
                      if (comma === -1) return address;
                      return <>{address.slice(0, comma)}<br />{address.slice(comma + 1).trim()}</>;
                    })()}
                  </p>
                </div>
              </div>
            </div>
            <div className={`${qcStyles.heroImage} ${styles.heroMapWrap}`} style={{ '--blue-500': '#3b82f6', '--primary-color': '#3b82f6' } as React.CSSProperties}>
              {/* Map layer — stays in normal flow so it drives container height */}
              <div className={styles.heroMapLayer} style={{ opacity: (showMapView || !housePhoto) ? 1 : 0 }}>
                <MapPlotCanvas mapPlotData={mapPlotData} onChange={() => {}} isReadOnly companyId={companyId} stampColor={brandPrimary ?? undefined} />
              </div>
              {/* House photo — absolutely overlaid, crossfades over the map */}
              {housePhoto && (
                <div className={`${styles.heroPhotoLayer} ${!showMapView ? styles.heroPhotoLayerVisible : ''}`}>
                  <Image src={housePhoto} alt="House photo" fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
              )}
              {/* "Switch To Pest Findings Map" — shown in photo view */}
              {housePhoto && !showMapView && (
                <button
                  type="button"
                  className={styles.heroViewToggleBtn}
                  style={{ color: brandPrimary ?? '#1D3D7C' }}
                  onClick={() => setShowMapView(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 22 22" fill="none">
                    <path d="M21 11C21 16.5228 16.5228 21 11 21M21 11C21 5.47715 16.5228 1 11 1M21 11H17M11 21C5.47715 21 1 16.5228 1 11M11 21V17M1 11C1 5.47715 5.47715 1 11 1M1 11H5M11 1V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 36 36" fill="none">
                    <path d="M23.1 12.9L12.9 23.1M12.9 12.9L23.1 23.1M35 18C35 27.3888 27.3888 35 18 35C8.61116 35 1 27.3888 1 18C1 8.61116 8.61116 1 18 1C27.3888 1 35 8.61116 35 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Content area ── */}
        <div className={qcStyles.contentArea}>

          {/* ── Plan cards (Plans / Bundles / Custom) ── */}
          {planItems.length > 0 && (
            <div className={qcStyles.plansContainer} id="pestProtectionPlans">
              <h2>Service Quote</h2>
              {planItems.map((item) => {
                const detail = getPlanContent(item);
                const hasContent = item.type === 'plan-addon' && planHasContent(item);
                const isExpanded = expandedItems.has(item.id);
                const isSelected = selectedItemIds.has(item.id);
                const isOnly = multipleItems && selectedItemIds.size === 1 && isSelected;

                const imageUrl = detail?.plan_image_url ?? detail?.bundle_image_url ?? null;
                const description = detail?.plan_description ?? detail?.bundle_description ?? null;
                const features: string[] = detail?.plan_features ?? detail?.bundle_features ?? [];
                const disclaimer: string | null = detail?.plan_disclaimer ?? null;
                const videoUrl: string | null = detail?.plan_video_url ?? null;

                return (
                  <div
                    key={item.id}
                    className={`${qcStyles.planCard} ${qcStyles.collapsible} ${isSelected ? qcStyles.selectedCard : ''} ${isExpanded ? qcStyles.expanded : ''}`}
                  >
                    <div
                      className={qcStyles.planHeader}
                      onClick={hasContent ? () => toggleExpanded(item.id) : undefined}
                      style={{ cursor: hasContent ? 'pointer' : 'default' }}
                    >
                      {multipleItems && (
                        <label className={`${qcStyles.addonCheckbox} ${isOnly ? qcStyles.addonCheckboxLastPlan : ''}`} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleItemSelected(item.id)} disabled={isOnly} />
                          <span className={`${qcStyles.addonCheckboxCustom} ${isOnly ? qcStyles.addonCheckboxDisabled : ''}`} />
                        </label>
                      )}
                      <h3 className={qcStyles.planHeaderTitle}>{formatLineItemLabel(item)}</h3>
                      <div className={qcStyles.addonHeaderRight}>
                        <div className={qcStyles.planHeaderPricing}>
                          {(item.recurringCost ?? 0) > 0 && (
                            <span className={qcStyles.planHeaderRecurring}>
                              <sup>$</sup>{(item.recurringCost ?? 0).toFixed(0)}
                              <span className={qcStyles.planRecurringFrequency}>/{abbreviateFrequency(item.frequency)}</span>
                            </span>
                          )}
                          {(item.recurringCost ?? 0) > 0 && (item.initialCost ?? 0) > 0 && (
                            <span className={qcStyles.planHeaderDivider}>|</span>
                          )}
                          {(item.initialCost ?? 0) > 0 && (
                            <span className={qcStyles.planHeaderInitial}>
                              <sup>$</sup>{(item.initialCost ?? 0).toFixed(0)}
                              <span className={qcStyles.initialText}> Initial</span>
                            </span>
                          )}
                        </div>
                        {hasContent && (
                          <span className={qcStyles.planHeaderIcon}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                              <circle cx="16" cy="16" r="16" fill="#000" />
                              <path d="M10 14L16 20L22 14" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>

                    {hasContent && (
                      <div className={qcStyles.planContentWrapper} style={{ maxHeight: isExpanded ? '3000px' : '0' }}>
                        <div className={qcStyles.planContent}>
                          <div className={qcStyles.planContentGrid}>
                            <div className={qcStyles.planContentLeft}>
                              {imageUrl && (
                                <div className={qcStyles.planImageWrapperMobile}>
                                  <Image src={imageUrl} alt={formatLineItemLabel(item)} fill className={qcStyles.planImage} />
                                </div>
                              )}
                              {description && <p className={qcStyles.planDescription}>{description}</p>}
                              {features.length > 0 && (
                                <div className={qcStyles.planIncluded}>
                                  <h4>What&apos;s Included:</h4>
                                  <ul className={qcStyles.featuresList}>
                                    {features.map((f, fi) => (
                                      <li key={fi} className={qcStyles.feature}>
                                        <span className={qcStyles.featureCheckmark}>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <g clipPath="url(#clip-rv)">
                                              <path d="M18.1678 8.33332C18.5484 10.2011 18.2772 12.1428 17.3994 13.8348C16.5216 15.5268 15.0902 16.8667 13.3441 17.6311C11.5979 18.3955 9.64252 18.5381 7.80391 18.0353C5.9653 17.5325 4.35465 16.4145 3.24056 14.8678C2.12646 13.3212 1.57626 11.4394 1.68171 9.53615C1.78717 7.63294 2.54189 5.8234 3.82004 4.4093C5.09818 2.9952 6.82248 2.06202 8.70538 1.76537C10.5883 1.46872 12.516 1.82654 14.167 2.77916" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                              <path d="M7.5 9.16659L10 11.6666L18.3333 3.33325" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </g>
                                            <defs><clipPath id="clip-rv"><rect width="20" height="20" fill="white" /></clipPath></defs>
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
                                  {(item.recurringCost ?? 0) > 0 && (
                                    <div className={qcStyles.priceLeft}>
                                      <div className={qcStyles.priceRecurring}>
                                        <sup>$</sup>{(item.recurringCost ?? 0).toFixed(0)}
                                        <sup className={qcStyles.priceAsterisk}>*</sup>
                                        <span className={qcStyles.priceFrequency}>/{abbreviateFrequency(item.frequency)}</span>
                                      </div>
                                    </div>
                                  )}
                                  {(item.initialCost ?? 0) > 0 && (
                                    <div className={qcStyles.priceRight}>
                                      <div className={qcStyles.priceInitial}>
                                        <span className={qcStyles.initialLabel}>Initial Only</span>
                                        <span className={qcStyles.priceNumber}><sup>$</sup>{(item.initialCost ?? 0).toFixed(0)}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {(disclaimer || videoUrl) && (
                                <div className={`${qcStyles.planDisclaimerVideoRow}${videoUrl ? ` ${qcStyles.hasVideo}` : ''}`}>
                                  {disclaimer && <div className={qcStyles.planDisclaimer}><p dangerouslySetInnerHTML={{ __html: disclaimer }} /></div>}
                                  {videoUrl && (
                                    <button type="button" className={qcStyles.planVideoThumbnail} onClick={() => setVideoLightboxUrl(videoUrl)} aria-label="Play plan video">
                                      <video src={videoUrl} muted preload="metadata" className={qcStyles.planVideoThumbnailVideo} />
                                      <span className={qcStyles.planVideoPlayOverlay}>
                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                          <circle cx="24" cy="24" r="24" fill="rgba(0,0,0,0.5)" />
                                          <path d="M19 16l14 8-14 8V16z" fill="white" />
                                        </svg>
                                      </span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className={qcStyles.planContentRight}>
                              <div className={qcStyles.planImageWrapper}>
                                {imageUrl ? (
                                  <Image src={imageUrl} alt={formatLineItemLabel(item)} fill className={qcStyles.planImage} />
                                ) : (
                                  <div className={qcStyles.planImagePlaceholder}>
                                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                                      <rect width="100" height="100" fill="#E5E7EB" />
                                      <path d="M50 30L60 50H40L50 30Z" fill="#9CA3AF" />
                                      <circle cx="50" cy="65" r="10" fill="#9CA3AF" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Add-On Services section ── */}
          {addonItems.length > 0 && (
            <div className={qcStyles.addonsSection}>
              <h2>Add-On Services</h2>
              {addonItems.map((item) => {
                const detail = getPlanContent(item);
                const hasContent = planHasContent(item);
                const isExpanded = expandedAddonItems.has(item.id);
                const isSelected = selectedItemIds.has(item.id);
                const isOnly = multipleItems && selectedItemIds.size === 1 && isSelected;

                const imageUrl = detail?.addon_image_url ?? null;
                const description = detail?.addon_description ?? null;
                const features: string[] = detail?.addon_features ?? [];

                return (
                  <div
                    key={item.id}
                    className={`${qcStyles.planCard} ${qcStyles.collapsible} ${isSelected ? qcStyles.selectedCard : ''} ${isExpanded ? qcStyles.expanded : ''}`}
                  >
                    <div
                      className={qcStyles.planHeader}
                      onClick={hasContent ? () => toggleAddonExpanded(item.id) : undefined}
                      style={{ cursor: hasContent ? 'pointer' : 'default' }}
                    >
                      <label className={`${qcStyles.addonCheckbox} ${isOnly ? qcStyles.addonCheckboxLastPlan : ''}`} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleItemSelected(item.id)} disabled={isOnly} />
                        <span className={`${qcStyles.addonCheckboxCustom} ${isOnly ? qcStyles.addonCheckboxDisabled : ''}`} />
                      </label>
                      <h3 className={qcStyles.planHeaderTitle}>{formatLineItemLabel(item)}</h3>
                      <div className={`${qcStyles.addonHeaderRight}${isSelected ? ` ${qcStyles.addonHeaderRightWithPill}` : ''}`}>
                        {isSelected && <span className={qcStyles.addedToPlanPill}>Added To Plan</span>}
                        <div className={qcStyles.planHeaderPricing}>
                          {(item.recurringCost ?? 0) > 0 && (
                            <span className={qcStyles.planHeaderRecurring}>
                              <sup>$</sup>{(item.recurringCost ?? 0).toFixed(0)}
                              <span className={qcStyles.planRecurringFrequency}>/{abbreviateFrequency(item.frequency)}</span>
                            </span>
                          )}
                          {(item.recurringCost ?? 0) > 0 && (item.initialCost ?? 0) > 0 && (
                            <span className={qcStyles.planHeaderDivider}>|</span>
                          )}
                          {(item.initialCost ?? 0) > 0 && (
                            <span className={qcStyles.planHeaderInitial}>
                              <sup>$</sup>{(item.initialCost ?? 0).toFixed(0)}
                              <span className={qcStyles.initialText}> Initial</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {hasContent && (
                        <span className={qcStyles.planHeaderIcon}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <circle cx="16" cy="16" r="16" fill="#000" />
                            <path d="M10 14L16 20L22 14" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </div>

                    {hasContent && (
                      <div className={qcStyles.planContentWrapper} style={{ maxHeight: isExpanded ? '3000px' : '0' }}>
                        <div className={qcStyles.planContent}>
                          {imageUrl && (
                            <div className={qcStyles.planImageWrapperMobile}>
                              <Image src={imageUrl} alt={formatLineItemLabel(item)} fill className={qcStyles.planImage} />
                            </div>
                          )}
                          {description && <p className={qcStyles.planDescription}>{description}</p>}
                          {features.length > 0 && (
                            <div className={qcStyles.planIncluded}>
                              <h4>What&apos;s Included:</h4>
                              <ul className={qcStyles.featuresList}>
                                {features.map((f, fi) => (
                                  <li key={fi} className={qcStyles.feature}>
                                    <span className={qcStyles.featureCheckmark}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <g clipPath="url(#clip-ao)">
                                          <path d="M18.1678 8.33332C18.5484 10.2011 18.2772 12.1428 17.3994 13.8348C16.5216 15.5268 15.0902 16.8667 13.3441 17.6311C11.5979 18.3955 9.64252 18.5381 7.80391 18.0353C5.9653 17.5325 4.35465 16.4145 3.24056 14.8678C2.12646 13.3212 1.57626 11.4394 1.68171 9.53615C1.78717 7.63294 2.54189 5.8234 3.82004 4.4093C5.09818 2.9952 6.82248 2.06202 8.70538 1.76537C10.5883 1.46872 12.516 1.82654 14.167 2.77916" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                          <path d="M7.5 9.16659L10 11.6666L18.3333 3.33325" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </g>
                                        <defs><clipPath id="clip-ao"><rect width="20" height="20" fill="white" /></clipPath></defs>
                                      </svg>
                                    </span>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Total pricing — matching QuoteTotalPricing exactly ── */}
          {quoteLineItems.length > 0 && (
            <div className={qcStyles.totalPricing}>
              <div className={styles.totalPricingHeader}>
                <h3>Customized Quote Total</h3>
                {isEditing ? (
                  <button type="button" className={styles.editSaveBtn} onClick={handleSaveEdit}>
                    Save
                  </button>
                ) : (
                  <button type="button" className={styles.editSaveBtn} onClick={() => setIsEditing(true)}>
                    Edit
                  </button>
                )}
              </div>

              {/* Total Initial Cost row */}
              <div className={qcStyles.totalRow}>
                <div>Total Initial Cost:</div>
                <strong><sup>$</sup>{adjustedInitial.toFixed(0)}</strong>
                <div className={qcStyles.totalListWrapper}>
                  <ul className={qcStyles.totalItemsList}>
                    {/* Plans & bundles */}
                    {(planItems.length > 0 || customItems.length > 0) && (
                      <li className={qcStyles.totalSectionLabel}>Services</li>
                    )}
                    {planItems.map(item => {
                      const isSelected = selectedItemIds.has(item.id);
                      const isOnly = multipleItems && selectedItemIds.size === 1 && isSelected;
                      const effRecurring = editedPrices[item.id]?.recurringCost ?? (item.recurringCost ?? 0);
                      const effInitial = editedPrices[item.id]?.initialCost ?? (item.initialCost ?? 0);
                      return (
                        <li key={item.id} className={`${qcStyles.totalItem} ${!isSelected ? qcStyles.totalItemUnselected : ''}`}>
                          <span className={qcStyles.totalItemLeft}>
                            {multipleItems ? (
                              <label className={`${qcStyles.addonCheckbox} ${isOnly ? qcStyles.addonCheckboxLastPlan : ''}`}>
                                <input type="checkbox" checked={isSelected} onChange={() => toggleItemSelected(item.id)} disabled={isOnly} />
                                <span className={`${qcStyles.addonCheckboxCustom} ${isOnly ? qcStyles.addonCheckboxDisabled : ''}`} />
                              </label>
                            ) : (
                              <span className={qcStyles.totalItemCheckmark}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="11" viewBox="0 0 13 11" fill="none">
                                  <path d="M1 7.04907L3.5 9.64154L11.8333 1" stroke="#0072DA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            )}
                            {formatLineItemLabel(item)}
                          </span>
                          <span className={qcStyles.totalItemPrice}>
                            {isEditing ? (
                              <span className={styles.priceEditGroup}>
                                {(item.recurringCost ?? 0) > 0 && (
                                  <span className={styles.priceEditCol}>
                                    <span className={styles.priceEditColLabel}>Recurring</span>
                                    <span className={styles.priceEditField}>
                                      <span className={styles.priceEditPrefix}>$</span>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        className={styles.priceEditInput}
                                        value={effRecurring}
                                        onChange={e => handleEditPrice(item.id, 'recurringCost', e.target.value)}
                                      />
                                      <span className={styles.priceEditSuffix}>/{abbreviateFrequency(item.frequency)}</span>
                                    </span>
                                  </span>
                                )}
                                {(item.initialCost ?? 0) > 0 && (
                                  <span className={styles.priceEditCol}>
                                    <span className={styles.priceEditColLabel}>Initial</span>
                                    <span className={styles.priceEditField}>
                                      <span className={styles.priceEditPrefix}>$</span>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        className={styles.priceEditInput}
                                        value={effInitial}
                                        onChange={e => handleEditPrice(item.id, 'initialCost', e.target.value)}
                                      />
                                    </span>
                                  </span>
                                )}
                              </span>
                            ) : (
                              <>
                                {effRecurring > 0 && (
                                  <span className={qcStyles.totalItemPriceRecurring}>
                                    <span className={qcStyles.totalItemPriceAmount}>${effRecurring.toFixed(0)}</span>
                                    <span className={qcStyles.totalItemPriceFreq}>/{abbreviateFrequency(item.frequency)}</span>
                                  </span>
                                )}
                                {effRecurring > 0 && effInitial > 0 && (
                                  <span className={qcStyles.totalItemPriceRecurring}>&nbsp;&middot;&nbsp;</span>
                                )}
                                {effInitial > 0 && (
                                  <span className={qcStyles.totalItemPriceInitial}>
                                    <span className={qcStyles.totalItemPriceAmount}>${effInitial.toFixed(0)}</span>
                                    <span className={qcStyles.totalItemPriceFreq}> initial</span>
                                  </span>
                                )}
                              </>
                            )}
                          </span>
                        </li>
                      );
                    })}
                    {/* Add-ons */}
                    {addonItems.length > 0 && (
                      <li className={qcStyles.totalSectionLabel}>Add-Ons</li>
                    )}
                    {addonItems.map(item => {
                      const isSelected = selectedItemIds.has(item.id);
                      const isOnly = multipleItems && selectedItemIds.size === 1 && isSelected;
                      const effRecurring = editedPrices[item.id]?.recurringCost ?? (item.recurringCost ?? 0);
                      const effInitial = editedPrices[item.id]?.initialCost ?? (item.initialCost ?? 0);
                      return (
                        <li key={item.id} className={`${qcStyles.totalItem} ${!isSelected ? qcStyles.totalItemUnselected : ''}`}>
                          <span className={qcStyles.totalItemLeft}>
                            <label className={`${qcStyles.addonCheckbox} ${isOnly ? qcStyles.addonCheckboxLastPlan : ''}`}>
                              <input type="checkbox" checked={isSelected} onChange={() => toggleItemSelected(item.id)} disabled={isOnly} />
                              <span className={`${qcStyles.addonCheckboxCustom} ${isOnly ? qcStyles.addonCheckboxDisabled : ''}`} />
                            </label>
                            {formatLineItemLabel(item)}
                          </span>
                          <span className={qcStyles.totalItemPrice}>
                            {isEditing ? (
                              <span className={styles.priceEditGroup}>
                                {(item.recurringCost ?? 0) > 0 && (
                                  <span className={styles.priceEditCol}>
                                    <span className={styles.priceEditColLabel}>Recurring</span>
                                    <span className={styles.priceEditField}>
                                      <span className={styles.priceEditPrefix}>$</span>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        className={styles.priceEditInput}
                                        value={effRecurring}
                                        onChange={e => handleEditPrice(item.id, 'recurringCost', e.target.value)}
                                      />
                                      <span className={styles.priceEditSuffix}>/{abbreviateFrequency(item.frequency)}</span>
                                    </span>
                                  </span>
                                )}
                                {(item.initialCost ?? 0) > 0 && (
                                  <span className={styles.priceEditCol}>
                                    <span className={styles.priceEditColLabel}>Initial</span>
                                    <span className={styles.priceEditField}>
                                      <span className={styles.priceEditPrefix}>$</span>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        className={styles.priceEditInput}
                                        value={effInitial}
                                        onChange={e => handleEditPrice(item.id, 'initialCost', e.target.value)}
                                      />
                                    </span>
                                  </span>
                                )}
                              </span>
                            ) : (
                              <>
                                {effRecurring > 0 && (
                                  <span className={qcStyles.totalItemPriceRecurring}>
                                    <span className={qcStyles.totalItemPriceAmount}>${effRecurring.toFixed(0)}</span>
                                    <span className={qcStyles.totalItemPriceFreq}>/{abbreviateFrequency(item.frequency)}</span>
                                  </span>
                                )}
                                {effRecurring > 0 && effInitial > 0 && (
                                  <span className={qcStyles.totalItemPriceRecurring}>&nbsp;&middot;&nbsp;</span>
                                )}
                                {effInitial > 0 && (
                                  <span className={qcStyles.totalItemPriceInitial}>
                                    <span className={qcStyles.totalItemPriceAmount}>${effInitial.toFixed(0)}</span>
                                    <span className={qcStyles.totalItemPriceFreq}> initial</span>
                                  </span>
                                )}
                              </>
                            )}
                          </span>
                        </li>
                      );
                    })}
                    {/* Discount row in list */}
                    {discountDollarInitial > 0 && (discountTarget === 'initial' || discountTarget === 'both') && (
                      <li className={`${qcStyles.totalItem} ${styles.discountItem}`}>
                        <span className={qcStyles.totalItemLeft}>Discount</span>
                        <span>-{formatCurrency(discountDollarInitial)}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Discount controls — only visible in edit mode */}
              {isEditing && (
                <div className={styles.discountRow}>
                  <p className={styles.discountLabel}>Apply discount</p>
                  <div className={styles.discountControls}>
                    <select
                      className={styles.discountSelect}
                      value={discountTarget}
                      onChange={e => setDiscountTarget(e.target.value as DiscountTarget)}
                    >
                      <option value="initial">On initial</option>
                      <option value="recurring">On recurring</option>
                      <option value="both">On both</option>
                    </select>
                    <div className={styles.discountTypeToggle}>
                      <button
                        type="button"
                        className={`${styles.discountTypeBtn} ${discountType === '$' ? styles.discountTypeBtnActive : ''}`}
                        onClick={() => setDiscountType('$')}
                      >
                        $
                      </button>
                      <button
                        type="button"
                        className={`${styles.discountTypeBtn} ${discountType === '%' ? styles.discountTypeBtnActive : ''}`}
                        onClick={() => setDiscountType('%')}
                      >
                        %
                      </button>
                    </div>
                    <div className={styles.discountInputWrap}>
                      <span className={styles.discountSign}>{discountType}</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        className={styles.discountInput}
                        placeholder="0.00"
                        value={discountAmount ?? ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          setDiscountAmount(Number.isFinite(val) ? val : null);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Total Recurring Cost — one row per frequency */}
              {recurringByFrequency.map(({ frequency, total }) => {
                // Apply recurring discount proportionally across frequency groups
                const adjusted = totalRecurring > 0 && discountDollarRecurring > 0
                  ? Math.max(0, total * (adjustedRecurring / totalRecurring))
                  : total;
                return (
                  <div key={frequency} className={qcStyles.totalRow}>
                    <div>Total Recurring Cost:</div>
                    <span>
                      <strong><sup>$</sup>{adjusted.toFixed(0)}</strong>
                      <span className={qcStyles.totalRowFreq}>/{abbreviateFrequency(frequency)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── FAQs ── */}
          {faqSources.length > 0 && (
            <div className={qcStyles.faqsSection}>
              {faqSources.length === 1 ? (
                <>
                  <h2 className={`${qcStyles.faqsTitle} ${styles.faqsTitleOverride}`}>Frequently Asked Questions</h2>
                  <div className={qcStyles.faqsContainer}>
                    {getFaqsForItem(faqSources[0]).map((faq: { question: string; answer: string }, fi: number) => (
                      <FaqItem key={fi} faq={faq} />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2 className={`${qcStyles.faqsTitle} ${styles.faqsTitleOverride}`}>Frequently Asked Questions</h2>
                  <div className={qcStyles.faqDropdownContainer}>
                    <label htmlFor="rv-faq-select" className={qcStyles.faqDropdownLabel}>Choose A Plan To View FAQs:</label>
                    <select id="rv-faq-select" className={qcStyles.faqDropdown} value={clampedFaqTab} onChange={e => setActiveFaqTab(Number(e.target.value))}>
                      {faqSources.map((item, ti) => (
                        <option key={ti} value={ti}>{getItemDisplayName(item)}</option>
                      ))}
                    </select>
                  </div>
                  <div className={qcStyles.faqsLayoutGrid}>
                    <div className={qcStyles.faqsSidebar}>
                      {faqSources.map((item, ti) => (
                        <button key={ti} className={`${qcStyles.faqTabButton} ${clampedFaqTab === ti ? qcStyles.faqTabButtonActive : ''}`} onClick={() => setActiveFaqTab(ti)}>
                          {getItemDisplayName(item)}
                        </button>
                      ))}
                    </div>
                    <div className={qcStyles.faqsContainer}>
                      {getFaqsForItem(faqSources[clampedFaqTab]).map((faq: { question: string; answer: string }, fi: number) => (
                        <FaqItem key={fi} faq={faq} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div className={styles.notesSection}>
              <p className={styles.notesLabel}>Inspector Notes</p>
              <p className={styles.notesText}>{notes}</p>
            </div>
          )}

          {/* Error */}
          {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

          {/* Email capture */}
          {showEmailInput && (
            <div className={styles.emailCapture}>
              <input
                type="email"
                className={styles.emailInput}
                value={enteredEmail}
                onChange={e => setEnteredEmail(e.target.value)}
                placeholder="customer@example.com"
              />
              <button
                type="button"
                className={styles.emailSendBtn}
                disabled={!enteredEmail.trim() || isBusy}
                onClick={handleSendQuote}
              >
                Send
              </button>
            </div>
          )}

          <div className={styles.actionSpacer} />
        </div>

        {/* ── Sticky action bar ── */}
        <div className={styles.stickyActions}>
          <div className={styles.stickyActionsInner}>
            <button type="button" className={styles.sendBtn} onClick={() => {
              setErrorMsg(null);
              setTermsViewed(false);
              setTermsAccepted(false);
              setTermsNudge(false);
              setPreferredDate('');
              setPreferredTime('');
              signatureRef.current?.clear();
              setShowSigModal(true);
            }} disabled={isBusy || !companyId}>
              {actionState === 'scheduling' ? 'Scheduling…' : 'Schedule Service'}
            </button>
            <button type="button" className={styles.scheduleBtn} onClick={handleSendQuote} disabled={isBusy}>
              {actionState === 'sending' ? 'Sending…' : 'Send Quote'}
            </button>
          </div>
        </div>
      </div>

      {/* Video lightbox */}
      {videoLightboxUrl && (
        <VideoLightbox videoUrl={videoLightboxUrl} onClose={() => setVideoLightboxUrl(null)} />
      )}

      {/* Unified Schedule Service modal */}
      {showSigModal && (
        <div className={styles.sigOverlay} onClick={e => { if (e.target === e.currentTarget) setShowSigModal(false); }}>
          <div className={styles.sigSheet}>

            {/* Header */}
            <div className={styles.sigHeader}>
              <h3 className={styles.sigTitle}>Schedule Service</h3>
              <button type="button" className={styles.sigCloseBtn} onClick={() => setShowSigModal(false)} aria-label="Close">&#215;</button>
            </div>

            {/* Section 1: Preferred date & time */}
            <div className={styles.sigSection}>
              <p className={styles.sigSectionLabel}>Preferred Date &amp; Time</p>
              <div className={styles.sigDateRow}>
                <input
                  type="date"
                  className={styles.sigDateInput}
                  min={todayIso}
                  value={preferredDate}
                  onChange={e => setPreferredDate(e.target.value)}
                />
                <select
                  className={styles.sigTimeSelect}
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                >
                  <option value="">No preference</option>
                  <option value="morning">Morning (8am&ndash;12pm)</option>
                  <option value="afternoon">Afternoon (12pm&ndash;5pm)</option>
                  <option value="evening">Evening (5pm&ndash;8pm)</option>
                  <option value="anytime">Anytime</option>
                </select>
              </div>
            </div>

            {/* Section 2: Terms & Conditions */}
            {hasTerms && (
              <div className={styles.sigSection}>
                <p className={styles.sigSectionLabel}>Terms &amp; Conditions</p>
                <div className={styles.termsBody} ref={termsBodyRef}>
                  {companyTerms && <div dangerouslySetInnerHTML={{ __html: companyTerms }} />}
                  {planTermsBlocks.map((b, i) => (
                    <div key={`plan-t-${i}`} className={styles.specificTermsBlock}>
                      <h4>{b.name} &mdash; Terms and Conditions</h4>
                      <div dangerouslySetInnerHTML={{ __html: b.terms }} />
                    </div>
                  ))}
                  {addonTermsBlocks.map((b, i) => (
                    <div key={`addon-t-${i}`} className={styles.specificTermsBlock}>
                      <h4>{b.name} &mdash; Terms and Conditions</h4>
                      <div dangerouslySetInnerHTML={{ __html: b.terms }} />
                    </div>
                  ))}
                </div>
                <div
                  className={styles.termsCheckRow}
                  onClick={() => {
                    if (!termsViewed) {
                      setTermsNudge(true);
                      setTimeout(() => setTermsNudge(false), 2000);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    id="sched-terms"
                    checked={termsAccepted}
                    disabled={!termsViewed}
                    onChange={e => { if (termsViewed) setTermsAccepted(e.target.checked); }}
                  />
                  <label htmlFor="sched-terms">
                    I have read and accept the terms and conditions
                    {!termsViewed && termsNudge && (
                      <span className={styles.termsHint}> &mdash; Scroll to the bottom first</span>
                    )}
                  </label>
                  {termsViewed && <span className={styles.viewedBadge}>&#10003; Viewed</span>}
                </div>
              </div>
            )}

            {/* Section 3: Signature */}
            <div className={styles.sigSection}>
              <p className={styles.sigSectionLabel}>Customer Signature</p>
              <div>
                <label className={styles.sigLabel} htmlFor="review-sig-name">Customer Name</label>
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
                <div className={styles.sigCanvasWrap}>
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{ width: 640, height: 160, style: { width: '100%', height: 160, display: 'block' } }}
                    backgroundColor="white"
                  />
                </div>
                <button type="button" className={styles.sigClear} onClick={() => signatureRef.current?.clear()}>Clear signature</button>
                <p className={styles.sigDate}>Date: {todayLabel}</p>
              </div>
            </div>

            {/* Error + footer */}
            {errorMsg && <p className={styles.sigError}>{errorMsg}</p>}
            <div className={styles.sigFooter}>
              <button type="button" className={styles.sigCancelBtn} onClick={() => setShowSigModal(false)}>Cancel</button>
              <button
                type="button"
                className={styles.sigConfirmBtn}
                onClick={handleScheduleSubmit}
                disabled={isBusy || (hasTerms && !termsAccepted)}
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
