import { useState, useEffect, useMemo } from 'react';
import {
  SupportCase,
  supportCaseIssueTypeOptions,
  supportCasePriorityOptions,
} from '@/types/support-case';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { adminAPI } from '@/lib/api-client';
import { AlertCircle, Save } from 'lucide-react';
import styles from './SupportCaseStepContent.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';

interface SupportCaseStepContentProps {
  supportCase: SupportCase;
  isAdmin: boolean;
  onSupportCaseUpdate?: () => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export function SupportCaseStepContent({
  supportCase,
  isAdmin,
  onSupportCaseUpdate,
  onShowToast,
}: SupportCaseStepContentProps) {
  // Form state for Customer Service Issue fields
  const [formData, setFormData] = useState({
    issue_type: supportCase.issue_type,
    priority: supportCase.priority,
    summary: supportCase.summary,
    description: supportCase.description || '',
    resolution_action: supportCase.resolution_action || '',
    notes: supportCase.notes || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Update form data when supportCase changes
  useEffect(() => {
    setFormData({
      issue_type: supportCase.issue_type,
      priority: supportCase.priority,
      summary: supportCase.summary,
      description: supportCase.description || '',
      resolution_action: supportCase.resolution_action || '',
      notes: supportCase.notes || '',
    });
  }, [supportCase]);

  // Handle form field changes
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle Save & Close Issue
  const handleSaveAndClose = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const updateData = {
        ...formData,
        status: 'resolved',
      };

      if (isAdmin) {
        await adminAPI.updateSupportCase(supportCase.id, updateData);
      } else {
        await adminAPI.updateUserSupportCase(supportCase.id, updateData);
      }

      onSupportCaseUpdate?.();
      onShowToast?.('Support case saved and marked as resolved', 'success');
    } catch (error) {
      console.error('Error saving and closing support case:', error);
      onShowToast?.('Failed to save support case. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save & Keep Open
  const handleSaveAndKeepOpen = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      if (isAdmin) {
        await adminAPI.updateSupportCase(supportCase.id, formData);
      } else {
        await adminAPI.updateUserSupportCase(supportCase.id, formData);
      }

      onSupportCaseUpdate?.();
      onShowToast?.('Support case saved successfully', 'success');
    } catch (error) {
      console.error('Error saving support case:', error);
      onShowToast?.('Failed to save support case. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className={styles.contentLeft}>
        <InfoCard
          title="Customer Service Issue"
          icon={<AlertCircle size={20} />}
          startExpanded={true}
        >
          <div className={styles.cardContent}>
            <div className={styles.formGrid}>
              {/* Row 1: Issue Type and Priority */}
              <div className={`${styles.gridRow} ${styles.twoColumns}`}>
                <div className={styles.formField}>
                  <label className={cardStyles.inputLabels}>Issue Type</label>
                  <div className={styles.dropdownWithArrow}>
                    <select
                      className={styles.selectInput}
                      value={formData.issue_type}
                      onChange={e =>
                        handleFormChange('issue_type', e.target.value)
                      }
                    >
                      {supportCaseIssueTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="21"
                      viewBox="0 0 20 21"
                      fill="none"
                      className={styles.dropdownArrow}
                    >
                      <path
                        d="M6 12.2539L10 7.80946L14 12.2539"
                        stroke="#99A1AF"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={cardStyles.inputLabels}>
                    Priority Level
                  </label>
                  <div className={styles.dropdownWithArrow}>
                    <select
                      className={styles.selectInput}
                      value={formData.priority}
                      onChange={e =>
                        handleFormChange('priority', e.target.value)
                      }
                    >
                      {supportCasePriorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="21"
                      viewBox="0 0 20 21"
                      fill="none"
                      className={styles.dropdownArrow}
                    >
                      <path
                        d="M6 12.2539L10 7.80946L14 12.2539"
                        stroke="#99A1AF"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Row 2: Subject/Issue Summary */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.formField}>
                  <label className={cardStyles.inputLabels}>
                    Subject/Issue Summary
                  </label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={formData.summary}
                    onChange={e => handleFormChange('summary', e.target.value)}
                    placeholder="Brief description of the issue..."
                  />
                </div>
              </div>

              {/* Row 3: Detailed Description */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.formField}>
                  <label className={cardStyles.inputLabels}>
                    Detailed Description
                  </label>
                  <textarea
                    className={styles.textareaInput}
                    value={formData.description}
                    onChange={e =>
                      handleFormChange('description', e.target.value)
                    }
                    placeholder="Please provide detailed information about the customer issue, including any relevant background information, what they've tried, and what outcomes they are looking for"
                    rows={4}
                  />
                </div>
              </div>

              {/* Row 4: Resolution & Action Taken */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.formField}>
                  <label className={cardStyles.inputLabels}>
                    Resolution & Action Taken
                  </label>
                  <textarea
                    className={styles.textareaInput}
                    value={formData.resolution_action}
                    onChange={e =>
                      handleFormChange('resolution_action', e.target.value)
                    }
                    placeholder="Document the steps taken to resolve the issue, any solutions provided, follow-up actions required and final outcomes"
                    rows={4}
                  />
                </div>
              </div>

              {/* Row 5: Additional Notes */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.formField}>
                  <label className={cardStyles.inputLabels}>
                    Additional Notes
                  </label>
                  <textarea
                    className={styles.textareaInput}
                    value={formData.notes}
                    onChange={e => handleFormChange('notes', e.target.value)}
                    placeholder="Any additional notes, observations or information that might be helpful for future reference."
                    rows={3}
                  />
                </div>
              </div>

              {/* Save Buttons */}
              <div className={styles.actionButtons}>
                <button
                  className={styles.saveCloseButton}
                  onClick={handleSaveAndClose}
                  disabled={isSaving}
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save & Close Issue'}
                </button>
                <button
                  className={styles.saveOpenButton}
                  onClick={handleSaveAndKeepOpen}
                  disabled={isSaving}
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save & Keep Open'}
                </button>
              </div>
            </div>
          </div>
        </InfoCard>
      </div>
    </>
  );
}
