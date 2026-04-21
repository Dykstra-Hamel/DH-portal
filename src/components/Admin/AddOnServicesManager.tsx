'use client';

import { useState } from 'react';
import AddOnServicesList from '@/components/AddOnServices/AddOnServicesList/AddOnServicesList';
import AddOnServiceEditor from '@/components/AddOnServices/AddOnServiceEditor/AddOnServiceEditor';
import { AddOnService } from '@/types/addon-service';
import styles from './AddOnServicesManager.module.scss';

interface ServicePlanBasic {
  id: string;
  plan_name: string;
}

interface AddOnServicesManagerProps {
  companyId: string;
  servicePlans?: ServicePlanBasic[];
}

export default function AddOnServicesManager({
  companyId,
  servicePlans = [],
}: AddOnServicesManagerProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddOnService | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditingAddon(null);
    setShowEditor(true);
  };

  const handleEdit = (addon: AddOnService) => {
    setEditingAddon(addon);
    setShowEditor(true);
  };

  const handleDelete = async (addonId: string) => {
    try {
      const response = await fetch(
        `/api/add-on-services/${companyId}/${addonId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setRefreshKey(prev => prev + 1); // Trigger list refresh
      } else {
        alert('Failed to delete add-on service');
      }
    } catch (error) {
      console.error('Error deleting add-on:', error);
      alert('Failed to delete add-on service');
    }
  };

  const handleSuccess = () => {
    setShowEditor(false);
    setEditingAddon(null);
    setRefreshKey(prev => prev + 1); // Trigger list refresh
  };

  return (
    <div className={styles.manager}>
      <AddOnServicesList
        key={refreshKey}
        companyId={companyId}
        servicePlans={servicePlans}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AddOnServiceEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        companyId={companyId}
        addon={editingAddon}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
