'use client';

import { useState, useEffect } from 'react';
import styles from './EmailQuoteModal.module.scss';

interface EmailTemplate {
  id: string;
  name: string;
  subject_line: string;
  template_type: string;
  is_active: boolean;
}

interface EmailQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (templateId: string, customerEmail: string) => void;
  companyId: string;
  customerEmail: string;
  customerName: string;
  customerFirstName?: string;
  customerLastName?: string;
}

export function EmailQuoteModal({
  isOpen,
  onClose,
  onSubmit,
  companyId,
  customerEmail: initialEmail,
  customerName,
  customerFirstName,
  customerLastName,
}: EmailQuoteModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Replace template variables with actual customer data
  const replaceVariables = (text: string): string => {
    if (!text) return '';

    return text
      .replace(/\{\{customerName\}\}/g, customerName || 'Customer')
      .replace(/\{\{customerFirstName\}\}/g, customerFirstName || '')
      .replace(/\{\{customerLastName\}\}/g, customerLastName || '')
      .replace(/\{\{firstName\}\}/g, customerFirstName || '')
      .replace(/\{\{lastName\}\}/g, customerLastName || '')
      .replace(/\{\{customerEmail\}\}/g, email || '');
  };

  // Fetch quote email templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!isOpen || !companyId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/companies/${companyId}/email-templates?type=quote`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }

        const data = await response.json();
        const quoteTemplates = (data.templates || []).filter(
          (t: EmailTemplate) => t.is_active
        );

        setTemplates(quoteTemplates);

        // Set default template (first active one)
        if (quoteTemplates.length > 0) {
          setSelectedTemplateId(quoteTemplates[0].id);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [isOpen, companyId]);

  // Update email when initialEmail changes
  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedTemplateId || !email.trim()) return;

    setIsSubmitting(true);
    onSubmit(selectedTemplateId, email.trim());
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Email Quote</h2>
        <p className={styles.modalDescription}>
          Send the quote to {customerName}
        </p>

        <div className={styles.formGroup}>
          <label htmlFor="customerEmail" className={styles.label}>
            Customer Email
          </label>
          <input
            type="email"
            id="customerEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="customer@example.com"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="emailTemplate" className={styles.label}>
            Email Template
          </label>
          {loading ? (
            <div className={styles.loading}>Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className={styles.noTemplates}>
              No active quote email templates found. Please create one in Settings → Automation → Templates.
            </div>
          ) : (
            <select
              id="emailTemplate"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className={styles.select}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedTemplate && (
          <div className={styles.templatePreview}>
            <div className={styles.previewLabel}>Subject:</div>
            <div className={styles.previewSubject}>
              {replaceVariables(selectedTemplate.subject_line)}
            </div>
          </div>
        )}

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!selectedTemplateId || !email.trim() || templates.length === 0 || isSubmitting}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 8L10 3L17 8V15.6667C17 16.0203 16.8595 16.3594 16.6095 16.6095C16.3594 16.8595 16.0203 17 15.6667 17H4.33333C3.97971 17 3.64057 16.8595 3.39052 16.6095C3.14048 16.3594 3 16.0203 3 15.6667V8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 17V10H13V17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {isSubmitting ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
