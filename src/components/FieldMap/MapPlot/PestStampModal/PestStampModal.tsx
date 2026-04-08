'use client';

import { useRef, useState } from 'react';
import { MapStampGlyph } from '@/components/FieldMap/MapPlot/glyphs';
import { getMapStampOption } from '@/components/FieldMap/MapPlot/types';
import type { MapPlotStamp, MapPestStampType } from '@/components/FieldMap/MapPlot/types';
import styles from './PestStampModal.module.scss';

interface PestStampModalProps {
  stamp: MapPlotStamp;
  companyId: string;
  onSave: (stampId: string, notes: string, photoUrls: string[]) => void;
  onDelete: (stampId: string) => void;
  onClose: () => void;
}

export function PestStampModal({ stamp, companyId, onSave, onDelete, onClose }: PestStampModalProps) {
  const option = getMapStampOption(stamp.type);
  const [notes, setNotes] = useState(stamp.notes ?? '');
  const [photoUrls, setPhotoUrls] = useState<string[]>(stamp.photoUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (companyId) formData.append('companyId', companyId);

      const res = await fetch('/api/field-map/upload-photo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? 'Upload failed');
        return;
      }
      setPhotoUrls(prev => [...prev, data.url]);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removePhoto(url: string) {
    setPhotoUrls(prev => prev.filter(u => u !== url));
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.stampIcon} style={{ backgroundColor: option.color }}>
            <MapStampGlyph type={stamp.type as MapPestStampType} size={28} />
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>{option.label} Finding</h3>
            <p className={styles.subtitle}>Add notes and photos for this pest location</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Notes */}
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={`pest-notes-${stamp.id}`}>
            Description
          </label>
          <textarea
            id={`pest-notes-${stamp.id}`}
            className={styles.textarea}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe the finding — severity, location details, activity observed..."
            rows={3}
          />
        </div>

        {/* Photos */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Photos</label>

          {photoUrls.length > 0 && (
            <div className={styles.photoGrid}>
              {photoUrls.map(url => (
                <div key={url} className={styles.photoThumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Finding photo" className={styles.photoImg} />
                  <button
                    type="button"
                    className={styles.photoRemove}
                    onClick={() => removePhoto(url)}
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadError && <p className={styles.uploadError}>{uploadError}</p>}

          <button
            type="button"
            className={styles.addPhotoBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span className={styles.spinner} />
                Uploading...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
                Take Photo / Upload Image
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className={styles.hiddenInput}
            onChange={handleFileChange}
          />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={() => onDelete(stamp.id)}
          >
            Remove Stamp
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={() => onSave(stamp.id, notes, photoUrls)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
