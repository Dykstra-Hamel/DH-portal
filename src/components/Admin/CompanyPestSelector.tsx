'use client';

import { useState, useEffect } from 'react';
import styles from './CompanyPestSelector.module.scss';

interface PestCategory {
  name: string;
  slug: string;
}

interface PestType {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_svg: string;
  is_active: boolean;
  pest_categories: PestCategory | null;
}

interface CompanyPestOption {
  pest_id: string;
  settings: Record<string, unknown>;
}

interface CompanyPestSelectorProps {
  companyId: string;
}

export default function CompanyPestSelector({
  companyId,
}: CompanyPestSelectorProps) {
  const [availablePestTypes, setAvailablePestTypes] = useState<PestType[]>([]);
  const [selectedPestIds, setSelectedPestIds] = useState<Set<string>>(
    new Set()
  );
  const [pestSettings, setPestSettings] = useState<Record<string, Record<string, unknown>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/pest-options/${companyId}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Failed to load pest data');
          return;
        }

        const { availablePestTypes: types, companyPestOptions: options } =
          json.data;
        setAvailablePestTypes(types || []);

        const opts = options as CompanyPestOption[];
        setSelectedPestIds(new Set(opts.map(o => o.pest_id)));

        const settingsMap: Record<string, Record<string, unknown>> = {};
        opts.forEach(o => {
          settingsMap[o.pest_id] = o.settings ?? {};
        });
        setPestSettings(settingsMap);
      } catch {
        setError('Failed to load pest data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const handleToggle = (pestId: string) => {
    setSelectedPestIds(prev => {
      const next = new Set(prev);
      if (next.has(pestId)) {
        next.delete(pestId);
      } else {
        next.add(pestId);
      }
      return next;
    });
    setSuccess(null);
  };

  const handleSettingToggle = (pestId: string, key: string, value: unknown) => {
    setPestSettings(prev => ({
      ...prev,
      [pestId]: { ...(prev[pestId] ?? {}), [key]: value },
    }));
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const pestOptions = Array.from(selectedPestIds).map((pest_id, index) => ({
      pest_id,
      display_order: index,
      is_active: true,
      settings: pestSettings[pest_id] ?? {},
    }));

    try {
      const res = await fetch(`/api/admin/pest-options/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pestOptions }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to save changes');
      } else {
        setSuccess('Covered pests updated successfully');
      }
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Group pest types by category
  const grouped = availablePestTypes.reduce<Record<string, PestType[]>>(
    (acc, pest) => {
      const category = pest.pest_categories?.name || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(pest);
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading pest types...</p>
      </div>
    );
  }

  return (
    <div className={styles.pestSelector}>
      <h3>Pests Covered</h3>
      <p>Select the pests this company offers services for.</p>

      {Object.entries(grouped).map(([category, pests]) => (
        <div key={category} className={styles.categoryGroup}>
          <h4 className={styles.categoryHeading}>{category}</h4>
          <div className={styles.pestList}>
            {pests.map(pest => {
              const isSelected = selectedPestIds.has(pest.id);
              const showInMap = pestSettings[pest.id]?.show_in_mapping_tool !== false;
              return (
                <div key={pest.id} className={styles.pestItemRow}>
                  <label className={styles.pestItem}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(pest.id)}
                      className={styles.checkbox}
                    />
                    {pest.icon_svg && (
                      <span
                        className={styles.pestIcon}
                        dangerouslySetInnerHTML={{ __html: pest.icon_svg }}
                      />
                    )}
                    <span className={styles.pestName}>{pest.name}</span>
                  </label>
                  {isSelected && (
                    <label className={styles.pestSettingToggle}>
                      <input
                        type="checkbox"
                        checked={showInMap}
                        onChange={e => handleSettingToggle(pest.id, 'show_in_mapping_tool', e.target.checked)}
                        className={styles.toggleInput}
                      />
                      <span className={styles.toggleLabel}>Show in map</span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.successMsg}>{success}</p>}

      <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
