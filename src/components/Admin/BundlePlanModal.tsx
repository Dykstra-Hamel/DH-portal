'use client';

import { useState, useEffect } from 'react';
import styles from './BundlePlanModal.module.scss';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { calculateIntervalCount, getIntervalLabel } from '@/lib/pricing-calculations';
import { BundlePlan, IntervalPricing } from '@/types/bundle';

interface ServicePlan {
  id: string;
  plan_name: string;
  initial_price: number;
  recurring_price: number;
}

interface AddOnService {
  id: string;
  addon_name: string;
  initial_price: number;
  recurring_price: number;
}

interface BundlePlanModalProps {
  bundle: BundlePlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (bundle: Partial<BundlePlan>) => Promise<void>;
  companyId: string;
}

export default function BundlePlanModal({
  bundle,
  isOpen,
  onClose,
  onSave,
  companyId,
}: BundlePlanModalProps) {
  const [formData, setFormData] = useState<Partial<BundlePlan>>({
    bundle_name: '',
    bundle_description: '',
    bundle_category: 'standard',
    bundled_service_plans: [],
    bundled_add_ons: [],
    pricing_mode: 'global',
    pricing_type: 'discount',
    custom_initial_price: undefined,
    custom_recurring_price: undefined,
    discount_type: 'percentage',
    discount_value: 10,
    applies_to_price: 'both',
    recurring_discount_type: 'percentage',
    recurring_discount_value: 10,
    interval_dimension: 'home',
    interval_pricing: [],
    billing_frequency: 'monthly',
    bundle_features: [''],
    bundle_image_url: undefined,
    display_order: 0,
    highlight_badge: '',
    is_active: true,
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [availablePlans, setAvailablePlans] = useState<ServicePlan[]>([]);
  const [availableAddOns, setAvailableAddOns] = useState<AddOnService[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch pricing settings to determine number of intervals
  const { settings: pricingSettings, isLoading: settingsLoading } = usePricingSettings(companyId);

  useEffect(() => {
    if (bundle) {
      setFormData({
        bundle_name: bundle.bundle_name,
        bundle_description: bundle.bundle_description,
        bundle_category: bundle.bundle_category,
        bundled_service_plans: bundle.bundled_service_plans || [],
        bundled_add_ons: bundle.bundled_add_ons || [],
        pricing_mode: bundle.pricing_mode || 'global',
        pricing_type: bundle.pricing_type,
        custom_initial_price: bundle.custom_initial_price,
        custom_recurring_price: bundle.custom_recurring_price,
        discount_type: bundle.discount_type,
        discount_value: bundle.discount_value,
        applies_to_price: bundle.applies_to_price || 'both',
        recurring_discount_type: bundle.recurring_discount_type,
        recurring_discount_value: bundle.recurring_discount_value,
        interval_dimension: bundle.interval_dimension || 'home',
        interval_pricing: bundle.interval_pricing || [],
        billing_frequency: bundle.billing_frequency,
        bundle_features: bundle.bundle_features.length > 0 ? bundle.bundle_features : [''],
        bundle_image_url: bundle.bundle_image_url,
        display_order: bundle.display_order,
        highlight_badge: bundle.highlight_badge,
        is_active: bundle.is_active,
      });
    }
  }, [bundle]);

  useEffect(() => {
    if (isOpen && companyId) {
      loadAvailableItems();
    }
  }, [isOpen, companyId]);

  const loadAvailableItems = async () => {
    setLoading(true);
    try {
      // Load service plans
      const plansResponse = await fetch(`/api/admin/service-plans/${companyId}`);
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        if (plansData.success) {
          setAvailablePlans(plansData.data || []);
        }
      }

      // Load add-ons
      const addonsResponse = await fetch(`/api/admin/addon-services/${companyId}`);
      if (addonsResponse.ok) {
        const addonsData = await addonsResponse.json();
        if (addonsData.success) {
          setAvailableAddOns(addonsData.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading available items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize interval pricing for a specific dimension
  const initializeIntervalPricingForDimension = (dimension: 'home' | 'yard' | 'linear_feet') => {
    if (!pricingSettings) return [];

    const intervalCount = calculateIntervalCount(pricingSettings, dimension);
    const intervals: IntervalPricing[] = [];

    for (let i = 0; i < intervalCount; i++) {
      intervals.push({
        interval_index: i,
        pricing_type: 'discount',
        discount_type: 'percentage',
        discount_value: 10,
        recurring_discount_type: 'percentage',
        recurring_discount_value: 10,
      });
    }

    return intervals;
  };

  const handlePricingModeChange = (mode: 'global' | 'per_interval') => {
    if (mode === 'per_interval' && (!formData.interval_pricing || formData.interval_pricing.length === 0)) {
      // Initialize interval pricing if switching to per_interval mode
      const dimension = formData.interval_dimension || 'home';
      const intervals = initializeIntervalPricingForDimension(dimension);

      setFormData({
        ...formData,
        pricing_mode: mode,
        interval_dimension: dimension,
        interval_pricing: intervals,
      });
    } else {
      setFormData({
        ...formData,
        pricing_mode: mode,
      });
    }
  };

  const handleIntervalDimensionChange = (dimension: 'home' | 'yard' | 'linear_feet') => {
    // Reinitialize interval pricing with the new dimension
    const intervals = initializeIntervalPricingForDimension(dimension);

    setFormData({
      ...formData,
      interval_dimension: dimension,
      interval_pricing: intervals,
    });
  };

  const updateIntervalPricing = (index: number, updates: Partial<IntervalPricing>) => {
    const intervals = [...(formData.interval_pricing || [])];
    intervals[index] = { ...intervals[index], ...updates };
    setFormData({ ...formData, interval_pricing: intervals });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bundle_name) {
      alert('Bundle name is required');
      return;
    }

    const pricingMode = formData.pricing_mode || 'global';

    if (pricingMode === 'global') {
      // Validate global pricing
      if (formData.pricing_type === 'custom') {
        if (!formData.custom_initial_price || !formData.custom_recurring_price) {
          alert('Custom pricing requires both initial and recurring prices');
          return;
        }
      } else {
        // Discount pricing validation
        const appliesToPrice = formData.applies_to_price || 'both';

        if (appliesToPrice === 'initial' || appliesToPrice === 'recurring') {
          if (!formData.discount_type || formData.discount_value === null) {
            alert('Discount pricing requires discount type and value');
            return;
          }
        } else if (appliesToPrice === 'both') {
          // When 'both', validate both initial and recurring discount fields
          if (!formData.discount_type || formData.discount_value === null) {
            alert('Initial discount requires discount type and value');
            return;
          }
          if (!formData.recurring_discount_type || formData.recurring_discount_value === null) {
            alert('Recurring discount requires discount type and value');
            return;
          }
        }
      }
    } else {
      // Validate per-interval pricing
      if (!formData.interval_pricing || formData.interval_pricing.length === 0) {
        alert('Per-interval pricing requires at least one interval to be configured');
        return;
      }

      for (let i = 0; i < formData.interval_pricing.length; i++) {
        const interval = formData.interval_pricing[i];
        if (interval.pricing_type === 'custom') {
          if (!interval.custom_initial_price || !interval.custom_recurring_price) {
            alert(`Interval ${i + 1}: Custom pricing requires both initial and recurring prices`);
            return;
          }
        } else {
          // Discount pricing
          if (!interval.discount_type || interval.discount_value === null) {
            alert(`Interval ${i + 1}: Discount pricing requires discount type and value`);
            return;
          }
          if (!interval.recurring_discount_type || interval.recurring_discount_value === null) {
            alert(`Interval ${i + 1}: Recurring discount requires discount type and value`);
            return;
          }
        }
      }
    }

    if (formData.bundled_service_plans!.length === 0 && formData.bundled_add_ons!.length === 0) {
      alert('Please select at least one service plan or add-on for the bundle');
      return;
    }

    await onSave({
      ...formData,
      company_id: companyId,
      bundle_features: formData.bundle_features!.filter(f => f.trim() !== ''),
    });
  };

  const handlePlanToggle = (planId: string, planName: string) => {
    const bundledPlans = formData.bundled_service_plans || [];
    const exists = bundledPlans.some(p => p.service_plan_id === planId);

    if (exists) {
      setFormData({
        ...formData,
        bundled_service_plans: bundledPlans.filter(p => p.service_plan_id !== planId),
      });
    } else {
      setFormData({
        ...formData,
        bundled_service_plans: [...bundledPlans, { service_plan_id: planId, plan_name: planName }],
      });
    }
  };

  const handleAddOnToggle = (addOnId: string, addOnName: string) => {
    const bundledAddOns = formData.bundled_add_ons || [];
    const exists = bundledAddOns.some(a => a.add_on_id === addOnId);

    if (exists) {
      setFormData({
        ...formData,
        bundled_add_ons: bundledAddOns.filter(a => a.add_on_id !== addOnId),
      });
    } else {
      setFormData({
        ...formData,
        bundled_add_ons: [...bundledAddOns, { add_on_id: addOnId, addon_name: addOnName }],
      });
    }
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      bundle_features: [...(formData.bundle_features || []), ''],
    });
  };

  const updateFeature = (index: number, value: string) => {
    const features = [...(formData.bundle_features || [])];
    features[index] = value;
    setFormData({ ...formData, bundle_features: features });
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      bundle_features: (formData.bundle_features || []).filter((_, i) => i !== index),
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{bundle ? 'Edit Bundle Plan' : 'Create Bundle Plan'}</h2>
          <button type="button" onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'basic' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'items' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('items')}
          >
            Bundle Items
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'pricing' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            Pricing
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'display' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('display')}
          >
            Display
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {activeTab === 'basic' && (
              <div className={styles.tabContent}>
                <div className={styles.formGroup}>
                  <label>Bundle Name *</label>
                  <input
                    type="text"
                    value={formData.bundle_name}
                    onChange={(e) => setFormData({ ...formData, bundle_name: e.target.value })}
                    placeholder="e.g., Ultimate Protection Package"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={formData.bundle_description}
                    onChange={(e) => setFormData({ ...formData, bundle_description: e.target.value })}
                    placeholder="Describe what&apos;s included in this bundle..."
                    rows={4}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select
                    value={formData.bundle_category}
                    onChange={(e) => setFormData({ ...formData, bundle_category: e.target.value })}
                  >
                    <option value="starter">Starter</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="ultimate">Ultimate</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div className={styles.tabContent}>
                {loading ? (
                  <div>Loading available items...</div>
                ) : (
                  <>
                    <div className={styles.section}>
                      <h4>Service Plans</h4>
                      {availablePlans.length === 0 ? (
                        <p>No service plans available</p>
                      ) : (
                        <div className={styles.checkboxList}>
                          {availablePlans.map((plan) => (
                            <label key={plan.id} className={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={(formData.bundled_service_plans || []).some(
                                  p => p.service_plan_id === plan.id
                                )}
                                onChange={() => handlePlanToggle(plan.id, plan.plan_name)}
                              />
                              {plan.plan_name} (${plan.initial_price} / ${plan.recurring_price}/mo)
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={styles.section}>
                      <h4>Add-On Services</h4>
                      {availableAddOns.length === 0 ? (
                        <p>No add-ons available</p>
                      ) : (
                        <div className={styles.checkboxList}>
                          {availableAddOns.map((addOn) => (
                            <label key={addOn.id} className={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={(formData.bundled_add_ons || []).some(
                                  a => a.add_on_id === addOn.id
                                )}
                                onChange={() => handleAddOnToggle(addOn.id, addOn.addon_name)}
                              />
                              {addOn.addon_name} (${addOn.initial_price} / ${addOn.recurring_price}/mo)
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className={styles.tabContent}>
                <div className={styles.formGroup}>
                  <label>Pricing Mode</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="pricing_mode"
                        value="global"
                        checked={(formData.pricing_mode || 'global') === 'global'}
                        onChange={() => handlePricingModeChange('global')}
                      />
                      Global Pricing (Same pricing for all sizes)
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="pricing_mode"
                        value="per_interval"
                        checked={formData.pricing_mode === 'per_interval'}
                        onChange={() => handlePricingModeChange('per_interval')}
                      />
                      Per-Interval Pricing (Different pricing for each size interval)
                    </label>
                  </div>
                  <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                    Global pricing applies the same price or discount regardless of property size.
                    Per-interval pricing allows you to set different prices or discounts for each size interval.
                  </small>
                </div>

                {(formData.pricing_mode || 'global') === 'global' ? (
                  <>
                    <div className={styles.formGroup}>
                      <label>Pricing Strategy</label>
                      <div className={styles.radioGroup}>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="pricing_type"
                            value="custom"
                            checked={formData.pricing_type === 'custom'}
                            onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value as 'custom' })}
                          />
                          Custom Pricing (Set exact bundle price)
                        </label>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="pricing_type"
                            value="discount"
                            checked={formData.pricing_type === 'discount'}
                            onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value as 'discount' })}
                          />
                          Discount (Apply discount to total of bundled items)
                        </label>
                      </div>
                    </div>

                {formData.pricing_type === 'custom' ? (
                  <>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Initial Price ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.custom_initial_price || ''}
                          onChange={(e) => setFormData({ ...formData, custom_initial_price: parseFloat(e.target.value) || undefined })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Recurring Price ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.custom_recurring_price || ''}
                          onChange={(e) => setFormData({ ...formData, custom_recurring_price: parseFloat(e.target.value) || undefined })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.formGroup}>
                      <label>Apply Discount To</label>
                      <div className={styles.radioGroup}>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="applies_to_price"
                            value="initial"
                            checked={formData.applies_to_price === 'initial'}
                            onChange={(e) => setFormData({ ...formData, applies_to_price: e.target.value as 'initial' })}
                          />
                          Initial Price Only
                        </label>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="applies_to_price"
                            value="recurring"
                            checked={formData.applies_to_price === 'recurring'}
                            onChange={(e) => setFormData({ ...formData, applies_to_price: e.target.value as 'recurring' })}
                          />
                          Recurring Price Only
                        </label>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="applies_to_price"
                            value="both"
                            checked={formData.applies_to_price === 'both'}
                            onChange={(e) => setFormData({ ...formData, applies_to_price: e.target.value as 'both' })}
                          />
                          Both (Separate discounts for initial and recurring)
                        </label>
                      </div>
                    </div>

                    {(formData.applies_to_price === 'initial' || formData.applies_to_price === 'recurring') && (
                      <>
                        <div className={styles.formGroup}>
                          <label>Discount Type</label>
                          <select
                            value={formData.discount_type || 'percentage'}
                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ($)</option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label>Discount Value *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={formData.discount_type === 'percentage' ? '100' : undefined}
                            value={formData.discount_value || ''}
                            onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || undefined })}
                            placeholder={formData.discount_type === 'percentage' ? '10' : '0.00'}
                          />
                          <small>
                            {formData.discount_type === 'percentage'
                              ? `Percentage off the ${formData.applies_to_price} price`
                              : `Fixed dollar amount off the ${formData.applies_to_price} price`}
                          </small>
                        </div>
                      </>
                    )}

                    {formData.applies_to_price === 'both' && (
                      <div className={styles.bothDiscountsContainer}>
                        <div className={styles.discountGroup}>
                          <h4>Initial Price Discount</h4>
                          <div className={styles.formGroup}>
                            <label>Discount Type</label>
                            <select
                              value={formData.discount_type || 'percentage'}
                              onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed Amount ($)</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label>Discount Value *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={formData.discount_type === 'percentage' ? '100' : undefined}
                              value={formData.discount_value || ''}
                              onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || undefined })}
                              placeholder={formData.discount_type === 'percentage' ? '10' : '0.00'}
                            />
                          </div>
                        </div>

                        <div className={styles.discountGroup}>
                          <h4>Recurring Price Discount</h4>
                          <div className={styles.formGroup}>
                            <label>Discount Type</label>
                            <select
                              value={formData.recurring_discount_type || 'percentage'}
                              onChange={(e) => setFormData({ ...formData, recurring_discount_type: e.target.value as 'percentage' | 'fixed' })}
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed Amount ($)</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label>Discount Value *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={formData.recurring_discount_type === 'percentage' ? '100' : undefined}
                              value={formData.recurring_discount_value || ''}
                              onChange={(e) => setFormData({ ...formData, recurring_discount_value: parseFloat(e.target.value) || undefined })}
                              placeholder={formData.recurring_discount_type === 'percentage' ? '10' : '0.00'}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                  </>
                ) : (
                  /* Per-Interval Pricing UI */
                  <div className={styles.intervalPricingSection}>
                    <h4>Interval Pricing Configuration</h4>

                    {/* Dimension Selector */}
                    <div className={styles.formGroup}>
                      <label>Interval Type</label>
                      <div className={styles.radioGroup}>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="interval_dimension"
                            value="home"
                            checked={(formData.interval_dimension || 'home') === 'home'}
                            onChange={() => handleIntervalDimensionChange('home')}
                          />
                          Home Size (Sq Ft)
                        </label>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="interval_dimension"
                            value="yard"
                            checked={formData.interval_dimension === 'yard'}
                            onChange={() => handleIntervalDimensionChange('yard')}
                          />
                          Yard Size (Acres)
                        </label>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="interval_dimension"
                            value="linear_feet"
                            checked={formData.interval_dimension === 'linear_feet'}
                            onChange={() => handleIntervalDimensionChange('linear_feet')}
                          />
                          Linear Feet
                        </label>
                      </div>
                      <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                        Choose which measurement type to base the interval pricing on. Each interval can have different pricing or discounts.
                      </small>
                    </div>

                    {settingsLoading ? (
                      <div>Loading pricing intervals...</div>
                    ) : !pricingSettings ? (
                      <div style={{ padding: '16px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
                        <strong>⚠️ Pricing Settings Required</strong>
                        <p style={{ marginTop: '8px' }}>
                          {formData.interval_dimension === 'home'
                            ? 'Home size pricing intervals must be configured in Company Settings before you can use per-interval bundle pricing.'
                            : formData.interval_dimension === 'yard'
                            ? 'Yard size pricing intervals must be configured in Company Settings before you can use per-interval bundle pricing.'
                            : 'Linear feet pricing intervals must be configured in Company Settings before you can use per-interval bundle pricing.'}
                        </p>
                      </div>
                    ) : (
                      <div className={styles.intervalPricingTable}>
                        {(formData.interval_pricing || []).map((interval, index) => {
                          const dimension = formData.interval_dimension || 'home';
                          const intervalLabel = getIntervalLabel(pricingSettings, dimension, index);
                          return (
                            <div key={index} className={styles.intervalPricingRow}>
                              <div className={styles.intervalHeader}>
                                <h5>{intervalLabel}</h5>
                              </div>

                              <div className={styles.formGroup}>
                                <label>Pricing Strategy</label>
                                <div className={styles.radioGroup}>
                                  <label className={styles.radioLabel}>
                                    <input
                                      type="radio"
                                      name={`interval_${index}_pricing_type`}
                                      value="custom"
                                      checked={interval.pricing_type === 'custom'}
                                      onChange={() => updateIntervalPricing(index, { pricing_type: 'custom' })}
                                    />
                                    Custom Price
                                  </label>
                                  <label className={styles.radioLabel}>
                                    <input
                                      type="radio"
                                      name={`interval_${index}_pricing_type`}
                                      value="discount"
                                      checked={interval.pricing_type === 'discount'}
                                      onChange={() => updateIntervalPricing(index, { pricing_type: 'discount' })}
                                    />
                                    Discount
                                  </label>
                                </div>
                              </div>

                              {interval.pricing_type === 'custom' ? (
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Initial Price ($)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={interval.custom_initial_price || ''}
                                      onChange={(e) => updateIntervalPricing(index, { custom_initial_price: parseFloat(e.target.value) || 0 })}
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div className={styles.formGroup}>
                                    <label>Recurring Price ($)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={interval.custom_recurring_price || ''}
                                      onChange={(e) => updateIntervalPricing(index, { custom_recurring_price: parseFloat(e.target.value) || 0 })}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                      <label>Initial Discount Type</label>
                                      <select
                                        value={interval.discount_type || 'percentage'}
                                        onChange={(e) => updateIntervalPricing(index, { discount_type: e.target.value as 'percentage' | 'fixed' })}
                                      >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                      </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                      <label>Initial Discount Value</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={interval.discount_type === 'percentage' ? '100' : undefined}
                                        value={interval.discount_value || ''}
                                        onChange={(e) => updateIntervalPricing(index, { discount_value: parseFloat(e.target.value) || 0 })}
                                        placeholder={interval.discount_type === 'percentage' ? '10' : '0.00'}
                                      />
                                    </div>
                                  </div>

                                  <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                      <label>Recurring Discount Type</label>
                                      <select
                                        value={interval.recurring_discount_type || 'percentage'}
                                        onChange={(e) => updateIntervalPricing(index, { recurring_discount_type: e.target.value as 'percentage' | 'fixed' })}
                                      >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                      </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                      <label>Recurring Discount Value</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={interval.recurring_discount_type === 'percentage' ? '100' : undefined}
                                        value={interval.recurring_discount_value || ''}
                                        onChange={(e) => updateIntervalPricing(index, { recurring_discount_value: parseFloat(e.target.value) || 0 })}
                                        placeholder={interval.recurring_discount_type === 'percentage' ? '10' : '0.00'}
                                      />
                                    </div>
                                  </div>
                                </>
                              )}

                              {index < (formData.interval_pricing || []).length - 1 && (
                                <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e9ecef' }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.formGroup} style={{ marginTop: '24px' }}>
                  <label>Billing Frequency</label>
                  <select
                    value={formData.billing_frequency || 'monthly'}
                    onChange={(e) => setFormData({ ...formData, billing_frequency: e.target.value })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi-annually">Semi-Annually</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'display' && (
              <div className={styles.tabContent}>
                <div className={styles.formGroup}>
                  <label>Highlight Badge</label>
                  <input
                    type="text"
                    value={formData.highlight_badge || ''}
                    onChange={(e) => setFormData({ ...formData, highlight_badge: e.target.value })}
                    placeholder="e.g., Best Deal, Save 20%"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Bundle Image URL</label>
                  <input
                    type="url"
                    value={formData.bundle_image_url || ''}
                    onChange={(e) => setFormData({ ...formData, bundle_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Bundle Features</label>
                  {(formData.bundle_features || []).map((feature, index) => (
                    <div key={index} className={styles.featureInput}>
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Feature description"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className={styles.removeButton}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addFeature} className={styles.addButton}>
                    + Add Feature
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton}>
              {bundle ? 'Update Bundle' : 'Create Bundle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
