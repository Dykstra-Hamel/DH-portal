'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import styles from './EligibleAddOnSelector.module.scss';
import { AddOnEligibility } from '@/types/addon-service';

interface EligibleAddOnSelectorProps {
  companyId: string;
  servicePlanId: string | null;
  selectedAddonIds: string[];
  onToggleAddon: (addonId: string) => void;
}

export default function EligibleAddOnSelector({
  companyId,
  servicePlanId,
  selectedAddonIds,
  onToggleAddon,
}: EligibleAddOnSelectorProps) {
  const [addons, setAddons] = useState<AddOnEligibility[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
        setAddons(eligibleAddons);
      }
    } catch (error) {
      console.error('Error fetching eligible add-ons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!servicePlanId) {
    return (
      <div className={styles.container}>
        <button
          type="button"
          className={styles.headerButton}
          onClick={() => setIsExpanded(!isExpanded)}
          disabled
        >
          <span className={styles.toggleIcon}>▶</span>
          <span className={styles.headerText}>Available Add-Ons</span>
        </button>
        {isExpanded && (
          <div className={styles.emptyState}>
            <p>Select a service plan to see available add-ons</p>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <button
          type="button"
          className={styles.headerButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className={styles.toggleIcon}>{isExpanded ? '▼' : '▶'}</span>
          <span className={styles.headerText}>Available Add-Ons</span>
        </button>
        {isExpanded && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading add-ons...</p>
          </div>
        )}
      </div>
    );
  }

  if (addons.length === 0) {
    return (
      <div className={styles.container}>
        <button
          type="button"
          className={styles.headerButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className={styles.toggleIcon}>{isExpanded ? '▼' : '▶'}</span>
          <span className={styles.headerText}>Available Add-Ons</span>
        </button>
        {isExpanded && (
          <div className={styles.emptyState}>
            <p>No add-on services available for this plan</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.headerButton}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={styles.toggleIcon}>{isExpanded ? '▼' : '▶'}</span>
        <span className={styles.headerText}>
          Available Add-Ons
          <span className={styles.count}>({addons.length})</span>
        </span>
      </button>

      {isExpanded && (
        <div className={styles.addonList}>
          {addons.map(addon => {
            const isSelected = selectedAddonIds.includes(addon.addon_id);

            return (
              <div
                key={addon.addon_id}
                className={`${styles.addonRow} ${isSelected ? styles.selected : ''}`}
              >
                <div className={styles.addonInfo}>
                  <div className={styles.addonName}>{addon.addon_name}</div>
                  <div className={styles.addonPricing}>
                    <span className={styles.addonRecurring}>+${addon.recurring_price}/mo</span>
                    {addon.initial_price && addon.initial_price > 0 && (
                      <span className={styles.addonInitial}>${addon.initial_price} initial</span>
                    )}
                  </div>
                </div>

                <div className={styles.addonAction}>
                  {isSelected ? (
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => onToggleAddon(addon.addon_id)}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.addButton}
                      onClick={() => onToggleAddon(addon.addon_id)}
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
