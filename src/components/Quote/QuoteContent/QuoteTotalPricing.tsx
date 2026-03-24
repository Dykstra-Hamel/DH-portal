/**
 * Quote Total Pricing Component
 *
 * Displays the total initial and recurring costs for a quote
 * with a list of items contributing to the initial cost
 */

import styles from './quotecontent.module.scss';

interface QuoteTotalPricingProps {
  regularLineItems: any[];
  availableAddons: any[];
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

export default function QuoteTotalPricing({
  regularLineItems,
  availableAddons,
  selectedAddonIds,
  onToggleAddon,
  selectedPlanIds,
  onTogglePlan,
}: QuoteTotalPricingProps) {
  const selectedPlans = regularLineItems.filter(item =>
    selectedPlanIds.includes(item.id)
  );
  const selectedAddons = availableAddons.filter(addon =>
    selectedAddonIds.includes(addon.id)
  );
  const isOnlyOnePlan = regularLineItems.length > 1 && selectedPlanIds.length === 1;

  const totalInitial =
    selectedPlans.reduce(
      (s, i) => s + (i.final_initial_price || i.initial_price || 0),
      0
    ) + selectedAddons.reduce((s, a) => s + (a.initial_price || 0), 0);

  const totalRecurring =
    selectedPlans.reduce(
      (s, i) => s + (i.final_recurring_price || i.recurring_price || 0),
      0
    ) + selectedAddons.reduce((s, a) => s + (a.recurring_price || 0), 0);

  // Billing frequency from first selected regular plan
  const billingFrequency =
    selectedPlans.find((item: any) => item.billing_frequency)
      ?.billing_frequency || 'monthly';

  const renderItemPrice = (item: any, isAddon = false) => {
    const recurring = isAddon ? item.recurring_price : (item.final_recurring_price || item.recurring_price);
    const initial = isAddon ? item.initial_price : (item.final_initial_price || item.initial_price);
    const freq = item.billing_frequency;
    return (
      <>
        {recurring > 0 && (
          <span className={styles.totalItemPriceRecurring}>
            <span className={styles.totalItemPriceAmount}>${formatCurrency(recurring)}</span>
            <span className={styles.totalItemPriceFreq}>/{abbreviateFrequency(freq)}</span>
          </span>
        )}
        {initial > 0 && (
          <span className={styles.totalItemPriceInitial}>
            <span className={styles.totalItemPriceAmount}>${formatCurrency(initial)}</span>
            <span className={styles.totalItemPriceFreq}> initial</span>
          </span>
        )}
      </>
    );
  };

  return (
    <div className={styles.totalPricing}>
      <h3>Customized Quote Total</h3>
      <div className={styles.totalRow}>
        <div>Total Initial Cost:</div>
        <strong>
          <sup>$</sup>
          {formatCurrency(totalInitial)}
        </strong>
        <div className={styles.totalListWrapper}>
          <ul className={styles.totalItemsList}>
            {/* Services sub-section */}
            <li className={styles.totalSectionLabel}>Services</li>
            {regularLineItems.map((item, idx) => {
              const isSelected = selectedPlanIds.includes(item.id);
              const isOnly = isOnlyOnePlan && isSelected;
              return (
                <li key={idx} className={`${styles.totalItem} ${!isSelected ? styles.totalItemUnselected : ''}`}>
                  <span className={styles.totalItemLeft}>
                    {regularLineItems.length > 1 ? (
                      <label
                        className={`${styles.addonCheckbox} ${isOnly ? styles.addonCheckboxLastPlan : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onTogglePlan(item.id)}
                          disabled={isOnly}
                        />
                        <span className={`${styles.addonCheckboxCustom} ${isOnly ? styles.addonCheckboxDisabled : ''}`} />
                      </label>
                    ) : (
                      <span className={styles.totalItemCheckmark}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="11" viewBox="0 0 13 11" fill="none">
                          <path d="M1 7.04907L3.5 9.64154L11.8333 1" stroke="#0072DA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                    {item.plan_name}
                  </span>
                  <span className={styles.totalItemPrice}>{renderItemPrice(item)}</span>
                </li>
              );
            })}
            {/* Add-Ons sub-section */}
            {availableAddons.length > 0 && (
              <li className={styles.totalSectionLabel}>Add-Ons</li>
            )}
            {availableAddons.map((addon, idx) => {
              const isSelected = selectedAddonIds.includes(addon.id);
              return (
                <li key={`addon-${idx}`} className={`${styles.totalItem} ${!isSelected ? styles.totalItemUnselected : ''}`}>
                  <span className={styles.totalItemLeft}>
                    <label className={styles.addonCheckbox}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleAddon(addon.id)}
                      />
                      <span className={styles.addonCheckboxCustom} />
                    </label>
                    {addon.addon_name}
                  </span>
                  <span className={styles.totalItemPrice}>{renderItemPrice(addon, true)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className={styles.totalRow}>
        <div>Total Recurring Cost:</div>
        <span>
          <strong>
            <sup>$</sup>
            {formatCurrency(totalRecurring)}
          </strong>
          <span className={styles.totalRowFreq}>/{abbreviateFrequency(billingFrequency)}</span>
        </span>
      </div>
    </div>
  );
}
