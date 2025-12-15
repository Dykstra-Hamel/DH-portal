'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2 } from 'lucide-react';
import styles from './AddOnServicesList.module.scss';
import { AddOnService } from '@/types/addon-service';

interface AddOnServicesListProps {
  companyId: string;
  onEdit: (addon: AddOnService) => void;
  onDelete: (addonId: string) => void;
  onAdd: () => void;
}

export default function AddOnServicesList({
  companyId,
  onEdit,
  onDelete,
  onAdd,
}: AddOnServicesListProps) {
  const [addons, setAddons] = useState<AddOnService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddons();
  }, [companyId]);

  const fetchAddons = async () => {
    try {
      const response = await fetch(`/api/add-on-services/${companyId}`);
      const result = await response.json();
      if (result.success) {
        setAddons(result.addons);
      }
    } catch (error) {
      console.error('Error fetching add-ons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addonId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this add-on service? This action cannot be undone.'
      )
    ) {
      return;
    }

    onDelete(addonId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Add-On Services</h2>
        <button onClick={onAdd} className={styles.addButton}>
          <Plus size={16} />
          Add New Add-On
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading add-on services...</p>
        </div>
      ) : addons.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No add-on services created yet.</p>
          <button onClick={onAdd} className={styles.addButton}>
            <Plus size={16} />
            Create Your First Add-On
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {addons.map(addon => (
            <div key={addon.id} className={styles.card}>
              {addon.addon_image_url && (
                <div className={styles.cardImage}>
                  <Image
                    src={addon.addon_image_url}
                    alt={addon.addon_name}
                    width={200}
                    height={200}
                    quality={85}
                  />
                </div>
              )}

              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <h3>{addon.addon_name}</h3>
                  {addon.highlight_badge && (
                    <span className={styles.badge}>{addon.highlight_badge}</span>
                  )}
                </div>

                {addon.addon_description && (
                  <p className={styles.description}>{addon.addon_description}</p>
                )}

                <div className={styles.pricing}>
                  {addon.initial_price && (
                    <span className={styles.initialPrice}>
                      ${addon.initial_price} initial
                    </span>
                  )}
                  <span className={styles.recurringPrice}>
                    ${addon.recurring_price}/{addon.billing_frequency}
                  </span>
                </div>

                <div className={styles.eligibility}>
                  {addon.eligibility_mode === 'all' ? (
                    <span className={styles.eligibilityAll}>
                      ✓ Available for all service plans
                    </span>
                  ) : (
                    <span className={styles.eligibilitySpecific}>
                      ⓘ Limited availability
                    </span>
                  )}
                </div>

                <div className={styles.actions}>
                  <button
                    onClick={() => onEdit(addon)}
                    className={styles.editButton}
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addon.id)}
                    className={styles.deleteButton}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
