import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { SupportCase, supportCaseIssueTypeOptions, supportCasePriorityOptions } from '@/types/support-case';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { adminAPI } from '@/lib/api-client';
import {
  AddressAutocomplete,
  AddressComponents,
} from '@/components/Common/AddressAutocomplete/AddressAutocomplete';
import { StreetViewImage } from '@/components/Common/StreetViewImage/StreetViewImage';
import {
  ServiceAddressData,
  createServiceAddressForLead,
  updateExistingServiceAddress,
} from '@/lib/service-addresses';
import {
  generateHomeSizeOptions,
  generateYardSizeOptions,
  findSizeOptionByValue,
} from '@/lib/pricing-calculations';
import { SizeOption } from '@/types/pricing';
import {
  SquareUserRound,
  MapPinned,
  AlertCircle,
  Save,
  Archive,
} from 'lucide-react';
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
  onShowToast
}: SupportCaseStepContentProps) {
  // Form state for Customer Service Issue fields
  const [formData, setFormData] = useState({
    issue_type: supportCase.issue_type,
    priority: supportCase.priority,
    summary: supportCase.summary,
    description: supportCase.description || '',
    resolution_action: supportCase.resolution_action || '',
    notes: supportCase.notes || ''
  });

  const [isSaving, setIsSaving] = useState(false);

  // Service Location form state
  const [serviceLocationData, setServiceLocationData] =
    useState<ServiceAddressData>({
      street_address: '',
      city: '',
      state: '',
      zip_code: '',
      latitude: undefined,
      longitude: undefined,
      address_type: 'residential',
    });
  const [originalServiceAddress, setOriginalServiceAddress] =
    useState<ServiceAddressData | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [homeSize, setHomeSize] = useState<number | ''>('');
  const [yardSize, setYardSize] = useState<number | ''>('');
  const [selectedHomeSizeOption, setSelectedHomeSizeOption] = useState<string>('');
  const [selectedYardSizeOption, setSelectedYardSizeOption] = useState<string>('');

  // Fetch pricing settings
  const { settings: pricingSettings } = usePricingSettings(supportCase.company_id);

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // State name to abbreviation mapping
  const stateNameToAbbreviation: { [key: string]: string } = {
    Alabama: 'AL',
    Alaska: 'AK',
    Arizona: 'AZ',
    Arkansas: 'AR',
    California: 'CA',
    Colorado: 'CO',
    Connecticut: 'CT',
    Delaware: 'DE',
    Florida: 'FL',
    Georgia: 'GA',
    Hawaii: 'HI',
    Idaho: 'ID',
    Illinois: 'IL',
    Indiana: 'IN',
    Iowa: 'IA',
    Kansas: 'KS',
    Kentucky: 'KY',
    Louisiana: 'LA',
    Maine: 'ME',
    Maryland: 'MD',
    Massachusetts: 'MA',
    Michigan: 'MI',
    Minnesota: 'MN',
    Mississippi: 'MS',
    Missouri: 'MO',
    Montana: 'MT',
    Nebraska: 'NE',
    Nevada: 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    Ohio: 'OH',
    Oklahoma: 'OK',
    Oregon: 'OR',
    Pennsylvania: 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    Tennessee: 'TN',
    Texas: 'TX',
    Utah: 'UT',
    Vermont: 'VT',
    Virginia: 'VA',
    Washington: 'WA',
    'West Virginia': 'WV',
    Wisconsin: 'WI',
    Wyoming: 'WY',
  };

  // Generate home size dropdown options (support cases don't have service plans, so no pricing shown)
  const homeSizeOptions = useMemo(() => {
    if (!pricingSettings) return [];
    return generateHomeSizeOptions(pricingSettings);
  }, [pricingSettings]);

  // Generate yard size dropdown options (support cases don't have service plans, so no pricing shown)
  const yardSizeOptions = useMemo(() => {
    if (!pricingSettings) return [];
    return generateYardSizeOptions(pricingSettings);
  }, [pricingSettings]);

  // Auto-select home size option when homeSize changes
  useEffect(() => {
    if (homeSize && homeSizeOptions.length > 0) {
      const option = findSizeOptionByValue(Number(homeSize), homeSizeOptions);
      if (option) {
        setSelectedHomeSizeOption(option.value);
      }
    }
  }, [homeSize, homeSizeOptions]);

  // Auto-select yard size option when yardSize changes
  useEffect(() => {
    if (yardSize && yardSizeOptions.length > 0) {
      const option = findSizeOptionByValue(Number(yardSize), yardSizeOptions);
      if (option) {
        setSelectedYardSizeOption(option.value);
      }
    }
  }, [yardSize, yardSizeOptions]);

  // Computed values for service location
  const currentFormattedAddress = useMemo(() => {
    const parts: string[] = [];
    if (serviceLocationData.street_address?.trim()) {
      parts.push(serviceLocationData.street_address);
    }
    if (serviceLocationData.city?.trim()) {
      parts.push(serviceLocationData.city);
    }
    if (serviceLocationData.state?.trim() && serviceLocationData.zip_code?.trim()) {
      parts.push(`${serviceLocationData.state} ${serviceLocationData.zip_code}`);
    }

    // Return formatted address if we have at least a street address or city
    return parts.length >= 1 &&
      (serviceLocationData.street_address?.trim() ||
        serviceLocationData.city?.trim())
      ? parts.join(', ')
      : '';
  }, [serviceLocationData]);

  // Detect address changes by comparing current serviceLocationData with originalServiceAddress
  const hasAddressChanges = useMemo(() => {
    if (!originalServiceAddress) return false;

    // Don't show buttons if the original address was empty (new address entry)
    const hadExistingAddress = !!(
      originalServiceAddress.street_address ||
      originalServiceAddress.city ||
      originalServiceAddress.state ||
      originalServiceAddress.zip_code
    );

    if (!hadExistingAddress) return false;

    return (
      serviceLocationData.street_address !==
        originalServiceAddress.street_address ||
      serviceLocationData.city !== originalServiceAddress.city ||
      serviceLocationData.state !== originalServiceAddress.state ||
      serviceLocationData.zip_code !== originalServiceAddress.zip_code ||
      serviceLocationData.apartment_unit !==
        originalServiceAddress.apartment_unit ||
      serviceLocationData.address_line_2 !== originalServiceAddress.address_line_2
    );
  }, [serviceLocationData, originalServiceAddress]);

  const hasCompleteUnchangedAddress = useMemo(() => {
    return Boolean(
      serviceLocationData.street_address?.trim() &&
      serviceLocationData.city?.trim() &&
      serviceLocationData.state?.trim() &&
      serviceLocationData.zip_code?.trim() &&
      !hasAddressChanges
    );
  }, [serviceLocationData, hasAddressChanges]);

  // Pre-fill service location with primary service address when component loads
  useEffect(() => {
    // Only pre-fill if we haven't already set the service location data
    if (originalServiceAddress === null) {
      if (supportCase.primary_service_address) {
        const addressData: ServiceAddressData = {
          street_address: supportCase.primary_service_address.street_address || '',
          city: supportCase.primary_service_address.city || '',
          state: supportCase.primary_service_address.state || '',
          zip_code: supportCase.primary_service_address.zip_code || '',
          apartment_unit: supportCase.primary_service_address.apartment_unit,
          address_line_2: supportCase.primary_service_address.address_line_2,
          latitude: supportCase.primary_service_address.latitude,
          longitude: supportCase.primary_service_address.longitude,
          address_type:
            (supportCase.primary_service_address.address_type || 'residential') as 'residential' | 'commercial' | 'industrial' | 'mixed_use',
          property_notes: supportCase.primary_service_address.property_notes,
          hasStreetView: supportCase.primary_service_address.hasStreetView,
        };

        // Store original service address for change detection
        setOriginalServiceAddress(addressData);

        setServiceLocationData(prev => ({
          ...prev,
          ...addressData,
        }));

        // Set home and yard sizes if available
        if (supportCase.primary_service_address.home_size && homeSize === '') {
          setHomeSize(supportCase.primary_service_address.home_size);
        }
        if (supportCase.primary_service_address.yard_size && yardSize === '') {
          setYardSize(supportCase.primary_service_address.yard_size);
        }
      } else if (supportCase.customer) {
        // Fallback to customer address if no primary service address exists
        const customerAddressData: ServiceAddressData = {
          street_address: supportCase.customer.address || '',
          city: supportCase.customer.city || '',
          state: supportCase.customer.state || '',
          zip_code: supportCase.customer.zip_code || '',
          latitude: undefined,
          longitude: undefined,
          address_type: 'residential',
        };

        // Store original service address for change detection
        setOriginalServiceAddress(customerAddressData);

        setServiceLocationData(prev => ({
          ...prev,
          ...customerAddressData,
        }));
      }
    }
  }, [supportCase.primary_service_address, supportCase.customer, originalServiceAddress, homeSize, yardSize]);

  // Update form data when supportCase changes
  useEffect(() => {
    setFormData({
      issue_type: supportCase.issue_type,
      priority: supportCase.priority,
      summary: supportCase.summary,
      description: supportCase.description || '',
      resolution_action: supportCase.resolution_action || '',
      notes: supportCase.notes || ''
    });
  }, [supportCase]);

  // Handle form field changes
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Service Location handlers
  const handleAddressSelect = (addressComponents: AddressComponents) => {
    // Build street address from components instead of using full formatted address
    let streetAddress = '';
    if (addressComponents.street_number && addressComponents.route) {
      streetAddress = `${addressComponents.street_number} ${addressComponents.route}`;
    } else if (addressComponents.route) {
      streetAddress = addressComponents.route;
    } else {
      // Fallback to formatted address if components not available
      streetAddress = addressComponents.formatted_address || '';
    }

    // Convert state name to abbreviation
    let stateAbbreviation = addressComponents.administrative_area_level_1 || '';
    if (stateNameToAbbreviation[stateAbbreviation]) {
      stateAbbreviation = stateNameToAbbreviation[stateAbbreviation];
    }

    const newLocationData = {
      ...serviceLocationData,
      street_address: streetAddress,
      city: addressComponents.locality || '',
      state: stateAbbreviation,
      zip_code: addressComponents.postal_code || '',
      latitude: addressComponents.latitude,
      longitude: addressComponents.longitude,
      hasStreetView: addressComponents.hasStreetView,
    };

    setServiceLocationData(newLocationData);
  };

  const handleServiceLocationChange = (
    field: keyof ServiceAddressData,
    value: string
  ) => {
    setServiceLocationData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAddress = async () => {
    if (!supportCase.customer || !hasAddressChanges) return;

    setIsSavingAddress(true);
    try {
      if (supportCase.primary_service_address?.id) {
        // UPDATE existing service address
        const { updateExistingServiceAddress } = await import('@/lib/service-addresses');
        const updateResult = await updateExistingServiceAddress(
          supportCase.primary_service_address.id,
          serviceLocationData
        );

        if (!updateResult.success) {
          throw new Error(
            updateResult.error || 'Failed to update service address'
          );
        }

        onShowToast?.('Service address updated successfully', 'success');
      } else {
        // CREATE new service address and link to customer
        const { createOrFindServiceAddress, linkCustomerToServiceAddress } = await import('@/lib/service-addresses');
        const isPrimary = !supportCase.primary_service_address; // Set as primary if no existing primary address

        // First, create or find the service address
        const serviceAddressResult = await createOrFindServiceAddress(
          supportCase.company_id,
          serviceLocationData
        );

        if (!serviceAddressResult.success) {
          throw new Error(serviceAddressResult.error || 'Failed to create service address');
        }

        // Then link the customer to the service address
        const linkResult = await linkCustomerToServiceAddress(
          supportCase.customer.id,
          serviceAddressResult.serviceAddressId!,
          'owner',
          isPrimary
        );

        if (!linkResult.success) {
          throw new Error(linkResult.error || 'Failed to link customer to service address');
        }

        if (serviceAddressResult.isExisting) {
          onShowToast?.('Service address linked successfully', 'success');
        } else {
          onShowToast?.('Service address created and linked successfully', 'success');
        }
      }

      // Update the original service address to reflect the saved state
      setOriginalServiceAddress({
        ...serviceLocationData,
      });

      onSupportCaseUpdate?.(); // Refresh the support case data
    } catch (error) {
      console.error('Error saving address:', error);
      onShowToast?.('Failed to save address. Please try again.', 'error');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCancelAddressChanges = () => {
    if (!originalServiceAddress) return;

    // Revert service location back to original service address
    setServiceLocationData({
      ...originalServiceAddress,
    });
  };

  // Handle Save & Close Issue
  const handleSaveAndClose = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const updateData = {
        ...formData,
        status: 'resolved'
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
                      onChange={e => handleFormChange('issue_type', e.target.value)}
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
                  <label className={cardStyles.inputLabels}>Priority Level</label>
                  <div className={styles.dropdownWithArrow}>
                    <select
                      className={styles.selectInput}
                      value={formData.priority}
                      onChange={e => handleFormChange('priority', e.target.value)}
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
                  <label className={cardStyles.inputLabels}>Subject/Issue Summary</label>
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
                  <label className={cardStyles.inputLabels}>Detailed Description</label>
                  <textarea
                    className={styles.textareaInput}
                    value={formData.description}
                    onChange={e => handleFormChange('description', e.target.value)}
                    placeholder="Please provide detailed information about the customer issue, including any relevant background information, what they've tried, and what outcomes they are looking for"
                    rows={4}
                  />
                </div>
              </div>

              {/* Row 4: Resolution & Action Taken */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.formField}>
                  <label className={cardStyles.inputLabels}>Resolution & Action Taken</label>
                  <textarea
                    className={styles.textareaInput}
                    value={formData.resolution_action}
                    onChange={e => handleFormChange('resolution_action', e.target.value)}
                    placeholder="Document the steps taken to resolve the issue, any solutions provided, follow-up actions required and final outcomes"
                    rows={4}
                  />
                </div>
              </div>

              {/* Row 5: Additional Notes */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.formField}>
                  <label className={cardStyles.inputLabels}>Additional Notes</label>
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
              <div className={`${styles.gridRow} ${styles.twoColumns}`} style={{ marginTop: '20px' }}>
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

      <div className={styles.contentRight}>
        {/* Contact Information InfoCard - Exact copy from LeadStepContent */}
        <InfoCard
          title="Contact Information"
          icon={<SquareUserRound size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            {supportCase.customer ? (
              <div className={styles.callInsightsGrid}>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Name</span>
                  <span className={cardStyles.dataText}>
                    {`${supportCase.customer.first_name} ${supportCase.customer.last_name}`.trim()}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Phone Number</span>
                  <span className={cardStyles.dataText}>
                    {supportCase.customer.phone || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Email</span>
                  <span className={cardStyles.dataText}>
                    {supportCase.customer.email || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Address</span>
                  <span className={cardStyles.dataText}>
                    {supportCase.customer.address || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>City</span>
                  <span className={cardStyles.dataText}>
                    {supportCase.customer.city || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>State</span>
                  <span className={cardStyles.dataText}>
                    {supportCase.customer.state || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Zip Code</span>
                  <span className={cardStyles.dataText}>
                    {supportCase.customer.zip_code || 'Not provided'}
                  </span>
                </div>
              </div>
            ) : (
              <p>No customer information available.</p>
            )}
          </div>
        </InfoCard>

        {/* Service Location InfoCard */}
        <InfoCard
          title="Service Location"
          icon={<MapPinned size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            <div className={styles.serviceLocationGrid}>
              {/* Row 1: City, State, Zip (3 columns) */}
              <div className={`${styles.gridRow} ${styles.threeColumns}`}>
                <div className={styles.formField}>
                  <label className={cardStyles.inputLabels}>City</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.city}
                    onChange={e =>
                      handleServiceLocationChange('city', e.target.value)
                    }
                    placeholder="Anytown"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={cardStyles.inputLabels}>State</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.state}
                    onChange={e =>
                      handleServiceLocationChange('state', e.target.value)
                    }
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={cardStyles.inputLabels}>Zip</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.zip_code}
                    onChange={e =>
                      handleServiceLocationChange('zip_code', e.target.value)
                    }
                    placeholder="12345"
                  />
                </div>
              </div>

              {/* Row 2: Address (1 column - full width) */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.formField}>
                  <label className={cardStyles.inputLabels}>Address</label>
                  <AddressAutocomplete
                    value={serviceLocationData.street_address}
                    onChange={value =>
                      handleServiceLocationChange('street_address', value)
                    }
                    onAddressSelect={handleAddressSelect}
                    placeholder="324 Winston Churchill Drive, Suite #34"
                    hideDropdown={hasCompleteUnchangedAddress}
                  />
                </div>
              </div>

              {/* Row 3: Size of Home, Yard Size (2 columns) */}
              <div className={`${styles.gridRow} ${styles.twoColumns}`}>
                <div className={styles.formField}>
                  <div className={styles.fieldHeader}>
                    <label className={cardStyles.inputLabels}>Size of Home</label>
                  </div>
                  <select
                    className={styles.selectInput}
                    value={selectedHomeSizeOption}
                    onChange={e => {
                      setSelectedHomeSizeOption(e.target.value);
                      const option = homeSizeOptions.find(opt => opt.value === e.target.value);
                      if (option) {
                        setHomeSize(option.rangeStart);
                      }
                    }}
                  >
                    <option value="">Select home size</option>
                    {homeSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <div className={styles.fieldHeader}>
                    <label className={cardStyles.inputLabels}>Yard Size</label>
                  </div>
                  <select
                    className={styles.selectInput}
                    value={selectedYardSizeOption}
                    onChange={e => {
                      setSelectedYardSizeOption(e.target.value);
                      const option = yardSizeOptions.find(opt => opt.value === e.target.value);
                      if (option) {
                        setYardSize(option.rangeStart);
                      }
                    }}
                  >
                    <option value="">Select yard size</option>
                    {yardSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Street View Image (1 column - full width) */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.streetViewContainer}>
                  <StreetViewImage
                    address={currentFormattedAddress}
                    latitude={serviceLocationData.latitude}
                    longitude={serviceLocationData.longitude}
                    width={600}
                    height={240}
                    className={styles.streetViewImage}
                    showPlaceholder={
                      !currentFormattedAddress && !serviceLocationData.latitude
                    }
                    fallbackToSatellite={true}
                    hasStreetView={serviceLocationData.hasStreetView}
                  />
                </div>
              </div>
            </div>

            {/* Save/Cancel Address Changes */}
            {hasAddressChanges && (
              <div className={styles.addressActions}>
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.button} ${styles.cancelButton}`}
                    onClick={handleCancelAddressChanges}
                    disabled={isSavingAddress}
                  >
                    Cancel
                  </button>
                  <button
                    className={`${styles.button} ${styles.saveButton}`}
                    onClick={handleSaveAddress}
                    disabled={!hasAddressChanges || isSavingAddress}
                  >
                    {isSavingAddress ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </InfoCard>
      </div>
    </>
  );
}