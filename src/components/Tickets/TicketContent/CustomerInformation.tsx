import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { Ticket } from '@/types/ticket';
import { authenticatedFetch } from '@/lib/api-client';
import { formatPhoneNumber } from '@/lib/display-utils';
import styles from './CustomerInformation.module.scss';

interface CustomerInformationProps {
  ticket: Ticket;
  onUpdate?: (customerData: any) => void;
}

interface FieldState {
  value: string;
  isLoading: boolean;
  hasError: boolean;
  showSuccess: boolean;
}

export default function CustomerInformation({
  ticket,
  onUpdate,
}: CustomerInformationProps) {
  // Initialize form fields with current customer data (contact info only)
  const [fields, setFields] = useState<Record<string, FieldState>>({
    first_name: {
      value: ticket.customer?.first_name || '',
      isLoading: false,
      hasError: false,
      showSuccess: false,
    },
    last_name: {
      value: ticket.customer?.last_name || '',
      isLoading: false,
      hasError: false,
      showSuccess: false,
    },
    email: {
      value: ticket.customer?.email || '',
      isLoading: false,
      hasError: false,
      showSuccess: false,
    },
    phone: {
      value: ticket.customer?.phone || '',
      isLoading: false,
      hasError: false,
      showSuccess: false,
    },
    alternate_phone: {
      value: ticket.customer?.alternate_phone || '',
      isLoading: false,
      hasError: false,
      showSuccess: false,
    },
  });

  // Store timeout refs for debouncing
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const successTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

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
    async (fieldName: string, value: string) => {
      if (!ticket.customer?.id) return;

      try {
        updateFieldState(fieldName, { isLoading: true, hasError: false });

        const updateData = { [fieldName]: value.trim() || null };

        const updatedCustomer = await authenticatedFetch(
          `/api/customers/${ticket.customer.id}`,
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

        // Call parent update callback
        if (onUpdate) {
          onUpdate(updatedCustomer);
        }
      } catch (error) {
        console.error(`Error updating ${fieldName}:`, error);
        updateFieldState(fieldName, {
          isLoading: false,
          hasError: true,
          showSuccess: false,
        });

        // Clear error after 3 seconds
        setTimeout(() => {
          updateFieldState(fieldName, { hasError: false });
        }, 3000);
      }
    },
    [ticket.customer?.id, onUpdate]
  );

  // Handle field changes with debouncing
  const handleFieldChange = (fieldName: string, value: string) => {
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
        autoSave(fieldName, formattedValue);
      }, 1000);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
      Object.values(successTimeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  // Field status indicator component
  const FieldStatusIndicator = ({ fieldName }: { fieldName: string }) => {
    const field = fields[fieldName];

    if (field.isLoading) {
      return <Loader2 size={16} className={styles.loadingIcon} />;
    }

    if (field.hasError) {
      return <AlertCircle size={16} className={styles.errorIcon} />;
    }

    if (field.showSuccess) {
      return <Check size={16} className={styles.successIcon} />;
    }

    return null;
  };

  return (
    <div className={styles.section}>
      <div className={styles.formGrid}>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>First Name</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={fields.first_name.value}
                onChange={e => handleFieldChange('first_name', e.target.value)}
                className={`${styles.autoSaveInput} ${fields.first_name.hasError ? styles.hasError : ''}`}
                placeholder="Enter first name"
              />
              <FieldStatusIndicator fieldName="first_name" />
            </div>
          </div>
          <div className={styles.formField}>
            <label>Last Name</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={fields.last_name.value}
                onChange={e => handleFieldChange('last_name', e.target.value)}
                className={`${styles.autoSaveInput} ${fields.last_name.hasError ? styles.hasError : ''}`}
                placeholder="Enter last name"
              />
              <FieldStatusIndicator fieldName="last_name" />
            </div>
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>Cell Phone</label>
            <div className={styles.inputWrapper}>
              <input
                type="tel"
                value={fields.phone.value}
                onChange={e => handleFieldChange('phone', e.target.value)}
                className={`${styles.autoSaveInput} ${fields.phone.hasError ? styles.hasError : ''}`}
                placeholder="Enter phone number"
              />
              <FieldStatusIndicator fieldName="phone" />
            </div>
          </div>
          <div className={styles.formField}>
            <label>Alternate Phone</label>
            <div className={styles.inputWrapper}>
              <input
                type="tel"
                value={fields.alternate_phone.value}
                onChange={e => handleFieldChange('alternate_phone', e.target.value)}
                className={`${styles.autoSaveInput} ${fields.alternate_phone.hasError ? styles.hasError : ''}`}
                placeholder="Enter alternate phone"
              />
              <FieldStatusIndicator fieldName="alternate_phone" />
            </div>
          </div>
        </div>
        <div className={styles.formField}>
          <label>Email Address</label>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              value={fields.email.value}
              onChange={e => handleFieldChange('email', e.target.value)}
              className={`${styles.autoSaveInput} ${fields.email.hasError ? styles.hasError : ''}`}
              placeholder="Enter email address"
            />
            <FieldStatusIndicator fieldName="email" />
          </div>
        </div>
      </div>
    </div>
  );
}
