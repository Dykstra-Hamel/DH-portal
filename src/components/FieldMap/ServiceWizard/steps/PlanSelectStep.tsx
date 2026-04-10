'use client';

import { useEffect, useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import styles from '../ServiceWizard.module.scss';

export interface ServicePlan {
  id: string;
  plan_name: string;
  plan_description: string | null;
  initial_price: number | null;
  recurring_price: number | null;
  billing_frequency: string | null;
  plan_features: string[] | null;
  plan_terms: string | null;
  highlight_badge: string | null;
  display_order: number | null;
  pest_coverage?: Array<{
    pest_id: string;
    pest_name: string;
    pest_slug: string | null;
    coverage_level: string | null;
  }>;
}

interface PlanSelectStepProps {
  pestTypes: string[];
  plottedPestIds?: string[];
  selectedPlanId: string | null;
  onSelect: (plan: ServicePlan) => void;
}

export function PlanSelectStep({ pestTypes, plottedPestIds = [], selectedPlanId, onSelect }: PlanSelectStepProps) {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id ?? null;
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedPestTypes = new Set(
    pestTypes
      .map(type =>
        type
          .trim()
          .toLowerCase()
          .replace(/&/g, ' and ')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      )
      .filter(Boolean)
  );

  const filteredPlans =
    normalizedPestTypes.size === 0 && plottedPestIds.length === 0
      ? plans
      : plans.filter(plan => {
          const coverage = plan.pest_coverage ?? [];
          if (coverage.length === 0) return true;

          // ID match first (dynamic company pests)
          if (plottedPestIds.length > 0 && coverage.some(item => plottedPestIds.includes(item.pest_id))) {
            return true;
          }

          // Fallback: slug/name match (hardcoded pest types)
          return coverage.some(item => {
            const slug = (item.pest_slug ?? '')
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9-]+/g, '-')
              .replace(/^-+|-+$/g, '');
            const name = (item.pest_name ?? '')
              .trim()
              .toLowerCase()
              .replace(/&/g, ' and ')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');

            return normalizedPestTypes.has(slug) || normalizedPestTypes.has(name);
          });
        });

  useEffect(() => {
    if (!selectedCompanyId) return;
    let cancelled = false;

    async function fetchPlans() {
      try {
        const res = await fetch(`/api/service-plans/${selectedCompanyId}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.success) {
          setError(data.error ?? 'Failed to load plans');
          return;
        }
        setPlans(data.plans ?? []);
      } catch {
        if (!cancelled) setError('Failed to connect to server');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPlans();
    return () => { cancelled = true; };
  }, [selectedCompanyId]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <span>Loading plans&hellip;</span>
      </div>
    );
  }

  if (error) {
    return <div className={styles.errorMsg}>{error}</div>;
  }

  if (plans.length === 0) {
    return <div className={styles.emptyPlans}>No service plans found for your company.</div>;
  }

  if (filteredPlans.length === 0) {
    return (
      <div className={styles.emptyPlans}>
        No active plans match the plotted pests. Clear pest stamps to show all plans.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {pestTypes.length > 0 && (
        <div className={styles.section}>
          <span className={styles.label}>Pests plotted</span>
          <div className={styles.pestTags}>
            {pestTypes.map(t => (
              <span key={t} className={styles.pestTag}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {filteredPlans.map(plan => (
        <button
          key={plan.id}
          type="button"
          className={`${styles.planCard} ${selectedPlanId === plan.id ? styles.planCardSelected : ''}`}
          onClick={() => onSelect(plan)}
        >
          {plan.highlight_badge && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>
              {plan.highlight_badge}
            </span>
          )}
          <p className={styles.planName}>{plan.plan_name}</p>
          {plan.plan_description && (
            <p className={styles.planDesc}>{plan.plan_description}</p>
          )}
          <div className={styles.planPricing}>
            {plan.initial_price != null && (
              <span className={styles.planPrice}>
                Initial: <strong>${plan.initial_price}</strong>
              </span>
            )}
            {plan.recurring_price != null && (
              <span className={styles.planPrice}>
                Recurring: <strong>${plan.recurring_price}{plan.billing_frequency ? ` / ${plan.billing_frequency}` : ''}</strong>
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
