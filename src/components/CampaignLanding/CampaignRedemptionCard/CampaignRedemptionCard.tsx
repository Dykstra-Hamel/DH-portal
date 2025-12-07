/**
 * Campaign Redemption Card
 *
 * Displays pricing and add-on options for campaign redemption
 * Uses brand colors via CSS variables for theming support
 */

'use client';

import { useState } from 'react';
import styles from './CampaignRedemptionCard.module.scss';

export interface AddonOption {
  id: string;
  name: string;
  checked: boolean;
}

export interface CampaignRedemptionCardProps {
  price: string; // e.g. "$44"
  frequency: string; // e.g. "/mo"
  originalPrice?: string; // e.g. "$199" (for strikethrough)
  addons?: AddonOption[];
  onRedeemClick: () => void;
  onAddonChange?: (addonId: string, checked: boolean) => void;
}

export default function CampaignRedemptionCard({
  price,
  frequency,
  originalPrice,
  addons = [],
  onRedeemClick,
  onAddonChange,
}: CampaignRedemptionCardProps) {
  const [localAddons, setLocalAddons] = useState<AddonOption[]>(addons);

  const handleAddonToggle = (addonId: string) => {
    const updatedAddons = localAddons.map((addon) =>
      addon.id === addonId ? { ...addon, checked: !addon.checked } : addon
    );
    setLocalAddons(updatedAddons);

    if (onAddonChange) {
      const addon = updatedAddons.find((a) => a.id === addonId);
      if (addon) {
        onAddonChange(addonId, addon.checked);
      }
    }
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <h3>Upgrade to Quarterly Pest Control:</h3>
      </div>

      {/* Pricing */}
      <div className={styles.pricing}>
        <div className={styles.priceDisplay}>
          <span className={styles.priceAmount}>{price}</span>
          <span className={styles.priceFrequency}>{frequency}</span>
          <span className={styles.activePill}>
            <svg xmlns="http://www.w3.org/2000/svg" width="53" height="28" viewBox="0 0 53 28" fill="none">
              <rect x="1" y="1" width="51" height="26" rx="13" fill="white" stroke="#C1C1C1" strokeWidth="2"/>
              <circle cx="39" cy="14" r="10" fill="#00B142"/>
            </svg>
          </span>
        </div>
        {originalPrice && (
          <div className={styles.originalPrice}>
            <span className={styles.strikethrough}>{originalPrice}</span>
            <span className={styles.freeSetup}>$0 Initial startup fee</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Add-ons Section */}
      {addons.length > 0 && (
        <div className={styles.addonsSection}>
          <h4 className={styles.addonsHeading}>I&apos;m interested in additional savings for:</h4>
          <div className={styles.addonsList}>
            {localAddons.map((addon) => (
              <label key={addon.id} className={styles.addonItem}>
                <span className={styles.addonName}>{addon.name}</span>
                <input
                  type="checkbox"
                  checked={addon.checked}
                  onChange={() => handleAddonToggle(addon.id)}
                  className={styles.checkbox}
                />
                <span className={styles.togglePill}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="53" height="28" viewBox="0 0 53 28" fill="none">
                    <rect x="1" y="1" width="51" height="26" rx="13" fill="white" stroke="#C1C1C1" strokeWidth="2"/>
                    <circle className={styles.toggleCircle} cx="14" cy="14" r="10" fill="#2B2B2B"/>
                  </svg>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Redeem Button */}
      <button type="button" onClick={onRedeemClick} className={styles.redeemButton}>
        Redeem Offer Today
      </button>

      {/* Disclaimer */}
      {addons.length > 0 && (
        <p className={styles.disclaimer}>
          *Costs will be discussed with you before upgrading any add-ons
        </p>
      )}
    </div>
  );
}
