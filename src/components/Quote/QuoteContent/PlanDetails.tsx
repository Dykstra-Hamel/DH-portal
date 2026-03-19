/**
 * Plan Details Component
 *
 * Displays quote line items with collapsible plan details, pricing, and FAQs
 */

import { useState } from 'react';
import Image from 'next/image';
import styles from './quotecontent.module.scss';
import QuoteTotalPricing from './QuoteTotalPricing';

interface FaqItemProps {
  faq: { question: string; answer: string };
}

function FaqItem({ faq }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${styles.faqItem} ${isOpen ? styles.active : ''}`}>
      <div className={styles.faqHeader} onClick={() => setIsOpen(!isOpen)}>
        <p className={styles.faqQuestion}>{faq.question}</p>
        <span
          className={styles.faqIcon}
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
        className={styles.faqContent}
        style={{ maxHeight: isOpen ? '500px' : '0' }}
      >
        <div className={styles.faqAnswer}>
          <p>{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}

interface PlanDetailsProps {
  expandedPlanIndexes: number[];
  setExpandedPlanIndexes: (indexes: number[]) => void;
  onContinue: () => void;
  regularLineItems: any[];
  availableAddons: any[];
  expandedAddonIndexes: number[];
  setExpandedAddonIndexes: (indexes: number[]) => void;
  selectedAddonIds: string[];
  onToggleAddon: (id: string) => void;
  selectedPlanIds: string[];
  onTogglePlan: (id: string) => void;
}

// Format for currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
};

// Abbreviate billing frequency
const abbreviateFrequency = (frequency: string) => {
  const lowerFreq = frequency?.toLowerCase() || '';
  const abbreviations: Record<string, string> = {
    monthly: 'mo',
    quarterly: 'qtr',
    'semi-annually': 'semi',
    'semi-annual': 'semi',
    annually: 'yr',
    annual: 'yr',
  };
  return abbreviations[lowerFreq] || frequency;
};

// Helper function to get all FAQs from a line item (service plan or bundle)
const getAllFaqsFromLineItem = (item: any) => {
  const allFaqs: any[] = [];

  // If it's a service plan, get its FAQs
  if (item.service_plan?.plan_faqs) {
    allFaqs.push(...item.service_plan.plan_faqs);
  }

  // If it's a bundle, get FAQs from all bundled service plans
  if (item.bundle_plan?.bundled_plans_with_faqs) {
    item.bundle_plan.bundled_plans_with_faqs.forEach((plan: any) => {
      if (plan.plan_faqs && plan.plan_faqs.length > 0) {
        allFaqs.push(...plan.plan_faqs);
      }
    });
  }

  return allFaqs;
};

// Helper function to get all features from a line item (service plan or bundle)
const getAllFeaturesFromLineItem = (item: any) => {
  const allFeatures: string[] = [];

  // If it's a service plan, get its features
  if (item.service_plan?.plan_features) {
    allFeatures.push(...item.service_plan.plan_features);
  }

  // If it's a bundle, get features from all bundled service plans
  if (item.bundle_plan?.bundled_plans_with_faqs) {
    item.bundle_plan.bundled_plans_with_faqs.forEach((plan: any) => {
      if (plan.plan_features && plan.plan_features.length > 0) {
        allFeatures.push(...plan.plan_features);
      }
    });
  }

  // Also include bundle's own features if they exist
  if (item.bundle_plan?.bundle_features && item.bundle_plan.bundle_features.length > 0) {
    allFeatures.push(...item.bundle_plan.bundle_features);
  }

  return allFeatures;
};

export default function PlanDetails({
  expandedPlanIndexes,
  setExpandedPlanIndexes,
  onContinue,
  regularLineItems,
  availableAddons,
  expandedAddonIndexes,
  setExpandedAddonIndexes,
  selectedAddonIds,
  onToggleAddon,
  selectedPlanIds,
  onTogglePlan,
}: PlanDetailsProps) {
  // State for FAQ tabs
  const [activeFaqTab, setActiveFaqTab] = useState(0);

  // Get plans with FAQs — only for selected plans
  const plansWithFaqs = regularLineItems.filter((item: any) => {
    const faqs = getAllFaqsFromLineItem(item);
    return faqs.length > 0 && selectedPlanIds.includes(item.id);
  });

  // Selected addons that have FAQs
  const selectedAddonsWithFaqs = availableAddons.filter(
    addon =>
      selectedAddonIds.includes(addon.id) &&
      addon.addon_faqs &&
      addon.addon_faqs.length > 0
  );

  // Combined FAQ items: regular plans + selected addon FAQs
  const allFaqItems = [...plansWithFaqs, ...selectedAddonsWithFaqs];

  // Helper to get FAQs from either a line item or an addon
  const getFaqsFromFaqItem = (item: any): any[] => {
    if (item.addon_faqs) return item.addon_faqs;
    return getAllFaqsFromLineItem(item);
  };

  // Helper to get display name from either type
  const getNameFromFaqItem = (item: any): string =>
    item.addon_name || item.plan_name || '';

  // Clamp active tab in case selected addons change
  const clampedFaqTab = Math.min(activeFaqTab, Math.max(0, allFaqItems.length - 1));

  return (
    <>
      {/* Plans Container */}
      <div className={styles.plansContainer} id="pestProtectionPlans">
        <h2>Pest Protection Plans</h2>
        {regularLineItems.map((item: any, index: number) => {
          const hasDiscount =
            item.discount_amount > 0 || item.discount_percentage > 0;
          const isExpanded = expandedPlanIndexes.includes(index);
          const isPlanSelected = selectedPlanIds.includes(item.id);
          const isOnlySelected = selectedPlanIds.length === 1 && isPlanSelected;

          return (
            <div
              key={index}
              className={`${styles.planCard} ${styles.collapsible} ${
                isExpanded ? styles.expanded : ''
              }`}
            >
              {/* Collapsible Header */}
              <div
                className={styles.planHeader}
                onClick={() => {
                  if (isExpanded) {
                    setExpandedPlanIndexes(
                      expandedPlanIndexes.filter(i => i !== index)
                    );
                  } else {
                    setExpandedPlanIndexes([...expandedPlanIndexes, index]);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {regularLineItems.length > 1 && (
                  <label
                    className={`${styles.addonCheckbox} ${isOnlySelected ? styles.addonCheckboxLastPlan : ''}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isPlanSelected}
                      onChange={() => onTogglePlan(item.id)}
                      disabled={isOnlySelected}
                    />
                    <span className={`${styles.addonCheckboxCustom} ${isOnlySelected ? styles.addonCheckboxDisabled : ''}`} />
                  </label>
                )}
                <h3 className={styles.planHeaderTitle}>{item.plan_name}</h3>
                <div className={styles.planHeaderPricing}>
                  <span className={styles.planHeaderRecurring}>
                    <sup>$</sup>
                    {formatCurrency(
                      item.final_recurring_price || item.recurring_price || 0
                    )}
                    <span className={styles.planRecurringFrequency}>
                      /
                      {abbreviateFrequency(item.billing_frequency || 'monthly')}
                    </span>
                  </span>
                  <span className={styles.planHeaderDivider}>|</span>
                  <span className={styles.planHeaderInitial}>
                    <sup>$</sup>
                    {formatCurrency(
                      item.final_initial_price || item.initial_price || 0
                    )}
                    <span className={styles.initialText}> Initial</span>
                  </span>
                </div>
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
              </div>

              {/* Plan Content */}
              <div
                className={styles.planContentWrapper}
                style={{
                  maxHeight: isExpanded ? '3000px' : '0',
                }}
              >
                <div className={styles.planContent}>
                  <div className={styles.planContentGrid}>
                    {/* Left Column - Content */}
                    <div className={styles.planContentLeft}>
                      {/* Plan Description */}
                      {(item.plan_description || item.bundle_plan?.bundle_description) && (
                        <p className={styles.planDescription}>
                          {item.plan_description || item.bundle_plan?.bundle_description}
                        </p>
                      )}

                      {/* Features List */}
                      {getAllFeaturesFromLineItem(item).length > 0 && (
                        <div className={styles.planIncluded}>
                          <h4>What&apos;s Included:</h4>
                          <ul className={styles.featuresList}>
                            {getAllFeaturesFromLineItem(item).map(
                              (feature: string, fIndex: number) => (
                                <li
                                  key={fIndex}
                                  className={styles.feature}
                                >
                                  <span className={styles.featureCheckmark}>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="20"
                                      height="20"
                                      viewBox="0 0 20 20"
                                      fill="none"
                                    >
                                      <g clipPath="url(#clip0_6146_560)">
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
                                        <clipPath id="clip0_6146_560">
                                          <rect
                                            width="20"
                                            height="20"
                                            fill="white"
                                          />
                                        </clipPath>
                                      </defs>
                                    </svg>
                                  </span>
                                  {feature}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Pricing Section */}
                      <div className={styles.pricingSection}>
                        <div className={styles.priceContainer}>
                          {/* Left: Recurring Price */}
                          <div className={styles.priceLeft}>
                            <div className={styles.priceRecurring}>
                              <sup>$</sup>
                              {formatCurrency(
                                item.final_recurring_price ||
                                  item.recurring_price ||
                                  0
                              )}
                              <sup className={styles.priceAsterisk}>*</sup>
                              <span className={styles.priceFrequency}>
                                /
                                {abbreviateFrequency(
                                  item.billing_frequency || 'monthly'
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Right: Initial Price */}
                          <div className={styles.priceRight}>
                            <div className={styles.priceInitial}>
                              <span className={styles.initialLabel}>Initial Only</span>
                              <span className={styles.priceNumber}>
                                <sup>$</sup>
                                {formatCurrency(
                                  item.final_initial_price ||
                                    item.initial_price ||
                                    0
                                )}
                              </span>
                            </div>
                            {hasDiscount && (
                              <div className={styles.priceNormally}>
                                Normally{' '}
                                <span className={styles.priceCrossed}>
                                  <sup>$</sup>
                                  {formatCurrency(item.initial_price || 0)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Image and Disclaimer */}
                    <div className={styles.planContentRight}>
                      {/* Plan Image */}
                      <div className={styles.planImageWrapper}>
                        {(item.bundle_plan?.bundle_image_url || item.service_plan?.plan_image_url) ? (
                          <Image
                            src={item.bundle_plan?.bundle_image_url || item.service_plan?.plan_image_url}
                            alt={item.plan_name || 'Plan image'}
                            fill={true}
                            className={styles.planImage}
                          />
                        ) : (
                          <div className={styles.planImagePlaceholder}>
                            <svg
                              width="100"
                              height="100"
                              viewBox="0 0 100 100"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect width="100" height="100" fill="#E5E7EB" />
                              <path
                                d="M50 30L60 50H40L50 30Z"
                                fill="#9CA3AF"
                              />
                              <circle cx="50" cy="65" r="10" fill="#9CA3AF" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Disclaimer */}
                      {item.service_plan?.plan_disclaimer && (
                        <div className={styles.planDisclaimer}>
                          <p
                            dangerouslySetInnerHTML={{
                              __html: item.service_plan.plan_disclaimer,
                            }}
                          ></p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add-On Services Section */}
      {availableAddons.length > 0 && (
        <div className={styles.addonsSection}>
          <h2>Add-On Services</h2>
          {availableAddons.map((item: any, index: number) => {
            const isSelected = selectedAddonIds.includes(item.id);
            const isExpanded = expandedAddonIndexes.includes(index);
            const hasContent = Boolean(item.addon_description || item.addon_terms);

            return (
              <div
                key={index}
                className={`${styles.planCard} ${styles.collapsible} ${
                  isExpanded ? styles.expanded : ''
                }`}
              >
                <div
                  className={styles.planHeader}
                  onClick={
                    hasContent
                      ? () => {
                          if (isExpanded) {
                            setExpandedAddonIndexes(
                              expandedAddonIndexes.filter(i => i !== index)
                            );
                          } else {
                            setExpandedAddonIndexes([
                              ...expandedAddonIndexes,
                              index,
                            ]);
                          }
                        }
                      : undefined
                  }
                  style={{ cursor: hasContent ? 'pointer' : 'default' }}
                >
                  {/* Checkbox stops click propagation to prevent collapse toggle */}
                  <label
                    className={styles.addonCheckbox}
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleAddon(item.id)}
                    />
                    <span className={styles.addonCheckboxCustom} />
                  </label>
                  <h3 className={styles.planHeaderTitle}>{item.addon_name}</h3>
                  <div className={styles.planHeaderPricing}>
                    <span className={styles.planHeaderRecurring}>
                      <sup>$</sup>
                      {formatCurrency(item.recurring_price || 0)}
                      <span className={styles.planRecurringFrequency}>
                        /
                        {abbreviateFrequency(item.billing_frequency || 'monthly')}
                      </span>
                    </span>
                    {(item.initial_price ?? 0) > 0 && (
                      <>
                        <span className={styles.planHeaderDivider}>|</span>
                        <span className={styles.planHeaderInitial}>
                          <sup>$</sup>
                          {formatCurrency(item.initial_price)}
                          <span className={styles.initialText}> Initial</span>
                        </span>
                      </>
                    )}
                  </div>
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
                {hasContent && (
                  <div
                    className={styles.planContentWrapper}
                    style={{ maxHeight: isExpanded ? '3000px' : '0' }}
                  >
                    <div className={styles.planContent}>
                      {item.addon_description && (
                        <p className={styles.planDescription}>
                          {item.addon_description}
                        </p>
                      )}
                      {item.addon_terms && (
                        <div className={styles.addonTerms}>
                          <h4>Terms &amp; Conditions</h4>
                          <div
                            dangerouslySetInnerHTML={{ __html: item.addon_terms }}
                          />
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

      <QuoteTotalPricing
        regularLineItems={regularLineItems}
        availableAddons={availableAddons}
        selectedAddonIds={selectedAddonIds}
        onToggleAddon={onToggleAddon}
        selectedPlanIds={selectedPlanIds}
        onTogglePlan={onTogglePlan}
      />

      <div className={styles.continueButtonWrapper}>
        <button className={styles.ctaButton} onClick={onContinue}>
          Continue
        </button>
      </div>

      {/* Plan FAQs - Single or Tabbed Layout */}
      {allFaqItems.length > 0 && (
        <div className={styles.faqsSection}>
          {allFaqItems.length === 1 ? (
            /* Single source: Show all FAQs in a flat list */
            <>
              <h2 className={styles.faqsTitle}>Frequently Asked Questions</h2>
              <div className={styles.faqsContainer}>
                {getFaqsFromFaqItem(allFaqItems[0]).map(
                  (faq: any, faqIndex: number) => (
                    <FaqItem key={faqIndex} faq={faq} />
                  )
                )}
              </div>
            </>
          ) : (
            /* Multiple sources: Show sidebar with buttons */
            <>
              <h2 className={styles.faqsTitle}>Frequently Asked Questions</h2>

              {/* Mobile Dropdown (visible on mobile only) */}
              <div className={styles.faqDropdownContainer}>
                <label htmlFor="faq-plan-select" className={styles.faqDropdownLabel}>
                  Choose A Plan To View FAQs:
                </label>
                <select
                  id="faq-plan-select"
                  className={styles.faqDropdown}
                  value={clampedFaqTab}
                  onChange={(e) => setActiveFaqTab(Number(e.target.value))}
                >
                  {allFaqItems.map((item: any, tabIndex: number) => (
                    <option key={tabIndex} value={tabIndex}>
                      {getNameFromFaqItem(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.faqsLayoutGrid}>
                {/* Left: Plan/Addon Buttons (hidden on mobile) */}
                <div className={styles.faqsSidebar}>
                  {allFaqItems.map((item: any, tabIndex: number) => (
                    <button
                      key={tabIndex}
                      className={`${styles.faqTabButton} ${
                        clampedFaqTab === tabIndex ? styles.faqTabButtonActive : ''
                      }`}
                      onClick={() => setActiveFaqTab(tabIndex)}
                    >
                      {getNameFromFaqItem(item)}
                    </button>
                  ))}
                </div>

                {/* Right: FAQ Content */}
                <div className={styles.faqsContainer}>
                  {getFaqsFromFaqItem(allFaqItems[clampedFaqTab]).map(
                    (faq: any, faqIndex: number) => (
                      <FaqItem key={faqIndex} faq={faq} />
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
