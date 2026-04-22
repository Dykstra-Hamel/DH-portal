'use client';

import styles from '../ServiceWizard.module.scss';
import type { ServicePlan } from './PlanSelectStep';

export interface PricingValues {
  initialPrice: number | null;
  recurringPrice: number | null;
  billingFrequency: string | null;
}

interface PricingStepProps {
  plan: ServicePlan | null;
  pricing: PricingValues;
  onChange: (next: PricingValues) => void;
}

function parsePrice(raw: string): number | null {
  const val = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(val) ? val : null;
}

export function PricingStep({ plan, pricing, onChange }: PricingStepProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {plan && (
        <div className={styles.reviewCard}>
          <div className={styles.reviewRow}>
            <span className={styles.reviewLabel}>Plan</span>
            <span className={styles.reviewValue}>{plan.plan_name}</span>
          </div>
          {plan.plan_description && (
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>Description</span>
              <span className={styles.reviewValue}>{plan.plan_description}</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.section}>
        <span className={styles.label}>Pricing</span>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>
          Adjust pricing as needed for this customer.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Initial price ($)</span>
          <input
            type="number"
            className={styles.priceInput}
            value={pricing.initialPrice ?? ''}
            min={0}
            step={1}
            placeholder={plan?.initial_price != null ? String(plan.initial_price) : '0.00'}
            onChange={e => onChange({ ...pricing, initialPrice: parsePrice(e.target.value) })}
          />
        </div>

        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Recurring price ($)</span>
          <input
            type="number"
            className={styles.priceInput}
            value={pricing.recurringPrice ?? ''}
            min={0}
            step={1}
            placeholder={plan?.recurring_price != null ? String(plan.recurring_price) : '0.00'}
            onChange={e => onChange({ ...pricing, recurringPrice: parsePrice(e.target.value) })}
          />
        </div>

        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Billing frequency</span>
          <select
            className={styles.priceInput}
            value={pricing.billingFrequency ?? ''}
            onChange={e => onChange({ ...pricing, billingFrequency: e.target.value || null })}
            style={{ cursor: 'pointer' }}
          >
            <option value="">Select&hellip;</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
            <option value="one-time">One-time</option>
          </select>
        </div>
      </div>
    </div>
  );
}
