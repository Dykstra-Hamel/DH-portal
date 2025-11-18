'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './DiscountModal.module.scss';
import {
  CompanyDiscount,
  DiscountFormData,
  ServicePlanOption,
  MONTH_OPTIONS,
  DAY_OPTIONS,
} from '@/types/discount';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  discount: CompanyDiscount | null;
  companyId: string;
}

export default function DiscountModal({
  isOpen,
  onClose,
  onSave,
  discount,
  companyId,
}: DiscountModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servicePlans, setServicePlans] = useState<ServicePlanOption[]>([]);
  const [formData, setFormData] = useState<DiscountFormData>({
    discount_name: '',
    description: '',
    is_active: true,
    discount_type: 'percentage',
    discount_value: '',
    applies_to_price: 'initial',
    applies_to_plans: 'all',
    eligible_plan_ids: [],
    requires_manager: false,
    time_restriction_type: 'none',
    seasonal_start_month: '',
    seasonal_start_day: '',
    seasonal_end_month: '',
    seasonal_end_day: '',
    limited_time_start: '',
    limited_time_end: '',
    sort_order: 0,
  });

  // Fetch service plans for the company
  useEffect(() => {
    if (isOpen) {
      fetchServicePlans();
    }
  }, [isOpen, companyId]);

  // Populate form when editing
  useEffect(() => {
    if (discount) {
      setFormData({
        discount_name: discount.discount_name,
        description: discount.description || '',
        is_active: discount.is_active,
        discount_type: discount.discount_type,
        discount_value: discount.discount_value.toString(),
        applies_to_price: discount.applies_to_price,
        applies_to_plans: discount.applies_to_plans,
        eligible_plan_ids: discount.eligible_plan_ids || [],
        requires_manager: discount.requires_manager,
        time_restriction_type: discount.time_restriction_type,
        seasonal_start_month: discount.seasonal_start_month?.toString() || '',
        seasonal_start_day: discount.seasonal_start_day?.toString() || '',
        seasonal_end_month: discount.seasonal_end_month?.toString() || '',
        seasonal_end_day: discount.seasonal_end_day?.toString() || '',
        limited_time_start: discount.limited_time_start || '',
        limited_time_end: discount.limited_time_end || '',
        sort_order: discount.sort_order || 0,
      });
    } else {
      // Reset form for new discount
      setFormData({
        discount_name: '',
        description: '',
        is_active: true,
        discount_type: 'percentage',
        discount_value: '',
        applies_to_price: 'initial',
        applies_to_plans: 'all',
        eligible_plan_ids: [],
        requires_manager: false,
        time_restriction_type: 'none',
        seasonal_start_month: '',
        seasonal_start_day: '',
        seasonal_end_month: '',
        seasonal_end_day: '',
        limited_time_start: '',
        limited_time_end: '',
        sort_order: 0,
      });
    }
    setError(null);
  }, [discount, isOpen]);

  const fetchServicePlans = async () => {
    try {
      const response = await fetch(`/api/admin/service-plans/${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch service plans');
      const data = await response.json();
      setServicePlans(
        (data.data || []).map((plan: any) => ({
          id: plan.id,
          name: plan.plan_name,
        }))
      );
    } catch (err: any) {
      console.error('Error fetching service plans:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.discount_name.trim()) {
        throw new Error('Discount name is required');
      }
      if (!formData.discount_value || Number(formData.discount_value) <= 0) {
        throw new Error('Discount value must be greater than 0');
      }

      // Validate time restrictions
      if (formData.time_restriction_type === 'seasonal') {
        if (
          !formData.seasonal_start_month ||
          !formData.seasonal_start_day ||
          !formData.seasonal_end_month ||
          !formData.seasonal_end_day
        ) {
          throw new Error('All seasonal date fields are required');
        }
      }
      if (formData.time_restriction_type === 'limited_time') {
        if (!formData.limited_time_start || !formData.limited_time_end) {
          throw new Error('Both start and end dates are required for limited time discounts');
        }
      }

      // Prepare payload
      const payload = {
        discount_name: formData.discount_name.trim(),
        description: formData.description.trim() || null,
        is_active: formData.is_active,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        applies_to_price: formData.applies_to_price,
        applies_to_plans: formData.applies_to_plans,
        eligible_plan_ids:
          formData.applies_to_plans === 'specific'
            ? formData.eligible_plan_ids
            : [],
        requires_manager: formData.requires_manager,
        time_restriction_type: formData.time_restriction_type,
        seasonal_start_month:
          formData.time_restriction_type === 'seasonal'
            ? Number(formData.seasonal_start_month)
            : null,
        seasonal_start_day:
          formData.time_restriction_type === 'seasonal'
            ? Number(formData.seasonal_start_day)
            : null,
        seasonal_end_month:
          formData.time_restriction_type === 'seasonal'
            ? Number(formData.seasonal_end_month)
            : null,
        seasonal_end_day:
          formData.time_restriction_type === 'seasonal'
            ? Number(formData.seasonal_end_day)
            : null,
        limited_time_start:
          formData.time_restriction_type === 'limited_time'
            ? formData.limited_time_start
            : null,
        limited_time_end:
          formData.time_restriction_type === 'limited_time'
            ? formData.limited_time_end
            : null,
        sort_order: Number(formData.sort_order) || 0,
      };

      const url = discount
        ? `/api/companies/${companyId}/discounts/${discount.id}`
        : `/api/companies/${companyId}/discounts`;

      const method = discount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save discount');
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanToggle = (planId: string) => {
    setFormData((prev) => ({
      ...prev,
      eligible_plan_ids: prev.eligible_plan_ids.includes(planId)
        ? prev.eligible_plan_ids.filter((id) => id !== planId)
        : [...prev.eligible_plan_ids, planId],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{discount ? 'Edit Discount' : 'Create Discount'}</h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Basic Info */}
          <div className={styles.section}>
            <h3>Basic Information</h3>

            <div className={styles.formGroup}>
              <label htmlFor="discount_name">
                Discount Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="discount_name"
                value={formData.discount_name}
                onChange={(e) =>
                  setFormData({ ...formData, discount_name: e.target.value })
                }
                placeholder="e.g., Summer Special - 15% Off"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Internal notes about this discount..."
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <span>Active</span>
              </label>
            </div>
          </div>

          {/* Discount Value */}
          <div className={styles.section}>
            <h3>Discount Value</h3>

            <div className={styles.formGroup}>
              <label>Discount Type</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="discount_type"
                    value="percentage"
                    checked={formData.discount_type === 'percentage'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as 'percentage',
                      })
                    }
                  />
                  <span>Percentage</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="discount_type"
                    value="fixed_amount"
                    checked={formData.discount_type === 'fixed_amount'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as 'fixed_amount',
                      })
                    }
                  />
                  <span>Fixed Amount</span>
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="discount_value">
                Discount Value <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWithPrefix}>
                {formData.discount_type === 'fixed_amount' && (
                  <span className={styles.prefix}>$</span>
                )}
                <input
                  type="number"
                  id="discount_value"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_value: e.target.value })
                  }
                  placeholder={
                    formData.discount_type === 'percentage' ? '15' : '100'
                  }
                  min="0"
                  step={formData.discount_type === 'percentage' ? '0.01' : '1'}
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  required
                />
                {formData.discount_type === 'percentage' && (
                  <span className={styles.suffix}>%</span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Applies To</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="applies_to_price"
                    value="initial"
                    checked={formData.applies_to_price === 'initial'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        applies_to_price: e.target.value as 'initial',
                      })
                    }
                  />
                  <span>Initial Price Only</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="applies_to_price"
                    value="recurring"
                    checked={formData.applies_to_price === 'recurring'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        applies_to_price: e.target.value as 'recurring',
                      })
                    }
                  />
                  <span>Recurring Price Only</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="applies_to_price"
                    value="both"
                    checked={formData.applies_to_price === 'both'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        applies_to_price: e.target.value as 'both',
                      })
                    }
                  />
                  <span>Both</span>
                </label>
              </div>
            </div>
          </div>

          {/* Plan Targeting */}
          <div className={styles.section}>
            <h3>Plan Targeting</h3>

            <div className={styles.formGroup}>
              <label>Applies To</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="applies_to_plans"
                    value="all"
                    checked={formData.applies_to_plans === 'all'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        applies_to_plans: e.target.value as 'all',
                      })
                    }
                  />
                  <span>All Plans</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="applies_to_plans"
                    value="specific"
                    checked={formData.applies_to_plans === 'specific'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        applies_to_plans: e.target.value as 'specific',
                      })
                    }
                  />
                  <span>Specific Plans</span>
                </label>
              </div>
            </div>

            {formData.applies_to_plans === 'specific' && (
              <div className={styles.formGroup}>
                <label>Select Plans</label>
                <div className={styles.planList}>
                  {servicePlans.length === 0 ? (
                    <p className={styles.emptyMessage}>
                      No service plans found. Create plans first.
                    </p>
                  ) : (
                    servicePlans.map((plan) => (
                      <label key={plan.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.eligible_plan_ids.includes(plan.id)}
                          onChange={() => handlePlanToggle(plan.id)}
                        />
                        <span>{plan.plan_name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Access Control */}
          <div className={styles.section}>
            <h3>Access Control</h3>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.requires_manager}
                  onChange={(e) =>
                    setFormData({ ...formData, requires_manager: e.target.checked })
                  }
                />
                <span>Manager Only (requires admin/manager role to apply)</span>
              </label>
            </div>
          </div>

          {/* Time Restrictions */}
          <div className={styles.section}>
            <h3>Time Restrictions</h3>

            <div className={styles.formGroup}>
              <label>Restriction Type</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="time_restriction_type"
                    value="none"
                    checked={formData.time_restriction_type === 'none'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        time_restriction_type: e.target.value as 'none',
                      })
                    }
                  />
                  <span>None (Always Available)</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="time_restriction_type"
                    value="seasonal"
                    checked={formData.time_restriction_type === 'seasonal'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        time_restriction_type: e.target.value as 'seasonal',
                      })
                    }
                  />
                  <span>Seasonal (Repeats Yearly)</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="time_restriction_type"
                    value="limited_time"
                    checked={formData.time_restriction_type === 'limited_time'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        time_restriction_type: e.target.value as 'limited_time',
                      })
                    }
                  />
                  <span>Limited Time (One-Time Expiration)</span>
                </label>
              </div>
            </div>

            {formData.time_restriction_type === 'seasonal' && (
              <div className={styles.dateRangeGroup}>
                <div className={styles.dateRange}>
                  <label>Start Date</label>
                  <div className={styles.dateInputs}>
                    <select
                      value={formData.seasonal_start_month}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seasonal_start_month: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Month</option>
                      {MONTH_OPTIONS.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.seasonal_start_day}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seasonal_start_day: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Day</option>
                      {DAY_OPTIONS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.dateRange}>
                  <label>End Date</label>
                  <div className={styles.dateInputs}>
                    <select
                      value={formData.seasonal_end_month}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seasonal_end_month: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Month</option>
                      {MONTH_OPTIONS.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.seasonal_end_day}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seasonal_end_day: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Day</option>
                      {DAY_OPTIONS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {formData.time_restriction_type === 'limited_time' && (
              <div className={styles.dateRangeGroup}>
                <div className={styles.formGroup}>
                  <label htmlFor="limited_time_start">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    id="limited_time_start"
                    value={formData.limited_time_start}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limited_time_start: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="limited_time_end">End Date & Time</label>
                  <input
                    type="datetime-local"
                    id="limited_time_end"
                    value={formData.limited_time_end}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limited_time_end: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Display Order */}
          <div className={styles.section}>
            <h3>Display Settings</h3>

            <div className={styles.formGroup}>
              <label htmlFor="sort_order">Sort Order</label>
              <input
                type="number"
                id="sort_order"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: e.target.value })
                }
                min="0"
              />
              <small>Lower numbers appear first in the list</small>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : discount ? 'Update Discount' : 'Create Discount'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
