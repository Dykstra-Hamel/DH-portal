'use client';

import { useState } from 'react';
import Image from 'next/image';
import VideoLightbox from '@/components/Quote/QuoteContent/VideoLightbox';
import type { QuoteLineItem } from '@/components/FieldMap/ServiceWizard/steps/QuoteBuildStep';
import {
  formatLineItemLabel,
  getQuoteTotals,
} from '@/components/FieldMap/ServiceWizard/steps/QuoteBuildStep';
import { toMonthlyEquivalent } from '@/lib/pricing-calculations';
import qcStyles from '@/components/Quote/QuoteContent/quotecontent.module.scss';
import styles from './QuoteServicePanel.module.scss';

// ── Types ───────────────────────────────────────────────────────────────────

export interface PlanContent {
  plan_name?: string | null;
  plan_description?: string | null;
  plan_features?: string[];
  plan_faqs?: Array<{ question: string; answer: string }>;
  plan_image_url?: string | null;
  plan_video_url?: string | null;
  plan_disclaimer?: string | null;
  plan_terms?: string | null;
  pest_coverage?: Array<{ pest_id: string }>;
  bundle_features?: string[];
  bundle_image_url?: string | null;
  bundle_description?: string | null;
  bundled_plans_with_faqs?: any[];
  addon_description?: string | null;
  addon_faqs?: Array<{ question: string; answer: string }>;
  addon_terms?: string | null;
}

