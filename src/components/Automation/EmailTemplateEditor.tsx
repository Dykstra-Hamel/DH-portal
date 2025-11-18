'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createSampleVariables, replaceVariablesWithSample, extractVariables } from '@/lib/email/variables';
import {
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Eye,
  Code,
  Type,
  Mail,
  Settings,
} from 'lucide-react';
import styles from './EmailTemplateEditor.module.scss';

interface EmailTemplate {
  id?: string;
  name: string;
  description: string;
  template_type: string;
  subject_line: string;
  html_content: string;
  text_content: string;
  variables?: string[];
  is_active: boolean;
}

interface EmailTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  template?: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
}

const TEMPLATE_TYPES = [
  { value: 'welcome', label: 'Welcome Email' },
  { value: 'follow_up', label: 'Follow-up Email' },
  { value: 'nurture', label: 'Nurture Email' },
  { value: 'quote', label: 'Quote Email' },
  { value: 'reminder', label: 'Reminder Email' },
  { value: 'custom', label: 'Custom Email' },
];

// Quote-specific variables that should only show for quote templates
const QUOTE_VARIABLES = [
  'quoteUrl',
  'quoteId',
  'quoteTotalInitialPrice',
  'quoteTotalRecurringPrice',
  'quoteLineItems',
  'quotePestConcerns',
  'quoteHomeSize',
  'quoteYardSize',
];

