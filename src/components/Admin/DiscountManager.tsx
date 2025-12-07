'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './DiscountManager.module.scss';
import DiscountModal from './DiscountModal';
import { CompanyDiscount } from '@/types/discount';

interface DiscountManagerProps {
  companyId: string;
}

export default function DiscountManager({ companyId }: DiscountManagerProps) {
  const [discounts, setDiscounts] = useState<CompanyDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<CompanyDiscount | null>(
    null
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDiscounts();
  }, [companyId]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/discounts`);
      if (!response.ok) {
        throw new Error('Failed to fetch discounts');
      }

      const data = await response.json();
      setDiscounts(data.discounts || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching discounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingDiscount(null);
    setModalOpen(true);
  };

  const handleEdit = (discount: CompanyDiscount) => {
    setEditingDiscount(discount);
    setModalOpen(true);
  };

  const handleDelete = async (discount: CompanyDiscount) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${discount.discount_name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/companies/${companyId}/discounts/${discount.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete discount');
      }

      setSuccess('Discount deleted successfully');
      fetchDiscounts();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting the discount');
    }
  };

  const handleSave = () => {
    setSuccess(
      editingDiscount ? 'Discount updated successfully' : 'Discount created successfully'
    );
    fetchDiscounts();
    setTimeout(() => setSuccess(null), 3000);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDiscountValue = (discount: CompanyDiscount) => {
    if (discount.discount_type === 'percentage') {
      return `${discount.discount_value}%`;
    }
    return `$${discount.discount_value}`;
  };

  const formatTimeRestriction = (discount: CompanyDiscount) => {
    if (discount.time_restriction_type === 'none') {
      return 'Always Available';
    }

    if (discount.time_restriction_type === 'seasonal') {
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const startMonth = months[(discount.seasonal_start_month || 1) - 1];
      const endMonth = months[(discount.seasonal_end_month || 1) - 1];
      return `Seasonal: ${startMonth} ${discount.seasonal_start_day} - ${endMonth} ${discount.seasonal_end_day}`;
    }

    if (discount.time_restriction_type === 'limited_time') {
      const start = new Date(discount.limited_time_start!).toLocaleDateString();
      const end = new Date(discount.limited_time_end!).toLocaleDateString();
      return `Limited: ${start} - ${end}`;
    }

    return '';
  };

  const formatAppliesToPrice = (appliesToPrice: string) => {
    const map: Record<string, string> = {
      initial: 'Initial Price',
      recurring: 'Recurring Price',
      both: 'Both Prices',
    };
    return map[appliesToPrice] || appliesToPrice;
  };

  const formatAppliesToPlans = (discount: CompanyDiscount) => {
    if (discount.applies_to_plans === 'all') {
      return 'All Plans';
    }
    const count = discount.eligible_plan_ids?.length || 0;
    return `${count} Specific Plan${count !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return <div className={styles.loading}>Loading discounts...</div>;
  }

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.header}>
        <div>
          <h2>Discount Management</h2>
          <p>Create and manage discounts for your company</p>
        </div>
        <button className={styles.createButton} onClick={handleCreateNew}>
          <Plus size={20} />
          Create Discount
        </button>
      </div>

      {discounts.length === 0 ? (
        <div className={styles.empty}>
          <p>No discounts configured yet</p>
          <button className={styles.createButton} onClick={handleCreateNew}>
            <Plus size={20} />
            Create Your First Discount
          </button>
        </div>
      ) : (
        <div className={styles.cardList}>
          {discounts.map((discount) => {
            const isExpanded = expandedIds.has(discount.id);

            return (
              <div key={discount.id} className={styles.card}>
                <div
                  className={styles.cardHeader}
                  onClick={() => toggleExpanded(discount.id)}
                >
                  <div className={styles.cardTitle}>
                    <h3>{discount.discount_name}</h3>
                    <div className={styles.badges}>
                      <span
                        className={`${styles.badge} ${
                          discount.is_active ? styles.badgeActive : styles.badgeInactive
                        }`}
                      >
                        {discount.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`${styles.badge} ${styles.badgeType}`}>
                        {formatDiscountValue(discount)}
                      </span>
                      {discount.requires_manager && (
                        <span className={`${styles.badge} ${styles.badgeManager}`}>
                          Manager Only
                        </span>
                      )}
                      {discount.time_restriction_type !== 'none' && (
                        <span className={`${styles.badge} ${styles.badgeTime}`}>
                          {discount.time_restriction_type === 'seasonal'
                            ? 'Seasonal'
                            : 'Limited Time'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.iconButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(discount);
                      }}
                      aria-label="Edit discount"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(discount);
                      }}
                      aria-label="Delete discount"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={() => toggleExpanded(discount.id)}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.cardBody}>
                    {discount.description && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Description:</span>
                        <span className={styles.detailValue}>
                          {discount.description}
                        </span>
                      </div>
                    )}

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Discount Type:</span>
                      <span className={styles.detailValue}>
                        {discount.discount_type === 'percentage'
                          ? 'Percentage'
                          : 'Fixed Amount'}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Applies To:</span>
                      <span className={styles.detailValue}>
                        {formatAppliesToPrice(discount.applies_to_price)}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Plan Targeting:</span>
                      <span className={styles.detailValue}>
                        {formatAppliesToPlans(discount)}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Time Restriction:</span>
                      <span className={styles.detailValue}>
                        {formatTimeRestriction(discount)}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Access Level:</span>
                      <span className={styles.detailValue}>
                        {discount.requires_manager ? 'Manager/Admin Only' : 'All Users'}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Sort Order:</span>
                      <span className={styles.detailValue}>{discount.sort_order}</span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Created:</span>
                      <span className={styles.detailValue}>
                        {new Date(discount.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DiscountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        discount={editingDiscount}
        companyId={companyId}
      />
    </div>
  );
}
