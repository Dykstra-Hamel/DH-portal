'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompany } from '@/contexts/CompanyContext';
import styles from './new.module.scss';

const ROUTE_TYPES = [
  { value: 'technician', label: 'Technician' },
  { value: 'sales', label: 'Sales' },
  { value: 'inspector', label: 'Inspector' },
];

export default function NewRoutePage() {
  const router = useRouter();
  const { selectedCompany } = useCompany();

  const todayStr = new Date().toISOString().split('T')[0];

  const [routeDate, setRouteDate] = useState(todayStr);
  const [routeType, setRouteType] = useState('technician');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompany?.id) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/routing/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: selectedCompany.id,
          route_date: routeDate,
          route_type: routeType,
          name: name.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to create route');
        return;
      }

      router.push(`/field-sales/routes/${data.route.id}`);
    } catch {
      setError('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <h1 className={styles.title}>New Route</h1>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="route-date">Date</label>
          <input
            id="route-date"
            type="date"
            className={styles.input}
            value={routeDate}
            onChange={e => setRouteDate(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Route Type</label>
          <div className={styles.typeGrid}>
            {ROUTE_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                className={`${styles.typeBtn} ${routeType === t.value ? styles.typeBtnActive : ''}`}
                onClick={() => setRouteType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="route-name">
            Name <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="route-name"
            type="text"
            className={styles.input}
            placeholder="e.g. North Zone Monday"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={200}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="route-notes">
            Notes <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            id="route-notes"
            className={styles.textarea}
            placeholder="Internal notes for this route..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={saving || !routeDate}
        >
          {saving ? 'Creating\u2026' : 'Create Route'}
        </button>
      </form>
    </div>
  );
}