export default function EmailTemplateEditor({
  isOpen,
  onClose,
  companyId,
  template,
  onSave,
}: EmailTemplateEditorProps) {
  const [formData, setFormData] = useState<EmailTemplate>({
    name: '',
    description: '',
    template_type: 'custom',
    subject_line: '',
    html_content: '',
    text_content: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'text' | 'preview'>(
    'html'
  );
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [companyData, setCompanyData] = useState<{
    name: string;
    email: string;
    phone: string;
    website: string;
  } | null>(null);
  const [brandData, setBrandData] = useState<{
    logo_url: string;
  } | null>(null);
  const [reviewsData, setReviewsData] = useState<{
    rating: number;
    reviewCount: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (template) {
        setFormData({
          name: template.name || '',
          description: template.description || '',
          template_type: template.template_type || 'custom',
          subject_line: template.subject_line || '',
          html_content: template.html_content || '',
          text_content: template.text_content || '',
          is_active: template.is_active !== false,
        });
      } else {
        // Reset form for new template
        setFormData({
          name: '',
          description: '',
          template_type: 'custom',
          subject_line: '',
          html_content: '',
          text_content: '',
          is_active: true,
        });
      }
      setActiveTab('html');
      setMessage(null);
    }
  }, [isOpen, template]);

  useEffect(() => {
    // Detect variables whenever content changes
    const variables = extractVariables(
      `${formData.html_content} ${formData.text_content} ${formData.subject_line}`
    );
    setDetectedVariables(variables);
  }, [formData.html_content, formData.text_content, formData.subject_line]);

  useEffect(() => {
    // Fetch company and brand data when component opens
    if (isOpen && companyId) {
      const fetchCompanyData = async () => {
        try {
          const supabase = createClient();

          // Fetch company data
          const { data: company } = await supabase
            .from('companies')
            .select('name, email, phone, website')
            .eq('id', companyId)
            .single();

          if (company) {
            setCompanyData(company);
          }

          // Fetch brand data
          const { data: brand } = await supabase
            .from('brands')
            .select('logo_url')
            .eq('company_id', companyId)
            .single();

          if (brand) {
            setBrandData(brand);
          }

          // Fetch Google reviews data
          const { data: reviewsSetting } = await supabase
            .from('company_settings')
            .select('setting_value')
            .eq('company_id', companyId)
            .eq('setting_key', 'google_reviews_data')
            .single();

          if (reviewsSetting?.setting_value && reviewsSetting.setting_value !== '{}') {
            try {
              const parsedReviews = JSON.parse(reviewsSetting.setting_value);
              setReviewsData(parsedReviews);
            } catch (parseError) {
              console.error('Error parsing Google reviews data:', parseError);
            }
          }
        } catch (error) {
          console.error('Error fetching company/brand data:', error);
        }
      };

      fetchCompanyData();
    }
  }, [isOpen, companyId]);

  // Use shared variable functions
  const sampleVariables = createSampleVariables(companyData, brandData, reviewsData);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Validation
      if (!formData.name.trim()) {
        setMessage({ type: 'error', text: 'Template name is required' });
        return;
      }

      if (!formData.subject_line.trim()) {
        setMessage({ type: 'error', text: 'Subject line is required' });
        return;
      }

      if (!formData.html_content.trim() && !formData.text_content.trim()) {
        setMessage({
          type: 'error',
          text: 'Either HTML content or text content is required',
        });
        return;
      }

      // API call
      const url = template
        ? `/api/companies/${companyId}/email-templates/${template.id}`
        : `/api/companies/${companyId}/email-templates`;

      const method = template ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onSave(result.template);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setMessage({ type: 'error', text: 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    const placeholder = `{{${variable}}}`;

    if (activeTab === 'html') {
      const textarea = document.getElementById(
        'html-content'
      ) as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          formData.html_content.substring(0, start) +
          placeholder +
          formData.html_content.substring(end);
        setFormData(prev => ({ ...prev, html_content: newContent }));

        // Restore cursor position
        setTimeout(() => {
          textarea.setSelectionRange(
            start + placeholder.length,
            start + placeholder.length
          );
          textarea.focus();
        }, 0);
      }
    } else if (activeTab === 'text') {
      const textarea = document.getElementById(
        'text-content'
      ) as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          formData.text_content.substring(0, start) +
          placeholder +
          formData.text_content.substring(end);
        setFormData(prev => ({ ...prev, text_content: newContent }));

        // Restore cursor position
        setTimeout(() => {
          textarea.setSelectionRange(
            start + placeholder.length,
            start + placeholder.length
          );
          textarea.focus();
        }, 0);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>
            {template ? 'Edit Email Template' : 'Create New Email Template'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

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

        <div className={styles.modalBody}>
          <div className={styles.formSection}>
            <h3>Basic Information</h3>

            <div className={styles.formGroup}>
              <label>Template Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Welcome New Lead"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what this template is used for..."
                rows={2}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Template Type *</label>
                <select
                  value={formData.template_type}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      template_type: e.target.value,
                    }))
                  }
                >
                  {TEMPLATE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                  />
                  Active (template can be used in workflows)
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Subject Line *</label>
              <input
                type="text"
                value={formData.subject_line}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    subject_line: e.target.value,
                  }))
                }
                placeholder="e.g., Welcome to {{companyName}}, {{customerName}}!"
              />
              <small>
                Use variables like {'{{customerName}}'} to personalize the subject
              </small>
            </div>
          </div>

          <div className={styles.contentSection}>
            <div className={styles.contentHeader}>
              <h3>Email Content</h3>
              <div className={styles.contentTabs}>
                <button
                  className={`${styles.tab} ${activeTab === 'html' ? styles.active : ''}`}
                  onClick={() => setActiveTab('html')}
                >
                  <Code size={16} />
                  HTML
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'text' ? styles.active : ''}`}
                  onClick={() => setActiveTab('text')}
                >
                  <Type size={16} />
                  Text
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'preview' ? styles.active : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  <Eye size={16} />
                  Preview
                </button>
              </div>
            </div>

            <div className={styles.contentEditor}>
              <div className={styles.variablesSidebar}>
                <h4>Variables</h4>
                <div className={styles.variableSection}>
                  <h5>Common Variables</h5>
                  {Object.keys(createSampleVariables(companyData, brandData))
                    .filter(variable => !QUOTE_VARIABLES.includes(variable))
                    .map(variable => (
                      <button
                        key={variable}
                        className={styles.variableButton}
                        onClick={() => insertVariable(variable)}
                        title={`Insert ${'{{'}${variable}${'}}'}`}
                      >
                        {variable}
                      </button>
                    ))}
                </div>

                {formData.template_type === 'quote' && (
                  <div className={styles.variableSection}>
                    <h5>Quote Variables</h5>
                    {QUOTE_VARIABLES.map(variable => (
                      <button
                        key={variable}
                        className={styles.variableButton}
                        onClick={() => insertVariable(variable)}
                        title={`Insert ${'{{'}${variable}${'}}'}`}
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                )}

                {detectedVariables.length > 0 && (
                  <div className={styles.variableSection}>
                    <h5>Detected Variables</h5>
                    {detectedVariables.map(variable => (
                      <div key={variable} className={styles.detectedVariable}>
                        {`{{${variable}}}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.editorContent}>
                {activeTab === 'html' && (
                  <textarea
                    id="html-content"
                    className={styles.contentTextarea}
                    value={formData.html_content}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        html_content: e.target.value,
                      }))
                    }
                    placeholder="Enter HTML content here... Use {{variable_name}} for dynamic content."
                    rows={15}
                  />
                )}

                {activeTab === 'text' && (
                  <textarea
                    id="text-content"
                    className={styles.contentTextarea}
                    value={formData.text_content}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        text_content: e.target.value,
                      }))
                    }
                    placeholder="Enter plain text content here... Use {{variable_name}} for dynamic content."
                    rows={15}
                  />
                )}

                {activeTab === 'preview' && (
                  <div className={styles.previewContainer}>
                    <div className={styles.previewHeader}>
                      <div className={styles.previewSubject}>
                        <Mail size={16} />
                        <strong>Subject:</strong>{' '}
                        {replaceVariablesWithSample(formData.subject_line, sampleVariables) ||
                          'No subject line'}
                      </div>
                    </div>
                    <div className={styles.previewContent}>
                      {formData.html_content ? (
                        <div
                          className={styles.htmlPreview}
                          dangerouslySetInnerHTML={{
                            __html: replaceVariablesWithSample(
                              formData.html_content,
                              sampleVariables
                            ),
                          }}
                        />
                      ) : formData.text_content ? (
                        <div className={styles.textPreview}>
                          {replaceVariablesWithSample(formData.text_content, sampleVariables)
                            .split('\n')
                            .map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                        </div>
                      ) : (
                        <div className={styles.emptyPreview}>
                          <Mail size={48} />
                          <p>Add content to see preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={styles.saveButton}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
