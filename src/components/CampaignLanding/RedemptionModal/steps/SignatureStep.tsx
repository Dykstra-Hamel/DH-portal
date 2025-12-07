'use client';

/**
 * Signature Step Component
 *
 * Second step of redemption modal - customer accepts terms and signs
 */

import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import styles from '../RedemptionModal.module.scss';

interface SignatureStepProps {
  customer: {
    first_name: string;
    last_name: string;
  };
  termsContent: string | null;
  onSubmit: (data: { signature: string; termsAccepted: boolean }) => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function SignatureStep({
  customer,
  termsContent,
  onSubmit,
  onBack,
  isSubmitting,
  error,
}: SignatureStepProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  const handleSignatureEnd = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setHasSignature(true);
    } else {
      setHasSignature(false);
    }
  };

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setHasSignature(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      return;
    }

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      return;
    }

    const signatureData = signatureRef.current.toDataURL();
    onSubmit({
      signature: signatureData,
      termsAccepted,
    });
  };

  return (
    <div className={styles.stepContent}>
      <button onClick={onBack} className={styles.backButton} type="button">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>

      <h2 className={styles.stepHeading}>Review and Sign Agreement</h2>

      <form onSubmit={handleSubmit}>
        <div className={styles.termsSection}>
          <h3>Terms and Conditions</h3>
          <div className={styles.termsContent}>
            {termsContent ? (
              <div dangerouslySetInnerHTML={{ __html: termsContent }} />
            ) : (
              <>
                <p>By signing below, you agree to the following terms and conditions:</p>
                <ul>
                  <li>This offer is valid for one-time use only</li>
                  <li>Discount will be applied to your first service</li>
                  <li>Services will be scheduled based on availability</li>
                  <li>Payment is due upon completion of service</li>
                  <li>You may cancel with 24 hours notice</li>
                  <li>Standard service terms and conditions apply</li>
                </ul>
              </>
            )}
          </div>

          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="terms-checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <label htmlFor="terms-checkbox">
              I have read and accept the terms and conditions
            </label>
          </div>
        </div>

        <div className={styles.signatureSection}>
          <h3>Signature</h3>
          <p className={styles.signatureInstructions}>
            Please sign in the box below using your mouse or touchscreen
          </p>
          <div className={styles.signaturePad}>
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: styles.signatureCanvas,
              }}
              onEnd={handleSignatureEnd}
            />
          </div>
          <button
            type="button"
            onClick={handleClearSignature}
            className={styles.secondaryButton}
          >
            Clear Signature
          </button>

          <div className={styles.signatureDate}>
            <strong>Date:</strong> {new Date().toLocaleDateString()}
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isSubmitting || !termsAccepted || !hasSignature}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Agreement'}
        </button>
      </form>
    </div>
  );
}
