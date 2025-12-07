/**
 * Price Card Component
 *
 * Floating price card with discount display and add-on checkboxes
 */

import { useState } from 'react';
import styles from '../CampaignLandingPage.module.scss';

interface PriceCardProps {
  pricing: {
    displayPrice: string;
    originalPrice: string | null;
    savings: string | null;
  };
  discount: {
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  } | null;
  onCtaClick: () => void;
}

export default function PriceCard({ pricing, discount, onCtaClick }: PriceCardProps) {
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const addons = [
    { id: 'weed-control', name: 'Weed Control*' },
    { id: 'scorpion-dusting', name: 'Scorpion Dusting*' },
    { id: 'desert-guard', name: 'DesertGuard*' },
  ];

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  return (
    <div className={styles.priceCard}>
      <div className={styles.priceCardHeader}>
        <h3>Only {pricing.displayPrice}</h3>
        <p className={styles.priceCardSubtext}>
          {pricing.savings || 'Special pricing for you'}
        </p>
      </div>

      <div className={styles.priceCardContent}>
        <div className={styles.pricingRow}>
          {pricing.originalPrice && (
            <span className={styles.originalPrice}>{pricing.originalPrice}</span>
          )}
          <span className={styles.finalPrice}>$0 Initial startup fee</span>
        </div>

        <div className={styles.addonsSection}>
          <p className={styles.addonsHeading}>
            I&apos;m interested in additional savings for:
          </p>
          {addons.map((addon) => (
            <label key={addon.id} className={styles.addonCheckbox}>
              <input
                type="checkbox"
                checked={selectedAddons.includes(addon.id)}
                onChange={() => toggleAddon(addon.id)}
              />
              <span>{addon.name}</span>
            </label>
          ))}
        </div>

        <button className={styles.priceCardCta} onClick={onCtaClick}>
          Redeem Offer Today
        </button>

        <p className={styles.priceCardDisclaimer}>
          *Costs will be discussed with you before upgrading any add-ons
        </p>
      </div>
    </div>
  );
}
