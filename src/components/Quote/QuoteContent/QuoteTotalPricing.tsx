/**
 * Quote Total Pricing Component
 *
 * Displays the total initial and recurring costs for a quote
 * with a list of items contributing to the initial cost
 */

import styles from './quotecontent.module.scss';

interface QuoteTotalPricingProps {
  quote: {
    total_initial_price: number;
    total_recurring_price: number;
  };
  lineItems: any[];
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
  quote,
  lineItems,
}: QuoteTotalPricingProps) {
  // Determine billing frequency from first non-addon plan
  const billingFrequency =
    lineItems.find((item: any) => !item.addon_service_id)?.billing_frequency ||
    'monthly';
  return (
    <div className={styles.totalPricing}>
      <h3>Customized Quote Total</h3>
      <div className={styles.totalRow}>
        <div>Total Initial Cost:</div>
        <strong>
          <sup>$</sup>
          {formatCurrency(quote.total_initial_price)}
        </strong>
        <div className={styles.totalListWrapper}>
          {/* List of items contributing to initial cost */}
          <ul className={styles.totalItemsList}>
            {lineItems
              .filter(
                item =>
                  (item.final_initial_price || item.initial_price || 0) > 0
              )
              .map((item, idx) => (
                <li key={idx} className={styles.totalItem}>
                  <span className={styles.totalItemCheckmark}>
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
                  {item.plan_name}
                </li>
              ))}
          </ul>
        </div>
      </div>
      <div className={styles.totalRow}>
        <div>Total Recurring Cost:</div>
        <span>
          <strong>
            <sup>$</sup>
            {formatCurrency(quote.total_recurring_price)}
          </strong>
          /{abbreviateFrequency(billingFrequency)}
        </span>
      </div>
    </div>
  );
}
