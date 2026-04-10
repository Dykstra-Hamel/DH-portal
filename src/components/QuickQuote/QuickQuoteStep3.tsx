'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { CustomDropdown } from '@/components/Common/CustomDropdown/CustomDropdown';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import {
  generateHomeSizeOptions,
  calculateTotalPricing,
} from '@/lib/pricing-calculations';
import { SizeOption, ServicePlanPricing } from '@/types/pricing';
import styles from './QuickQuoteStep3.module.scss';

const PEST_LOCATIONS = [
  'Kitchen',
  'Bathroom',
  'Basement',
  'Garage',
  'Living Areas',
  'Bedrooms',
  'Attic',
  'Exterior/Foundation',
];

interface PestOption {
  name: string;
  slug: string;
  custom_label: string | null;
  how_we_do_it_text: string | null;
  description?: string;
}

interface CustomerData {
  firstName: string;
  lastName: string;
  streetAddress?: string;
  city?: string;
  state?: string;
}

interface ServicePlan {
  id: string;
  plan_name: string;
  plan_description: string | null;
  plan_category: string;
  initial_price: number;
  recurring_price: number;
  billing_frequency: string;
  treatment_frequency: string | null;
  includes_inspection: boolean;
  plan_features: string[] | null;
  highlight_badge: string | null;
  display_order: number;
  coverage_level: string | null;
  home_size_pricing: ServicePlanPricing['home_size_pricing'] | null;
  yard_size_pricing: ServicePlanPricing['yard_size_pricing'] | null;
  linear_feet_pricing: ServicePlanPricing['linear_feet_pricing'] | null;
}

