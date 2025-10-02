import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { Ticket } from '@/types/ticket';
import { authenticatedFetch } from '@/lib/api-client';
import styles from './ServiceLocation.module.scss';

interface ServiceLocationProps {
  ticket: Ticket;
  onUpdate?: (serviceAddressData: any) => void;
}

interface FieldState {
  value: string;
  isLoading: boolean;
  hasError: boolean;
  showSuccess: boolean;
}

interface ServiceAddress {
  id: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  apartment_unit?: string;
  address_line_2?: string;
  address_type: 'residential' | 'commercial' | 'industrial' | 'mixed_use';
  property_notes?: string;
  home_size_range?: string;
  yard_size_range?: string;
}

// Predefined size range options
const HOME_SIZE_OPTIONS = [
  { value: '', label: 'Select home size' },
  { value: '0-1500', label: 'Under 1,500 sq ft' },
  { value: '1501-2000', label: '1,501 - 2,000 sq ft' },
  { value: '2001-2500', label: '2,001 - 2,500 sq ft' },
  { value: '2501-3000', label: '2,501 - 3,000 sq ft' },
  { value: '3001-4000', label: '3,001 - 4,000 sq ft' },
  { value: '4001-5000', label: '4,001 - 5,000 sq ft' },
  { value: '5000+', label: 'Over 5,000 sq ft' },
];

const YARD_SIZE_OPTIONS = [
  { value: '', label: 'Select yard size' },
  { value: '0-0.25', label: 'Under 0.25 acres' },
  { value: '0.26-0.50', label: '0.26 - 0.50 acres' },
  { value: '0.51-1.00', label: '0.51 - 1.00 acres' },
  { value: '1.01-2.00', label: '1.01 - 2.00 acres' },
  { value: '2.01-5.00', label: '2.01 - 5.00 acres' },
  { value: '5.00+', label: 'Over 5 acres' },
];

