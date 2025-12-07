'use client';

import { useState } from 'react';
import { X, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './TestEmailModal.module.scss';

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  templateId?: string;
  templateName?: string;
  templateData?: {
    subject_line: string;
    html_content: string;
    text_content: string;
  };
}

export default function TestEmailModal({
  isOpen,
  onClose,
  companyId,
  templateId,
  templateName,
  templateData,
}: TestEmailModalProps) {
  const [testEmail, setTestEmail] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSend = async () => {
    // Reset message
    setMessage(null);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!testEmail.trim() || !emailRegex.test(testEmail)) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid email address',
      });
      return;
    }

    try {
      setSending(true);

      let response;

      if (templateId) {
        // Sending from saved template
        // Use different endpoint for admin library templates
        const url = companyId === 'admin'
          ? `/api/admin/template-library/${templateId}/test`
          : `/api/companies/${companyId}/email-templates/${templateId}/test`;

        const requestBody: any = {
          testEmail: testEmail.trim(),
        };

        // Add campaign ID if provided
        if (campaignId.trim()) {
          requestBody.customVariables = {
            campaignId: campaignId.trim(),
          };
        }

        console.log('[TestEmailModal] Sending test email:', {
          url,
          companyId,
          templateId,
          testEmail: testEmail.trim(),
        });

        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        console.log('[TestEmailModal] Response status:', response.status);
        console.log('[TestEmailModal] Response headers:', Object.fromEntries(response.headers.entries()));
      } else if (templateData) {
        // Sending from unsaved template (draft mode)
        if (companyId === 'admin') {
          // Admin templates can't be tested in draft mode (must be saved first)
          setMessage({
            type: 'error',
            text: 'Please save the template before sending a test email',
          });
          return;
        }

        // Send directly via email API with template data
        response = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: testEmail.trim(),
            subject: templateData.subject_line,
            html: templateData.html_content,
            text: templateData.text_content,
            companyId,
            source: 'template_test_draft',
          }),
        });
      } else {
        setMessage({
          type: 'error',
          text: 'No template data available to send',
        });
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received:', await response.text());
        setMessage({
          type: 'error',
          text: 'Server error: Invalid response format. Please check console for details.',
        });
        return;
      }

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || `Test email sent successfully to ${testEmail}`,
        });
        // Clear email after successful send
        setTestEmail('');
        setCampaignId('');
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to send test email',
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send test email. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !sending) {
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <Mail size={20} />
            <h2>Send Test Email</h2>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {templateName && (
            <div className={styles.templateInfo}>
              <p>
                <strong>Template:</strong> {templateName}
              </p>
            </div>
          )}

          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.type === 'success' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {message.text}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="test-email">
              Test Email Address <span className={styles.required}>*</span>
            </label>
            <input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="your.email@example.com"
              className={styles.input}
              autoFocus
            />
            <p className={styles.helpText}>
              The test email will be sent to this address with sample data.
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="campaign-id">Campaign ID (Optional)</label>
            <input
              id="campaign-id"
              type="text"
              value={campaignId}
              onChange={e => setCampaignId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., PEST26"
              className={styles.input}
            />
            <p className={styles.helpText}>
              Enter a campaign ID to test campaign-specific variables like {'{'}
              {'{'}campaignHeroImage{'}}'}. Leave empty to use sample campaign data.
            </p>
          </div>

          <div className={styles.infoBox}>
            <AlertCircle size={16} />
            <div>
              <p>
                <strong>Note:</strong> This test will use sample data for all template
                variables. The email will render exactly as it would appear to a real
                customer.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !testEmail.trim()}
            className={styles.sendButton}
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
