import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import RichTextEditor from '@/components/UI/RichTextEditor/RichTextEditor';
import styles from './WidgetConfig.module.scss';

interface ServicePlan {
  id: string;
  company_id: string;
  plan_name: string;
  plan_description: string;
  plan_category: string;
  initial_price: number;
  initial_discount: number;
  recurring_price: number;
  billing_frequency: string;
  treatment_frequency: string;
  includes_inspection: boolean;
  plan_features: string[];
  plan_faqs: Array<{ question: string; answer: string }>;
  display_order: number;
  highlight_badge: string | null;
  color_scheme: any;
  requires_quote: boolean;
  plan_image_url: string | null;
  plan_disclaimer: string | null;
  is_active: boolean;
  pest_coverage?: Array<{
    pest_id: string;
    coverage_level: string;
    pest_name: string;
    pest_slug: string;
    pest_icon: string;
    pest_category: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface PestType {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon_svg: string;
  is_active: boolean;
  pest_categories?: {
    name: string;
    slug: string;
  };
}

interface ServicePlanModalProps {
  plan?: ServicePlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: Partial<ServicePlan>) => void;
  availablePestTypes: PestType[];
}

const ServicePlanModal: React.FC<ServicePlanModalProps> = ({
  plan,
  isOpen,
  onClose,
  onSave,
  availablePestTypes,
}) => {
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_description: '',
    plan_category: 'standard',
    initial_price: 0,
    initial_discount: 0,
    recurring_price: 0,
    billing_frequency: 'monthly',
    treatment_frequency: 'monthly',
    includes_inspection: true,
    plan_features: [''],
    plan_faqs: [{ question: '', answer: '' }],
    display_order: 1,
    highlight_badge: '',
    requires_quote: false,
    plan_image_url: '',
    plan_disclaimer: '',
    is_active: true,
    allow_custom_pricing: false,
    pest_coverage: [] as Array<{ pest_id: string; coverage_level: string }>,
    home_size_pricing: {
      initial_cost_per_interval: 20.00,
      recurring_cost_per_interval: 10.00,
    },
    yard_size_pricing: {
      initial_cost_per_interval: 25.00,
      recurring_cost_per_interval: 15.00,
    },
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({
        plan_name: plan.plan_name,
        plan_description: plan.plan_description || '',
        plan_category: plan.plan_category || 'standard',
        initial_price: plan.initial_price || 0,
        initial_discount: plan.initial_discount || 0,
        recurring_price: plan.recurring_price,
        billing_frequency: plan.billing_frequency,
        treatment_frequency: plan.treatment_frequency || 'monthly',
        includes_inspection: plan.includes_inspection,
        plan_features: plan.plan_features.length > 0 ? plan.plan_features : [''],
        plan_faqs: plan.plan_faqs.length > 0 ? plan.plan_faqs : [{ question: '', answer: '' }],
        display_order: plan.display_order,
        highlight_badge: plan.highlight_badge || '',
        requires_quote: plan.requires_quote,
        plan_image_url: plan.plan_image_url || '',
        plan_disclaimer: plan.plan_disclaimer || '',
        is_active: plan.is_active,
        allow_custom_pricing: (plan as any).allow_custom_pricing || false,
        pest_coverage: plan.pest_coverage?.map(pc => ({
          pest_id: pc.pest_id,
          coverage_level: pc.coverage_level,
        })) || [],
        home_size_pricing: (plan as any).home_size_pricing || {
          initial_cost_per_interval: 20.00,
          recurring_cost_per_interval: 10.00,
        },
        yard_size_pricing: (plan as any).yard_size_pricing || {
          initial_cost_per_interval: 25.00,
          recurring_cost_per_interval: 15.00,
        },
      });
    } else {
      // Reset form for new plan
      setFormData({
        plan_name: '',
        plan_description: '',
        plan_category: 'standard',
        initial_price: 0,
        initial_discount: 0,
        recurring_price: 0,
        billing_frequency: 'monthly',
        treatment_frequency: 'monthly',
        includes_inspection: true,
        plan_features: [''],
        plan_faqs: [{ question: '', answer: '' }],
        display_order: 1,
        highlight_badge: '',
        requires_quote: false,
        plan_image_url: '',
        plan_disclaimer: '',
        is_active: true,
        allow_custom_pricing: false,
        pest_coverage: [],
        home_size_pricing: {
          initial_cost_per_interval: 20.00,
          recurring_cost_per_interval: 10.00,
        },
        yard_size_pricing: {
          initial_cost_per_interval: 25.00,
          recurring_cost_per_interval: 15.00,
        },
      });
    }
  }, [plan]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.plan_features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, plan_features: newFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      plan_features: [...prev.plan_features, ''],
    }));
  };

  const removeFeature = (index: number) => {
    if (formData.plan_features.length > 1) {
      const newFeatures = formData.plan_features.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, plan_features: newFeatures }));
    }
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...formData.plan_faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    setFormData(prev => ({ ...prev, plan_faqs: newFaqs }));
  };

  const addFaq = () => {
    setFormData(prev => ({
      ...prev,
      plan_faqs: [...prev.plan_faqs, { question: '', answer: '' }],
    }));
  };

  const removeFaq = (index: number) => {
    if (formData.plan_faqs.length > 1) {
      const newFaqs = formData.plan_faqs.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, plan_faqs: newFaqs }));
    }
  };

  const handlePestCoverageChange = (pestId: string, coverageLevel: string) => {
    const existingIndex = formData.pest_coverage.findIndex(pc => pc.pest_id === pestId);
    
    if (coverageLevel === 'none') {
      // Remove pest from coverage
      if (existingIndex !== -1) {
        const newCoverage = formData.pest_coverage.filter((_, i) => i !== existingIndex);
        setFormData(prev => ({ ...prev, pest_coverage: newCoverage }));
      }
    } else {
      // Add or update pest coverage
      const newCoverage = [...formData.pest_coverage];
      if (existingIndex !== -1) {
        newCoverage[existingIndex] = { pest_id: pestId, coverage_level: coverageLevel };
      } else {
        newCoverage.push({ pest_id: pestId, coverage_level: coverageLevel });
      }
      setFormData(prev => ({ ...prev, pest_coverage: newCoverage }));
    }
  };

  const getPestCoverageLevel = (pestId: string): string => {
    const coverage = formData.pest_coverage.find(pc => pc.pest_id === pestId);
    return coverage?.coverage_level || 'none';
  };

  // File upload functionality
  const uploadFile = async (
    file: File,
    bucket: string,
    folder: string
  ): Promise<string | null> => {
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2, 15)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const deleteFileFromStorage = async (url: string) => {
    try {
      const supabase = createClient();
      const urlParts = url.split('/');
      const bucket = urlParts[urlParts.length - 3];
      const folder = urlParts[urlParts.length - 2];
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${folder}/${fileName}`;

      await supabase.storage.from(bucket).remove([filePath]);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);

    try {
      // If there's an existing image, delete it from storage first
      if (formData.plan_image_url) {
        await deleteFileFromStorage(formData.plan_image_url);
      }

      const url = await uploadFile(file, 'brand-assets', 'service-plans');
      if (url) {
        handleInputChange('plan_image_url', url);
        // Clear the input so the same file can be selected again if needed
        event.target.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Could add error state handling here if needed
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.plan_name || !formData.recurring_price) {
      alert('Plan name and recurring price are required');
      return;
    }

    // Enrich pest_coverage with additional pest info and filter out empty features and FAQs
    const enrichedPestCoverage = formData.pest_coverage.map(coverage => {
      const pestType = availablePestTypes.find(p => p.id === coverage.pest_id);
      return {
        ...coverage,
        pest_name: pestType?.name || '',
        pest_slug: pestType?.slug || '',
        pest_icon: pestType?.icon_svg || '',
        pest_category: pestType?.pest_categories?.name || pestType?.category || 'Unknown',
      };
    });

    const cleanedData = {
      ...formData,
      plan_features: formData.plan_features.filter(f => f.trim() !== ''),
      plan_faqs: formData.plan_faqs.filter(faq => faq.question.trim() !== '' && faq.answer.trim() !== ''),
      pest_coverage: enrichedPestCoverage,
    };

    onSave(cleanedData);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{plan ? 'Edit Service Plan' : 'Create Service Plan'}</h3>
          <button type="button" onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.modalTabs}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'basic' ? styles.active : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'features' ? styles.active : ''}`}
            onClick={() => setActiveTab('features')}
          >
            Features & FAQs
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'coverage' ? styles.active : ''}`}
            onClick={() => setActiveTab('coverage')}
          >
            Pest Coverage
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'pricing' ? styles.active : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            Pricing
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {activeTab === 'basic' && (
            <div className={styles.tabContent}>
              <div className={styles.formGroup}>
                <label>Plan Name *</label>
                <input
                  type="text"
                  value={formData.plan_name}
                  onChange={(e) => handleInputChange('plan_name', e.target.value)}
                  placeholder="e.g., Basic Protection Plan"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.plan_description}
                  onChange={(e) => handleInputChange('plan_description', e.target.value)}
                  placeholder="Brief description of this plan"
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select
                    value={formData.plan_category}
                    onChange={(e) => handleInputChange('plan_category', e.target.value)}
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) => handleInputChange('display_order', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Initial Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.initial_price}
                    onChange={(e) => handleInputChange('initial_price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Initial Discount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.initial_discount}
                    onChange={(e) => handleInputChange('initial_discount', parseFloat(e.target.value) || 0)}
                    placeholder="Amount saved from normal price"
                  />
                  <small style={{color: '#666', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                    Normal price will be: ${((formData.initial_price || 0) + (formData.initial_discount || 0)).toFixed(2)}
                  </small>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Recurring Price ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.recurring_price}
                    onChange={(e) => handleInputChange('recurring_price', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  {/* Empty div to maintain grid layout */}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Billing Frequency</label>
                  <select
                    value={formData.billing_frequency}
                    onChange={(e) => handleInputChange('billing_frequency', e.target.value)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi-annually">Semi-Annually</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Treatment Frequency</label>
                  <select
                    value={formData.treatment_frequency}
                    onChange={(e) => handleInputChange('treatment_frequency', e.target.value)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="bi-monthly">Bi-Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Highlight Badge</label>
                <input
                  type="text"
                  value={formData.highlight_badge}
                  onChange={(e) => handleInputChange('highlight_badge', e.target.value)}
                  placeholder="e.g., Most Popular, Best Value"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Plan Image</label>
                <div className={styles.fileUploadSection}>
                  <div className={styles.fileUploadInfo}>
                    <small>
                      Upload an image to display with this plan. Images are stored in{' '}
                      <code>
                        /brand-assets/service-plans/
                      </code>
                    </small>
                  </div>
                  
                  {isUploadingImage ? (
                    <div className={styles.uploadingIndicator}>
                      <div className={styles.spinner}></div>
                      <span>Uploading image...</span>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className={styles.fileInput}
                    />
                  )}
                  
                  {formData.plan_image_url && formData.plan_image_url.trim() && (
                    <div className={`${styles.imagePreview} ${isUploadingImage ? styles.uploading : ''}`}>
                      <Image
                        src={formData.plan_image_url}
                        alt="Plan Image"
                        width={200}
                        height={120}
                        style={{ objectFit: 'cover', borderRadius: '8px' }}
                      />
                      {isUploadingImage && (
                        <div className={styles.imageOverlay}>
                          <div className={styles.overlaySpinner}></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Plan Disclaimer</label>
                <RichTextEditor
                  value={formData.plan_disclaimer || ''}
                  onChange={(value) => handleInputChange('plan_disclaimer', value)}
                  placeholder="Enter disclaimer text for this plan..."
                  rows={4}
                />
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.includes_inspection}
                    onChange={(e) => handleInputChange('includes_inspection', e.target.checked)}
                  />
                  Includes initial inspection
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.requires_quote}
                    onChange={(e) => handleInputChange('requires_quote', e.target.checked)}
                  />
                  Requires custom quote
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  />
                  Plan is active
                </label>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className={styles.tabContent}>
              <div className={styles.featuresSection}>
                <h4>Plan Features</h4>
                {formData.plan_features.map((feature, index) => (
                  <div key={index} className={styles.featureRow}>
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      placeholder="e.g., Covers 25+ pests"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className={styles.removeButton}
                      disabled={formData.plan_features.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addFeature} className={styles.addButton}>
                  + Add Feature
                </button>
              </div>

              <div className={styles.faqsSection}>
                <h4>Frequently Asked Questions</h4>
                {formData.plan_faqs.map((faq, index) => (
                  <div key={index} className={styles.faqRow}>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                      placeholder="Question"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                      placeholder="Answer"
                      rows={2}
                    />
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className={styles.removeButton}
                      disabled={formData.plan_faqs.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addFaq} className={styles.addButton}>
                  + Add FAQ
                </button>
              </div>
            </div>
          )}

          {activeTab === 'coverage' && (
            <div className={styles.tabContent}>
              <h4>Pest Coverage</h4>
              <p>Select which pests this plan covers and the level of coverage.</p>
              
              <div className={styles.pestCoverageGrid}>
                {availablePestTypes.map((pest) => (
                  <div key={pest.id} className={styles.pestCoverageItem}>
                    <div className={styles.pestInfo}>
                      <span className={styles.pestIcon} dangerouslySetInnerHTML={{__html: pest.icon_svg}}></span>
                      <span className={styles.pestName}>{pest.name}</span>
                    </div>
                    <select
                      value={getPestCoverageLevel(pest.id)}
                      onChange={(e) => handlePestCoverageChange(pest.id, e.target.value)}
                      className={styles.coverageSelect}
                    >
                      <option value="none">No Coverage</option>
                      <option value="prevention">Prevention</option>
                      <option value="partial">Partial</option>
                      <option value="full">Full Coverage</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className={styles.tabContent}>
              <h4>Pricing Per Interval</h4>
              <p>Set pricing increases for each size interval above the base size defined in company settings.</p>

              <div className={styles.pricingSection}>
                <h5>Home Size Pricing</h5>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Initial Cost Per Interval ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.home_size_pricing.initial_cost_per_interval}
                      onChange={(e) => setFormData({
                        ...formData,
                        home_size_pricing: {
                          ...formData.home_size_pricing,
                          initial_cost_per_interval: parseFloat(e.target.value) || 0,
                        },
                      })}
                      placeholder="20.00"
                    />
                    <small>Added to initial price for each interval above base</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Recurring Cost Per Interval ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.home_size_pricing.recurring_cost_per_interval}
                      onChange={(e) => setFormData({
                        ...formData,
                        home_size_pricing: {
                          ...formData.home_size_pricing,
                          recurring_cost_per_interval: parseFloat(e.target.value) || 0,
                        },
                      })}
                      placeholder="10.00"
                    />
                    <small>Added to recurring price for each interval above base</small>
                  </div>
                </div>
              </div>

              <div className={styles.pricingSection}>
                <h5>Yard Size Pricing</h5>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Initial Cost Per Interval ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.yard_size_pricing.initial_cost_per_interval}
                      onChange={(e) => setFormData({
                        ...formData,
                        yard_size_pricing: {
                          ...formData.yard_size_pricing,
                          initial_cost_per_interval: parseFloat(e.target.value) || 0,
                        },
                      })}
                      placeholder="25.00"
                    />
                    <small>Added to initial price for each interval above base</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Recurring Cost Per Interval ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.yard_size_pricing.recurring_cost_per_interval}
                      onChange={(e) => setFormData({
                        ...formData,
                        yard_size_pricing: {
                          ...formData.yard_size_pricing,
                          recurring_cost_per_interval: parseFloat(e.target.value) || 0,
                        },
                      })}
                      placeholder="15.00"
                    />
                    <small>Added to recurring price for each interval above base</small>
                  </div>
                </div>
              </div>

              <div className={styles.pricingNote}>
                <strong>Note:</strong> These prices are applied for each interval step above the base size.
                For example, if a home is in the second interval (1501-2000 sq ft), the initial cost increase
                would be 1 × Initial Cost Per Interval.
              </div>

              <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e9ecef' }} />

              <h4>Custom Pricing Options</h4>
              <div className={styles.checkboxGroup}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.allow_custom_pricing}
                    onChange={(e) => handleInputChange('allow_custom_pricing', e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div>Allow custom pricing for this plan</div>
                    <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      When enabled, sales representatives can set custom prices when adding this plan to quotes instead of using calculated prices.
                    </small>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton}>
              {plan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicePlanModal;