'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import { getClientDeviceData } from '@/lib/device-utils';
import { formatHomeSizeRange, formatYardSizeRange } from '@/lib/display-utils';
import HeaderSection from './HeaderSection';
import styles from './quotecontent.module.scss';
import HeroSection from './HeroSection';
import FooterSection from './FooterSection';
import QuoteServicePanel from '@/components/Quote/QuoteServicePanel/QuoteServicePanel';
import type { PlanContent } from '@/components/Quote/QuoteServicePanel/QuoteServicePanel';
import type { QuoteLineItem } from '@/components/FieldMap/ServiceWizard/steps/QuoteBuildStep';
import {
  getPestStampType,
  formatLineItemLabel,
} from '@/components/FieldMap/ServiceWizard/steps/QuoteBuildStep';
import { getPlottedPests } from '@/components/FieldMap/ServiceWizard/steps/MapPlotStep';
import { MapStampGlyph } from '@/components/FieldMap/MapPlot/glyphs';
import Link from 'next/link';
import {
  TimeOption,
  DEFAULT_TIME_OPTIONS,
  getEnabledTimeOptions,
} from '@/lib/time-options';

interface AlternativeColor {
  hex: string;
  cmyk: string;
  name: string;
  pantone: string;
}

interface Branding {
  primary_color: string;
  secondary_color: string;
  alternative_colors: AlternativeColor[];
  logo_url: string;
  icon_logo_url: string;
  font_color?: string | null;
  font_primary_name?: string;
  font_secondary_name?: string;
  primary_hero_image_url?: string | null;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  website: any;
  privacy_policy_url: string;
  terms_conditions_url: string;
  quote_terms: string;
  quote_thanks_content: string;
  wisetack_enabled?: boolean;
  wisetack_url?: string;
  quote_accent_color_preference?: 'primary' | 'secondary';
  time_options?: TimeOption[];
}

