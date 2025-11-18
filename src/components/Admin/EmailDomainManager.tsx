'use client';

import { useState, useEffect } from 'react';
import styles from './EmailDomainManager.module.scss';

interface DomainRecord {
  hostname: string;
  type: string;
  value: string;
  priority?: number;
}

interface DomainData {
  name: string | null;
  prefix: string;
  status: string;
  records: DomainRecord[];
  verifiedAt: string | null;
  mailersendDomainId: string | null;
  liveInfo?: any;
}

interface EmailDomainManagerProps {
  companyId: string;
}

export default function EmailDomainManager({ companyId }: EmailDomainManagerProps) {
  const [domain, setDomain] = useState<DomainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formDomain, setFormDomain] = useState('');
  const [formPrefix, setFormPrefix] = useState('noreply');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [availableDomains, setAvailableDomains] = useState<DomainData[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [importing, setImporting] = useState(false);

  // Fetch current domain configuration
  const fetchDomain = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/companies/${companyId}/domain`);

      if (!response.ok) {
        throw new Error('Failed to fetch domain configuration');
      }

      const data = await response.json();

      if (data.success && data.domain) {
        setDomain(data.domain);
        setFormDomain(data.domain.name || '');
        setFormPrefix(data.domain.prefix || 'noreply');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load domain');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchDomain();
    }
  }, [companyId]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Add domain
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formDomain) {
      setError('Please enter a domain name');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/companies/${companyId}/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: formDomain,
          emailPrefix: formPrefix
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add domain');
      }

      setSuccess('Domain added successfully! Please add the DNS records below.');
      setIsEditing(false);
      await fetchDomain();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch available domains for import
  const fetchAvailableDomains = async () => {
    setLoadingDomains(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/mailersend-domains?companyId=${companyId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch domains');
      }

      setAvailableDomains(data.domains.available.map((d: any) => ({
        name: d.name,
        prefix: 'noreply',
        status: d.is_verified ? 'verified' : 'pending',
        records: [],
        verifiedAt: d.is_verified ? d.updated_at : null,
        mailersendDomainId: d.id,
        liveInfo: d
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load available domains');
    } finally {
      setLoadingDomains(false);
    }
  };

  // Import existing domain
  const handleImportDomain = async (domainId: string, domainName: string) => {
    if (!confirm(`Import domain "${domainName}"? This will connect it to this company.`)) {
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/companies/${companyId}/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: domainId,
          emailPrefix: formPrefix
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import domain');
      }

      setSuccess(`Domain "${domainName}" imported successfully!`);
      setShowImportModal(false);
      await fetchDomain();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import domain');
    } finally {
      setImporting(false);
    }
  };

  // Open import modal
  const handleOpenImportModal = () => {
    setShowImportModal(true);
    fetchAvailableDomains();
  };

  // Verify domain
  const handleVerifyDomain = async () => {
    setVerifying(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/companies/${companyId}/domain`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      if (data.domain?.status === 'verified') {
        setSuccess('Domain verified successfully!');
      } else {
        setError('Domain not yet verified. Please ensure all DNS records are configured correctly.');
      }

      await fetchDomain();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification check failed');
    } finally {
      setVerifying(false);
    }
  };

  // Delete domain
  const handleDeleteDomain = async () => {
    if (!confirm('Are you sure you want to delete this domain configuration? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/companies/${companyId}/domain`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete domain');
      }

      setSuccess('Domain configuration removed successfully');
      setFormDomain('');
      setFormPrefix('noreply');
      await fetchDomain();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete domain');
    } finally {
      setDeleting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard!');
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      verified: { text: 'Verified', className: styles.statusVerified },
      pending: { text: 'Pending Verification', className: styles.statusPending },
      not_configured: { text: 'Not Configured', className: styles.statusNotConfigured },
      failed: { text: 'Verification Failed', className: styles.statusFailed }
    };

    const badge = badges[status] || badges.not_configured;

    return <span className={`${styles.statusBadge} ${badge.className}`}>{badge.text}</span>;
  };

  if (loading) {
    return <div className={styles.loading}>Loading domain configuration...</div>;
  }

  return (
    <div className={styles.emailDomainManager}>
      <div className={styles.header}>
        <h3>Email Domain Configuration</h3>
        <p className={styles.subtitle}>
          Configure a custom email domain for this company. Emails will be sent from your domain instead of the default pmpcentral.io.
        </p>
      </div>

      {error && (
        <div className={styles.alert} data-type="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className={styles.alert} data-type="success">
          {success}
        </div>
      )}

      {!domain?.name || isEditing ? (
        <form onSubmit={handleAddDomain} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="domain">Domain Name</label>
            <input
              type="text"
              id="domain"
              value={formDomain}
              onChange={(e) => setFormDomain(e.target.value)}
              placeholder="example.com"
              className={styles.input}
              disabled={submitting}
              required
            />
            <small>Enter your company domain (e.g., acmepest.com)</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="prefix">Email Prefix</label>
            <input
              type="text"
              id="prefix"
              value={formPrefix}
              onChange={(e) => setFormPrefix(e.target.value)}
              placeholder="noreply"
              className={styles.input}
              disabled={submitting}
              required
            />
            <small>The prefix for the email address (e.g., &quot;noreply&quot; creates noreply@{formDomain || 'example.com'})</small>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={submitting}
            >
              {submitting ? 'Adding Domain...' : domain?.name ? 'Update Domain' : 'Add Domain'}
            </button>
            {isEditing && domain?.name && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={styles.btnSecondary}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className={styles.domainInfo}>
          <div className={styles.infoHeader}>
            <div>
              <h4>{domain.name}</h4>
              <p className={styles.emailPreview}>
                Emails will be sent from: <strong>{domain.prefix}@{domain.name}</strong>
              </p>
            </div>
            <div className={styles.statusContainer}>
              {getStatusBadge(domain.status)}
            </div>
          </div>

          {domain.status !== 'verified' && domain.records && domain.records.length > 0 && (
            <div className={styles.dnsRecords}>
              <h5>DNS Records Required</h5>
              <p className={styles.instructions}>
                Add the following DNS records to your domain provider to verify ownership and enable email sending:
              </p>

              <div className={styles.recordsList}>
                {domain.records.map((record, index) => (
                  <div key={index} className={styles.recordCard}>
                    <div className={styles.recordHeader}>
                      <span className={styles.recordType}>{record.type}</span>
                      {record.type === 'TXT' && <span className={styles.recordLabel}>SPF/DKIM</span>}
                      {record.type === 'CNAME' && <span className={styles.recordLabel}>Tracking</span>}
                      {record.type === 'MX' && <span className={styles.recordLabel}>Return Path</span>}
                    </div>
                    <div className={styles.recordFields}>
                      <div className={styles.recordField}>
                        <label>Hostname:</label>
                        <div className={styles.recordValue}>
                          <code>{record.hostname}</code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(record.hostname)}
                            className={styles.btnCopy}
                            title="Copy to clipboard"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className={styles.recordField}>
                        <label>Value:</label>
                        <div className={styles.recordValue}>
                          <code className={styles.valueWrap}>{record.value}</code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(record.value)}
                            className={styles.btnCopy}
                            title="Copy to clipboard"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      {record.priority && (
                        <div className={styles.recordField}>
                          <label>Priority:</label>
                          <div className={styles.recordValue}>
                            <code>{record.priority}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {domain.status === 'verified' && domain.verifiedAt && (
            <div className={styles.verifiedInfo}>
              <p>
                ✓ Domain verified on {new Date(domain.verifiedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className={styles.domainActions}>
            <button
              type="button"
              onClick={handleVerifyDomain}
              className={styles.btnPrimary}
              disabled={verifying || domain.status === 'verified'}
            >
              {verifying ? 'Verifying...' : 'Verify Domain'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={styles.btnSecondary}
              disabled={verifying || deleting}
            >
              Change Domain
            </button>
            <button
              type="button"
              onClick={handleDeleteDomain}
              className={styles.btnDanger}
              disabled={verifying || deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Domain'}
            </button>
          </div>
        </div>
      )}

      {!domain?.name && !isEditing && (
        <div className={styles.fallbackInfo}>
          <p>
            <strong>No custom domain configured.</strong> Emails will be sent from the fallback domain: <code>noreply@pmpcentral.io</code>
          </p>
          <button
            type="button"
            onClick={handleOpenImportModal}
            className={styles.btnSecondary}
            style={{ marginTop: '1rem' }}
          >
            Import Existing Domain from MailerSend
          </button>
        </div>
      )}

      {/* Import Domain Modal */}
      {showImportModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4>Import Existing MailerSend Domain</h4>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className={styles.btnClose}
                disabled={importing}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {loadingDomains ? (
                <div className={styles.loading}>Loading available domains...</div>
              ) : availableDomains.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No available domains found in your MailerSend account.</p>
                  <p className={styles.helpText}>
                    All domains in your MailerSend account are either already connected to companies or you haven&apos;t added any domains yet.
                  </p>
                </div>
              ) : (
                <div className={styles.domainsList}>
                  <p className={styles.instructions}>
                    Select a domain from your MailerSend account to import:
                  </p>
                  {availableDomains.map((availableDomain) => (
                    <div key={availableDomain.mailersendDomainId} className={styles.domainCard}>
                      <div className={styles.domainCardHeader}>
                        <h5>{availableDomain.name}</h5>
                        {getStatusBadge(availableDomain.status)}
                      </div>
                      <div className={styles.domainCardDetails}>
                        <p>
                          <strong>Domain ID:</strong> <code>{availableDomain.mailersendDomainId}</code>
                        </p>
                        {availableDomain.liveInfo?.is_verified && (
                          <p className={styles.verifiedNote}>
                            ✓ This domain is already verified and ready to send emails
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImportDomain(availableDomain.mailersendDomainId!, availableDomain.name!)}
                        className={styles.btnPrimary}
                        disabled={importing}
                      >
                        {importing ? 'Importing...' : 'Import This Domain'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
