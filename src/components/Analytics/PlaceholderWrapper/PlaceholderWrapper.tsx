'use client';

import React from 'react';
import styles from './PlaceholderWrapper.module.scss';

interface PlaceholderWrapperProps {
  children: React.ReactNode;
  companyName: string;
  isAdmin?: boolean;
  onSetupClick?: () => void;
}

export default function PlaceholderWrapper({ 
  children, 
  companyName, 
  isAdmin = false,
  onSetupClick 
}: PlaceholderWrapperProps) {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.blurredContent}>
        {children}
      </div>
      <div className={styles.setupOverlay}>
        <div className={styles.setupCard}>
          <div className={styles.setupIcon}>📊</div>
          <h3 className={styles.setupTitle}>Set Up Google Analytics</h3>
          
          {isAdmin ? (
            <>
              <p className={styles.setupDescription}>
                Enable analytics tracking for <strong>{companyName}</strong> to view real data.
              </p>
              <div className={styles.setupSteps}>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>1</span>
                  <span className={styles.stepText}>Add your GA4 Property ID in Company Settings</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>2</span>
                  <span className={styles.stepText}>View real analytics data from your website</span>
                </div>
              </div>
              {onSetupClick && (
                <button 
                  className={styles.setupButton}
                  onClick={onSetupClick}
                >
                  Configure Analytics
                </button>
              )}
            </>
          ) : (
            <p className={styles.setupDescription}>
              Looks like we need to set up your Google Analytics. Once we have your GA-4 Property ID added, you will see your data here in real time.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}