interface QuickQuoteStep3Props {
  companyId: string;
  salesScript: string;
  selectedPest: PestOption;
  customerData: CustomerData;
  selectedPlan: ServicePlan | null;
  homeSize: string;
  pestLocations: string[];
  onPlanSelect: (plan: ServicePlan) => void;
  onHomeSizeChange: (value: string) => void;
  onPestLocationsChange: (locations: string[]) => void;
  onSendQuote: () => void;
  onSchedule: () => void;
  isSubmitting: boolean;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(0)}`;
}

function getBillingLabel(frequency: string): string {
  const map: Record<string, string> = {
    monthly: '/mo',
    quarterly: '/quarter',
    annually: '/year',
    'one-time': '',
  };
  return map[frequency] ?? `/${frequency}`;
}

export default function QuickQuoteStep3({
  companyId,
  salesScript,
  selectedPest,
  customerData,
  selectedPlan,
  homeSize,
  pestLocations,
  onPlanSelect,
  onHomeSizeChange,
  onPestLocationsChange,
  onSendQuote,
  onSchedule,
  isSubmitting,
}: QuickQuoteStep3Props) {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const { settings: pricingSettings } = usePricingSettings(companyId);

  // Fetch plans
  useEffect(() => {
    if (!companyId || !selectedPest?.slug) return;

    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const response = await fetch(
          `/api/companies/${companyId}/service-plans?pestSlug=${selectedPest.slug}`
        );
        if (!response.ok) throw new Error('Failed to fetch service plans');
        const data = await response.json();
        const fetchedPlans: ServicePlan[] = data.data || [];
        setPlans(fetchedPlans);

        // Pre-select first plan if none selected
        if (fetchedPlans.length > 0 && !selectedPlan) {
          onPlanSelect(fetchedPlans[0]);
        }
      } catch (err) {
        console.error('Error fetching service plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [companyId, selectedPest?.slug]);

  // Generate home size options based on selected plan's pricing
  const homeSizeOptions = pricingSettings && selectedPlan
    ? generateHomeSizeOptions(pricingSettings, {
        home_size_pricing: selectedPlan.home_size_pricing ?? {
          pricing_mode: 'linear',
          initial_cost_per_interval: 0,
          recurring_cost_per_interval: 0,
        },
        yard_size_pricing: selectedPlan.yard_size_pricing ?? {
          pricing_mode: 'linear',
          initial_cost_per_interval: 0,
          recurring_cost_per_interval: 0,
        },
        linear_feet_pricing: selectedPlan.linear_feet_pricing ?? {
          initial_price_per_foot: [],
        },
      })
    : pricingSettings
    ? generateHomeSizeOptions(pricingSettings)
    : [];

  const homeSizeDropdownOptions = homeSizeOptions.map((opt: SizeOption) => {
    let label = opt.label;
    const parts: string[] = [];
    if (opt.initialIncrease > 0) parts.push(`+$${opt.initialIncrease} initial`);
    if (opt.recurringIncrease > 0) {
      const billingLabel = selectedPlan ? getBillingLabel(selectedPlan.billing_frequency) : '/mo';
      parts.push(`+$${opt.recurringIncrease}${billingLabel}`);
    }
    if (parts.length > 0) label += ` (${parts.join(', ')})`;
    return { value: opt.value, label };
  });

  // Calculate adjusted prices for selected plan + home size
  const getAdjustedPrices = (plan: ServicePlan) => {
    if (!pricingSettings || !homeSize) {
      return {
        initial: plan.initial_price,
        recurring: plan.recurring_price,
      };
    }

    const options = generateHomeSizeOptions(pricingSettings, {
      home_size_pricing: plan.home_size_pricing ?? {
        pricing_mode: 'linear',
        initial_cost_per_interval: 0,
        recurring_cost_per_interval: 0,
      },
      yard_size_pricing: plan.yard_size_pricing ?? {
        pricing_mode: 'linear',
        initial_cost_per_interval: 0,
        recurring_cost_per_interval: 0,
      },
      linear_feet_pricing: plan.linear_feet_pricing ?? {
        initial_price_per_foot: [],
      },
    });

    const selectedOpt = options.find((o: SizeOption) => o.value === homeSize);
    const pricing = calculateTotalPricing(
      plan.initial_price,
      plan.recurring_price,
      selectedOpt
    );

    return {
      initial: pricing.totalInitialPrice,
      recurring: pricing.totalRecurringPrice,
    };
  };

  const toggleLocation = (loc: string) => {
    if (pestLocations.includes(loc)) {
      onPestLocationsChange(pestLocations.filter((l) => l !== loc));
    } else {
      onPestLocationsChange([...pestLocations, loc]);
    }
  };

  const customerName = [customerData.firstName, customerData.lastName]
    .filter(Boolean)
    .join(' ');
  const customerAddress = [customerData.streetAddress, customerData.city, customerData.state]
    .filter(Boolean)
    .join(', ');

  const pestLabel = selectedPest.custom_label || selectedPest.name;

  return (
    <div className={styles.step}>
      {salesScript && (
        <div className={styles.scriptBanner}>
          <span className={styles.scriptBannerLabel}>Sales Script</span>
          <span className={styles.scriptBannerText}>{salesScript}</span>
        </div>
      )}

      {/* Summary bar */}
      <div className={styles.summaryBar}>
        <span className={styles.summaryName}>{customerName || 'Customer'}</span>
        {customerAddress && (
          <>
            <span className={styles.summaryDot} />
            <span className={styles.summaryItem}>{customerAddress}</span>
          </>
        )}
        <span className={styles.summaryDot} />
        <span className={styles.summaryItem}>{pestLabel}</span>
      </div>

      <div className={styles.columns}>
        {/* Left: Home info + pest locations + pest info */}
        <div className={styles.leftColumn}>
          {/* Home Size */}
          <div className={styles.homeSizeWrapper}>
            <p className={styles.sectionTitle}>Home Size</p>
            {homeSizeOptions.length > 0 ? (
              <CustomDropdown
                options={homeSizeDropdownOptions}
                value={homeSize}
                onChange={onHomeSizeChange}
                placeholder="Select home size"
              />
            ) : (
              <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                Loading&hellip;
              </span>
            )}
          </div>

          {/* Pest Sighting Locations */}
          <div>
            <p className={styles.sectionTitle}>Pest Sighting Locations</p>
            <div className={styles.checklistGrid}>
              {PEST_LOCATIONS.map((loc) => (
                <label key={loc} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={pestLocations.includes(loc)}
                    onChange={() => toggleLocation(loc)}
                  />
                  <span className={styles.checkLabel}>{loc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pest Info Box */}
          {(selectedPest.how_we_do_it_text || selectedPest.description) && (
            <div className={styles.pestInfoBox}>
              <p className={styles.pestInfoTitle}>
                How We Handle {pestLabel}
              </p>
              <p className={styles.pestInfoText}>
                {selectedPest.how_we_do_it_text || selectedPest.description}
              </p>
            </div>
          )}
        </div>

        {/* Right: Plan cards */}
        <div className={styles.rightColumn}>
          <p className={styles.sectionTitle}>Select a Plan</p>

          {loadingPlans ? (
            <div className={styles.loadingPlans}>
              <Loader2 size={18} className={styles.spinner} />
              Loading plans&hellip;
            </div>
          ) : (
            <div className={styles.plansGrid}>
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const prices = getAdjustedPrices(plan);
                const isOneTime = plan.plan_category === 'one-time';

                return (
                  <div
                    key={plan.id}
                    className={`${styles.planCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => onPlanSelect(plan)}
                  >
                    <div className={styles.planCardHeader}>
                      <div>
                        {plan.highlight_badge && (
                          <div className={styles.planBadge}>
                            {plan.highlight_badge}
                          </div>
                        )}
                        <p className={styles.planName}>{plan.plan_name}</p>
                      </div>
                      <div className={styles.planPriceBlock}>
                        <div className={styles.planInitialPrice}>
                          {formatPrice(prices.initial)}
                          <span style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 400 }}>
                            {' '}initial
                          </span>
                        </div>
                        {!isOneTime && prices.recurring > 0 && (
                          <div className={styles.planRecurringPrice}>
                            {formatPrice(prices.recurring)}
                            {getBillingLabel(plan.billing_frequency)}
                          </div>
                        )}
                      </div>
                    </div>

                    {plan.plan_features && plan.plan_features.length > 0 && (
                      <div className={styles.planCardBody}>
                        <ul className={styles.planFeatures}>
                          {plan.plan_features.slice(0, 4).map((feature, idx) => (
                            <li key={idx} className={styles.planFeatureItem}>
                              <CheckCircle
                                size={13}
                                className={styles.featureCheck}
                              />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {isSelected ? (
                      <div className={styles.planSelectedLabel}>
                        <CheckCircle size={14} />
                        Selected
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={styles.planSelectBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlanSelect(plan);
                        }}
                      >
                        Select Plan
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onSchedule}
          disabled={!selectedPlan || isSubmitting}
        >
          Continue to Scheduling
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onSendQuote}
          disabled={!selectedPlan || isSubmitting}
        >
          {isSubmitting ? 'Sending\u2026' : 'Send Quote'}
        </button>
      </div>
    </div>
  );
}
