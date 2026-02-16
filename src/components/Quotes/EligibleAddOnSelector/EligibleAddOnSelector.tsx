'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './EligibleAddOnSelector.module.scss';
import { AddOnEligibility } from '@/types/addon-service';

interface AddonCustomPriceData {
  addonId: string;
  initialPrice: number;
  recurringPrice: number;
}

interface EligibleAddOnSelectorProps {
  companyId: string;
  servicePlanId: string | null;
  selectedAddonIds: string[];
  onToggleAddon: (addonId: string) => void;
  addonLineItems?: any[];
  onSaveAddonCustomPrice?: (data: AddonCustomPriceData) => Promise<void>;
}

export default function EligibleAddOnSelector({
  companyId,
  servicePlanId,
  selectedAddonIds,
  onToggleAddon,
  addonLineItems,
  onSaveAddonCustomPrice,
}: EligibleAddOnSelectorProps) {
  const [addons, setAddons] = useState<AddOnEligibility[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [pricingModalAddon, setPricingModalAddon] = useState<AddOnEligibility | null>(null);
  const [modalInitialPrice, setModalInitialPrice] = useState<number>(0);
  const [modalRecurringPrice, setModalRecurringPrice] = useState<number>(0);
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    if (servicePlanId) {
      fetchEligibleAddons();
    } else {
      setAddons([]);
    }
  }, [servicePlanId, companyId]);

  const fetchEligibleAddons = async () => {
    if (!servicePlanId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/add-on-services/${companyId}/eligible-for-plan/${servicePlanId}`
      );
      const result = await response.json();

      if (result.success) {
        // Only show eligible add-ons
        const eligibleAddons = result.addons.filter(
          (a: AddOnEligibility) => a.is_eligible
        );

        // If requires_quote is missing from the RPC response, fetch full add-on data
        const needsRequiresQuote = eligibleAddons.some(
          (a: AddOnEligibility) => a.requires_quote === undefined
        );

        if (needsRequiresQuote) {
          try {
            const allAddonsResponse = await fetch(
              `/api/add-on-services/${companyId}`
            );
            const allAddonsResult = await allAddonsResponse.json();
            if (allAddonsResult.success && allAddonsResult.addons) {
              const addonsMap = new Map(
                allAddonsResult.addons.map((a: any) => [a.id, a])
              );
              for (const addon of eligibleAddons) {
                const fullAddon = addonsMap.get(addon.addon_id) as any;
                if (fullAddon && addon.requires_quote === undefined) {
                  addon.requires_quote = fullAddon.requires_quote ?? false;
                }
              }
            }
          } catch {
            // Fallback: set requires_quote to false if fetch fails
            for (const addon of eligibleAddons) {
              if (addon.requires_quote === undefined) {
                addon.requires_quote = false;
              }
            }
          }
        }

        setAddons(eligibleAddons);
      }
    } catch (error) {
      console.error('Error fetching eligible add-ons:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reusable header button component
  const renderHeaderButton = (disabled = false, count?: number) => (
    <button
      type="button"
      className={styles.headerButton}
      onClick={() => setIsExpanded(!isExpanded)}
      disabled={disabled}
      data-is-expanded={isExpanded}
    >
      <span className={styles.headerText}>
        Available Add-Ons
        {count !== undefined && <span className={styles.count}>({count})</span>}
      </span>
      <span className={styles.toggleIcon}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
        >
          <path
            d="M0.75 0.75L4.75 5.19444L8.75 0.75"
            stroke="#6A7282"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );

  const formatRecurringPrice = (price: number): string => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };

  // Helper function to format billing frequency for display
  const formatBillingFrequency = (frequency: string): string => {
    switch (frequency) {
      case 'monthly':
        return '/mo';
      case 'quarterly':
        return '/qtr';
      case 'semi-annually':
        return '/6mo';
      case 'annually':
        return '/yr';
      default:
        return '/mo';
    }
  };

  // Determine content to display when expanded
  const renderExpandedContent = () => {
    if (!servicePlanId) {
      return (
        <div className={styles.emptyState}>
          <p>Select a service plan to see available add-ons</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading add-ons...</p>
        </div>
      );
    }

    if (addons.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>No add-on services available for this plan</p>
        </div>
      );
    }

    return (
      <div className={styles.addonList}>
        {addons.map(addon => {
          const isSelected = selectedAddonIds.includes(addon.addon_id);
          const lineItem = addonLineItems?.find(
            (item: any) => item.addon_service_id === addon.addon_id
          );
          const hasCustomPrice = lineItem?.is_custom_priced;

          return (
            <div
              key={addon.addon_id}
              className={`${styles.addonRow} ${isSelected ? styles.selected : ''}`}
              onClick={() => onToggleAddon(addon.addon_id)}
            >
              {isSelected && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  className={styles.selectedAddonCheckmark}
                >
                  <path
                    d="M13.8661 6.0026C14.1706 7.4968 13.9536 9.05021 13.2513 10.4038C12.5491 11.7574 11.404 12.8293 10.0071 13.4408C8.61019 14.0523 7.04585 14.1665 5.57496 13.7642C4.10408 13.3619 2.81556 12.4675 1.92428 11.2302C1.033 9.99289 0.592846 8.48742 0.677207 6.96485C0.761568 5.44229 1.36535 3.99466 2.38786 2.86338C3.41038 1.7321 4.78982 0.985551 6.29614 0.748233C7.80246 0.510915 9.34462 0.797171 10.6654 1.55926M5.3321 6.66926L7.3321 8.66926L13.9988 2.0026"
                    stroke="#00C281"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <div className={styles.addonInfo}>
                <div className={styles.addonName}>{addon.addon_name}</div>
                <div className={styles.addonPricing}>
                  {addon.requires_quote ? (
                    isSelected && hasCustomPrice ? (
                      <>
                        <span className={styles.addonRecurring}>
                          +${formatRecurringPrice(lineItem.final_recurring_price)}
                          {formatBillingFrequency(addon.billing_frequency)}
                        </span>
                        {lineItem.final_initial_price > 0 && (
                          <span className={styles.addonInitial}>
                            ${Math.round(lineItem.final_initial_price)} initial
                          </span>
                        )}
                        <span className={styles.customBadge}>(Custom)</span>
                      </>
                    ) : (
                      <span className={styles.customQuoteLabel}>
                        Custom Pricing Required
                      </span>
                    )
                  ) : (
                    <>
                      <span className={styles.addonRecurring}>
                        +${addon.recurring_price}
                        {formatBillingFrequency(addon.billing_frequency)}
                      </span>
                      {addon.initial_price && addon.initial_price > 0 && (
                        <span className={styles.addonInitial}>
                          ${addon.initial_price} initial
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className={styles.addonAction}>
                {isSelected && addon.requires_quote ? (
                  <button
                    type="button"
                    className={hasCustomPrice ? styles.editPricingButton : styles.addPricingButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalInitialPrice(lineItem?.custom_initial_price ?? 0);
                      setModalRecurringPrice(lineItem?.custom_recurring_price ?? 0);
                      setPricingModalAddon(addon);
                    }}
                  >
                    {hasCustomPrice ? 'Edit Custom Price' : 'Add Pricing'}
                  </button>
                ) : isSelected ? (
                  <button type="button" className={styles.removeButton}>
                    Remove Add-On
                  </button>
                ) : (
                  <button type="button" className={styles.addButton}>
                    Add Service
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {renderHeaderButton(
        !servicePlanId,
        addons.length > 0 ? addons.length : undefined
      )}
      {isExpanded && renderExpandedContent()}

      {/* Custom Pricing Modal */}
      {pricingModalAddon && (
        <div className={styles.modalOverlay} onClick={() => setPricingModalAddon(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Set Custom Pricing</h3>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setPricingModalAddon(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalAddonName}>{pricingModalAddon.addon_name}</p>
              <div className={styles.modalFields}>
                <div className={styles.modalField}>
                  <label>Initial Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={modalInitialPrice}
                    onChange={e => setModalInitialPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.modalField}>
                  <label>Recurring Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={modalRecurringPrice}
                    onChange={e => setModalRecurringPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelButton}
                onClick={() => setPricingModalAddon(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalSaveButton}
                disabled={savingPrice}
                onClick={async () => {
                  if (!onSaveAddonCustomPrice) return;
                  setSavingPrice(true);
                  try {
                    await onSaveAddonCustomPrice({
                      addonId: pricingModalAddon.addon_id,
                      initialPrice: modalInitialPrice,
                      recurringPrice: modalRecurringPrice,
                    });
                    setPricingModalAddon(null);
                  } finally {
                    setSavingPrice(false);
                  }
                }}
              >
                {savingPrice ? 'Saving...' : 'Save Pricing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