export default function ServiceLocation({
  ticket,
  onUpdate,
}: ServiceLocationProps) {
  const [primaryServiceAddress, setPrimaryServiceAddress] =
    useState<ServiceAddress | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form fields based on data source
  const getInitialFieldValues = (): Record<string, FieldState> => {
    // PRIORITY 1: If ticket has a linked service address, use that
    if (ticket.service_address) {
      return {
        street_address: {
          value: ticket.service_address.street_address || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        city: {
          value: ticket.service_address.city || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        state: {
          value: ticket.service_address.state || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        zip_code: {
          value: ticket.service_address.zip_code || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        apartment_unit: {
          value: ticket.service_address.apartment_unit || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        address_line_2: {
          value: ticket.service_address.address_line_2 || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        address_type: {
          value: ticket.service_address.address_type || 'residential',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        property_notes: {
          value: ticket.service_address.property_notes || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        home_size_range: {
          value: ticket.service_address.home_size_range || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        yard_size_range: {
          value: ticket.service_address.yard_size_range || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
      };
    }

    // PRIORITY 2: If we have a customer's primary service address, use that
    if (primaryServiceAddress) {
      return {
        street_address: {
          value: primaryServiceAddress.street_address || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        city: {
          value: primaryServiceAddress.city || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        state: {
          value: primaryServiceAddress.state || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        zip_code: {
          value: primaryServiceAddress.zip_code || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        apartment_unit: {
          value: primaryServiceAddress.apartment_unit || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        address_line_2: {
          value: primaryServiceAddress.address_line_2 || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        address_type: {
          value: primaryServiceAddress.address_type || 'residential',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        property_notes: {
          value: primaryServiceAddress.property_notes || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        home_size_range: {
          value: primaryServiceAddress.home_size_range || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        yard_size_range: {
          value: primaryServiceAddress.yard_size_range || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
      };
    }

    // PRIORITY 3: If we have ticket customer address data, use that as fallback
    if (ticket.customer?.address) {
      return {
        street_address: {
          value: ticket.customer.address || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        city: {
          value: ticket.customer.city || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        state: {
          value: ticket.customer.state || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        zip_code: {
          value: ticket.customer.zip_code || '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        apartment_unit: {
          value: '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        address_line_2: {
          value: '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        address_type: {
          value: 'residential',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        property_notes: {
          value: '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        home_size_range: {
          value: '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
        yard_size_range: {
          value: '',
          isLoading: false,
          hasError: false,
          showSuccess: false,
        },
      };
    }

    // PRIORITY 4: Default empty fields (no address data available)
    return {
      street_address: {
        value: '',
        isLoading: false,
        hasError: false,
        showSuccess: false,
      },
      city: {
        value: '',
        isLoading: false,
        hasError: false,
        showSuccess: false,
      },
      state: {
        value: '',
        isLoading: false,
        hasError: false,
        showSuccess: false,
      },
      zip_code: {
        value: '',
        isLoading: false,
        hasError: false,
        showSuccess: false,
      },
      apartment_unit: {
        value: '',
        isLoading: false,
        hasError: false,
        showSuccess: false,
      },
      address_line_2: {
        value: '',
        isLoading: false,
        hasError: false,
        showSuccess: false,
      },
      address_type: {
        value: 'residential',
        isLoading: false,
        hasError: false,
        showSuccess: false,
      },
      property_notes: {
        value: '',
        isLoading: false,
        hasError: false,
        showSuccess: false,
      },
      home_size_range: {
        value: '',
        isLoading: false,
        hasError: false,
        showSuccess: false,
      },
      yard_size_range: {
        value: '',
        isLoading: false,
        hasError: false,
        showSuccess: false,
      },
    };
  };

  const [fields, setFields] = useState<Record<string, FieldState>>(
    getInitialFieldValues()
  );

  // Store timeout refs for debouncing
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const successTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  // Load primary service address if customer exists and ticket doesn't have one already
  useEffect(() => {
    const loadPrimaryServiceAddress = async () => {
      // Skip loading if ticket already has a service address or no customer
      if (ticket.service_address || !ticket.customer?.id) {
        setFields(getInitialFieldValues());
        return;
      }

      try {
        setIsLoadingAddress(true);
        const response = await authenticatedFetch(
          `/api/customers/${ticket.customer.id}/service-address`
        );

        if (response.serviceAddress) {
          setPrimaryServiceAddress(response.serviceAddress);
          setFields(getInitialFieldValues());
        } else {
          // No primary service address - will create one when needed
          setFields(getInitialFieldValues());
        }
      } catch (error) {
        console.error('Error loading primary service address:', error);
        // Fall back to empty fields - will create service address when needed
        setFields(getInitialFieldValues());
      } finally {
        setIsLoadingAddress(false);
      }
    };

    loadPrimaryServiceAddress();
  }, [ticket.customer?.id, ticket.service_address]);

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

  // Function to link service address to ticket
  const linkServiceAddressToTicket = useCallback(
    async (serviceAddressId: string) => {
      try {
        
        const response = await authenticatedFetch(`/api/tickets/${ticket.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_address_id: serviceAddressId,
          }),
        });

        if (!response.ok) {
          console.error('❌ Failed to link service address to ticket');
        }
      } catch (error) {
        console.error('❌ Error linking service address to ticket:', error);
      }
    },
    [ticket.id]
  );

  // Auto-save function with debouncing
  const autoSave = useCallback(
    async (fieldName: string, value: string) => {
      // Only attempt to save if we have a customer ID
      if (!ticket.customer?.id) {
        updateFieldState(fieldName, {
          isLoading: false,
          hasError: false,
          showSuccess: false,
        });
        return;
      }

      // Prevent concurrent saves
      if (isSaving) {
        updateFieldState(fieldName, {
          isLoading: false,
          hasError: false,
          showSuccess: false,
        });
        return;
      }

      try {
        setIsSaving(true);
        updateFieldState(fieldName, { isLoading: true, hasError: false });

        // Check what type of operation we should perform
        const currentFields = fields;
        const requiredFields = ['street_address', 'city', 'state', 'zip_code'];
        
        // Check if we have all required fields
        const hasAllRequired = requiredFields.every(field => {
          if (field === fieldName) {
            return value.trim() !== '';
          }
          return currentFields[field]?.value.trim() !== '';
        });

        // If we don't have all required fields, just update local state
        if (!hasAllRequired) {
          updateFieldState(fieldName, {
            isLoading: false,
            hasError: false,
            showSuccess: false,
          });
          setIsSaving(false);
          return;
        }

        // Strategy: Always use POST to create/find service addresses
        // The createOrFindServiceAddress function handles deduplication
        // This avoids the PUT errors when service addresses don't exist
        
        const apiEndpoint = `/api/customers/${ticket.customer.id}/service-address`;
        const method = 'POST';
        
        // Include all current field values for creation/update
        const updateData = {
          street_address: fieldName === 'street_address' ? value.trim() : currentFields.street_address.value.trim(),
          city: fieldName === 'city' ? value.trim() : currentFields.city.value.trim(),
          state: fieldName === 'state' ? value.trim() : currentFields.state.value.trim(),
          zip_code: fieldName === 'zip_code' ? value.trim() : currentFields.zip_code.value.trim(),
          apartment_unit: currentFields.apartment_unit?.value.trim() || null,
          address_line_2: currentFields.address_line_2?.value.trim() || null,
          address_type: currentFields.address_type?.value || 'residential',
          property_notes: currentFields.property_notes?.value.trim() || null,
          home_size_range: currentFields.home_size_range?.value || null,
          yard_size_range: currentFields.yard_size_range?.value || null,
        };

        const response = await authenticatedFetch(apiEndpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

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

        // Update our state with the created/found service address
        if (response.serviceAddress) {
          setPrimaryServiceAddress(response.serviceAddress);
          
          // Link the service address to the ticket
          await linkServiceAddressToTicket(response.serviceAddress.id);
        }

        // Call parent update callback
        if (onUpdate) {
          onUpdate(response);
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
      } finally {
        setIsSaving(false);
      }
    },
    [ticket.customer?.id, onUpdate, fields, isSaving, linkServiceAddressToTicket]
  );

  // Handle field changes with debouncing
  const handleFieldChange = (fieldName: string, value: string) => {
    // Update local state immediately for responsive UI
    updateFieldState(fieldName, { value, showSuccess: false, hasError: false });

    // Clear existing timeout
    if (timeoutRefs.current[fieldName]) {
      clearTimeout(timeoutRefs.current[fieldName]);
    }

    // Set new timeout for auto-save (500ms after user stops typing)
    timeoutRefs.current[fieldName] = setTimeout(() => {
      autoSave(fieldName, value);
    }, 500);
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


  if (isLoadingAddress) {
    return (
      <div className={styles.section}>
        <div className={styles.loadingContainer}>
          <Loader2 size={24} className={styles.loadingIcon} />
          <span>Loading address information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Street Address</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={fields.street_address.value}
              onChange={e =>
                handleFieldChange('street_address', e.target.value)
              }
              className={`${styles.autoSaveInput} ${fields.street_address.hasError ? styles.hasError : ''}`}
              placeholder="Enter street address"
            />
            <FieldStatusIndicator fieldName="street_address" />
          </div>
        </div>

        <div className={`${styles.formRow} ${styles.threeColumns}`}>
          <div className={styles.formField}>
            <label>City</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={fields.city.value}
                onChange={e => handleFieldChange('city', e.target.value)}
                className={`${styles.autoSaveInput} ${fields.city.hasError ? styles.hasError : ''}`}
                placeholder="Enter city"
              />
              <FieldStatusIndicator fieldName="city" />
            </div>
          </div>
          <div className={styles.formField}>
            <label>State</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={fields.state.value}
                onChange={e => handleFieldChange('state', e.target.value)}
                className={`${styles.autoSaveInput} ${fields.state.hasError ? styles.hasError : ''}`}
                placeholder="Enter state"
              />
              <FieldStatusIndicator fieldName="state" />
            </div>
          </div>
          <div className={styles.formField}>
            <label>Zip Code</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={fields.zip_code.value}
                onChange={e => handleFieldChange('zip_code', e.target.value)}
                className={`${styles.autoSaveInput} ${fields.zip_code.hasError ? styles.hasError : ''}`}
                placeholder="Enter zip"
              />
              <FieldStatusIndicator fieldName="zip_code" />
            </div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>Home Size</label>
            <div className={styles.inputWrapper}>
              <select
                value={fields.home_size_range.value}
                onChange={e => handleFieldChange('home_size_range', e.target.value)}
                className={`${styles.autoSaveInput} ${fields.home_size_range.hasError ? styles.hasError : ''}`}
              >
                {HOME_SIZE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldStatusIndicator fieldName="home_size_range" />
            </div>
          </div>
          <div className={styles.formField}>
            <label>Yard Size</label>
            <div className={styles.inputWrapper}>
              <select
                value={fields.yard_size_range.value}
                onChange={e => handleFieldChange('yard_size_range', e.target.value)}
                className={`${styles.autoSaveInput} ${fields.yard_size_range.hasError ? styles.hasError : ''}`}
              >
                {YARD_SIZE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldStatusIndicator fieldName="yard_size_range" />
            </div>
          </div>
        </div>

        <div className={styles.formField}>
          <label>Property Notes</label>
          <div className={styles.inputWrapper}>
            <textarea
              value={fields.property_notes.value}
              onChange={e =>
                handleFieldChange('property_notes', e.target.value)
              }
              className={`${styles.autoSaveInput} ${styles.textareaInput} ${fields.property_notes.hasError ? styles.hasError : ''}`}
              placeholder="Additional property information..."
              rows={3}
            />
            <FieldStatusIndicator fieldName="property_notes" />
          </div>
        </div>
      </div>
    </div>
  );
}
