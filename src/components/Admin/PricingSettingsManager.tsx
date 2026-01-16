'use client';

import { useState, useEffect, useMemo } from 'react';
import { CompanyPricingSettings } from '@/types/pricing';
import { generateHomeSizeOptions, generateYardSizeOptions, generateLinearFeetOptions } from '@/lib/pricing-calculations';
import { Save, RotateCcw } from 'lucide-react';
import styles from './PricingSettingsManager.module.scss';

interface PricingSettingsManagerProps {
  companyId: string;
  onSave?: () => void;
}

export default function PricingSettingsManager({ companyId, onSave }: PricingSettingsManagerProps) {
  const [settings, setSettings] = useState<CompanyPricingSettings | null>(null);
  const [formData, setFormData] = useState({
    base_home_sq_ft: 1500,
    home_sq_ft_interval: 500,
    max_home_sq_ft: 5000,
    base_yard_acres: 0.25,
    yard_acres_interval: 0.25,
    max_yard_acres: 2.0,
    base_linear_feet: 100,
    linear_feet_interval: 50,
    max_linear_feet: 500,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [companyId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/pricing-settings`);
      if (!response.ok) {
        throw new Error('Failed to load pricing settings');
      }

      const { data } = await response.json();
      setSettings(data);
      setFormData({
        base_home_sq_ft: data.base_home_sq_ft,
        home_sq_ft_interval: data.home_sq_ft_interval,
        max_home_sq_ft: data.max_home_sq_ft,
        base_yard_acres: data.base_yard_acres,
        yard_acres_interval: data.yard_acres_interval,
        max_yard_acres: data.max_yard_acres,
        base_linear_feet: data.base_linear_feet,
        linear_feet_interval: data.linear_feet_interval,
        max_linear_feet: data.max_linear_feet,
      });
    } catch (err) {
      console.error('Error loading pricing settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate form data
      if (
        formData.base_home_sq_ft <= 0 ||
        formData.home_sq_ft_interval <= 0 ||
        formData.max_home_sq_ft <= formData.base_home_sq_ft
      ) {
        setError('Invalid home size values. Please check your inputs.');
        return;
      }

      if (
        formData.base_yard_acres <= 0 ||
        formData.yard_acres_interval <= 0 ||
        formData.max_yard_acres <= formData.base_yard_acres
      ) {
        setError('Invalid yard size values. Please check your inputs.');
        return;
      }

      if (
        formData.base_linear_feet <= 0 ||
        formData.linear_feet_interval <= 0 ||
        formData.max_linear_feet <= formData.base_linear_feet
      ) {
        setError('Invalid linear feet values. Please check your inputs.');
        return;
      }

      const response = await fetch(`/api/companies/${companyId}/pricing-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save pricing settings');
      }

      const { data } = await response.json();
      setSettings(data);
      setSuccess('Pricing settings saved successfully!');
      onSave?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving pricing settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        base_home_sq_ft: settings.base_home_sq_ft,
        home_sq_ft_interval: settings.home_sq_ft_interval,
        max_home_sq_ft: settings.max_home_sq_ft,
        base_yard_acres: settings.base_yard_acres,
        yard_acres_interval: settings.yard_acres_interval,
        max_yard_acres: settings.max_yard_acres,
        base_linear_feet: settings.base_linear_feet,
        linear_feet_interval: settings.linear_feet_interval,
        max_linear_feet: settings.max_linear_feet,
      });
      setError(null);
      setSuccess(null);
    }
  };

  // Generate preview options
  const previewHomeSizeOptions = useMemo(() => {
    if (!formData) return [];
    try {
      return generateHomeSizeOptions({
        id: '',
        company_id: companyId,
        ...formData,
        created_at: '',
        updated_at: '',
      });
    } catch {
      return [];
    }
  }, [formData, companyId]);

  const previewYardSizeOptions = useMemo(() => {
    if (!formData) return [];
    try {
      return generateYardSizeOptions({
        id: '',
        company_id: companyId,
        ...formData,
        created_at: '',
        updated_at: '',
      });
    } catch {
      return [];
    }
  }, [formData, companyId]);

  const previewLinearFeetOptions = useMemo(() => {
    if (!formData) return [];
    try {
      return generateLinearFeetOptions({
        id: '',
        company_id: companyId,
        ...formData,
        created_at: '',
        updated_at: '',
      });
    } catch {
      return [];
    }
  }, [formData, companyId]);

  if (loading) {
    return <div className={styles.loading}>Loading pricing settings...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Pricing Interval Settings</h2>
      <p className={styles.subtitle}>
        Configure the size intervals that will be used across all service plans.
        Pricing per interval is set individually for each service plan.
      </p>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.content}>
        {/* Home Size Settings */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Home Size Intervals</h3>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label}>
                Base Home Size
                <span className={styles.unit}>sq ft</span>
              </label>
              <input
                type="number"
                className={styles.input}
                value={formData.base_home_sq_ft}
                onChange={(e) =>
                  setFormData({ ...formData, base_home_sq_ft: Number(e.target.value) })
                }
                min="0"
              />
              <span className={styles.helpText}>Starting size for the first interval</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Interval Size
                <span className={styles.unit}>sq ft</span>
              </label>
              <input
                type="number"
                className={styles.input}
                value={formData.home_sq_ft_interval}
                onChange={(e) =>
                  setFormData({ ...formData, home_sq_ft_interval: Number(e.target.value) })
                }
                min="1"
              />
              <span className={styles.helpText}>Size increase for each interval step</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Maximum Size
                <span className={styles.unit}>sq ft</span>
              </label>
              <input
                type="number"
                className={styles.input}
                value={formData.max_home_sq_ft}
                onChange={(e) =>
                  setFormData({ ...formData, max_home_sq_ft: Number(e.target.value) })
                }
                min="1"
              />
              <span className={styles.helpText}>Largest size before &quot;max+&quot; option</span>
            </div>
          </div>
        </div>

        {/* Yard Size Settings */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Yard Size Intervals</h3>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label}>
                Base Yard Size
                <span className={styles.unit}>acres</span>
              </label>
              <input
                type="number"
                step="0.01"
                className={styles.input}
                value={formData.base_yard_acres}
                onChange={(e) =>
                  setFormData({ ...formData, base_yard_acres: Number(e.target.value) })
                }
                min="0"
              />
              <span className={styles.helpText}>Starting size for the first interval</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Interval Size
                <span className={styles.unit}>acres</span>
              </label>
              <input
                type="number"
                step="0.01"
                className={styles.input}
                value={formData.yard_acres_interval}
                onChange={(e) =>
                  setFormData({ ...formData, yard_acres_interval: Number(e.target.value) })
                }
                min="0.01"
              />
              <span className={styles.helpText}>Size increase for each interval step</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Maximum Size
                <span className={styles.unit}>acres</span>
              </label>
              <input
                type="number"
                step="0.01"
                className={styles.input}
                value={formData.max_yard_acres}
                onChange={(e) =>
                  setFormData({ ...formData, max_yard_acres: Number(e.target.value) })
                }
                min="0.01"
              />
              <span className={styles.helpText}>Largest size before &quot;max+&quot; option</span>
            </div>
          </div>
        </div>

        {/* Linear Feet Settings */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Linear Feet Intervals</h3>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label}>
                Base Linear Feet
                <span className={styles.unit}>ft</span>
              </label>
              <input
                type="number"
                className={styles.input}
                value={formData.base_linear_feet}
                onChange={(e) =>
                  setFormData({ ...formData, base_linear_feet: Number(e.target.value) })
                }
                min="0"
              />
              <span className={styles.helpText}>Starting size for the first interval</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Interval Size
                <span className={styles.unit}>ft</span>
              </label>
              <input
                type="number"
                className={styles.input}
                value={formData.linear_feet_interval}
                onChange={(e) =>
                  setFormData({ ...formData, linear_feet_interval: Number(e.target.value) })
                }
                min="1"
              />
              <span className={styles.helpText}>Size increase for each interval step</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Maximum Size
                <span className={styles.unit}>ft</span>
              </label>
              <input
                type="number"
                className={styles.input}
                value={formData.max_linear_feet}
                onChange={(e) =>
                  setFormData({ ...formData, max_linear_feet: Number(e.target.value) })
                }
                min="1"
              />
              <span className={styles.helpText}>Largest size before &quot;max+&quot; option</span>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Dropdown Preview</h3>
          <div className={styles.previewGrid}>
            <div className={styles.previewColumn}>
              <h4 className={styles.previewTitle}>Home Size Options</h4>
              <ul className={styles.previewList}>
                {previewHomeSizeOptions.length > 0 ? (
                  previewHomeSizeOptions.map((option) => (
                    <li key={option.value} className={styles.previewItem}>
                      {option.label}
                    </li>
                  ))
                ) : (
                  <li className={styles.previewError}>Invalid configuration</li>
                )}
              </ul>
            </div>

            <div className={styles.previewColumn}>
              <h4 className={styles.previewTitle}>Yard Size Options</h4>
              <ul className={styles.previewList}>
                {previewYardSizeOptions.length > 0 ? (
                  previewYardSizeOptions.map((option) => (
                    <li key={option.value} className={styles.previewItem}>
                      {option.label}
                    </li>
                  ))
                ) : (
                  <li className={styles.previewError}>Invalid configuration</li>
                )}
              </ul>
            </div>

            <div className={styles.previewColumn}>
              <h4 className={styles.previewTitle}>Linear Feet Options</h4>
              <ul className={styles.previewList}>
                {previewLinearFeetOptions.length > 0 ? (
                  previewLinearFeetOptions.map((option) => (
                    <li key={option.value} className={styles.previewItem}>
                      {option.label}
                    </li>
                  ))
                ) : (
                  <li className={styles.previewError}>Invalid configuration</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.resetButton}
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving || previewHomeSizeOptions.length === 0 || previewYardSizeOptions.length === 0 || previewLinearFeetOptions.length === 0}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}