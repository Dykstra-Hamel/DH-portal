'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './VideoLightbox.module.scss';

interface VideoLightboxProps {
  videoUrl: string;
  onClose: () => void;
}

export default function VideoLightbox({ videoUrl, onClose }: VideoLightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
        <video
          src={videoUrl}
          controls
          autoPlay
          className={styles.video}
        />
      </div>
    </div>
  );
}
