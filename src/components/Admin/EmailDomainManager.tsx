'use client';

import { useState, useEffect, useCallback } from 'react';
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
  identityArn?: string | null;
  dkimTokens?: DomainRecord[];
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

  // Tenant provisioning state
  const [tenantProvisioned, setTenantProvisioned] = useState<boolean | null>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState(false);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formDomain, setFormDomain] = useState('');
  const [formPrefix, setFormPrefix] = useState('noreply');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Email DNS Instructions modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Fetch tenant provisioning status
  const fetchTenantStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/provision-ses`);

      if (!response.ok) {
        throw new Error('Failed to fetch tenant status');
      }

      const data = await response.json();

      if (data.success) {
        setTenantProvisioned(data.provisioned || false);
        setTenantInfo(data.provisioned ? data : null);
      }
    } catch (err) {
      console.error('Error fetching tenant status:', err);
      setTenantProvisioned(false);
    }
  }, [companyId]);

  // Fetch current domain configuration
  const fetchDomain = useCallback(async () => {
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
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchTenantStatus();
      fetchDomain();
    }
  }, [companyId, fetchTenantStatus, fetchDomain]);

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

  // Provision SES tenant
  const handleProvisionTenant = async () => {
    setProvisioning(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/companies/${companyId}/provision-ses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to provision SES tenant');
      }

      setSuccess('SES tenant provisioned successfully! You can now add your email domain.');
      setTenantProvisioned(true);
      setTenantInfo(data);
      await fetchTenantStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to provision tenant');
    } finally {
      setProvisioning(false);
    }
  };

  // Delete SES tenant
  const handleDeleteTenant = async () => {
    if (!confirm('Are you sure you want to delete this SES tenant? This will remove all email sending configuration and cannot be undone.')) {
      return;
    }

    setDeletingTenant(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/companies/${companyId}/provision-ses`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete SES tenant');
      }

      setSuccess('SES tenant deleted successfully. You can provision a new one if needed.');
      setTenantProvisioned(false);
      setTenantInfo(null);
      await fetchTenantStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tenant');
    } finally {
      setDeletingTenant(false);
    }
  };

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

  // Email validation helper
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Send DNS instructions email
  const handleSendDnsInstructions = async () => {
    // Validate email
    if (!emailRecipient || !validateEmail(emailRecipient)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setSendingEmail(true);
    setEmailError(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/companies/${companyId}/email-dns-instructions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: emailRecipient,
          domain: domain?.name
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSuccess(`DNS instructions sent to ${emailRecipient}`);
      setShowEmailModal(false);
      setEmailRecipient('');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSendingEmail(false);
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

      {/* SES Tenant Provisioning Status */}
      {tenantProvisioned === false && (
        <div className={styles.tenantAlert} data-type="warning">
          <div className={styles.tenantAlertContent}>
            <div>
              <strong>AWS SES Tenant Not Provisioned</strong>
              <p>Before you can add an email domain, you need to provision an AWS SES tenant for this company. This creates the necessary infrastructure for sending emails.</p>
            </div>
            <button
              type="button"
              onClick={handleProvisionTenant}
              className={styles.btnProvision}
              disabled={provisioning}
            >
              {provisioning ? 'Provisioning...' : 'Provision SES Tenant'}
            </button>
          </div>
        </div>
      )}

      {tenantProvisioned === true && tenantInfo && (
        <div className={styles.tenantAlert} data-type="success">
          <div className={styles.tenantAlertContent}>
            <div>
              <strong>✓ AWS SES Tenant Provisioned</strong>
              <p className={styles.tenantDetails}>
                Tenant: <code>{tenantInfo.tenant?.tenantName || 'N/A'}</code>
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteTenant}
              className={styles.btnDeleteTenant}
              disabled={deletingTenant}
            >
              {deletingTenant ? 'Deleting...' : 'Delete Tenant'}
            </button>
          </div>
        </div>
      )}

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
              disabled={submitting || tenantProvisioned === false}
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
              disabled={submitting || tenantProvisioned === false}
              required
            />
            <small>The prefix for the email address (e.g., &quot;noreply&quot; creates noreply@{formDomain || 'example.com'})</small>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={submitting || tenantProvisioned === false}
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
            {domain.status !== 'verified' && domain.records && domain.records.length > 0 && (
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className={styles.btnSecondary}
                disabled={verifying || deleting || sendingEmail}
              >
                Email DNS Instructions
              </button>
            )}
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
        </div>
      )}

      {/* Email DNS Instructions Modal */}
      {showEmailModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4>Email DNS Instructions</h4>
              <button
                type="button"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailRecipient('');
                  setEmailError(null);
                }}
                className={styles.btnClose}
                disabled={sendingEmail}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.instructions}>
                Send DNS configuration instructions for <strong>{domain?.name}</strong> to a technical team member.
              </p>

              {emailError && (
                <div className={styles.alert} data-type="error">
                  {emailError}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="recipient-email">Recipient Email Address</label>
                <input
                  type="email"
                  id="recipient-email"
                  value={emailRecipient}
                  onChange={(e) => {
                    setEmailRecipient(e.target.value);
                    setEmailError(null);
                  }}
                  placeholder="tech@example.com"
                  className={styles.input}
                  disabled={sendingEmail}
                  required
                />
                <small>Enter the email address of the person who will configure DNS</small>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleSendDnsInstructions}
                  className={styles.btnPrimary}
                  disabled={sendingEmail || !emailRecipient}
                >
                  {sendingEmail ? 'Sending...' : 'Send Instructions'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailRecipient('');
                    setEmailError(null);
                  }}
                  className={styles.btnSecondary}
                  disabled={sendingEmail}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
