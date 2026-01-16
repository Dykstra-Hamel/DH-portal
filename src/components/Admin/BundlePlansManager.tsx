'use client';

import { useState, useEffect } from 'react';
import styles from './ServicePlansManager.module.scss';
import BundlePlanModal from './BundlePlanModal';
import { BundlePlan } from '@/types/bundle';

interface BundlePlansManagerProps {
  companyId: string;
}

export default function BundlePlansManager({ companyId }: BundlePlansManagerProps) {
  const [bundles, setBundles] = useState<BundlePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingBundle, setEditingBundle] = useState<BundlePlan | null>(null);
  const [showBundleModal, setShowBundleModal] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadBundles();
    }
  }, [companyId]);

  const loadBundles = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await fetch(`/api/admin/bundle-plans?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBundles(data.data || []);
        } else {
          setErrorMessage(data.error || 'Failed to load bundle plans');
        }
      } else {
        setErrorMessage('Failed to load bundle plans');
      }
    } catch (error) {
      console.error('Error loading bundle plans:', error);
      setErrorMessage('Error loading bundle plans');
      setBundles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bundle?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/bundle-plans/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Bundle deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        loadBundles();
      } else {
        setErrorMessage(data.error || 'Failed to delete bundle');
      }
    } catch (error) {
      console.error('Error deleting bundle:', error);
      setErrorMessage('Error deleting bundle');
    }
  };

  const openBundleModal = (bundle?: BundlePlan) => {
    setEditingBundle(bundle || null);
    setShowBundleModal(true);
  };

  const closeBundleModal = () => {
    setEditingBundle(null);
    setShowBundleModal(false);
  };

  const handleSaveBundle = async (bundleData: Partial<BundlePlan>) => {
    try {
      const url = editingBundle
        ? `/api/admin/bundle-plans/${editingBundle.id}`
        : '/api/admin/bundle-plans';

      const method = editingBundle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bundleData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(
          editingBundle
            ? 'Bundle updated successfully'
            : 'Bundle created successfully'
        );
        setTimeout(() => setSuccessMessage(null), 3000);
        closeBundleModal();
        loadBundles();
      } else {
        setErrorMessage(data.error || 'Failed to save bundle');
      }
    } catch (error) {
      console.error('Error saving bundle:', error);
      setErrorMessage('Error saving bundle');
    }
  };

  const formatPricing = (bundle: BundlePlan) => {
    if (bundle.pricing_type === 'custom') {
      return `$${bundle.custom_initial_price || 0} initial / $${bundle.custom_recurring_price || 0} ${bundle.billing_frequency || 'monthly'}`;
    } else {
      const discount = bundle.discount_type === 'percentage'
        ? `${bundle.discount_value}% off`
        : `$${bundle.discount_value} off`;
      return `Bundle Discount: ${discount}`;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading bundle plans...</div>;
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          {successMessage && (
            <div className={styles.successMessage}>{successMessage}</div>
          )}
          {errorMessage && (
            <div className={styles.errorMessage}>{errorMessage}</div>
          )}
        </div>
        <button onClick={() => openBundleModal()} className={styles.createButton}>
          Create New Bundle
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>BUNDLE NAME</th>
              <th>CATEGORY</th>
              <th>PRICING</th>
              <th>ITEMS</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {bundles.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No bundle plans found. Click &quot;Create New Plan&quot; to get started.
                </td>
              </tr>
            ) : (
              bundles.map((bundle) => (
                <tr key={bundle.id}>
                  <td>{bundle.bundle_name}</td>
                  <td>{bundle.bundle_category || 'standard'}</td>
                  <td>{formatPricing(bundle)}</td>
                  <td>
                    {bundle.bundled_service_plans.length} plans, {bundle.bundled_add_ons.length} add-ons
                  </td>
                  <td>
                    <span className={bundle.is_active ? styles.activeStatus : styles.inactiveStatus}>
                      {bundle.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => openBundleModal(bundle)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleDelete(bundle.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showBundleModal && (
        <BundlePlanModal
          bundle={editingBundle}
          isOpen={showBundleModal}
          onClose={closeBundleModal}
          onSave={handleSaveBundle}
          companyId={companyId}
        />
      )}
    </div>
  );
}
