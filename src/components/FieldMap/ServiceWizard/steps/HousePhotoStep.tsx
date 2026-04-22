'use client';

import { useState } from 'react';
import styles from './HousePhotoStep.module.scss';

interface HousePhotoStepProps {
  photoUrls: string[];
  onChange: (urls: string[]) => void;
  companyId: string;
}

export function HousePhotoStep({ photoUrls, onChange, companyId }: HousePhotoStepProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    let errorMessage: string | null = null;
    const newUrls: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (companyId) formData.append('companyId', companyId);

        const res = await fetch('/api/field-map/upload-photo', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          errorMessage = data.error ?? 'Upload failed';
          continue;
        }
        newUrls.push(data.url);
      }
      if (newUrls.length > 0) {
        onChange([...photoUrls, ...newUrls]);
      }
    } catch {
      errorMessage = 'Upload failed. Please try again.';
    } finally {
      setUploading(false);
      if (errorMessage) setUploadError(errorMessage);
    }
  }

  function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    void uploadFiles([file]);
  }

  function handleUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    void uploadFiles(files);
  }

  function removePhoto(url: string) {
    onChange(photoUrls.filter(u => u !== url));
  }

  return (
    <div className={styles.container}>
      <div className={styles.intro}>
        <p className={styles.introText}>
          Take or upload at least one photo of the house exterior before plotting the map.
        </p>
      </div>

      {photoUrls.length > 0 && (
        <div className={styles.photoGrid}>
          {photoUrls.map(url => (
            <div key={url} className={styles.photoThumb}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="House photo" className={styles.photoImg} />
              <button
                type="button"
                className={styles.removeBtn}
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

      <div className={styles.actions}>
        <label className={`${styles.actionBtn} ${uploading ? styles.actionBtnDisabled : ''}`}>
          {uploading ? (
            <>
              <span className={styles.spinner} />
              Uploading&hellip;
            </>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
              </svg>
              Take Picture
            </>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className={styles.fileInput}
            onChange={handleCameraChange}
            disabled={uploading}
          />
        </label>

        <label className={`${styles.actionBtn} ${uploading ? styles.actionBtnDisabled : ''}`}>
          {uploading ? (
            <>
              <span className={styles.spinner} />
              Uploading&hellip;
            </>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
                <polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload Picture
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            className={styles.fileInput}
            onChange={handleUploadChange}
            disabled={uploading}
          />
        </label>
      </div>

      {photoUrls.length === 0 && (
        <p className={styles.hint}>At least one photo is required to continue.</p>
      )}
    </div>
  );
}
