'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './AdminManager.module.scss';

interface FieldMapSettingsManagerProps {
  companyId: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  template_type: string;
  is_active: boolean;
}

export default function FieldMapSettingsManager({ companyId }: FieldMapSettingsManagerProps) {
  const [quoteTemplates, setQuoteTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    setLoading(true);
    try {
      const [templatesRes, settingRes] = await Promise.all([
        fetch(`/api/companies/${companyId}/email-templates?type=quote`),
        fetch(`/api/companies/${companyId}/settings`),
      ]);

      if (templatesRes.ok) {
        const { templates } = await templatesRes.json();
        setQuoteTemplates((templates ?? []).filter((t: EmailTemplate) => t.is_active));
      }

      if (settingRes.ok) {
        const { settings } = await settingRes.json();
        const current = settings?.field_map_quote_template_id?.value ?? '';
        setSelectedTemplateId(current);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/companies/${companyId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            field_map_quote_template_id: {
              value: selectedTemplateId,
              type: 'string',
            },
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      setMessage({ type: 'success', text: 'Field Map settings saved.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading Field Map settings&hellip;</div>;
  }

  return (
    <div className={styles.settingsForm}>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className={styles.settingGroup}>
        <h3 className={styles.groupTitle}>Field Map</h3>
        <p className={styles.groupDescription}>
          Configure the email template used when sending quotes from the Field Map wizard.
          If no template is selected, the lead will still be created but no email will be sent.
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label htmlFor="fieldmap-quote-template" className={styles.settingLabel}>
              Quote Email Template
            </label>
            <p className={styles.settingDescription}>
              Only active templates with type &ldquo;quote&rdquo; appear here.
            </p>
          </div>
          <div className={styles.settingControl}>
            <select
              id="fieldmap-quote-template"
              className={styles.textInput}
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
            >
              <option value="">— None (skip email) —</option>
              {quoteTemplates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} />
          {saving ? 'Saving\u2026' : 'Save Field Map Settings'}
        </button>
      </div>
    </div>
  );
}
