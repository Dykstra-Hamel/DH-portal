import { useState, useCallback, useRef, useEffect } from 'react';
import { SquareUserRound, Check, AlertCircle, Loader2 } from 'lucide-react';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { getCustomerDisplayName, getPhoneDisplay } from '@/lib/display-utils';
import { authenticatedFetch } from '@/lib/api-client';
import { customerStatusOptions } from '@/types/customer';
import styles from './ContactInformationCard.module.scss';
import cardStyles from '../InfoCard/InfoCard.module.scss';

interface ContactInformationCardProps {
  customer: {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    alternate_phone?: string | null;
    email?: string | null;
    customer_status?: string;
    created_at?: string;
  } | null;
  startExpanded?: boolean;
  editable?: boolean;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
  onRequestUndo?: (undoHandler: () => Promise<void>) => void;
  companyId?: string;
}

interface FieldState {
  value: string;
  isLoading: boolean;
  hasError: boolean;
  showSuccess: boolean;
}

export function ContactInformationCard({
  customer,
  startExpanded = false,
  editable = false,
  onShowToast,
  onRequestUndo,
  companyId,
}: ContactInformationCardProps) {
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Initialize form fields with current customer data
  const [fields, setFields] = useState<Record<string, FieldState>>({
    first_name: {
      value: customer?.first_name || '',
      isLoading: false,
      hasError: false,
      showSuccess: false,
    },
    last_name: {
      value: customer?.last_name || '',
      isLoading: false,
      hasError: false,
      showSuccess: false,
    },
    email: {
      value: customer?.email || '',
      isLoading: false,
      hasError: false,
      showSuccess: false,
    },
    phone: {
      value: customer?.phone || '',
      isLoading: false,
      hasError: false,
      showSuccess: false,
    },
    alternate_phone: {
      value: customer?.alternate_phone || '',
      isLoading: false,
      hasError: false,
      showSuccess: false,
    },
    customer_status: {
      value: customer?.customer_status || 'active',
      isLoading: false,
      hasError: false,
      showSuccess: false,
    },
  });

  // Store timeout refs for debouncing
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const successTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  // Store original database values for accurate activity logging
  const originalValuesRef = useRef<Record<string, string>>({
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    alternate_phone: customer?.alternate_phone || '',
    customer_status: customer?.customer_status || 'active',
  });

  // Format phone progressively as user types
  const formatPhoneInput = (value: string): string => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');

    // Apply formatting based on length
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else {
      // Limit to 10 digits
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  // Validation helpers
  const isValidPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Update field state helper
  const updateFieldState = (
    fieldName: string,
    updates: Partial<FieldState>
  ) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], ...updates },
    }));
  };

  // Auto-save function with debouncing
  const autoSave = useCallback(
    async (fieldName: string, value: string, oldValue: string) => {
      if (!customer?.id) return;

      try {
        updateFieldState(fieldName, { isLoading: true, hasError: false });

        const updateData = { [fieldName]: value.trim() || null };

        const updatedCustomer = await authenticatedFetch(
          `/api/customers/${customer.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          }
        );

        updateFieldState(fieldName, {
          isLoading: false,
          hasError: false,
          showSuccess: true,
        });

        // Hide success indicator after 2 seconds
        if (successTimeoutRefs.current[fieldName]) {
          clearTimeout(successTimeoutRefs.current[fieldName]);
        }
        successTimeoutRefs.current[fieldName] = setTimeout(() => {
          updateFieldState(fieldName, { showSuccess: false });
        }, 2000);

        // Update original value ref after successful save
        originalValuesRef.current[fieldName] = value.trim();

        // Log activity for the field change
        if (companyId && oldValue !== value.trim()) {
          try {
            await fetch('/api/activity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                company_id: companyId,
                entity_type: 'customer',
                entity_id: customer.id,
                activity_type: 'field_update',
                field_name: fieldName,
                old_value: oldValue || null,
                new_value: value.trim() || null,
              }),
            });
          } catch (activityError) {
            console.error('Error logging activity:', activityError);
            // Don't fail the main operation if activity logging fails
          }
        }

        // Show success toast with undo capability
        if (onShowToast) {
          onShowToast('Field updated successfully', 'success');
        }

        // Provide undo handler
        if (onRequestUndo) {
          const undoHandler = async () => {
            try {
              // Revert to old value in UI
              updateFieldState(fieldName, { value: oldValue });

              // Revert in database
              await authenticatedFetch(`/api/customers/${customer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [fieldName]: oldValue || null }),
              });

              // Update original value ref back to old value
              originalValuesRef.current[fieldName] = oldValue;

              // Log undo activity
              if (companyId) {
                try {
                  await fetch('/api/activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      company_id: companyId,
                      entity_type: 'customer',
                      entity_id: customer.id,
                      activity_type: 'field_update',
                      field_name: fieldName,
                      old_value: value.trim() || null,
                      new_value: oldValue || null,
                    }),
                  });
                } catch (activityError) {
                  console.error('Error logging undo activity:', activityError);
                }
              }

              onShowToast?.('Change undone', 'success');
            } catch (error) {
              console.error('Error undoing change:', error);
              onShowToast?.('Failed to undo change', 'error');
            }
          };

          onRequestUndo(undoHandler);
        }
      } catch (error) {
        console.error(`Error updating ${fieldName}:`, error);
        updateFieldState(fieldName, {
          isLoading: false,
          hasError: true,
          showSuccess: false,
        });

        // Show error toast
        if (onShowToast) {
          onShowToast('Failed to update field', 'error');
        }

        // Clear error after 3 seconds
        setTimeout(() => {
          updateFieldState(fieldName, { hasError: false });
        }, 3000);
      }
    },
    [customer?.id, companyId, onShowToast, onRequestUndo]
  );

  // Handle field changes with debouncing
  const handleFieldChange = (fieldName: string, value: string) => {
    // Get the original database value for activity logging
    const oldValue = originalValuesRef.current[fieldName];

    let formattedValue = value;

    // Auto-format phone numbers as user types
    if (fieldName === 'phone' || fieldName === 'alternate_phone') {
      formattedValue = formatPhoneInput(value);
    }

    // Update local state immediately for responsive UI
    updateFieldState(fieldName, {
      value: formattedValue,
      showSuccess: false,
      hasError: false,
    });

    // Clear existing timeout
    if (timeoutRefs.current[fieldName]) {
      clearTimeout(timeoutRefs.current[fieldName]);
    }

    // Validate before saving
    let shouldSave = true;

    if (fieldName === 'phone' || fieldName === 'alternate_phone') {
      // Only save if phone is empty or valid 10-digit number
      shouldSave = value.trim() === '' || isValidPhone(value);
    } else if (fieldName === 'email') {
      // Only save if email is empty or valid format
      shouldSave = value.trim() === '' || isValidEmail(value);
    }

    // Set new timeout for auto-save (1000ms after user stops typing)
    if (shouldSave) {
      timeoutRefs.current[fieldName] = setTimeout(() => {
        autoSave(fieldName, formattedValue, oldValue);
      }, 1000);
    }
  };

  // Update original values ref when customer data changes from props
  useEffect(() => {
    if (customer) {
      originalValuesRef.current = {
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        alternate_phone: customer.alternate_phone || '',
        customer_status: customer.customer_status || 'active',
      };
    }
  }, [customer]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
      Object.values(successTimeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  // Render field indicator (loading, success, error)
  const renderFieldIndicator = (fieldName: string) => {
    const field = fields[fieldName];
    if (field.isLoading) {
      return <Loader2 size={16} className={styles.spinner} />;
    }
    if (field.showSuccess) {
      return <Check size={16} className={styles.successIcon} />;
    }
    if (field.hasError) {
      return <AlertCircle size={16} className={styles.errorIcon} />;
    }
    return null;
  };

  return (
    <InfoCard
      title="Contact Information"
      icon={<SquareUserRound size={20} />}
      startExpanded={startExpanded}
    >
      <div className={styles.cardContent}>
        {customer ? (
          <div className={styles.callInsightsGrid}>
            {/* First Name */}
            <div className={styles.callDetailItem}>
              <span className={cardStyles.dataLabel}>First Name</span>
              {editable ? (
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    value={fields.first_name.value}
                    onChange={(e) => handleFieldChange('first_name', e.target.value)}
                    className={styles.editableInput}
                    placeholder="First name"
                  />
                  {renderFieldIndicator('first_name')}
                </div>
              ) : (
                <span className={cardStyles.dataText}>
                  {customer.first_name || 'Not provided'}
                </span>
              )}
            </div>

            {/* Last Name */}
            <div className={styles.callDetailItem}>
              <span className={cardStyles.dataLabel}>Last Name</span>
              {editable ? (
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    value={fields.last_name.value}
                    onChange={(e) => handleFieldChange('last_name', e.target.value)}
                    className={styles.editableInput}
                    placeholder="Last name"
                  />
                  {renderFieldIndicator('last_name')}
                </div>
              ) : (
                <span className={cardStyles.dataText}>
                  {customer.last_name || 'Not provided'}
                </span>
              )}
            </div>

            {/* Phone Number */}
            <div className={styles.callDetailItem}>
              <span className={cardStyles.dataLabel}>Phone Number</span>
              {editable ? (
                <div className={styles.inputWrapper}>
                  <input
                    type="tel"
                    value={fields.phone.value}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className={styles.editableInput}
                    placeholder="(XXX) XXX-XXXX"
                  />
                  {renderFieldIndicator('phone')}
                </div>
              ) : (
                <span className={cardStyles.dataText}>
                  {getPhoneDisplay(customer.phone)}
                </span>
              )}
            </div>

            {/* Alternate Phone */}
            <div className={styles.callDetailItem}>
              <span className={cardStyles.dataLabel}>Alternate Phone</span>
              {editable ? (
                <div className={styles.inputWrapper}>
                  <input
                    type="tel"
                    value={fields.alternate_phone.value}
                    onChange={(e) => handleFieldChange('alternate_phone', e.target.value)}
                    className={styles.editableInput}
                    placeholder="(XXX) XXX-XXXX"
                  />
                  {renderFieldIndicator('alternate_phone')}
                </div>
              ) : (
                <span className={cardStyles.dataText}>
                  {getPhoneDisplay(customer.alternate_phone)}
                </span>
              )}
            </div>

            {/* Email */}
            <div className={styles.callDetailItem}>
              <span className={cardStyles.dataLabel}>Email</span>
              {editable ? (
                <div className={styles.inputWrapper}>
                  <input
                    type="email"
                    value={fields.email.value}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className={styles.editableInput}
                    placeholder="email@example.com"
                  />
                  {renderFieldIndicator('email')}
                </div>
              ) : (
                <span className={cardStyles.dataText}>
                  {customer.email || 'Not provided'}
                </span>
              )}
            </div>

            {/* Customer Status */}
            {customer.customer_status && (
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Customer Status</span>
                {editable ? (
                  <div className={styles.inputWrapper}>
                    <select
                      value={fields.customer_status.value}
                      onChange={(e) => handleFieldChange('customer_status', e.target.value)}
                      className={styles.editableSelect}
                    >
                      {customerStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {renderFieldIndicator('customer_status')}
                  </div>
                ) : (
                  <span className={cardStyles.dataText}>
                    {capitalizeFirst(customer.customer_status)}
                  </span>
                )}
              </div>
            )}
            {customer.created_at && (
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Created At</span>
                <span className={cardStyles.dataText}>
                  {new Date(customer.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className={cardStyles.lightText}>
            No customer information available
          </div>
        )}
      </div>
    </InfoCard>
  );
}
