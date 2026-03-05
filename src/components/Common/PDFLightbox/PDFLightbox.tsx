'use client';

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './PDFLightbox.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PDFLightboxProps {
  url: string;
  name: string;
  onClose: () => void;
}

export function PDFLightbox({ url, name, onClose }: PDFLightboxProps) {
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentPage((p) => Math.max(1, p - 1));
      if (e.key === 'ArrowRight') setCurrentPage((p) => Math.min(numPages, p + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className={styles.lightbox} onClick={onClose}>
      <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        {numPages > 1 && currentPage > 1 && (
          <button
            className={`${styles.navButton} ${styles.navButtonLeft}`}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        <div className={styles.pdfWrapper}>
          <Document
            file={url}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            className={styles.document}
          >
            <Page
              pageNumber={currentPage}
              className={styles.page}
              renderTextLayer={false}
            />
          </Document>
        </div>

        {numPages > 1 && currentPage < numPages && (
          <button
            className={`${styles.navButton} ${styles.navButtonRight}`}
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight size={32} />
          </button>
        )}

        <div className={styles.pdfInfo}>
          <span className={styles.pdfName}>{name}</span>
          {numPages > 1 && (
            <span className={styles.pageCounter}>
              Page {currentPage} of {numPages}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
