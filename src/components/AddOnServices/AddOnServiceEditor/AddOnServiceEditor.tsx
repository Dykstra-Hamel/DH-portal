'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './AddOnServiceEditor.module.scss';
import { AddOnService, AddOnServiceFormData } from '@/types/addon-service';
import DynamicListEditor from '@/components/Campaigns/DynamicListEditor/DynamicListEditor';
import RichTextEditor from '@/components/Common/RichTextEditor/RichTextEditor';

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
    addon_faqs: [],
    addon_terms: '',
    eligibility_mode: 'all',
    eligible_plan_ids: [],
    is_active: true,
    requires_quote: false,
    pricing_type: 'flat',
    price_per_unit: null,
    additional_unit_price: null,
    minimum_price: null,
    variants: [],
    percentage_pricing: null,
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
          addon_faqs: addon.addon_faqs || [],
          addon_terms: addon.addon_terms || '',
          eligibility_mode: addon.eligibility_mode,
          eligible_plan_ids: addon.eligible_plan_ids || [],
          is_active: addon.is_active,
          requires_quote: addon.requires_quote ?? false,
          pricing_type: addon.pricing_type ?? 'flat',
          price_per_unit: addon.price_per_unit ?? null,
          additional_unit_price: addon.additional_unit_price ?? null,
          minimum_price: addon.minimum_price ?? null,
          variants: addon.variants ?? [],
          percentage_pricing: addon.percentage_pricing ?? null,
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
          addon_faqs: [],
          addon_terms: '',
          eligibility_mode: 'all',
          eligible_plan_ids: [],
          is_active: true,
          requires_quote: false,
          pricing_type: 'flat',
          price_per_unit: null,
          additional_unit_price: null,
          minimum_price: null,
          variants: [],
          percentage_pricing: null,
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

  const faqFields = [
    {
      name: 'question',
      label: 'Question',
      type: 'text' as const,
      placeholder: 'e.g., How often is this service performed?',
      required: true,
    },
    {
      name: 'answer',
      label: 'Answer',
      type: 'textarea' as const,
      placeholder: 'Detailed answer to the question',
      required: true,
    },
  ];

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
                  value={formData.billing_frequency ?? ''}
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

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.requires_quote}
                  onChange={e =>
                    setFormData({ ...formData, requires_quote: e.target.checked })
                  }
                />
                <span>Requires Custom Quote</span>
              </label>
              <p className={styles.helpText}>
                When enabled, pricing will not be shown. A custom quote must be entered for each customer.
              </p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="pricing_type">Pricing Type</label>
              <select
                id="pricing_type"
                value={formData.pricing_type}
                onChange={e =>
                  setFormData({
                    ...formData,
                    pricing_type: e.target.value as AddOnServiceFormData['pricing_type'],
                    price_per_unit: null,
                    additional_unit_price: null,
                  })
                }
              >
                <option value="flat">Flat Rate</option>
                <option value="per_sqft">Per Square Foot</option>
                <option value="per_linear_foot">Per Linear Foot</option>
                <option value="per_acre">Per Acre</option>
                <option value="per_hour">Per Hour</option>
                <option value="per_room">Per Room</option>
              </select>
            </div>

            {['per_sqft', 'per_linear_foot', 'per_acre'].includes(formData.pricing_type) && (
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="price_per_unit">
                    Price Per {formData.pricing_type === 'per_sqft' ? 'Sq Ft' : formData.pricing_type === 'per_linear_foot' ? 'Linear Ft' : 'Acre'} ($)
                  </label>
                  <input
                    id="price_per_unit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_per_unit ?? ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        price_per_unit: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="minimum_price_addon">Minimum Price ($)</label>
                  <input
                    id="minimum_price_addon"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimum_price ?? ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        minimum_price: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    placeholder="No minimum"
                  />
                </div>
              </div>
            )}

            {formData.pricing_type === 'per_room' && (
              <div className={styles.formGroup}>
                <label htmlFor="additional_unit_price">Price Per Additional Room ($)</label>
                <input
                  id="additional_unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.additional_unit_price ?? ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      additional_unit_price: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="0.00"
                />
                <p className={styles.helpText}>First room uses the Initial Price above. Each additional room adds this amount.</p>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.percentage_pricing !== null}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      percentage_pricing: e.target.checked
                        ? { percentage: 0, years: undefined, minimum: undefined }
                        : null,
                    })
                  }
                />
                <span>Percentage-Based Pricing</span>
              </label>
              <p className={styles.helpText}>
                Price is calculated as a percentage of the related job cost (e.g. a warranty add-on).
              </p>
            </div>

            {formData.percentage_pricing !== null && (
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.percentage_pricing.percentage}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        percentage_pricing: {
                          ...formData.percentage_pricing!,
                          percentage: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Years (optional)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formData.percentage_pricing.years ?? ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        percentage_pricing: {
                          ...formData.percentage_pricing!,
                          years: e.target.value ? parseInt(e.target.value) : undefined,
                        },
                      })
                    }
                    placeholder="e.g. 2"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Minimum ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.percentage_pricing.minimum ?? ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        percentage_pricing: {
                          ...formData.percentage_pricing!,
                          minimum: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    placeholder="No minimum"
                  />
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Variants (Optional)</label>
              <p className={styles.helpText}>
                Variants let reps choose a named option (e.g. &quot;Small&quot;, &quot;Large&quot;) with different pricing when building a quote. Leave any field blank to inherit the add-on&apos;s default.
              </p>
              {formData.variants.map((variant, index) => {
                const isPerUnit = ['per_sqft', 'per_linear_foot', 'per_acre'].includes(formData.pricing_type);
                const updateVariant = (patch: Partial<typeof variant>) => {
                  const updated = [...formData.variants];
                  updated[index] = { ...updated[index], ...patch };
                  setFormData({ ...formData, variants: updated });
                };
                return (
                  <div key={index} className={styles.variantCard}>
                    <div className={styles.variantCardHeader}>
                      <input
                        type="text"
                        value={variant.label}
                        onChange={e => updateVariant({ label: e.target.value })}
                        placeholder="e.g. Small, Large"
                        className={styles.variantLabelInput}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            variants: formData.variants.filter((_, i) => i !== index),
                          })
                        }
                        className={styles.removeButton}
                      >
                        ✕
                      </button>
                    </div>
                    <div className={styles.variantFields}>
                      {isPerUnit ? (
                        <div className={styles.formGroup}>
                          <label>Price Per Unit ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={variant.price_per_unit ?? ''}
                            onChange={e =>
                              updateVariant({ price_per_unit: e.target.value === '' ? undefined : parseFloat(e.target.value) })
                            }
                            placeholder="Add-on default"
                          />
                        </div>
                      ) : (
                        <>
                          <div className={styles.formGroup}>
                            <label>Initial Price ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={variant.initial_price ?? ''}
                              onChange={e =>
                                updateVariant({ initial_price: e.target.value === '' ? undefined : parseFloat(e.target.value) })
                              }
                              placeholder="Add-on default"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Recurring Price ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={variant.recurring_price ?? ''}
                              onChange={e =>
                                updateVariant({ recurring_price: e.target.value === '' ? undefined : parseFloat(e.target.value) })
                              }
                              placeholder="Add-on default"
                            />
                          </div>
                        </>
                      )}
                      <div className={styles.formGroup}>
                        <label>Minimum Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.minimum_price ?? ''}
                          onChange={e =>
                            updateVariant({ minimum_price: e.target.value === '' ? undefined : parseFloat(e.target.value) })
                          }
                          placeholder="No minimum"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Billing Frequency</label>
                        <select
                          value={variant.billing_frequency ?? ''}
                          onChange={e =>
                            updateVariant({ billing_frequency: e.target.value || undefined })
                          }
                        >
                          <option value="">Add-on default</option>
                          <option value="one-time">One-Time</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="semi-annually">Semi-Annually</option>
                          <option value="annually">Annually</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, variants: [...formData.variants, { label: '' }] })
                }
                className={styles.addButton}
              >
                + Add Variant
              </button>
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

          {/* FAQ Section */}
          <div className={styles.formSection}>
            <h3>Frequently Asked Questions</h3>
            <p className={styles.helpText}>
              Add common questions customers might have about this add-on service
            </p>
            <DynamicListEditor
              label=""
              items={formData.addon_faqs}
              onChange={(faqs) => setFormData({ ...formData, addon_faqs: faqs })}
              fields={faqFields}
              addButtonText="Add FAQ"
              emptyText="No FAQs added yet. Click &apos;Add FAQ&apos; to create one."
            />
          </div>

          <div className={styles.formSection}>
            <h3>Terms and Conditions</h3>
            <div className={styles.formGroup}>
              <RichTextEditor
                value={formData.addon_terms}
                onChange={(value) => setFormData({ ...formData, addon_terms: value })}
                placeholder="Enter terms and conditions specific to this add-on..."
              />
              <p className={styles.helpText}>Displayed on the quote signing page when this add-on is selected.</p>
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
