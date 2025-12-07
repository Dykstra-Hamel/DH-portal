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

  const [preferences, setPreferences] = useState({
    email: false,
    phone: false,
    sms: false,
    all: false,
  });

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

  const handleCheckboxChange = (field: keyof typeof preferences) => {
    setPreferences((prev) => {
      const newPreferences = { ...prev, [field]: !prev[field] };

      // If "all" is checked, uncheck individual options
      if (field === 'all' && !prev.all) {
        return {
          email: false,
          phone: false,
          sms: false,
          all: true,
        };
      }

      // If any individual option is checked, uncheck "all"
      if (field !== 'all' && !prev[field]) {
        newPreferences.all = false;
      }

      return newPreferences;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one option is selected
    if (!preferences.email && !preferences.phone && !preferences.sms && !preferences.all) {
      setError('Please select at least one communication type to unsubscribe from');
      return;
    }

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
          preferences,
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
            <p>You have been unsubscribed from the selected communication types.</p>
            <div className={styles.summaryBox}>
              <h3>Unsubscribed from:</h3>
              <ul>
                {preferences.all && <li>All marketing communications</li>}
                {!preferences.all && preferences.email && <li>Marketing emails</li>}
                {!preferences.all && preferences.phone && <li>AI phone calls</li>}
                {!preferences.all && preferences.sms && <li>SMS messages</li>}
              </ul>
            </div>
            <p className={styles.note}>
              You may still receive transactional communications related to your service. Processing may take up to 10 business days.
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
          <h1>Unsubscribe from Communications</h1>
          {tokenData?.customerName && (
            <p className={styles.greeting}>Hello, {tokenData.customerName}</p>
          )}
        </div>

        <div className={styles.info}>
          <p>We&apos;re sorry to see you go! Please select which types of communications you&apos;d like to unsubscribe from:</p>

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

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.options}>
            {tokenData?.email && (
              <label className={styles.option}>
                <input
                  type="checkbox"
                  checked={preferences.email}
                  onChange={() => handleCheckboxChange('email')}
                  disabled={preferences.all}
                />
                <div className={styles.optionContent}>
                  <strong>Marketing Emails</strong>
                  <span>Promotional emails, newsletters, and marketing campaigns</span>
                </div>
              </label>
            )}

            {tokenData?.phoneNumber && (
              <>
                <label className={styles.option}>
                  <input
                    type="checkbox"
                    checked={preferences.phone}
                    onChange={() => handleCheckboxChange('phone')}
                    disabled={preferences.all}
                  />
                  <div className={styles.optionContent}>
                    <strong>AI Phone Calls</strong>
                    <span>Automated phone calls and voice messages</span>
                  </div>
                </label>

                <label className={styles.option}>
                  <input
                    type="checkbox"
                    checked={preferences.sms}
                    onChange={() => handleCheckboxChange('sms')}
                    disabled={preferences.all}
                  />
                  <div className={styles.optionContent}>
                    <strong>SMS Messages</strong>
                    <span>Text messages and SMS notifications</span>
                  </div>
                </label>
              </>
            )}

            <label className={styles.option}>
              <input
                type="checkbox"
                checked={preferences.all}
                onChange={() => handleCheckboxChange('all')}
              />
              <div className={styles.optionContent}>
                <strong>All Marketing Communications</strong>
                <span>Unsubscribe from all marketing emails, calls, and messages</span>
              </div>
            </label>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Unsubscribe'}
            </button>
          </div>

          <p className={styles.disclaimer}>
            Note: You may still receive important transactional communications related to your service, such as appointment confirmations and service updates.
          </p>
        </form>
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