export interface QuoteServicePanelProps {
  quoteLineItems: QuoteLineItem[];
  selectedItemIds: Set<string>;
  onToggleItem: (id: string) => void;
  expandedItemId: string | null;
  onSetExpandedItem: (id: string | null) => void;
  getContent: (item: QuoteLineItem) => PlanContent | null;
  onToggleRecommendedAddon?: (id: string, siblingIds: string[]) => void;
  renderPlanHeaderExtra?: (item: QuoteLineItem) => React.ReactNode;
  renderRecommendedAddons?: (item: QuoteLineItem) => React.ReactNode;
  appliedDiscountName?: string | null;
  appliedDiscountDisplay?: string | null;
  showDiscountRow?: boolean;
  quoteSubtotalInitial?: number | null;
  quoteTotalInitial?: number | null;
  multipleItems?: boolean;
  /** Whether to render the totals panel (default: true) */
  showTotals?: boolean;
  /** Whether to render the FAQ section (default: true) */
  showFaqs?: boolean;
  /** Content rendered between the addon cards and the totals panel */
  renderAfterItems?: React.ReactNode;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── FAQ Item ─────────────────────────────────────────────────────────────────

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

// ── Main Component ───────────────────────────────────────────────────────────

export default function QuoteServicePanel({
  quoteLineItems,
  selectedItemIds,
  onToggleItem,
  expandedItemId,
  onSetExpandedItem,
  getContent,
  onToggleRecommendedAddon,
  renderPlanHeaderExtra,
  renderRecommendedAddons,
  appliedDiscountName,
  appliedDiscountDisplay,
  showDiscountRow,
  quoteSubtotalInitial,
  quoteTotalInitial,
  multipleItems,
  showTotals = true,
  showFaqs = true,
  renderAfterItems,
}: QuoteServicePanelProps) {
  const [videoLightboxUrl, setVideoLightboxUrl] = useState<string | null>(null);
  const [activeFaqTab, setActiveFaqTab] = useState(0);

  const planItems = quoteLineItems.filter(
    i =>
      i.catalogItemKind !== 'addon' &&
      i.catalogItemKind !== 'product' &&
      i.catalogItemKind !== 'specialty-line'
  );
  const addonItems = quoteLineItems.filter(i => i.catalogItemKind === 'addon');

  // ── Totals ──────────────────────────────────────────────────────────────

  const selectedItems = quoteLineItems.filter(i => {
    if (!selectedItemIds.has(i.id)) return false;
    if (i.catalogItemKind === 'specialty-line' && i.parentLineItemId) {
      return selectedItemIds.has(i.parentLineItemId);
    }
    return true;
  });

  const { totalInitial, totalRecurring, recurringByFrequency } = getQuoteTotals(
    selectedItems.map(i => ({ ...i, isSelected: true }))
  );

  const displaySubtotal = quoteSubtotalInitial ?? totalInitial;
  const displayTotal = quoteTotalInitial ?? totalInitial;

  // ── FAQ helpers ──────────────────────────────────────────────────────────

  function getFaqsForItem(
    item: QuoteLineItem
  ): Array<{ question: string; answer: string }> {
    const d = getContent(item);
    if (!d) return [];
    if (item.catalogItemKind === 'addon') return d.addon_faqs ?? [];
    if (item.catalogItemKind === 'bundle') {
      const faqs: Array<{ question: string; answer: string }> = [];
      d.bundled_plans_with_faqs?.forEach((p: any) => {
        if (p.plan_faqs) faqs.push(...p.plan_faqs);
      });
      return faqs;
    }
    return d.plan_faqs ?? [];
  }

  function getItemDisplayName(item: QuoteLineItem): string {
    const d = getContent(item);
    return d?.plan_name ?? item.catalogItemName ?? formatLineItemLabel(item);
  }

  function planHasContent(item: QuoteLineItem): boolean {
    const d = getContent(item);
    if (!d) return false;
    if (d.plan_description || d.plan_image_url || d.plan_video_url) return true;
    if (Array.isArray(d.plan_features) && d.plan_features.length > 0)
      return true;
    if (d.addon_description) return true;
    if (d.bundle_description || d.bundle_image_url) return true;
    if (Array.isArray(d.bundle_features) && d.bundle_features.length > 0)
      return true;
    return false;
  }

  const faqSources = quoteLineItems.filter(
    i => i.type === 'plan-addon' && getFaqsForItem(i).length > 0
  );
  const clampedFaqTab = Math.min(
    activeFaqTab,
    Math.max(0, faqSources.length - 1)
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={qcStyles.contentAreaInner}>
      {/* ── Plan cards ── */}
      {planItems.length > 0 && (
        <div className={qcStyles.plansContainer} id="pestProtectionPlans">
          <h2>Quoted Services</h2>
          {planItems.map(item => {
            const detail = getContent(item);
            const hasContent =
              item.type === 'plan-addon' && planHasContent(item);
            const hasRecommended = addonItems.some(
              a =>
                a.parentLineItemId === item.id && a.isRecommended !== undefined
            );
            const isExpandable = hasContent || hasRecommended;
            const isExpanded = expandedItemId === item.id;
            const isSelected = selectedItemIds.has(item.id);
            const isOnly =
              multipleItems && selectedItemIds.size === 1 && isSelected;

            const imageUrl =
              detail?.plan_image_url ?? detail?.bundle_image_url ?? null;
            const description =
              detail?.plan_description ?? detail?.bundle_description ?? null;
            const features: string[] =
              detail?.plan_features ?? detail?.bundle_features ?? [];
            const disclaimer = detail?.plan_disclaimer ?? null;
            const videoUrl = detail?.plan_video_url ?? null;

            const productChildren = quoteLineItems.filter(
              c =>
                c.catalogItemKind === 'product' &&
                c.parentLineItemId === item.id
            );
            const selectedAddonChildren = addonItems.filter(
              a => a.parentLineItemId === item.id && selectedItemIds.has(a.id)
            );
            const specialtyLineChildren = quoteLineItems.filter(
              c =>
                c.catalogItemKind === 'specialty-line' &&
                c.parentLineItemId === item.id
            );
            const displaySpecialtyChildren = specialtyLineChildren.filter(c =>
              selectedItemIds.has(c.id)
            );

            const aggInitial =
              (item.initialCost ?? 0) +
              productChildren.reduce((s, c) => s + (c.initialCost ?? 0), 0) +
              selectedAddonChildren.reduce(
                (s, a) => s + (a.initialCost ?? 0),
                0
              ) +
              displaySpecialtyChildren.reduce(
                (s, c) => s + (c.initialCost ?? 0),
                0
              );
            const aggRecurring =
              (item.recurringCost ?? 0) +
              productChildren.reduce((s, c) => s + (c.recurringCost ?? 0), 0) +
              selectedAddonChildren.reduce(
                (s, a) => s + (a.recurringCost ?? 0),
                0
              );

            return (
              <div
                key={item.id}
                className={`${qcStyles.planCard} ${qcStyles.collapsible} ${isExpanded ? qcStyles.expanded : ''}`}
              >
                <div
                  className={qcStyles.planHeader}
                  onClick={
                    isExpandable
                      ? () => onSetExpandedItem(isExpanded ? null : item.id)
                      : undefined
                  }
                  style={{ cursor: isExpandable ? 'pointer' : 'default' }}
                >
                  {multipleItems && (
                    <label
                      className={`${qcStyles.addonCheckbox} ${isOnly ? qcStyles.addonCheckboxLastPlan : ''}`}
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleItem(item.id)}
                        disabled={isOnly}
                      />
                      <span
                        className={`${qcStyles.addonCheckboxCustom} ${isOnly ? qcStyles.addonCheckboxDisabled : ''}`}
                      />
                    </label>
                  )}
                  {renderPlanHeaderExtra?.(item)}
                  <div>
                    <h3 className={qcStyles.planHeaderTitle}>
                      {formatLineItemLabel(item)}
                    </h3>
                  </div>
                  <div
                    className={`${qcStyles.addonHeaderRight}${isSelected ? ` ${qcStyles.addonHeaderRightWithPill}` : ''}`}
                  >
                    {isSelected && (
                      <span className={qcStyles.addedToPlanPill}>
                        Added To Plan
                      </span>
                    )}
                    <div className={qcStyles.planHeaderPricing}>
                      {aggRecurring > 0 && (
                        <span className={qcStyles.planHeaderRecurring}>
                          <sup>$</sup>
                          {aggRecurring.toFixed(0)}
                          <span className={qcStyles.planRecurringFrequency}>
                            /{abbreviateFrequency(item.frequency)}
                          </span>
                        </span>
                      )}
                      {aggRecurring > 0 && aggInitial > 0 && (
                        <span className={qcStyles.planHeaderDivider}>|</span>
                      )}
                      {aggInitial > 0 && (
                        <span className={qcStyles.planHeaderInitial}>
                          <sup>$</sup>
                          {aggInitial.toFixed(0)}
                          {aggRecurring > 0 && (
                            <span className={qcStyles.initialText}>
                              {item.frequency === 'one-time'
                                ? ' One Time'
                                : ' Initial'}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    {isExpandable && (
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

                {isExpandable && (
                  <div
                    className={qcStyles.planContentWrapper}
                    style={{ maxHeight: isExpanded ? '3000px' : '0' }}
                  >
                    {hasContent && (
                      <div className={qcStyles.planContent}>
                        <div className={qcStyles.planContentGrid}>
                          {description && (
                            <p className={qcStyles.planDescription}>
                              {description}
                            </p>
                          )}
                          <div className={qcStyles.planContentLeft}>
                            {features.length > 0 && (
                              <div className={qcStyles.planIncluded}>
                                <h4>What&apos;s Included:</h4>
                                <ul className={qcStyles.featuresList}>
                                  {features.map((f, fi) => (
                                    <li key={fi} className={qcStyles.feature}>
                                      <span
                                        className={qcStyles.featureCheckmark}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="20"
                                          height="20"
                                          viewBox="0 0 20 20"
                                          fill="none"
                                        >
                                          <g clipPath="url(#clip-qsp)">
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
                                            <clipPath id="clip-qsp">
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
                                {aggRecurring > 0 && (
                                  <div className={qcStyles.priceLeft}>
                                    <div className={qcStyles.priceRecurring}>
                                      <sup>$</sup>
                                      {aggRecurring.toFixed(0)}
                                      <sup className={qcStyles.priceAsterisk}>
                                        *
                                      </sup>
                                      <span className={qcStyles.priceFrequency}>
                                        /{abbreviateFrequency(item.frequency)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {aggInitial > 0 && (
                                  <div
                                    className={
                                      item.frequency === 'one-time' ||
                                      aggRecurring === 0
                                        ? qcStyles.priceLeft
                                        : qcStyles.priceRight
                                    }
                                  >
                                    <div className={qcStyles.priceRecurring}>
                                      <sup>$</sup>
                                      {aggInitial.toFixed(0)}
                                      {item.frequency !== 'one-time' &&
                                        aggRecurring > 0 && (
                                          <span
                                            className={qcStyles.priceFrequency}
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
                                  alt={formatLineItemLabel(item)}
                                  fill
                                  className={qcStyles.planImage}
                                />
                              </div>
                            )}
                            {videoUrl && (
                              <button
                                type="button"
                                className={styles.planVideoCallout}
                                onClick={() => setVideoLightboxUrl(videoUrl)}
                                aria-label="Play plan video"
                              >
                                <span className={styles.planVideoCalloutText}>
                                  Watch Our Service Video
                                </span>
                                <span className={styles.planVideoCalloutPlay}>
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
                    )}
                    {renderRecommendedAddons?.(item)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Non-recommended add-ons */}
          {addonItems
            .filter(i => i.isRecommended === undefined)
            .map(addon => {
              const isChecked = selectedItemIds.has(addon.id);
              const isOnly =
                multipleItems && selectedItemIds.size === 1 && isChecked;
              return (
                <div
                  key={addon.id}
                  className={`${qcStyles.planCard} ${qcStyles.collapsible}`}
                >
                  <div className={qcStyles.planHeader}>
                    <label
                      className={`${qcStyles.addonCheckbox} ${isOnly ? qcStyles.addonCheckboxLastPlan : ''}`}
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleItem(addon.id)}
                        disabled={isOnly}
                      />
                      <span
                        className={`${qcStyles.addonCheckboxCustom} ${isOnly ? qcStyles.addonCheckboxDisabled : ''}`}
                      />
                    </label>
                    <div>
                      <h3 className={qcStyles.planHeaderTitle}>
                        {formatLineItemLabel(addon)}
                      </h3>
                    </div>
                    <div className={qcStyles.addonHeaderRight}>
                      <div className={qcStyles.planHeaderPricing}>
                        {(addon.recurringCost ?? 0) > 0 && (
                          <span className={qcStyles.planHeaderRecurring}>
                            <sup>$</sup>
                            {(addon.recurringCost ?? 0).toFixed(0)}
                            <span className={qcStyles.planRecurringFrequency}>
                              /{abbreviateFrequency(addon.frequency)}
                            </span>
                          </span>
                        )}
                        {(addon.recurringCost ?? 0) > 0 &&
                          (addon.initialCost ?? 0) > 0 && (
                            <span className={qcStyles.planHeaderDivider}>
                              |
                            </span>
                          )}
                        {(addon.initialCost ?? 0) > 0 && (
                          <span className={qcStyles.planHeaderInitial}>
                            <sup>$</sup>
                            {(addon.initialCost ?? 0).toFixed(0)}
                            {(addon.recurringCost ?? 0) > 0 && (
                              <span className={qcStyles.initialText}>
                                {' '}
                                Initial
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {renderAfterItems}

      {/* ── Totals panel ── */}
      {showTotals && quoteLineItems.length > 0 && (
        <div className={qcStyles.totalPricing}>
          <div className={styles.totalPricingHeader}>
            <h3>Customized Quote Total</h3>
          </div>

          <div className={qcStyles.totalListWrapper}>
            <div className={qcStyles.totalItemsList}>
              {planItems.length > 0 && (
                <div className={qcStyles.totalSectionLabel}>Services</div>
              )}
              {planItems.map(item => {
                const isSelected = selectedItemIds.has(item.id);
                const isOnly =
                  multipleItems && selectedItemIds.size === 1 && isSelected;
                const childAddons = addonItems.filter(
                  a => a.parentLineItemId === item.id
                );
                const productChildren = quoteLineItems.filter(
                  c =>
                    c.catalogItemKind === 'product' &&
                    c.parentLineItemId === item.id
                );
                const selectedAddonChildren = childAddons.filter(a =>
                  selectedItemIds.has(a.id)
                );
                const totalSpecialtyChildren = quoteLineItems.filter(
                  c =>
                    c.catalogItemKind === 'specialty-line' &&
                    c.parentLineItemId === item.id
                );
                const selectedSpecialtyChildren = isSelected
                  ? totalSpecialtyChildren.filter(c =>
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
                  selectedSpecialtyChildren.reduce(
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
                              onChange={() => onToggleItem(item.id)}
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
                        {aggRecurring > 0 && (
                          <span className={qcStyles.totalItemPriceRecurring}>
                            <span className={qcStyles.totalItemPriceAmount}>
                              ${aggRecurring.toFixed(0)}
                            </span>
                            <span className={qcStyles.totalItemPriceFreq}>
                              /{abbreviateFrequency(item.frequency)}
                            </span>
                          </span>
                        )}
                        {aggInitial > 0 &&
                          (aggRecurring === 0 ? (
                            <span className={qcStyles.totalItemPriceAmount}>
                              ${aggInitial.toFixed(0)}
                            </span>
                          ) : (
                            <span className={qcStyles.totalItemPriceInitial}>
                              <span className={qcStyles.totalItemPriceAmount}>
                                ${aggInitial.toFixed(0)}
                              </span>
                              <span className={qcStyles.totalItemPriceFreq}>
                                {' '}
                                initial
                              </span>
                            </span>
                          ))}
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
                                  isRecommendedAddon && onToggleRecommendedAddon
                                    ? onToggleRecommendedAddon(
                                        addon.id,
                                        recommendedSiblingIds
                                      )
                                    : onToggleItem(addon.id)
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
                            {(addon.recurringCost ?? 0) > 0 && (
                              <span
                                className={qcStyles.totalItemPriceRecurring}
                              >
                                <span className={qcStyles.totalItemPriceAmount}>
                                  ${(addon.recurringCost ?? 0).toFixed(0)}
                                </span>
                                <span className={qcStyles.totalItemPriceFreq}>
                                  /{abbreviateFrequency(addon.frequency)}
                                </span>
                              </span>
                            )}
                            {(addon.initialCost ?? 0) > 0 &&
                              ((addon.recurringCost ?? 0) === 0 ? (
                                <span className={qcStyles.totalItemPriceAmount}>
                                  ${(addon.initialCost ?? 0).toFixed(0)}
                                </span>
                              ) : (
                                <span
                                  className={qcStyles.totalItemPriceInitial}
                                >
                                  <span
                                    className={qcStyles.totalItemPriceAmount}
                                  >
                                    ${(addon.initialCost ?? 0).toFixed(0)}
                                  </span>
                                  <span className={qcStyles.totalItemPriceFreq}>
                                    {' '}
                                    initial
                                  </span>
                                </span>
                              ))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Discount row */}
          {showDiscountRow && (
            <div
              className={`${qcStyles.totalRow} ${styles.discountAppliedRow}`}
            >
              <div>
                {appliedDiscountName
                  ? `${appliedDiscountName} - Discount Applied`
                  : 'Discount Applied'}
              </div>
              <strong>{appliedDiscountDisplay ?? ''}</strong>
            </div>
          )}

          {/* Total Initial Cost */}
          <div className={qcStyles.totalRow}>
            <div>Total Initial Cost:</div>
            <strong>
              <span
                className={showDiscountRow ? qcStyles.originalPriceText : ''}
              >
                {showDiscountRow && `$${displaySubtotal.toFixed(0)}`}
              </span>
              ${displayTotal.toFixed(0)}
            </strong>
          </div>

          {/* Monthly EZPay */}
          {recurringByFrequency.length > 0 &&
            (() => {
              const totalMonthly = recurringByFrequency.reduce(
                (sum, { frequency, total }) =>
                  sum + toMonthlyEquivalent(frequency, total),
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
      {showFaqs && faqSources.length > 0 && (
        <div className={qcStyles.faqsSection}>
          {faqSources.length === 1 ? (
            <>
              <h2 className={qcStyles.faqsTitle}>Frequently Asked Questions</h2>
              <div className={qcStyles.faqsContainer}>
                {getFaqsForItem(faqSources[0]).map((faq, fi) => (
                  <FaqItem key={fi} faq={faq} />
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className={qcStyles.faqsTitle}>Frequently Asked Questions</h2>
              <div className={qcStyles.faqDropdownContainer}>
                <label
                  htmlFor="qsp-faq-select"
                  className={qcStyles.faqDropdownLabel}
                >
                  Choose A Plan To View FAQs:
                </label>
                <select
                  id="qsp-faq-select"
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
                  {getFaqsForItem(faqSources[clampedFaqTab]).map((faq, fi) => (
                    <FaqItem key={fi} faq={faq} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {videoLightboxUrl && (
        <VideoLightbox
          videoUrl={videoLightboxUrl}
          onClose={() => setVideoLightboxUrl(null)}
        />
      )}
    </div>
  );
}
