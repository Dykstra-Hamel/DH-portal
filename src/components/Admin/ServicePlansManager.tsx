'use client';

import { useState, useEffect } from 'react';
import styles from './ServicePlansManager.module.scss';
import ServicePlanModal from '../Widget/WidgetConfig/ServicePlanModal';
import AddOnServicesManager from './AddOnServicesManager';

interface ServicePlan {
  id: string;
  company_id: string;
  plan_name: string;
  plan_description: string;
  plan_category: string;
  initial_price: number;
  initial_discount: number;
  recurring_price: number;
  billing_frequency: string | null;
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

interface ServicePlansManagerProps {
  companyId: string;
}

export default function ServicePlansManager({ companyId }: ServicePlansManagerProps) {
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([]);
  const [availablePestTypes, setAvailablePestTypes] = useState<PestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'addons'>('plans');

  useEffect(() => {
    if (companyId) {
      loadServicePlans();
      loadPestTypes();
    }
  }, [companyId]);

  const loadServicePlans = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await fetch(`/api/admin/service-plans/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServicePlans(data.data || []);
        } else {
          setErrorMessage(data.error || 'Failed to load service plans');
        }
      } else {
        setErrorMessage('Failed to load service plans');
      }
    } catch (error) {
      console.error('Error loading service plans:', error);
      setErrorMessage('Error loading service plans');
      setServicePlans([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPestTypes = async () => {
    try {
      const response = await fetch(`/api/admin/pest-options/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailablePestTypes(data.data.availablePestTypes || []);
        }
      }
    } catch (error) {
      console.error('Error loading pest types:', error);
    }
  };

  const openPlanModal = (plan?: ServicePlan) => {
    setEditingPlan(plan || null);
    setShowPlanModal(true);
  };

  const closePlanModal = () => {
    setShowPlanModal(false);
    setEditingPlan(null);
  };

  const handleSavePlan = async (planData: Partial<ServicePlan>) => {
    try {
      setErrorMessage(null);

      // Determine if this is create or update
      const isUpdate = !!(planData as any).id || !!editingPlan?.id;
      const planId = editingPlan?.id || (planData as any).id;

      const response = await fetch(`/api/admin/service-plans/${companyId}`, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...planData,
          company_id: companyId,
          ...(isUpdate && planId ? { id: planId } : {}),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(isUpdate ? 'Service plan updated successfully' : 'Service plan created successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        closePlanModal();
        loadServicePlans();
      } else {
        setErrorMessage(data.error || 'Failed to save service plan');
      }
    } catch (error) {
      console.error('Error saving service plan:', error);
      setErrorMessage('Error saving service plan');
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this service plan?')) {
      return;
    }

    try {
      setErrorMessage(null);
      const response = await fetch(`/api/admin/service-plans/${planId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Service plan deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        loadServicePlans();
      } else {
        setErrorMessage(data.error || 'Failed to delete service plan');
      }
    } catch (error) {
      console.error('Error deleting service plan:', error);
      setErrorMessage('Error deleting service plan');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h2>Service Plans &amp; Add-Ons</h2>
        <div className={styles.loading}>Loading service plans...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Service Plans &amp; Add-Ons</h2>
          <p className={styles.description}>
            Manage the service plans and add-on services available for this company.
          </p>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'plans' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('plans')}
            >
              Service Plans
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'addons' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('addons')}
            >
              Add-On Services
            </button>
          </div>
        </div>
        {activeTab === 'plans' && (
          <button onClick={() => openPlanModal()} className={styles.createButton}>
            Create New Plan
          </button>
        )}
      </div>

      {activeTab === 'plans' && (
        <>
          {successMessage && (
            <div className={styles.successMessage}>{successMessage}</div>
          )}

          {errorMessage && (
            <div className={styles.errorMessage}>{errorMessage}</div>
          )}

          {servicePlans.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No service plans configured.</p>
              <button onClick={() => openPlanModal()} className={styles.createButton}>
                Create Your First Plan
              </button>
            </div>
          ) : (
            <div className={styles.plansTable}>
              <div className={styles.plansTableHeader}>
                <div>Plan Name</div>
                <div>Category</div>
                <div>Pricing</div>
                <div>Coverage</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {servicePlans.map(plan => (
                <div key={plan.id} className={styles.planRow}>
                  <div className={styles.planName}>
                    {plan.plan_name}
                    {plan.highlight_badge && (
                      <span className={styles.badge}>{plan.highlight_badge}</span>
                    )}
                  </div>
                  <div>{plan.plan_category}</div>
                  <div className={styles.pricing}>
                    <div>${plan.initial_price} initial</div>
                    <div>${plan.recurring_price} / {plan.billing_frequency || 'month'}</div>
                  </div>
                  <div>{plan.pest_coverage?.length || 0} pests</div>
                  <div>
                    <span className={`${styles.statusIndicator} ${plan.is_active ? styles.active : styles.inactive}`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className={styles.actions}>
                    <button onClick={() => openPlanModal(plan)} className={styles.editButton}>
                      Edit
                    </button>
                    <button onClick={() => deletePlan(plan.id)} className={styles.deleteButton}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'addons' && (
        <AddOnServicesManager companyId={companyId} />
      )}

      {showPlanModal && (
        <ServicePlanModal
          plan={editingPlan}
          isOpen={showPlanModal}
          onClose={closePlanModal}
          onSave={handleSavePlan}
          availablePestTypes={availablePestTypes}
          companyId={companyId}
        />
      )}
    </div>
  );
}
