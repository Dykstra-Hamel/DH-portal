'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './AddOnServiceEditor.module.scss';
import { AddOnService, AddOnServiceFormData } from '@/types/addon-service';

interface AddOnServiceEditorProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  addon?: AddOnService | null;
  onSuccess: () => void;
}

export default function AddOnServiceEditor({
  isOpen,
  onClose,
  companyId,
  addon,
  onSuccess,
}: AddOnServiceEditorProps) {
  const [formData, setFormData] = useState<AddOnServiceFormData>({
    addon_name: '',
    addon_description: '',
    addon_category: null,
    initial_price: null,
    recurring_price: 0,
    billing_frequency: 'monthly',
    treatment_frequency: 'monthly',
    addon_features: [],
    eligibility_mode: 'all',
    eligible_plan_ids: [],
    is_active: true,
  });

  const [servicePlans, setServicePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchServicePlans();

      if (addon) {
        // Populate form with addon data for editing
        setFormData({
          addon_name: addon.addon_name,
          addon_description: addon.addon_description || '',
          addon_category: addon.addon_category,
          initial_price: addon.initial_price,
          recurring_price: addon.recurring_price,
          billing_frequency: addon.billing_frequency,
          treatment_frequency: addon.treatment_frequency,
          addon_features: addon.addon_features || [],
          eligibility_mode: addon.eligibility_mode,
          eligible_plan_ids: addon.eligible_plan_ids || [],
          is_active: addon.is_active,
        });
      } else {
        // Reset form for new addon
        setFormData({
          addon_name: '',
          addon_description: '',
          addon_category: null,
          initial_price: null,
          recurring_price: 0,
          billing_frequency: 'monthly',
          treatment_frequency: 'monthly',
          addon_features: [],
          eligibility_mode: 'all',
          eligible_plan_ids: [],
          is_active: true,
        });
      }
    }
  }, [isOpen, addon]);

  const fetchServicePlans = async () => {
    try {
      const response = await fetch(`/api/service-plans/${companyId}`);
      const result = await response.json();
      if (result.success) {
        setServicePlans(result.plans || []);
      }
    } catch (error) {
      console.error('Error fetching service plans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = addon
        ? `/api/add-on-services/${companyId}/${addon.id}`
        : `/api/add-on-services/${companyId}`;

      const method = addon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert(result.error || 'Failed to save add-on service');
      }
    } catch (error) {
      console.error('Error saving add-on:', error);
      alert('Failed to save add-on service');
    } finally {
      setLoading(false);
    }
  };

  const handleEligibilityChange = (planId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      eligible_plan_ids: checked
        ? [...prev.eligible_plan_ids, planId]
        : prev.eligible_plan_ids.filter(id => id !== planId),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{addon ? 'Edit Add-On Service' : 'Create Add-On Service'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h3>Basic Information</h3>

            <div className={styles.formGroup}>
              <label htmlFor="addon_name">
                Add-On Name <span className={styles.required}>*</span>
              </label>
              <input
                id="addon_name"
                type="text"
                value={formData.addon_name}
                onChange={e =>
                  setFormData({ ...formData, addon_name: e.target.value })
                }
                placeholder="e.g., Weed Control"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="addon_description">Description</label>
              <textarea
                id="addon_description"
                value={formData.addon_description}
                onChange={e =>
                  setFormData({ ...formData, addon_description: e.target.value })
                }
                placeholder="Describe what this add-on service includes..."
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="addon_category">Category</label>
              <select
                id="addon_category"
                value={formData.addon_category || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    addon_category: e.target.value
                      ? (e.target.value as 'basic' | 'premium' | 'specialty')
                      : null,
                  })
                }
              >
                <option value="">None</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="specialty">Specialty</option>
              </select>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Pricing</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="initial_price">Initial Price</label>
                <input
                  id="initial_price"
                  type="number"
                  step="0.01"
                  value={formData.initial_price || ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      initial_price: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="recurring_price">
                  Recurring Price <span className={styles.required}>*</span>
                </label>
                <input
                  id="recurring_price"
                  type="number"
                  step="0.01"
                  value={formData.recurring_price}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      recurring_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="billing_frequency">
                  Billing Frequency <span className={styles.required}>*</span>
                </label>
                <select
                  id="billing_frequency"
                  value={formData.billing_frequency}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      billing_frequency: e.target.value as any,
                    })
                  }
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="semi-annually">Semi-Annually</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Service Details</h3>

            <div className={styles.formGroup}>
              <label htmlFor="treatment_frequency">Treatment Frequency</label>
              <select
                id="treatment_frequency"
                value={formData.treatment_frequency || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    treatment_frequency: e.target.value
                      ? (e.target.value as any)
                      : null,
                  })
                }
              >
                <option value="">Not specified</option>
                <option value="monthly">Monthly</option>
                <option value="bi-monthly">Bi-Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="on-demand">On-Demand</option>
              </select>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Eligibility</h3>

            <div className={styles.formGroup}>
              <label htmlFor="eligibility_mode">
                Service Plan Eligibility <span className={styles.required}>*</span>
              </label>
              <select
                id="eligibility_mode"
                value={formData.eligibility_mode}
                onChange={e =>
                  setFormData({
                    ...formData,
                    eligibility_mode: e.target.value as 'all' | 'specific',
                    eligible_plan_ids:
                      e.target.value === 'all' ? [] : formData.eligible_plan_ids,
                  })
                }
              >
                <option value="all">Available for all service plans</option>
                <option value="specific">Available for specific plans only</option>
              </select>
              <p className={styles.helpText}>
                Choose whether this add-on can be added to all service plans or only
                specific ones.
              </p>
            </div>

            {formData.eligibility_mode === 'specific' && (
              <div className={styles.formGroup}>
                <label>
                  Eligible Service Plans <span className={styles.required}>*</span>
                </label>
                {servicePlans.length === 0 ? (
                  <p className={styles.noPlans}>
                    No service plans found. Create service plans first.
                  </p>
                ) : (
                  <div className={styles.checkboxGroup}>
                    {servicePlans.map(plan => (
                      <label key={plan.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.eligible_plan_ids.includes(plan.id)}
                          onChange={e =>
                            handleEligibilityChange(plan.id, e.target.checked)
                          }
                        />
                        <span>{plan.plan_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.formActions}>
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
              disabled={loading}
              className={styles.submitButton}
            >
              {loading
                ? 'Saving...'
                : addon
                  ? 'Update Add-On'
                  : 'Create Add-On'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