interface Quote {
  id: string;
  primary_pest: string;
  additional_pests: string[];
  total_initial_price: number;
  total_recurring_price: number;
  line_items: QuoteLineItem[];
  signed_at: string | null;
  home_size_range: string | null;
  yard_size_range: string | null;
  customer_comments?: string | null;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  service_address: {
    street_address: string;
    apartment_unit: string | null;
    city: string;
    state: string;
    zip_code: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  lead: {
    id: string;
    lead_status: string;
    service_type: string;
    comments: string;
    requested_date: string | null;
    requested_time: string | null;
    map_plot_data?: any;
  };
  featured_plans?: Array<{
    id: string;
    plan_name: string;
    billing_frequency: string | null;
    initial_price: number | null;
    recurring_price: number | null;
    plan_description: string | null;
    plan_features: string[];
    plan_image_url: string | null;
  }>;
  inspector?: {
    name: string;
    title: string | null;
    avatar_url: string | null;
  } | null;
}

interface QuoteStepsProps {
  company: Company;
  branding: Branding | null;
  quote: Quote;
  token: string | null;
}

export default function QuoteContent({
  company,
  branding,
  quote,
  token,
}: QuoteStepsProps) {
  const [showThankYou, setShowThankYou] = useState(!!quote.signed_at);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const [preferredDate, setPreferredDate] = useState(
    quote.lead.requested_date || ''
  );
  const [preferredTime, setPreferredTime] = useState(
    quote.lead.requested_time || ''
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [termsViewed, setTermsViewed] = useState(false);
  const [termsNudge, setTermsNudge] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string>(
    '/images/quote-hero-placeholder.svg'
  );
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [additionalLineItems, setAdditionalLineItems] = useState<
    QuoteLineItem[]
  >([]);
  const [featuredPlans, setFeaturedPlans] = useState(
    quote.featured_plans ?? []
  );
  const [expandedFeaturedId, setExpandedFeaturedId] = useState<string | null>(
    null
  );

  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    () =>
      new Set(
        quote.line_items.filter(i => i.isSelected !== false).map(i => i.id)
      )
  );

  const effectiveLineItems = [...quote.line_items, ...additionalLineItems];

  const multipleItems =
    effectiveLineItems.filter(i => i.catalogItemKind !== 'addon').length > 1;

  const getContent = (item: QuoteLineItem): PlanContent | null =>
    (item as any).planContent ?? null;

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => {
      const item = effectiveLineItems.find(i => i.id === id);
      if (prev.has(id)) {
        if (item?.catalogItemKind !== 'addon') {
          const planCount = [...prev].filter(sid =>
            effectiveLineItems.find(
              i => i.id === sid && i.catalogItemKind !== 'addon'
            )
          ).length;
          if (planCount <= 1) return prev;
        }
        const next = new Set(prev);
        next.delete(id);
        return next;
      }
      return new Set([...prev, id]);
    });
  };

  const toggleRecommendedAddon = (id: string, siblingIds: string[]) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      siblingIds.forEach(sibId => {
        if (sibId !== id) next.delete(sibId);
      });
      if (prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  async function handleAddFeaturedPlan(plan: (typeof featuredPlans)[number]) {
    const tempId = crypto.randomUUID();
    const newItem: QuoteLineItem = {
      id: tempId,
      type: 'plan-addon',
      catalogItemKind: 'plan',
      catalogItemId: plan.id,
      catalogItemName: plan.plan_name,
      coveredPestIds: [],
      coveredPestLabels: [],
      initialCost: plan.initial_price ?? 0,
      recurringCost: plan.recurring_price ?? 0,
      frequency: plan.billing_frequency ?? 'monthly',
      isPrimary: true,
      isSelected: true,
    };

    setAdditionalLineItems(prev => [...prev, newItem]);
    setSelectedItemIds(prev => new Set([...prev, tempId]));
    setFeaturedPlans(prev => prev.filter(p => p.id !== plan.id));

    try {
      const res = await fetch(`/api/quotes/${quote.id}/line-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_plan_id: plan.id,
          plan_name: plan.plan_name,
          initial_price: plan.initial_price ?? 0,
          recurring_price: plan.recurring_price ?? 0,
          billing_frequency: plan.billing_frequency ?? 'monthly',
          display_order: quote.line_items.length + additionalLineItems.length,
        }),
      });

      if (!res.ok) throw new Error('Failed to add plan');

      const data = await res.json();
      const realId: string = data?.id ?? data?.data?.id ?? tempId;

      setAdditionalLineItems(prev =>
        prev.map(i => (i.id === tempId ? { ...i, id: realId } : i))
      );
      setSelectedItemIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        next.add(realId);
        return next;
      });
    } catch {
      setAdditionalLineItems(prev => prev.filter(i => i.id !== tempId));
      setSelectedItemIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      setFeaturedPlans(prev => [...prev, plan]);
    }
  }

  function renderRecommendedAddonsForItem(
    item: QuoteLineItem
  ): React.ReactNode {
    const addonItems = quote.line_items.filter(
      i => i.catalogItemKind === 'addon'
    );
    const recommendedAddons = addonItems.filter(
      a => a.parentLineItemId === item.id && a.isRecommended !== undefined
    );
    if (recommendedAddons.length === 0) return null;

    return (
      <div className={styles.planCardAddons}>
        <div className={styles.planCardAddonBtnGroup}>
          {recommendedAddons.map(addon => {
            const isChecked = selectedItemIds.has(addon.id);
            const recurringCost = addon.recurringCost ?? 0;
            const initialCost = addon.initialCost ?? 0;
            const freqAbbr: Record<string, string> = {
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
            const freq = addon.frequency
              ? (freqAbbr[addon.frequency.toLowerCase()] ?? addon.frequency)
              : 'mo';
            const priceLabel =
              recurringCost > 0
                ? `$${recurringCost.toFixed(0)}/${freq}`
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
                      recommendedAddons.map(a => a.id)
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

  const [interestedInFinancing, setInterestedInFinancing] = useState(false);
  const [pestIconMap, setPestIconMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(
      `/api/pest-options/${encodeURIComponent(company.id)}?context=fieldmap`
    )
      .then(r => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (data?.success && Array.isArray(data.data)) {
          const iconMap: Record<string, string> = {};
          for (const opt of data.data) {
            if (opt.id && opt.icon_svg) iconMap[opt.id] = opt.icon_svg;
          }
          setPestIconMap(iconMap);
        }
      })
      .catch(() => {});
  }, [company.id]);

  const signatureRef = useRef<SignatureCanvas>(null);
  const termsModalBodyRef = useRef<HTMLDivElement>(null);

  // Mark terms as viewed when schedule modal opens:
  // - immediately if content doesn't overflow (no scrolling needed)
  // - only after scrolling to the bottom if it does overflow
  useEffect(() => {
    if (!scheduleModalOpen) return;

    const el = termsModalBodyRef.current;
    if (!el) return;

    if (el.scrollHeight <= el.clientHeight) {
      setTermsViewed(true);
      return;
    }

    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
        setTermsViewed(true);
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scheduleModalOpen]);

  const mapPlotData = quote.lead?.map_plot_data ?? null;
  const plottedPests = mapPlotData ? getPlottedPests(mapPlotData) : [];

  const inspectionAddress = quote.service_address
    ? [
        quote.service_address.street_address,
        [
          quote.service_address.city,
          quote.service_address.state,
          quote.service_address.zip_code,
        ]
          .filter(Boolean)
          .join(', '),
      ]
        .filter(Boolean)
        .join(', ')
    : ((mapPlotData as any)?.addressInput ?? null);

  function renderPlanHeaderPestIcon(item: QuoteLineItem): React.ReactNode {
    const content = getContent(item) as any;
    const pestCoverage: Array<{ pest_id: string }> =
      content?.pest_coverage ?? [];
    const catalogCoveredIds = pestCoverage.map((c: any) => c.pest_id);
    if (catalogCoveredIds.length === 0) return null;

    const coveredPlotted = plottedPests.filter(p =>
      catalogCoveredIds.includes(p.id)
    );
    if (coveredPlotted.length === 0) return null;

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
    const iconSvg = pestIconMap[pestId] ?? null;
    const stampType = singlePest?.stampType ?? getPestStampType(pestId);

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

  function abbreviateFreq(frequency: string | null): string {
    const abbr: Record<string, string> = {
      monthly: 'mo',
      quarterly: 'qtr',
      'semi-annually': 'semi',
      annually: 'yr',
      annual: 'yr',
      'one-time': 'once',
    };
    return frequency ? (abbr[frequency.toLowerCase()] ?? frequency) : 'mo';
  }

  const heroContent = {
    title: `Your Custom Pest Protection Plan Is Ready, ${quote.customer.first_name}`,
    subtitle:
      quote.service_address?.street_address && quote.service_address?.city
        ? `Protect your home and family at <strong>${quote.service_address.street_address} in ${quote.service_address.city}</strong> from a local company trusted for over 50 years.`
        : `Protect your home and family from a local company trusted for over 50 years.`,
    imageUrl: branding?.primary_hero_image_url ?? null,
  };

  const footer_links = {
    privacyUrl: company.privacy_policy_url,
    termsUrl: company.terms_conditions_url,
  };

  const footer_branding = {
    logoUrl: branding?.logo_url ?? null,
    companyName: company.name,
    phoneNumber: company.phone,
    email: company.email,
  };

  // Update lead scheduling when date/time changes
  const updateLeadSchedule = async (
    field: 'requested_date' | 'requested_time',
    value: string
  ) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/leads/${quote.lead.id}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [field]: value || null,
          quote_id: quote.id,
          token: token,
        }),
      });

      if (!response.ok) {
        console.error('Failed to update lead schedule');
      }
    } catch (err) {
      console.error('Error updating lead schedule:', err);
    }
  };

  // Generate Street View or Satellite image URL for hero section
  useEffect(() => {
    const generateHeroImage = async () => {
      if (!quote.service_address) return;

      try {
        const apiKeyResponse = await fetch('/api/google-places-key');
        if (!apiKeyResponse.ok) return;
        const apiKeyData = await apiKeyResponse.json();
        const apiKey = apiKeyData.apiKey;
        if (!apiKey) return;

        let locationParam: string;
        if (quote.service_address.latitude && quote.service_address.longitude) {
          locationParam = `${quote.service_address.latitude},${quote.service_address.longitude}`;
        } else {
          const addressString = `${quote.service_address.street_address}, ${quote.service_address.city}, ${quote.service_address.state} ${quote.service_address.zip_code}`;
          locationParam = encodeURIComponent(addressString);
        }

        const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${locationParam}&key=${apiKey}`;
        const metadataResponse = await fetch(metadataUrl);
        const metadata = await metadataResponse.json();

        if (metadata.status === 'OK') {
          const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=420x600&location=${locationParam}&key=${apiKey}`;
          setHeroImageUrl(streetViewUrl);
        } else {
          const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${locationParam}&zoom=18&size=420x600&maptype=satellite&key=${apiKey}`;
          setHeroImageUrl(satelliteUrl);
        }
      } catch {
        // Keep default placeholder on error
      }
    };

    generateHeroImage();
  }, [
    quote.service_address?.latitude,
    quote.service_address?.longitude,
    quote.service_address?.street_address,
  ]);

  // Apply branding colors and font via CSS variables
  const isReversed = company.quote_accent_color_preference === 'secondary';
  const brandingStyle = {
    '--brand-primary': isReversed
      ? branding?.secondary_color
      : branding?.primary_color,
    '--brand-secondary': isReversed
      ? branding?.primary_color
      : branding?.secondary_color,
    '--accent-color': isReversed
      ? branding?.secondary_color
      : branding?.primary_color,
    '--color-text': branding?.font_color || undefined,
    '--primary-font': branding?.font_primary_name,
    '--secondary-font':
      branding?.font_secondary_name || branding?.font_primary_name,
  } as React.CSSProperties;

  // Handle form submission
  const handleSubmit = async () => {
    if (!token) {
      setError('Invalid or missing access token.');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the terms and conditions to continue.');
      return;
    }

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError('Please provide your signature.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const signatureData = signatureRef.current.toDataURL();
      const clientDeviceData = getClientDeviceData();

      const response = await fetch(`/api/quotes/${quote.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_data: signatureData,
          terms_accepted: termsAccepted,
          token: token,
          preferred_date: preferredDate,
          preferred_time: preferredTime,
          selected_addon_ids: quote.line_items
            .filter(
              i =>
                selectedItemIds.has(i.id) &&
                i.catalogItemKind === 'addon' &&
                i.catalogItemId
            )
            .map(i => i.catalogItemId as string),
          selected_plan_ids: effectiveLineItems
            .filter(
              i => selectedItemIds.has(i.id) && i.catalogItemKind !== 'addon'
            )
            .map(i => i.id),
          interested_in_financing: interestedInFinancing,
          client_device_data: clientDeviceData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept quote');
      }

      setScheduleModalOpen(false);
      setShowThankYou(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setHasSignature(false);
    }
  };

  const featuredPlansSection =
    featuredPlans.length > 0 ? (
      <section className={styles.additionalServicesSection}>
        <div className={styles.plansContainer} style={{ marginBottom: 0 }}>
          <h2>Additional Services We Offer</h2>
          {featuredPlans.map(plan => {
            const isExpanded = expandedFeaturedId === plan.id;
            const isOneTime =
              plan.billing_frequency === 'one-time' || !plan.recurring_price;
            const features: string[] = plan.plan_features ?? [];
            const imageUrl = plan.plan_image_url ?? null;
            const description = plan.plan_description ?? null;
            const recurringPrice = plan.recurring_price ?? 0;
            const initialPrice = plan.initial_price ?? 0;
            const hasContent = !!(
              description ||
              features.length > 0 ||
              imageUrl
            );

            return (
              <div
                key={plan.id}
                className={`${styles.planCard} ${styles.collapsible}${isExpanded ? ` ${styles.expanded}` : ''}`}
              >
                <div
                  className={styles.planHeader}
                  onClick={
                    hasContent
                      ? () =>
                          setExpandedFeaturedId(prev =>
                            prev === plan.id ? null : plan.id
                          )
                      : undefined
                  }
                  style={{ cursor: hasContent ? 'pointer' : 'default' }}
                >
                  <label
                    className={styles.addonCheckbox}
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => handleAddFeaturedPlan(plan)}
                    />
                    <span className={styles.addonCheckboxCustom} />
                  </label>

                  <div>
                    <h3 className={styles.planHeaderTitle}>{plan.plan_name}</h3>
                  </div>

                  <div className={styles.addonHeaderRight}>
                    {isOneTime && initialPrice ? (
                      <span className={styles.additionalServicePrice}>
                        From <sup>$</sup>
                        <span className={styles.additionalServicePriceNumber}>
                          {initialPrice.toFixed(0)}
                        </span>
                      </span>
                    ) : recurringPrice ? (
                      <span className={styles.additionalServicePrice}>
                        From <sup>$</sup>
                        <span className={styles.additionalServicePriceNumber}>
                          {recurringPrice.toFixed(0)}
                        </span>
                        /{abbreviateFreq(plan.billing_frequency)}
                      </span>
                    ) : null}
                    {hasContent && (
                      <span className={styles.planHeaderIcon}>
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
                    className={styles.planContentWrapper}
                    style={{ maxHeight: isExpanded ? '3000px' : '0' }}
                  >
                    <div className={styles.planContent}>
                      {description && (
                        <p className={styles.planDescription}>{description}</p>
                      )}
                      <div className={styles.planContentGrid}>
                        <div className={styles.planContentLeft}>
                          {features.length > 0 && (
                            <div className={styles.planIncluded}>
                              <h4>What&apos;s Included:</h4>
                              <ul className={styles.featuresList}>
                                {features.map((f, fi) => (
                                  <li key={fi} className={styles.feature}>
                                    <span className={styles.featureCheckmark}>
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
                          <div className={styles.pricingSection}>
                            <div className={styles.priceContainer}>
                              {!isOneTime && recurringPrice > 0 && (
                                <div className={styles.priceLeft}>
                                  <div className={styles.priceRecurring}>
                                    <sup>$</sup>
                                    {recurringPrice.toFixed(0)}
                                    <sup className={styles.priceAsterisk}>
                                      *
                                    </sup>
                                    <span className={styles.priceFrequency}>
                                      /{abbreviateFreq(plan.billing_frequency)}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {initialPrice > 0 && (
                                <div
                                  className={
                                    isOneTime
                                      ? styles.priceLeft
                                      : styles.priceRight
                                  }
                                >
                                  <div className={styles.priceRecurring}>
                                    <sup>$</sup>
                                    {initialPrice.toFixed(0)}
                                    {!isOneTime && recurringPrice > 0 && (
                                      <span className={styles.priceFrequency}>
                                        /Initial
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {imageUrl && (
                          <div className={styles.planContentRight}>
                            <div className={styles.planImageWrapper}>
                              <Image
                                src={imageUrl}
                                alt={plan.plan_name}
                                fill
                                className={styles.planImage}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    ) : null;

  return (
    <div className={styles.quoteContainer} style={brandingStyle}>
      <HeaderSection
        logo={branding?.logo_url}
        companyName={company.name}
        buttonText={company.phone}
        phoneNumber={company.phone}
        removeBackground={false}
      />

      {/* Single-page quote view */}
      {!showThankYou && (
        <>
          <HeroSection
            hero={heroContent}
            companyId={company.id}
            mapPlotData={mapPlotData}
            brandPrimary={branding?.primary_color ?? null}
          >
            {/* Pests Identified + Inspector Card (shown when inspection data exists) */}
            {(plottedPests.length > 0 || quote.inspector) && (
              <div className={styles.inspectionSummary}>
                {plottedPests.length > 0 && (
                  <div className={styles.heroPests}>
                    <p className={styles.heroPestsLabel}>Pests Identified</p>
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

                {quote.inspector && (
                  <div className={styles.inspectorCard}>
                    <div className={styles.inspectorInfo}>
                      {quote.inspector.avatar_url ? (
                        <Image
                          src={quote.inspector.avatar_url}
                          alt={quote.inspector.name}
                          width={57}
                          height={57}
                          className={styles.inspectorAvatar}
                        />
                      ) : (
                        <div className={styles.inspectorAvatarFallback}>
                          {quote.inspector.name.charAt(0)}
                        </div>
                      )}
                      <div className={styles.inspectorText}>
                        <p className={styles.inspectorName}>
                          {quote.inspector.name}
                        </p>
                        <p className={styles.inspectorTitle}>
                          {quote.inspector.title || 'Lead Sales Inspector'}
                        </p>
                      </div>
                    </div>
                    {inspectionAddress && (
                      <>
                        <div className={styles.inspectorSeparator} />
                        <div className={styles.inspectorAddress}>
                          <p className={styles.inspectorAddressLabel}>
                            Inspection Address:
                          </p>
                          <div className={styles.inspectorAddressSeparator} />
                          <p className={styles.inspectorAddressValue}>
                            {inspectionAddress}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </HeroSection>

          <div className={styles.quoteStep}>
            <div className={styles.contentArea}>
              <QuoteServicePanel
                quoteLineItems={effectiveLineItems}
                selectedItemIds={selectedItemIds}
                onToggleItem={toggleItem}
                expandedItemId={expandedItemId}
                onSetExpandedItem={id =>
                  setExpandedItemId(prev => (prev === id ? null : id))
                }
                getContent={getContent}
                multipleItems={multipleItems}
                showTotals={true}
                showFaqs={true}
                renderPlanHeaderExtra={renderPlanHeaderPestIcon}
                onToggleRecommendedAddon={toggleRecommendedAddon}
                renderRecommendedAddons={renderRecommendedAddonsForItem}
                renderAfterItems={featuredPlansSection}
              />
              <div className={styles.continueButtonWrapper}>
                <button
                  className={styles.ctaButton}
                  onClick={() => setScheduleModalOpen(true)}
                >
                  Schedule Service
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Thank You */}
      {showThankYou && (
        <div className={styles.quoteStep}>
          <div className={styles.quoteStepContent}>
            <div className={styles.contentArea}>
              <div className={styles.completionHeader}>
                <h2>Thank You, {quote.customer.first_name}!</h2>
              </div>

              <div className={styles.summaryItem}>
                <div
                  className={styles.summaryContent}
                  dangerouslySetInnerHTML={{
                    __html: company.quote_thanks_content,
                  }}
                />
                <div className={styles.buttonWrapper}>
                  <Link href={company.website} className={styles.primaryButton}>
                    Return To Website
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Service Modal */}
      {scheduleModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setScheduleModalOpen(false)}
        >
          <div
            className={styles.scheduleModal}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.scheduleModalHeader}>
              <h3>Schedule Service</h3>
              <button
                type="button"
                className={styles.scheduleModalCloseBtn}
                onClick={() => setScheduleModalOpen(false)}
              >
                &#215;
              </button>
            </div>

            {/* Scrollable body */}
            <div className={styles.scheduleModalBody}>
              {/* Preferred Day & Time */}
              <div className={styles.scheduleModalSection}>
                <p className={styles.scheduleModalSectionLabel}>
                  Preferred Day &amp; Time
                </p>
                <div className={styles.scheduleDateRow}>
                  <select
                    value={preferredDate}
                    onChange={e => {
                      const val = e.target.value;
                      setPreferredDate(val);
                      updateLeadSchedule('requested_date', val);
                    }}
                  >
                    <option value="">No preference</option>
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                  </select>
                  <select
                    value={preferredTime}
                    onChange={e => {
                      const val = e.target.value;
                      setPreferredTime(val);
                      updateLeadSchedule('requested_time', val);
                    }}
                  >
                    <option value="">Select a time...</option>
                    {getEnabledTimeOptions(
                      company.time_options || DEFAULT_TIME_OPTIONS
                    ).map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className={styles.scheduleModalSection}>
                <p className={styles.scheduleModalSectionLabel}>
                  Terms &amp; Conditions
                  {termsViewed && (
                    <span
                      className={styles.viewedBadge}
                      style={{ marginLeft: 12 }}
                    >
                      &#10003; Viewed
                    </span>
                  )}
                </p>
                <div
                  className={styles.scheduleModalTermsBody}
                  ref={termsModalBodyRef}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: company.quote_terms }}
                  />
                  {quote.line_items
                    .filter(item => (item as any).planContent?.plan_terms)
                    .map((item, i) => (
                      <div
                        key={`plan-terms-${i}`}
                        className={styles.specificTermsBlock}
                      >
                        <h4>
                          {(item as any).planContent.plan_name} &mdash; Terms
                          and Conditions
                        </h4>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: (item as any).planContent.plan_terms,
                          }}
                        />
                      </div>
                    ))}
                  {quote.line_items
                    .filter(
                      item =>
                        selectedItemIds.has(item.id) &&
                        (item as any).planContent?.addon_terms
                    )
                    .map((item, i) => (
                      <div
                        key={`addon-terms-${i}`}
                        className={styles.specificTermsBlock}
                      >
                        <h4>
                          {(item as any).planContent.plan_name} &mdash; Terms
                          and Conditions
                        </h4>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: (item as any).planContent.addon_terms,
                          }}
                        />
                      </div>
                    ))}
                </div>
                <div
                  className={styles.checkboxGroup}
                  onClick={() => {
                    if (!termsViewed) {
                      setTermsNudge(true);
                      setTimeout(() => setTermsNudge(false), 2000);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    id="schedule-terms-checkbox"
                    checked={termsAccepted}
                    onChange={e => {
                      if (!termsViewed) {
                        setTermsNudge(true);
                        setTimeout(() => setTermsNudge(false), 2000);
                        return;
                      }
                      setTermsAccepted(e.target.checked);
                    }}
                  />
                  <label
                    htmlFor="schedule-terms-checkbox"
                    className={`${styles.termsLabel} ${termsNudge ? styles.viewTermsNudge : ''}`}
                  >
                    I have read and accept the terms and conditions
                    {!termsViewed && termsNudge && (
                      <span className={styles.termsHint}>
                        {' '}
                        &mdash; You must scroll through the terms first
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Signature */}
              <div className={styles.scheduleModalSection}>
                <p className={styles.scheduleModalSectionLabel}>Signature</p>
                <p className={styles.signatureInstruction}>
                  Please sign in the box below using your mouse or finger
                </p>
                <div className={styles.sigCanvasWrap}>
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{ className: styles.signaturePad }}
                    onEnd={() => setHasSignature(true)}
                  />
                </div>
                <div className={styles.signatureActions}>
                  <p className={styles.signingDate}>
                    Signing on {new Date().toLocaleDateString()}
                  </p>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className={styles.secondaryButton}
                  >
                    Clear Signature
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.scheduleModalFooter}>
              {error && (
                <div
                  className={styles.error}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  {error}
                </div>
              )}
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.primaryButton} ${styles.submitButton}`}
                onClick={handleSubmit}
                disabled={isSubmitting || !termsAccepted || !hasSignature}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Agreement'}
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterSection links={footer_links} branding={footer_branding} />
    </div>
  );
}
