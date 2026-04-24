'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import styles from './ServicePlanImagePicker.module.scss';
import { Modal, ModalTop, ModalMiddle, ModalBottom } from '@/components/Common/Modal/Modal';

interface ServicePlanImagePickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
  isUploading: boolean;
  onUpload: (file: File) => void;
}

interface StoredImage {
  fileName: string;
  publicUrl: string;
}

export default function ServicePlanImagePicker({
  value,
  onChange,
  isUploading,
  onUpload,
}: ServicePlanImagePickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingImages, setExistingImages] = useState<StoredImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchExistingImages = async () => {
    setLoadingImages(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/admin/service-plans/images');
      if (!res.ok) throw new Error('Failed to load images');
      const data = await res.json();
      setExistingImages(data.images ?? []);
    } catch {
      setFetchError('Could not load existing images.');
    } finally {
      setLoadingImages(false);
    }
  };

  const handleBrowseClick = () => {
    setIsModalOpen(true);
    if (existingImages.length === 0 && !loadingImages) {
      fetchExistingImages();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const handleSelectExisting = (url: string) => {
    onChange(url);
    setIsModalOpen(false);
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={styles.picker}>
      <div className={styles.actions}>
        {isUploading ? (
          <div className={styles.uploadingIndicator}>
            <div className={styles.spinner} />
            <span>Uploading image...</span>
          </div>
        ) : (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
        )}
        <button
          type="button"
          className={styles.browseBtn}
          onClick={handleBrowseClick}
        >
          Browse library&hellip;
        </button>
      </div>

      <small className={styles.hint}>
        Upload a new image or browse previously uploaded images in{' '}
        <code>/brand-assets/service-plans/</code>
      </small>

      {value && value.trim() && (
        <div className={`${styles.preview} ${isUploading ? styles.uploading : ''}`}>
          <Image
            src={value}
            alt="Plan Image"
            width={200}
            height={120}
            style={{ objectFit: 'cover', borderRadius: '8px' }}
          />
          {isUploading && (
            <div className={styles.imageOverlay}>
              <div className={styles.overlaySpinner} />
            </div>
          )}
          <button
            type="button"
            className={styles.removeBtn}
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="medium">
        <ModalTop title="Choose a Plan Image" onClose={() => setIsModalOpen(false)} />
        <ModalMiddle>
          {loadingImages && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <span>Loading images...</span>
            </div>
          )}
          {fetchError && <p className={styles.errorState}>{fetchError}</p>}
          {!loadingImages && !fetchError && existingImages.length === 0 && (
            <p className={styles.emptyState}>No images uploaded yet.</p>
          )}
          {!loadingImages && existingImages.length > 0 && (
            <div className={styles.imageGrid}>
              {existingImages.map((img) => (
                <button
                  key={img.fileName}
                  type="button"
                  className={`${styles.thumbnailBtn} ${value === img.publicUrl ? styles.selected : ''}`}
                  onClick={() => handleSelectExisting(img.publicUrl)}
                  title={img.fileName}
                >
                  <Image
                    src={img.publicUrl}
                    alt={img.fileName}
                    width={100}
                    height={70}
                    style={{ objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </ModalMiddle>
        <ModalBottom>
          <button
            type="button"
            className={styles.browseBtn}
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </button>
        </ModalBottom>
      </Modal>
    </div>
  );
}
