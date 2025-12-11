'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './unsubscribe.module.scss';

interface TokenData {
  email?: string;
  phoneNumber?: string;
  customerName?: string;
  source?: string;
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No unsubscribe token provided');
        setValidating(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/unsubscribe?token=${token}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || 'Invalid or expired unsubscribe link');
          setValidating(false);
          setLoading(false);
          return;
        }

        setTokenData(result.data);
        setValidating(false);
        setLoading(false);
      } catch (err) {
        console.error('Error validating token:', err);
        setError('Failed to validate unsubscribe link');
        setValidating(false);
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to process unsubscribe request');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);
    } catch (err) {
      console.error('Error submitting unsubscribe:', err);
      setError('Failed to process unsubscribe request');
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Validating unsubscribe link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !tokenData) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.error}>
            <h1>Invalid Link</h1>
            <p>{error}</p>
            <p className={styles.helpText}>
              This link may have expired or already been used. If you continue to receive unwanted communications, please contact us directly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <h1>Successfully Unsubscribed</h1>
            <p>You have been unsubscribed from all marketing communications.</p>
            <p className={styles.note}>
              You may still receive transactional communications related to your service, such as appointment confirmations and service updates. Processing may take up to 10 business days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main unsubscribe form
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Unsubscribe from Marketing Communications</h1>
          {tokenData?.customerName && (
            <p className={styles.greeting}>Hello, {tokenData.customerName}</p>
          )}
        </div>

        <div className={styles.info}>
          <p>We&apos;re sorry to see you go! By clicking the button below, you will be unsubscribed from all marketing communications, including promotional emails, phone calls, and text messages.</p>

          {tokenData?.email && (
            <div className={styles.contactInfo}>
              <strong>Email:</strong> {tokenData.email}
            </div>
          )}

          {tokenData?.phoneNumber && (
            <div className={styles.contactInfo}>
              <strong>Phone:</strong> {tokenData.phoneNumber}
            </div>
          )}
        </div>

        <div className={styles.form}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              onClick={handleSubmit}
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Unsubscribe from Marketing Communications'}
            </button>
          </div>

          <p className={styles.disclaimer}>
            Note: You may still receive important transactional communications related to your service, such as appointment confirmations and service updates.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
