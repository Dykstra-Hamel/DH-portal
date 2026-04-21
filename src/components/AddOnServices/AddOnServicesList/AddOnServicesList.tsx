'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import styles from './AddOnServicesList.module.scss';
import { AddOnService } from '@/types/addon-service';
import ConfirmationModal from '@/components/Common/ConfirmationModal/ConfirmationModal';

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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredAddons = addons
    .filter(addon =>
      addon.addon_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.addon_name.localeCompare(b.addon_name));

  if (loading) {
    return <div className={styles.loading}>Loading add-on services...</div>;
  }

  return (
    <div className={styles.container}>
      {addons.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No add-on services created yet.</p>
          <button onClick={onAdd} className={styles.createButton}>
            <Plus size={16} />
            Create Your First Add-On
          </button>
        </div>
      ) : (
        <>
          <div className={styles.filterBar}>
            <input
              type="text"
              placeholder="Search add-ons..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button onClick={onAdd} className={styles.createButton}>
              <Plus size={16} />
              Add New Add-On
            </button>
          </div>

          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div>Name</div>
              <div>Category</div>
              <div>Pricing</div>
              <div>Eligibility</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {filteredAddons.length === 0 ? (
              <div className={styles.noResults}>No add-ons match your search.</div>
            ) : filteredAddons.map(addon => (
              <div key={addon.id} className={styles.tableRow}>
                <div className={styles.addonName}>
                  {addon.addon_name}
                  {addon.highlight_badge && (
                    <span className={styles.badge}>{addon.highlight_badge}</span>
                  )}
                </div>
                <div>{addon.addon_category || '—'}</div>
                <div className={styles.pricing}>
                  {addon.initial_price != null && (
                    <div>${addon.initial_price} initial</div>
                  )}
                  <div>${addon.recurring_price} / {addon.billing_frequency}</div>
                </div>
                <div>
                  <span className={`${styles.eligibility} ${addon.eligibility_mode === 'all' ? styles.eligibilityAll : styles.eligibilitySpecific}`}>
                    {addon.eligibility_mode === 'all' ? 'All plans' : 'Limited'}
                  </span>
                </div>
                <div>
                  <span className={`${styles.statusIndicator} ${addon.is_active ? styles.active : styles.inactive}`}>
                    {addon.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(addon)} className={styles.editButton}>
                    Edit
                  </button>
                  <button onClick={() => setPendingDeleteId(addon.id)} className={styles.deleteButton}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmationModal
        isOpen={!!pendingDeleteId}
        title="Delete Add-On Service"
        message="Are you sure you want to delete this add-on service? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          if (pendingDeleteId) {
            onDelete(pendingDeleteId);
            setPendingDeleteId(null);
          }
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
